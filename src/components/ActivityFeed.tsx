import React from 'react';
import { MessageCircle, ShieldCheck, Flag, Flame, ThumbsUp, Trophy } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Avatar } from './Avatar';
import { formatRelativeTime } from '../lib/formatTime';

export const ActivityFeed: React.FC = () => {
  const { activities, reactToActivity, verifyRound, currentUser } = useApp();

  return (
    <div className="glass-panel p-6 rounded-3xl space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-white font-['Outfit'] flex items-center gap-2">
            <MessageCircle className="text-[#00FF87]" size={20} /> Clubhouse Activity Feed
          </h2>
          <p className="text-xs text-slate-400">
            Recent scores, handicap drops, and round highlights logged by your golf buddies.
          </p>
        </div>
      </div>

      {activities.length === 0 && (
        <div className="text-center py-10 space-y-1">
          <Flag className="mx-auto text-slate-500" size={28} />
          <p className="text-sm text-slate-300">No activity yet.</p>
          <p className="text-xs text-slate-400">Post your first round to get the clubhouse feed going.</p>
        </div>
      )}

      <div className="space-y-4">
        {activities.map((act) => {
          const userReactions = act.userReactions || [];

          return (
            <div
              key={act.id}
              className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all space-y-3"
            >
              {/* Header: Golfer Avatar & Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={act.golferName} size={40} />
                  <div>
                    <p className="font-bold text-white text-sm">{act.golferName}</p>
                    <p className="text-[11px] text-slate-400">{formatRelativeTime(act.timestamp)}</p>
                  </div>
                </div>

                {act.roundId && (
                  <button
                    onClick={() => verifyRound(act.roundId!)}
                    className="px-3 py-1 rounded-full bg-[#05C46B]/20 text-[#00FF87] border border-[#05C46B]/40 text-xs font-bold flex items-center gap-1.5 hover:bg-[#05C46B]/30"
                  >
                    <ShieldCheck size={14} /> Attest Score
                  </button>
                )}
              </div>

              {/* Title & Subtitle */}
              <div>
                <h3 className="font-bold text-white text-base">{act.title}</h3>
                <p className="text-xs text-slate-300">{act.subtitle}</p>
              </div>

              {/* Reactions Bar */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <button
                  onClick={() => reactToActivity(act.id, 'fire')}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                    userReactions.includes('fire')
                      ? 'bg-[#05C46B]/30 border-[#00FF87] text-[#00FF87]'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <Flame size={14} /> {act.reactions.fire || 0}
                </button>

                <button
                  onClick={() => reactToActivity(act.id, 'golf')}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                    userReactions.includes('golf')
                      ? 'bg-[#05C46B]/30 border-[#00FF87] text-[#00FF87]'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <Flag size={14} /> {act.reactions.golf || 0}
                </button>

                <button
                  onClick={() => reactToActivity(act.id, 'applause')}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                    userReactions.includes('applause')
                      ? 'bg-[#05C46B]/30 border-[#00FF87] text-[#00FF87]'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <ThumbsUp size={14} /> {act.reactions.applause || 0}
                </button>

                <button
                  onClick={() => reactToActivity(act.id, 'trophy')}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                    userReactions.includes('trophy')
                      ? 'bg-[#FFD700]/30 border-[#FFD700] text-[#FFD700]'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <Trophy size={14} /> {act.reactions.trophy || 0}
                </button>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
