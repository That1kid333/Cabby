import React, { useEffect, useState } from 'react';
import { Swords, Trophy, ArrowRight, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchGames } from '../lib/games';
import { Game } from '../types';

interface RecentGamesWidgetProps {
  onOpenGames: () => void;
}

export const RecentGamesWidget: React.FC<RecentGamesWidgetProps> = ({ onOpenGames }) => {
  const { currentUser } = useApp();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGames().then(all => { setGames(all); setLoading(false); });
  }, []);

  if (!currentUser) return null;

  const myGames = games.filter(g => g.players.some(p => p.golferId === currentUser.id)).slice(0, 3);

  return (
    <div className="glass-panel p-6 rounded-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-stone-300 uppercase tracking-wider flex items-center gap-2">
          <Swords size={16} className="text-[#7FA65C]" /> Your Games
        </h2>
        <span className="flex items-center gap-1 text-xs font-extrabold text-[#C9A24B]">
          <Trophy size={14} /> {currentUser.gamesWon}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="animate-spin text-stone-500" size={20} /></div>
      ) : myGames.length === 0 ? (
        <p className="text-xs text-stone-400 text-center py-4">No games yet. Start one with your buddies.</p>
      ) : (
        <div className="space-y-2">
          {myGames.map(g => (
            <div key={g.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
              <div>
                <p className="text-xs font-bold text-white">{g.courseName}</p>
                <p className="text-[10px] text-stone-400">{g.date} • {g.players.length} players</p>
              </div>
              <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                g.status === 'live' ? 'bg-[#7FA65C]/20 text-[#7FA65C]' :
                g.status === 'completed' ? (g.winnerGolferId === currentUser.id ? 'bg-[#C9A24B]/20 text-[#C9A24B]' : 'bg-white/10 text-stone-300') :
                'bg-white/10 text-stone-300'
              }`}>
                {g.status === 'completed' && g.winnerGolferId === currentUser.id ? 'Won' : g.status}
              </span>
            </div>
          ))}
        </div>
      )}

      <button onClick={onOpenGames} className="w-full text-xs text-[#7FA65C] font-bold hover:underline flex items-center justify-center gap-1">
        View All Games <ArrowRight size={12} />
      </button>
    </div>
  );
};
