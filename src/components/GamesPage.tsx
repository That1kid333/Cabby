import React, { useEffect, useState } from 'react';
import { Swords, Users, History, Trophy, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Avatar } from './Avatar';
import { Game } from '../types';
import { fetchGames, playerProgress } from '../lib/games';
import { StartGameModal } from './StartGameModal';
import { GameCardView } from './GameCardView';

export const GamesPage: React.FC = () => {
  const { currentUser } = useApp();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  useEffect(() => {
    fetchGames().then(g => { setGames(g); setLoading(false); });
  }, []);

  if (!currentUser) return null;

  const handleGameUpdated = (updated: Game) => {
    setGames(prev => {
      const exists = prev.some(g => g.id === updated.id);
      return exists ? prev.map(g => (g.id === updated.id ? updated : g)) : [updated, ...prev];
    });
  };

  const selectedGame = games.find(g => g.id === selectedGameId);
  if (selectedGame) {
    return (
      <GameCardView
        game={selectedGame}
        onBack={() => setSelectedGameId(null)}
        onGameUpdated={handleGameUpdated}
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
  const history = games.filter(g => g.status === 'completed' && isMine(g));

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white font-['Outfit'] flex items-center gap-2">
            <Swords className="text-[#00FF87]" size={28} /> Games
          </h1>
          <p className="text-xs text-slate-300">
            Start a live round with your buddies — everyone sees the leaderboard update hole by hole.
          </p>
        </div>
        <button onClick={() => setIsStartOpen(true)} className="btn-primary text-sm px-5 py-2.5 font-black shrink-0">
          Start A Game
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="animate-spin" size={24} />
        </div>
      )}

      {!loading && (
        <>
          <GameSection title="Your Active Games" icon={<Swords size={16} className="text-[#00FF87]" />} games={myActiveGames} onSelect={setSelectedGameId} emptyText="No active games. Start one above." />
          <GameSection title="Friends' Live Games" icon={<Users size={16} className="text-[#00FF87]" />} games={joinableFriendGames} onSelect={setSelectedGameId} emptyText="No joinable games from your friends right now." />

          <div className="glass-panel p-6 rounded-3xl space-y-3">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <History size={16} className="text-[#00FF87]" /> Game History
            </h2>
            {history.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No completed games yet.</p>
            ) : (
              <div className="space-y-2">
                {history.map(g => {
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
                        <p className="text-[10px] text-slate-400">{g.date} • {g.holesPlayed} holes • {g.players.length} players</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {won && <Trophy size={14} className="text-[#FFD700]" />}
                        <span className={`text-xs font-bold ${won ? 'text-[#FFD700]' : 'text-slate-300'}`}>{winner?.golferName || 'Unknown'}</span>
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
    <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">{icon} {title}</h2>
    {games.length === 0 ? (
      <p className="text-xs text-slate-400 text-center py-4">{emptyText}</p>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {games.map(g => {
          const leaderCount = g.players.filter(p => playerProgress(g, p.golferId).holesCompleted > 0).length;
          return (
            <button
              key={g.id}
              onClick={() => onSelect(g.id)}
              className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#00FF87]/40 text-left transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white">{g.courseName}</p>
                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${g.status === 'live' ? 'bg-[#00FF87]/20 text-[#00FF87]' : 'bg-white/10 text-slate-300'}`}>
                  {g.status}
                </span>
              </div>
              <div className="flex items-center -space-x-2">
                {g.players.slice(0, 5).map(p => <Avatar key={p.id} name={p.golferName} size={24} />)}
              </div>
              <p className="text-[10px] text-slate-400">
                {g.players.length} player{g.players.length === 1 ? '' : 's'} • {g.holesPlayed} holes {g.status === 'live' && `• ${leaderCount} scoring live`}
              </p>
            </button>
          );
        })}
      </div>
    )}
  </div>
);
