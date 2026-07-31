import React, { useEffect, useState } from 'react';
import { ArrowLeft, Crown, Flag, Play, Trophy, UserPlus, Loader2, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { Avatar } from './Avatar';
import { Game, TeeBox } from '../types';
import { fetchGame, subscribeToGame, setGameStatus, postHoleScore, joinGame, completeGame, deleteGame, playerProgress, postGameResultsAsRounds } from '../lib/games';
import { parseHoleScore, relativeToParLabel } from '../lib/holeScoring';
import { ShareGameModal } from './ShareGameModal';
import { BettingPanel } from './BettingPanel';

interface GameCardViewProps {
  game: Game;
  onBack: () => void;
  onGameUpdated: (game: Game) => void;
  onDeleted: (gameId: string) => void;
}

export const GameCardView: React.FC<GameCardViewProps> = ({ game: initialGame, onBack, onGameUpdated, onDeleted }) => {
  const { currentUser, courses, golfers, rounds, postActivity, bumpGamesWon, applyGameResults, applyGameDeletionRollback, updateCourseHolePar } = useApp();
  const [game, setGame] = useState<Game>(initialGame);
  const [myScores, setMyScores] = useState<Record<number, string>>({});
  const [editingPar, setEditingPar] = useState<number | null>(null);
  const [parDraft, setParDraft] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const refresh = async () => {
    const updated = await fetchGame(initialGame.id);
    if (updated) {
      setGame(updated);
      onGameUpdated(updated);
    }
  };

  useEffect(() => {
    setGame(initialGame);
    const unsubscribe = subscribeToGame(initialGame.id, refresh);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialGame.id]);

  useEffect(() => {
    if (!currentUser) return;
    const mine: Record<number, string> = {};
    game.scores.filter(s => s.golferId === currentUser.id).forEach(s => { mine[s.hole] = String(s.strokes); });
    setMyScores(mine);
  }, [game.scores, currentUser]);

  if (!currentUser) return null;

  const me = game.players.find(p => p.golferId === currentUser.id);
  const isCreator = game.createdBy === currentUser.id;
  const matchingCourse = courses.find(c => c.name === game.courseName);

  const standings = game.players
    .map(p => ({ player: p, ...playerProgress(game, p.golferId) }))
    .sort((a, b) => {
      if (a.holesCompleted === 0 && b.holesCompleted === 0) return 0;
      if (a.holesCompleted === 0) return 1;
      if (b.holesCompleted === 0) return -1;
      return a.total - b.total;
    });

  const allFinished = game.players.length > 0 && game.players.every(p => playerProgress(game, p.golferId).holesCompleted === game.holesPlayed);

  const handleJoin = async (tee: TeeBox) => {
    setJoining(true);
    setJoinError(null);
    const { error } = await joinGame(game.id, currentUser, tee);
    setJoining(false);
    if (error) {
      setJoinError(error);
      return;
    }
    await refresh();
  };

  const handleStartRound = async () => {
    setStarting(true);
    setActionError(null);
    const { success, error } = await setGameStatus(game.id, 'live');
    setStarting(false);
    if (!success) {
      setActionError(error || 'Could not start the round. Try again.');
      return;
    }
    await refresh();
  };

  // Every hole always has a usable par — real data when the course has it, a
  // plain default of 4 otherwise — so +/- shorthand always works, not just for
  // courses OpenGolfAPI happens to have hole-level data for.
  const realHolePar = (hole: number) => matchingCourse?.holes?.find(h => h.number === hole)?.par;
  const holePar = (hole: number) => realHolePar(hole) ?? 4;

  const startEditPar = (hole: number) => {
    setEditingPar(hole);
    setParDraft(String(holePar(hole)));
  };

  const commitParEdit = async () => {
    if (editingPar === null) return;
    const hole = editingPar;
    const n = Number(parDraft);
    setEditingPar(null);
    if (!matchingCourse || !Number.isFinite(n) || n < 3 || n > 6) return;
    if (n === holePar(hole)) return;
    // Shared correction — saved to the course itself so every player (and every
    // future game at this course) sees the same, right par, not just this browser.
    const ok = await updateCourseHolePar(matchingCourse.id, hole, n);
    if (!ok) setActionError(`Could not save the par correction for hole ${hole}. Try again.`);
  };

  const commitHole = async (hole: number, value: string) => {
    const strokes = parseHoleScore(value, holePar(hole));
    if (strokes === null) {
      if (value.trim()) {
        setActionError(`Hole ${hole}: enter a valid score (e.g. -1, E, +2, or a total strokes count). If the par shown is wrong, tap it to fix it.`);
      }
      return;
    }
    const { success, error } = await postHoleScore(game.id, currentUser.id, hole, strokes);
    if (!success) {
      setActionError(error ? `Hole ${hole}: ${error}` : `Could not save your score for hole ${hole}. Try again.`);
    } else {
      setMyScores(prev => ({ ...prev, [hole]: String(strokes) }));
    }
  };

  const handleCrownWinner = async () => {
    if (standings.length === 0 || completing) return;
    if (standings[0].holesCompleted === 0) {
      setActionError('No scores have been entered yet — nothing to crown a winner from.');
      return;
    }
    setConfirmEnd(false);
    setCompleting(true);
    setActionError(null);

    const winner = standings[0];
    const winnerGolfer = golfers.find(g => g.id === winner.player.golferId);

    const { success, error } = await completeGame(game.id, winner.player.golferId, winnerGolfer?.gamesWon ?? 0);
    if (!success) {
      setActionError(error || 'Could not complete the game. Try again.');
      setCompleting(false);
      await refresh();
      return;
    }

    bumpGamesWon(winner.player.golferId);

    // Every finished player's total posts as a real WHS round, so playing a Game
    // feeds the same Handicap Index math as posting a round solo would.
    const roundResults = await postGameResultsAsRounds(game, rounds, golfers);
    applyGameResults(roundResults);

    if (winner.player.golferId === currentUser.id) {
      await postActivity({
        type: 'game_won',
        title: `Won the game at ${game.courseName}`,
        subtitle: `Final score: ${winner.total} over ${winner.holesCompleted} holes, beating ${game.players.length - 1} other golfer${game.players.length - 1 === 1 ? '' : 's'}.`,
        gameId: game.id
      });
      confetti({ particleCount: 100, spread: 90, origin: { y: 0.6 }, colors: ['#00FF87', '#00E676', '#FFD700', '#FFFFFF'] });
    }

    await refresh();
    setCompleting(false);
  };

  const handleDeleteGame = async () => {
    setDeleting(true);
    setActionError(null);
    const { success, error, rollback } = await deleteGame(game);
    setDeleting(false);
    if (!success) {
      setActionError(error || 'Could not delete the game. Try again.');
      setConfirmDelete(false);
      return;
    }
    if (rollback) applyGameDeletionRollback(rollback);
    onDeleted(game.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-bold">
          <ArrowLeft size={14} /> Back to Games
        </button>
        <button onClick={() => setShowShare(true)} className="flex items-center gap-1.5 text-xs text-[#00FF87] hover:underline font-bold">
          <Share2 size={14} /> Share
        </button>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-3xl border-white/10 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-2 ${
              game.status === 'live' ? 'bg-[#00FF87]/20 text-[#00FF87] border border-[#00FF87]/40' :
              game.status === 'completed' ? 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/40' :
              'bg-white/10 text-slate-300 border border-white/20'
            }`}>
              {game.status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-[#00FF87]" />}
              {game.status}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">{game.courseName}</h1>
            <p className="text-xs text-slate-400">{game.courseLocation} • {game.holesPlayed} holes • {game.date}</p>
            {actionError && (
              <p className="text-xs font-bold text-red-400 bg-red-500/10 mt-2 p-2.5 rounded-xl border border-red-500/20 max-w-md">{actionError}</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              {isCreator && game.status === 'lobby' && (
                <button onClick={handleStartRound} disabled={starting} className="btn-primary text-xs px-4 py-2.5 font-black flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
                  {starting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Start Round
                </button>
              )}

              {isCreator && game.status === 'live' && !confirmEnd && (
                <button
                  onClick={() => (allFinished ? handleCrownWinner() : setConfirmEnd(true))}
                  disabled={completing}
                  className="btn-primary text-xs px-4 py-2.5 font-black flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {completing ? <Loader2 size={14} className="animate-spin" /> : <Trophy size={14} />}
                  {allFinished ? 'Crown The Winner' : 'End Game Now'}
                </button>
              )}

              {isCreator && (game.status === 'lobby' || game.status === 'live') && !confirmDelete && (
                <button onClick={() => setConfirmDelete(true)} className="text-xs text-red-400 hover:text-red-300 font-bold px-2 py-2.5">
                  Delete
                </button>
              )}
              {isCreator && game.status === 'completed' && !confirmDelete && (
                <button onClick={() => setConfirmDelete(true)} className="text-xs text-slate-400 hover:text-red-400 font-bold px-2 py-2.5">
                  Remove from history
                </button>
              )}
            </div>

            {isCreator && game.status === 'live' && confirmEnd && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-right space-y-2 max-w-[260px]">
                <p className="text-[11px] text-amber-300">
                  Not everyone's finished all {game.holesPlayed} holes. Ending now crowns whoever's lowest right now — only players who finished every hole will have it count toward their Handicap Index.
                </p>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setConfirmEnd(false)} className="text-[11px] text-slate-400 hover:text-white font-bold px-2 py-1">Cancel</button>
                  <button onClick={handleCrownWinner} disabled={completing} className="text-[11px] bg-amber-500 text-[#070B16] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50">
                    {completing && <Loader2 size={12} className="animate-spin" />} End It Now
                  </button>
                </div>
              </div>
            )}

            {confirmDelete && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-right space-y-2 max-w-[260px]">
                <p className="text-[11px] text-red-300">
                  {game.status === 'completed'
                    ? "This removes it from everyone's history for good — any rounds it posted are undone and everyone's Handicap Index recalculates without them."
                    : 'This deletes the game and all scores for good.'}
                </p>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setConfirmDelete(false)} className="text-[11px] text-slate-400 hover:text-white font-bold px-2 py-1">Cancel</button>
                  <button onClick={handleDeleteGame} disabled={deleting} className="text-[11px] bg-red-500 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50">
                    {deleting && <Loader2 size={12} className="animate-spin" />} Delete
                  </button>
                </div>
              </div>
            )}

            {allFinished && game.status === 'live' && (
              <p className="text-[10px] text-slate-400 max-w-[220px] text-right">Posts everyone's score as a real round, updating their Handicap Index.</p>
            )}
          </div>
        </div>

        {game.status === 'completed' && game.winnerGolferId && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FFD700]/15 to-[#00FF87]/10 border border-[#FFD700]/40 flex items-center gap-3">
            <Crown className="text-[#FFD700]" size={28} />
            <div>
              <p className="text-xs text-[#FFD700] font-bold uppercase tracking-wider">Winner</p>
              <p className="text-lg font-extrabold text-white font-['Outfit']">
                {game.players.find(p => p.golferId === game.winnerGolferId)?.golferName || 'Unknown'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Live Leaderboard */}
      <div className="glass-panel p-6 rounded-3xl space-y-3">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Leaderboard</h2>
        {standings.map((s, i) => (
          <div
            key={s.player.id}
            className={`flex items-center justify-between p-3 rounded-2xl border ${
              s.player.golferId === currentUser.id ? 'bg-[#05C46B]/10 border-[#00FF87]/40' : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="w-6 text-center text-xs font-extrabold text-slate-400">{i + 1}</span>
              <Avatar name={s.player.golferName} size={36} />
              <div>
                <p className="text-sm font-bold text-white">{s.player.golferName}</p>
                <p className="text-[10px] text-slate-400">{s.player.teeName} • R {s.player.rating} / S {s.player.slope}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-baseline justify-end gap-1.5">
                <p className="text-xl font-black text-white font-['Outfit']">{s.holesCompleted > 0 ? s.total : '--'}</p>
                {s.holesCompleted > 0 && (
                  <span className="text-xs font-bold text-[#00FF87]">
                    ({relativeToParLabel(s.total, Array.from({ length: s.holesCompleted }, (_, i) => holePar(i + 1)).reduce((a, b) => a + b, 0))})
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">{s.holesCompleted === game.holesPlayed ? 'Finished' : s.holesCompleted > 0 ? `Thru ${s.holesCompleted}` : 'Not started'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Join Panel */}
      {!me && game.status !== 'completed' && (
        <div className="glass-panel p-6 rounded-3xl space-y-3 border-[#00FF87]/30">
          <h2 className="text-sm font-bold text-white flex items-center gap-2"><UserPlus size={16} className="text-[#00FF87]" /> Join This Game</h2>
          {matchingCourse ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {matchingCourse.tees.map(t => (
                <button
                  key={t.id}
                  disabled={joining}
                  onClick={() => handleJoin(t)}
                  className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:border-[#00FF87]/50 text-left transition-all disabled:opacity-50"
                >
                  <p className="text-xs font-bold text-white">{t.name}</p>
                  <p className="text-[10px] text-slate-400">R: {t.rating} / S: {t.slope}</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">Loading course tees…</p>
          )}
          {joinError && <p className="text-xs font-bold text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">{joinError}</p>}
        </div>
      )}

      {/* Hole-by-hole entry for the current player */}
      {me && game.status === 'live' && (
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Flag size={16} className="text-[#00FF87]" /> Your Scorecard
          </h2>
          <p className="text-[10px] text-slate-400">
            Enter total strokes taken, or shorthand relative to par: -1 birdie, E even, +2 double bogey. Tap a hole's par if it's wrong — it corrects it for everyone playing this course.
          </p>
          <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
            {Array.from({ length: game.holesPlayed }, (_, i) => i + 1).map(hole => (
              <div key={hole} className="text-center bg-white/5 p-2 rounded-xl border border-white/10">
                <p className="text-[10px] text-slate-400 font-bold">#{hole}</p>
                {editingPar === hole ? (
                  <input
                    type="number"
                    autoFocus
                    value={parDraft}
                    onChange={(e) => setParDraft(e.target.value)}
                    onBlur={commitParEdit}
                    onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
                    className="w-full bg-transparent text-center text-[9px] text-[#00FF87] focus:outline-none"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => startEditPar(hole)}
                    className={`text-[9px] underline decoration-dotted ${realHolePar(hole) ? 'text-slate-500 hover:text-[#00FF87]' : 'text-amber-500/80 hover:text-amber-400'}`}
                    title={realHolePar(hole) ? "Tap to correct this hole's par" : 'Par not on file for this course — assumed 4, tap to set the real number'}
                  >
                    Par {holePar(hole)}
                  </button>
                )}
                <input
                  type="text"
                  inputMode="text"
                  value={myScores[hole] ?? ''}
                  onChange={(e) => setMyScores(prev => ({ ...prev, [hole]: e.target.value }))}
                  onBlur={(e) => commitHole(hole, e.target.value)}
                  className="w-full bg-transparent text-center text-white font-bold text-sm focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {me && game.status === 'lobby' && (
        <div className="glass-panel p-6 rounded-3xl text-center">
          <p className="text-sm text-slate-300">You're in. Waiting for {isCreator ? 'you to start the round' : 'the host to start the round'}.</p>
        </div>
      )}

      {me && <BettingPanel game={game} currentUser={currentUser} onChanged={refresh} />}

      <ShareGameModal isOpen={showShare} onClose={() => setShowShare(false)} game={game} />
    </div>
  );
};
