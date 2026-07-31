import React from 'react';
import { Award, Info, TrendingDown, Target, Zap, ShieldCheck, Flame, CheckCircle2, ChevronRight, Trophy } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatHandicapIndex, calculateHandicapIndex } from '../lib/whsEngine';

interface HandicapCardProps {
  onOpenLogModal: () => void;
  onOpenCalculator: () => void;
  onOpenProfile: () => void;
}

export const HandicapCard: React.FC<HandicapCardProps> = ({
  onOpenLogModal,
  onOpenCalculator,
  onOpenProfile
}) => {
  const { currentUser, userRounds } = useApp();

  if (!currentUser) return null;

  const { handicapIndex, bestRoundIds, differentialsUsed, totalEvaluatedRounds } =
    calculateHandicapIndex(userRounds);

  const sortedRounds = [...userRounds]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20);

  return (
    <div className="space-y-6">
      
      {/* Primary Handicap Index Hero Banner */}
      <div className="relative overflow-hidden glass-panel p-6 sm:p-8 rounded-3xl border border-[#4F6B3A]/30 bg-gradient-to-br from-[#1E2118] via-[#20241A] to-[#171911]">
        
        {/* Decorative Background Glows */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#4F6B3A]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#C9A24B]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          {/* Left Column: Golfer Info & Index Display */}
          <div className="space-y-4">
            
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#4F6B3A]/20 text-[#7FA65C] border border-[#4F6B3A]/40 flex items-center gap-1.5">
                <ShieldCheck size={14} /> WHS 2024 VERIFIED INDEX
              </span>
              <span className="text-xs text-stone-400 font-medium">
                Home: {currentUser.homeCourse}
              </span>
            </div>

            <div className="flex items-baseline gap-4">
              <div>
                <h1 className="text-6xl sm:text-7xl font-black tracking-tight text-white font-['Outfit'] drop-shadow-md leading-none">
                  {formatHandicapIndex(handicapIndex)}
                </h1>
                {totalEvaluatedRounds === 0 && (
                  <span className="inline-block mt-2 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#C9A24B]/20 text-[#C9A24B] border border-[#C9A24B]/40">
                    WHS starting index — not a score
                  </span>
                )}
              </div>
              <div className="space-y-1">
                {totalEvaluatedRounds === 0 ? (
                  <p className="text-xs text-stone-400 max-w-[180px]">
                    Every new golfer starts here. It drops once you post rounds.
                  </p>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 text-[#7FA65C] font-bold text-sm">
                      <TrendingDown size={18} />
                      <span>Lowest Index: {formatHandicapIndex(currentUser.lowestHandicapIndex)}</span>
                    </div>
                    <p className="text-xs text-stone-400">
                      Target: {currentUser.targetHandicap ? formatHandicapIndex(currentUser.targetHandicap) : 'Scratch (0.0)'}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* WHS Rule Quick Summary */}
            {totalEvaluatedRounds === 0 ? (
              <p className="text-sm text-stone-300 max-w-xl leading-relaxed">
                <span className="text-[#7FA65C] font-bold">54.0 is the official WHS starting point</span> for every golfer with no rounds on file yet — it's the maximum index allowed, not a score. It's not a placeholder or a bug: post your first round below and it will drop to reflect your real ability.
              </p>
            ) : (
              <p className="text-sm text-stone-300 max-w-xl leading-relaxed">
                Calculated using the average of your best <span className="text-[#7FA65C] font-bold">{differentialsUsed} differentials</span> from your last <span className="text-white font-bold">{totalEvaluatedRounds} rounds</span>. Represents your potential scoring ability, not your average score!
              </p>
            )}

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onOpenLogModal}
                className="bg-gradient-to-r from-[#4F6B3A] to-[#7FA65C] hover:opacity-90 text-[#171911] font-extrabold px-5 py-2.5 rounded-xl shadow-lg shadow-black/20 transition-all text-sm flex items-center gap-2"
              >
                <Zap size={16} /> Log New Round
              </button>

              <button
                onClick={onOpenCalculator}
                className="bg-white/10 hover:bg-white/15 text-white font-semibold px-4 py-2.5 rounded-xl border border-white/10 transition-all text-sm flex items-center gap-2"
              >
                <Target size={16} /> Convert to Course Handicap
              </button>
            </div>

          </div>

          {/* Right Column: Key Golfing Stats */}
          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
            <div className="glass-panel p-4 rounded-2xl border-white/10 bg-white/5 space-y-1">
              <div className="flex items-center justify-between text-stone-400 text-xs font-semibold">
                <span>Best Gross</span>
                <Award size={14} className="text-[#C9A24B]" />
              </div>
              <p className="text-2xl font-extrabold text-white font-['Outfit']">
                {currentUser.bestGrossScore === 999 ? '--' : currentUser.bestGrossScore}
              </p>
              <p className="text-[10px] text-stone-400 font-medium">Lowest stroke round</p>
            </div>

            <div className="glass-panel p-4 rounded-2xl border-white/10 bg-white/5 space-y-1">
              <div className="flex items-center justify-between text-stone-400 text-xs font-semibold">
                <span>Best Differential</span>
                <Flame size={14} className="text-emerald-400" />
              </div>
              <p className="text-2xl font-extrabold text-[#7FA65C] font-['Outfit']">
                {currentUser.bestDifferential === 99.9 ? '--' : currentUser.bestDifferential.toFixed(1)}
              </p>
              <p className="text-[10px] text-stone-400 font-medium">Course difficulty adjusted</p>
            </div>

            <div className="glass-panel p-4 rounded-2xl border-white/10 bg-white/5 space-y-1">
              <div className="flex items-center justify-between text-stone-400 text-xs font-semibold">
                <span>Total Rounds</span>
                <Info size={14} className="text-blue-400" />
              </div>
              <p className="text-2xl font-extrabold text-white font-['Outfit']">
                {currentUser.totalRounds}
              </p>
              <p className="text-[10px] text-stone-400 font-medium">Recorded in Cabby</p>
            </div>

            <div className="glass-panel p-4 rounded-2xl border-white/10 bg-white/5 space-y-1">
              <div className="flex items-center justify-between text-stone-400 text-xs font-semibold">
                <span>Eagles / ACEs</span>
                <Trophy size={14} className="text-yellow-400" />
              </div>
              <p className="text-2xl font-extrabold text-amber-300 font-['Outfit']">
                {currentUser.eaglesCount} / {currentUser.holesInOneCount}
              </p>
              <p className="text-[10px] text-stone-400 font-medium">Trophy highlights</p>
            </div>
          </div>

        </div>

      </div>

      {/* WHS 20-Round Differential Breakdown */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Scoring Record Differentials</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#4F6B3A]/20 text-[#7FA65C] border border-[#4F6B3A]/30">
                Top {differentialsUsed} Counted
              </span>
            </h2>
            <p className="text-xs text-stone-400">
              Rounds with an <span className="text-[#7FA65C] font-semibold">emerald outline</span> are included in your official Handicap Index average.
            </p>
          </div>
        </div>

        {sortedRounds.length === 0 ? (
          <div className="text-center py-8 text-stone-400 space-y-2">
            <p className="text-sm">No rounds recorded yet!</p>
            <button
              onClick={onOpenLogModal}
              className="text-xs text-[#7FA65C] hover:underline font-bold"
            >
              Post your first round to calculate your Handicap Index →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {sortedRounds.map((round) => {
              const isBest = bestRoundIds.includes(round.id);
              return (
                <div
                  key={round.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    isBest
                      ? 'bg-[#4F6B3A]/15 border-[#7FA65C] shadow-md shadow-black/20 scale-[1.02]'
                      : 'bg-white/5 border-white/10 opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-stone-400 truncate max-w-[80px]">{round.date}</span>
                    {isBest && <CheckCircle2 size={14} className="text-[#7FA65C]" />}
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className={`text-xl font-extrabold font-['Outfit'] ${isBest ? 'text-[#7FA65C]' : 'text-stone-200'}`}>
                      {round.differential > 0 ? `+${round.differential.toFixed(1)}` : round.differential.toFixed(1)}
                    </span>
                    <span className="text-xs font-semibold text-stone-300">
                      {round.score} ({round.score > round.par ? `+${round.score - round.par}` : round.score - round.par})
                    </span>
                  </div>

                  <p className="text-[10px] text-stone-400 truncate mt-1">
                    {round.courseName}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
