import React, { useEffect, useState } from 'react';
import { Swords, Users, History, Trophy, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Avatar } from './Avatar';
import { Game } from '../types';
import { fetchGames, fetchGame, playerProgress } from '../lib/games';
import { StartGameModal } from './StartGameModal';
import { GameCardView } from './GameCardView';

function parseSharedGameId(): string | null {
  const match = window.location.hash.match(/^#game-([0-9a-f-]{36})$/i);
  return match ? match[1] : null;
}

export const GamesPage: React.FC = () => {
  const { currentUser } = useApp();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  useEffect(() => {
    fetchGames().then(async (g) => {
      setGames(g);
      setLoading(false);

      // A shared game link (#game-<id>) opens straight to that game, even if it
      // isn't in the normal friends/active list yet.
      const sharedId = parseSharedGameId();
      if (sharedId) {
        const shared = g.find(x => x.id === sharedId) || await fetchGame(sharedId);
        if (shared) {
          setGames(prev => (prev.some(x => x.id === shared.id) ? prev : [shared, ...prev]));
          setSelectedGameId(shared.id);
        }
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    });
  }, []);

  if (!currentUser) return null;

  const handleGameUpdated = (updated: Game) => {
    setGames(prev => {
      const exists = prev.some(g => g.id === updated.id);
      return exists ? prev.map(g => (g.id === updated.id ? updated : g)) : [updated, ...prev];
    });
  };

  const handleGameDeleted = (deletedId: string) => {
    setGames(prev => prev.filter(g => g.id !== deletedId));
    setSelectedGameId(null);
  };

  const selectedGame = games.find(g => g.id === selectedGameId);
  if (selectedGame) {
    return (
      <GameCardView
        game={selectedGame}
        onBack={() => setSelectedGameId(null)}
        onGameUpdated={handleGameUpdated}
        onDeleted={handleGameDeleted}
      />
    );
  }

  const isMine = (g: Game) => g.players.some(p => p.golferId === currentUser.id);
  const isFriendGame = (g: Game) =>
    g.createdBy === currentUser.id ||
    currentUser.friends.includes(g.createdBy) ||
    g.players.some(p => currentUser.friends.includes(p.golferId));

  const myActiveGames = games.filter(g => g.status !== 'completed' && isMine(g));
  const joinableFriendGames = games.filter(g => g.status !== 'completed' && !isMine(g) && isFriendGame(g));
  const history_ = games.filter(g => g.status === 'completed' && isMine(g));
  const trophies = history_.filter(g => g.winnerGolferId === currentUser.id);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white font-['Outfit'] flex items-center gap-2">
            <Swords className="text-[#7FA65C]" size={28} /> Games
          </h1>
          <p className="text-xs text-stone-300">
            Start a live round with your buddies — everyone sees the leaderboard update hole by hole.
          </p>
        </div>
        <button onClick={() => setIsStartOpen(true)} className="btn-primary text-sm px-5 py-2.5 font-black shrink-0">
          Start A Game
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-stone-400">
          <Loader2 className="animate-spin" size={24} />
        </div>
      )}

      {!loading && (
        <>
          <GameSection title="Your Active Games" icon={<Swords size={16} className="text-[#7FA65C]" />} games={myActiveGames} onSelect={setSelectedGameId} emptyText="No active games. Start one above." />
          <GameSection title="Friends' Live Games" icon={<Users size={16} className="text-[#7FA65C]" />} games={joinableFriendGames} onSelect={setSelectedGameId} emptyText="No joinable games from your friends right now." />

          {/* Trophy Case */}
          <div className="glass-panel p-6 rounded-3xl space-y-3 border-[#C9A24B]/30">
            <h2 className="text-sm font-bold text-[#C9A24B] uppercase tracking-wider flex items-center gap-2">
              <Trophy size={16} /> Trophy Case ({trophies.length})
            </h2>
            {trophies.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-4">No wins yet — win a game to start your trophy case.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {trophies.map(g => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGameId(g.id)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#C9A24B]/10 border border-[#C9A24B]/30 hover:border-[#C9A24B]/60 text-left transition-all"
                  >
                    <Trophy size={20} className="text-[#C9A24B] shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-white">{g.courseName}</p>
                      <p className="text-[10px] text-stone-400">{g.date} • beat {g.players.length - 1} other{g.players.length - 1 === 1 ? '' : 's'}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="glass-panel p-6 rounded-3xl space-y-3">
            <h2 className="text-sm font-bold text-stone-300 uppercase tracking-wider flex items-center gap-2">
              <History size={16} className="text-[#7FA65C]" /> Game History
            </h2>
            {history_.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-4">No completed games yet.</p>
            ) : (
              <div className="space-y-2">
                {history_.map(g => {
                  const winner = g.players.find(p => p.golferId === g.winnerGolferId);
                  const won = g.winnerGolferId === currentUser.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGameId(g.id)}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-left transition-all"
                    >
                      <div>
                        <p className="text-sm font-bold text-white">{g.courseName}</p>
                        <p className="text-[10px] text-stone-400">{g.date} • {g.holesPlayed} holes • {g.players.length} players</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {won && <Trophy size={14} className="text-[#C9A24B]" />}
                        <span className={`text-xs font-bold ${won ? 'text-[#C9A24B]' : 'text-stone-300'}`}>{winner?.golferName || 'Unknown'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      <StartGameModal
        isOpen={isStartOpen}
        onClose={() => setIsStartOpen(false)}
        onCreated={(game) => { handleGameUpdated(game); setIsStartOpen(false); setSelectedGameId(game.id); }}
      />
    </div>
  );
};

const GameSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  games: Game[];
  onSelect: (id: string) => void;
  emptyText: string;
}> = ({ title, icon, games, onSelect, emptyText }) => (
  <div className="glass-panel p-6 rounded-3xl space-y-3">
    <h2 className="text-sm font-bold text-stone-300 uppercase tracking-wider flex items-center gap-2">{icon} {title}</h2>
    {games.length === 0 ? (
      <p className="text-xs text-stone-400 text-center py-4">{emptyText}</p>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {games.map(g => {
          const leaderCount = g.players.filter(p => playerProgress(g, p.golferId).holesCompleted > 0).length;
          return (
            <button
              key={g.id}
              onClick={() => onSelect(g.id)}
              className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#7FA65C]/40 text-left transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white">{g.courseName}</p>
                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${g.status === 'live' ? 'bg-[#7FA65C]/20 text-[#7FA65C]' : 'bg-white/10 text-stone-300'}`}>
                  {g.status}
                </span>
              </div>
              <div className="flex items-center -space-x-2">
                {g.players.slice(0, 5).map(p => <Avatar key={p.id} name={p.golferName} size={24} />)}
              </div>
              <p className="text-[10px] text-stone-400">
                {g.players.length} player{g.players.length === 1 ? '' : 's'} • {g.holesPlayed} holes {g.status === 'live' && `• ${leaderCount} scoring live`}
              </p>
            </button>
          );
        })}
      </div>
    )}
  </div>
);
