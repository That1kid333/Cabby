import React from 'react';
import { TrendingDown, Activity, Award, Target, Flame, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatHandicapIndex } from '../lib/whsEngine';

export const StatsAnalytics: React.FC = () => {
  const { currentUser, userRounds } = useApp();

  const sortedRounds = [...userRounds].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border-white/10 space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#4F6B3A]/20 text-[#7FA65C] border border-[#4F6B3A]/40">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white font-['Outfit']">
              Handicap Analytics & Scoring Performance
            </h1>
            <p className="text-xs text-stone-400">
              Track your differential progression, low rounds, and scoring consistency.
            </p>
          </div>
        </div>
      </div>

      {/* Differential History Graphic */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <TrendingDown size={18} className="text-[#7FA65C]" /> Differential Trend Record
        </h2>

        {sortedRounds.length === 0 ? (
          <p className="text-xs text-stone-400 text-center py-6">No rounds logged yet to generate trend charts.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-end gap-2 h-44 pt-6 pb-2 px-2 border-b border-white/10">
              {sortedRounds.map((r, i) => {
                const heightPercent = Math.min(100, Math.max(15, (20 - r.differential) * 5));
                return (
                  <div key={r.id} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Tooltip on Hover */}
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-[#171911] text-[#7FA65C] border border-[#7FA65C] text-[10px] font-bold px-2 py-0.5 rounded shadow-lg transition-opacity whitespace-nowrap z-20">
                      Diff: {r.differential} ({r.score})
                    </div>

                    <div
                      className={`w-full rounded-t-lg transition-all ${
                        r.isBestRound
                          ? 'bg-gradient-to-t from-[#4F6B3A] to-[#7FA65C] shadow-md shadow-black/25'
                          : 'bg-white/15'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-[9px] text-stone-400 font-mono rotate-[-45deg] origin-top-left mt-1">
                      {r.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-stone-400 text-center">
              Green bars indicate rounds selected in your official WHS Best Differentials.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
