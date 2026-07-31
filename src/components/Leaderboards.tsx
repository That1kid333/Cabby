import React, { useState } from 'react';
import { Trophy, Crown, Flame, Award, UserPlus, Sparkles, Medal, Feather, Target, Globe, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatHandicapIndex } from '../lib/whsEngine';
import { Avatar } from './Avatar';

interface LeaderboardsProps {
  onOpenQrShare: () => void;
  onOpenQrScanner: () => void;
}

export const Leaderboards: React.FC<LeaderboardsProps> = ({ onOpenQrShare, onOpenQrScanner }) => {
  const { golfers, currentUser } = useApp();
  const [filter, setFilter] = useState<'handicap' | 'gross' | 'differential' | 'wins' | 'trophies'>('handicap');
  const [scope, setScope] = useState<'local' | 'global'>('local');

  const visibleGolfers = scope === 'global'
    ? golfers
    : golfers.filter(g => currentUser && (g.id === currentUser.id || currentUser.friends.includes(g.id)));

  // Sort golfers based on active leaderboard filter
  const sortedGolfers = [...visibleGolfers].sort((a, b) => {
    if (filter === 'handicap') return a.handicapIndex - b.handicapIndex;
    if (filter === 'gross') return a.bestGrossScore - b.bestGrossScore;
    if (filter === 'differential') return a.bestDifferential - b.bestDifferential;
    if (filter === 'wins') return b.gamesWon - a.gamesWon;
    if (filter === 'trophies') return (b.eaglesCount + b.holesInOneCount * 5) - (a.eaglesCount + a.holesInOneCount * 5);
    return 0;
  });

  return (
    <div className="space-y-6">

      {/* Leaderboard Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border-white/10 relative overflow-hidden bg-gradient-to-r from-[#0C1A2E] via-[#0E1F38] to-[#070D18]">
        <div className="absolute right-0 top-0 w-80 h-80 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/40 flex items-center gap-1.5">
                <Crown size={14} /> CLUBHOUSE HIGH SCORES
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white font-['Outfit']">
              The Buddy Leaderboard
            </h1>
            <p className="text-xs text-slate-300">
              Compete live with your golf buddies across Handicap Index, Gross Rounds, and Eagles!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenQrShare}
              className="bg-gradient-to-r from-[#05C46B] to-[#00FF87] text-[#070B16] font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-[#05C46B]/20 text-xs flex items-center gap-2"
            >
              <UserPlus size={16} /> Share Friend Code
            </button>
            <button
              onClick={onOpenQrScanner}
              className="bg-white/10 hover:bg-white/15 text-white font-semibold px-4 py-2.5 rounded-xl border border-white/10 text-xs"
            >
              Scan QR Code
            </button>
          </div>
        </div>
      </div>

      {/* Scope Toggle */}
      <div className="flex bg-[#0E1626] p-1.5 rounded-2xl border border-white/10 w-fit">
        <button
          onClick={() => setScope('local')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            scope === 'local' ? 'bg-gradient-to-r from-[#05C46B] to-[#00FF87] text-[#070B16] shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users size={14} /> Friends
        </button>
        <button
          onClick={() => setScope('global')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            scope === 'global' ? 'bg-gradient-to-r from-[#05C46B] to-[#00FF87] text-[#070B16] shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Globe size={14} /> Global
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-[#0E1626] p-1.5 rounded-2xl border border-white/10">
        <button
          onClick={() => setFilter('handicap')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
            filter === 'handicap'
              ? 'bg-gradient-to-r from-[#05C46B] to-[#00FF87] text-[#070B16] shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trophy size={16} /> Lowest Handicap Index
        </button>

        <button
          onClick={() => setFilter('gross')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
            filter === 'gross'
              ? 'bg-gradient-to-r from-[#05C46B] to-[#00FF87] text-[#070B16] shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Award size={16} /> Best Gross Score
        </button>

        <button
          onClick={() => setFilter('differential')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
            filter === 'differential'
              ? 'bg-gradient-to-r from-[#05C46B] to-[#00FF87] text-[#070B16] shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Flame size={16} /> Best Differential
        </button>

        <button
          onClick={() => setFilter('wins')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
            filter === 'wins'
              ? 'bg-gradient-to-r from-[#05C46B] to-[#00FF87] text-[#070B16] shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Crown size={16} /> Most Game Wins
        </button>

        <button
          onClick={() => setFilter('trophies')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
            filter === 'trophies'
              ? 'bg-gradient-to-r from-[#05C46B] to-[#00FF87] text-[#070B16] shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles size={16} /> Eagles & Aces Hall
        </button>
      </div>

      {/* Leaderboard Table List */}
      <div className="glass-panel p-4 sm:p-6 rounded-3xl space-y-3">
        {sortedGolfers.length <= 1 && (
          <div className="text-center py-6 space-y-2">
            <p className="text-sm text-slate-300">
              {sortedGolfers.length === 0
                ? "It's quiet in here."
                : scope === 'local'
                  ? "You're the only golfer here so far."
                  : 'No golfers on Cabby yet.'}
            </p>
            {scope === 'local' && (
              <button
                onClick={onOpenQrShare}
                className="text-xs text-[#00FF87] hover:underline font-bold"
              >
                Share your friend code to start a real leaderboard →
              </button>
            )}
          </div>
        )}

        {sortedGolfers.map((golfer, index) => {
          const rank = index + 1;
          const isCurrentUser = currentUser ? golfer.id === currentUser.id : false;

          let rankBadge = (
            <span className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-extrabold text-sm text-slate-300">
              #{rank}
            </span>
          );

          if (rank === 1) {
            rankBadge = (
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#070B16] flex items-center justify-center shadow-md shadow-[#FFD700]/30">
                <Medal size={16} />
              </span>
            );
          } else if (rank === 2) {
            rankBadge = (
              <span className="w-8 h-8 rounded-full bg-slate-300 text-[#070B16] flex items-center justify-center shadow-md">
                <Medal size={16} />
              </span>
            );
          } else if (rank === 3) {
            rankBadge = (
              <span className="w-8 h-8 rounded-full bg-amber-700 text-white flex items-center justify-center shadow-md">
                <Medal size={16} />
              </span>
            );
          }

          return (
            <div
              key={golfer.id}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                isCurrentUser
                  ? 'bg-[#05C46B]/15 border-[#00FF87] shadow-lg shadow-[#05C46B]/20'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              {/* Rank & Profile */}
              <div className="flex items-center gap-3">
                {rankBadge}
                <Avatar name={golfer.name} size={48} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base font-['Outfit']">
                      {golfer.name}
                    </span>
                    {isCurrentUser && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00FF87]/20 text-[#00FF87]">
                        YOU
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {golfer.homeCourse} • Code: <span className="font-mono text-slate-300">{golfer.friendCode}</span>
                  </p>
                </div>
              </div>

              {/* Score Display based on active filter */}
              <div className="text-right">
                {filter === 'handicap' && (
                  <div>
                    <span className="text-2xl font-black text-[#00FF87] font-['Outfit']">
                      {formatHandicapIndex(golfer.handicapIndex)}
                    </span>
                    <p className="text-[10px] text-slate-400">{golfer.totalRounds} rounds logged</p>
                  </div>
                )}

                {filter === 'gross' && (
                  <div>
                    <span className="text-2xl font-black text-white font-['Outfit']">
                      {golfer.bestGrossScore === 999 ? '--' : golfer.bestGrossScore}
                    </span>
                    <p className="text-[10px] text-slate-400">Best 18-hole stroke</p>
                  </div>
                )}

                {filter === 'differential' && (
                  <div>
                    <span className="text-2xl font-black text-emerald-400 font-['Outfit']">
                      {golfer.bestDifferential === 99.9 ? '--' : golfer.bestDifferential.toFixed(1)}
                    </span>
                    <p className="text-[10px] text-slate-400">Lowest diff</p>
                  </div>
                )}

                {filter === 'wins' && (
                  <div>
                    <span className="text-2xl font-black text-[#FFD700] font-['Outfit']">
                      {golfer.gamesWon}
                    </span>
                    <p className="text-[10px] text-slate-400">Games won</p>
                  </div>
                )}

                {filter === 'trophies' && (
                  <div className="flex items-center gap-3 justify-end">
                    <span className="flex items-center gap-1 text-lg font-extrabold text-[#FFD700] font-['Outfit']">
                      <Feather size={16} /> {golfer.eaglesCount}
                    </span>
                    <span className="flex items-center gap-1 text-lg font-extrabold text-[#FFD700] font-['Outfit']">
                      <Target size={16} /> {golfer.holesInOneCount}
                    </span>
                    <p className="text-[10px] text-slate-400 hidden sm:block">Eagles / Aces</p>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
