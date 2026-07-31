import React, { useEffect, useState } from 'react';
import { ArrowLeft, Crown, Flag, Play, Trophy, UserPlus, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { Avatar } from './Avatar';
import { Game, TeeBox } from '../types';
import { fetchGame, subscribeToGame, setGameStatus, postHoleScore, joinGame, completeGame, playerProgress, postGameResultsAsRounds } from '../lib/games';

interface GameCardViewProps {
  game: Game;
  onBack: () => void;
  onGameUpdated: (game: Game) => void;
}

export const GameCardView: React.FC<GameCardViewProps> = ({ game: initialGame, onBack, onGameUpdated }) => {
  const { currentUser, courses, golfers, rounds, postActivity, bumpGamesWon, applyGameResults } = useApp();
  const [game, setGame] = useState<Game>(initialGame);
  const [myScores, setMyScores] = useState<Record<number, string>>({});
  const [joining, setJoining] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [selectedTee, setSelectedTee] = useState<TeeBox | null>(null);

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
    await joinGame(game.id, currentUser, tee);
    setJoining(false);
    await refresh();
  };

  const handleStartRound = async () => {
    await setGameStatus(game.id, 'live');
    await refresh();
  };

  const commitHole = async (hole: number, value: string) => {
    const strokes = Number(value);
    if (!strokes || strokes <= 0) return;
    await postHoleScore(game.id, currentUser.id, hole, strokes);
  };

  const handleCrownWinner = async () => {
    if (standings.length === 0) return;
    setCompleting(true);

    const winner = standings[0];
    const winnerGolfer = golfers.find(g => g.id === winner.player.golferId);

    await completeGame(game.id, winner.player.golferId, winnerGolfer?.gamesWon ?? 0);
    bumpGamesWon(winner.player.golferId);

    // Every finished player's total posts as a real WHS round, so playing a Game
    // feeds the same Handicap Index math as posting a round solo would.
    const roundResults = await postGameResultsAsRounds(game, rounds, golfers);
    applyGameResults(roundResults);

    if (winner.player.golferId === currentUser.id) {
      await postActivity({
        type: 'game_won',
        title: `Won the game at ${game.courseName}`,
        subtitle: `Final score: ${winner.total} over ${winner.holesCompleted} holes, beating ${game.players.length - 1} other golfer${game.players.length - 1 === 1 ? '' : 's'}.`
      });
      confetti({ particleCount: 100, spread: 90, origin: { y: 0.6 }, colors: ['#00FF87', '#00E676', '#FFD700', '#FFFFFF'] });
    }

    setCompleting(false);
    await refresh();
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-bold">
        <ArrowLeft size={14} /> Back to Games
      </button>

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
          </div>

          {isCreator && game.status === 'lobby' && (
            <button onClick={handleStartRound} className="btn-primary text-xs px-4 py-2.5 font-black flex items-center gap-1.5">
              <Play size={14} /> Start Round
            </button>
          )}

          {isCreator && game.status === 'live' && (
            <div className="text-right space-y-1">
              <button
                onClick={handleCrownWinner}
                disabled={!allFinished || completing}
                className="btn-primary text-xs px-4 py-2.5 font-black flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {completing ? <Loader2 size={14} className="animate-spin" /> : <Trophy size={14} />}
                {allFinished ? 'Crown The Winner' : 'Waiting For All Players'}
              </button>
              {allFinished && <p className="text-[10px] text-slate-400 max-w-[220px]">Posts everyone's score as a real round, updating their Handicap Index.</p>}
            </div>
          )}
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
              <p className="text-xl font-black text-white font-['Outfit']">{s.holesCompleted > 0 ? s.total : '--'}</p>
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
        </div>
      )}

      {/* Hole-by-hole entry for the current player */}
      {me && game.status === 'live' && (
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Flag size={16} className="text-[#00FF87]" /> Your Scorecard
          </h2>
          <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
            {Array.from({ length: game.holesPlayed }, (_, i) => i + 1).map(hole => (
              <div key={hole} className="text-center bg-white/5 p-2 rounded-xl border border-white/10">
                <p className="text-[10px] text-slate-400 font-bold">#{hole}</p>
                <input
                  type="number"
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
    </div>
  );
};
