import React, { useState } from 'react';
import { DollarSign, Check, Plus, X, Loader2, HandCoins } from 'lucide-react';
import { Game, GolferProfile } from '../types';
import { proposeBet, agreeToBet, settleBet, cancelBet } from '../lib/games';

interface BettingPanelProps {
  game: Game;
  currentUser: GolferProfile;
  onChanged: () => Promise<void>;
}

export const BettingPanel: React.FC<BettingPanelProps> = ({ game, currentUser, onChanged }) => {
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyBetId, setBusyBetId] = useState<string | null>(null);
  const [settlingBetId, setSettlingBetId] = useState<string | null>(null);

  const otherPlayers = game.players.filter(p => p.golferId !== currentUser.id);
  const openBets = game.bets.filter(b => b.status === 'open');
  const settledBets = game.bets.filter(b => b.status !== 'open');

  const toggleParticipant = (golferId: string) => {
    setSelectedParticipants(prev => (prev.includes(golferId) ? prev.filter(id => id !== golferId) : [...prev, golferId]));
  };

  const handlePropose = async () => {
    if (!description.trim() || selectedParticipants.length === 0 || submitting) return;
    setSubmitting(true);
    setError(null);

    const { bet, error: proposeError } = await proposeBet(game.id, currentUser, description.trim(), Number(amount) || 0, selectedParticipants);

    setSubmitting(false);

    if (!bet) {
      setError(proposeError || 'Could not save that bet. Try again.');
      return;
    }

    setDescription('');
    setAmount('');
    setSelectedParticipants([]);
    setShowForm(false);
    await onChanged();
  };

  const handleAgree = async (betId: string) => {
    setBusyBetId(betId);
    setError(null);
    const { success, error: agreeError } = await agreeToBet(betId, currentUser.id);
    setBusyBetId(null);
    if (!success) {
      setError(agreeError || 'Could not save that. Try again.');
      return;
    }
    await onChanged();
  };

  const handleSettle = async (betId: string, winnerGolferId?: string) => {
    setBusyBetId(betId);
    setError(null);
    const { success, error: settleError } = await settleBet(betId, winnerGolferId);
    setBusyBetId(null);
    setSettlingBetId(null);
    if (!success) {
      setError(settleError || 'Could not save that. Try again.');
      return;
    }
    await onChanged();
  };

  const handleCancel = async (betId: string) => {
    setBusyBetId(betId);
    setError(null);
    const { success, error: cancelError } = await cancelBet(betId);
    setBusyBetId(null);
    if (!success) {
      setError(cancelError || 'Could not remove that bet. Try again.');
      return;
    }
    await onChanged();
  };

  return (
    <div className="glass-panel p-6 rounded-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <HandCoins size={16} className="text-[#FFD700]" /> Side Bets
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            disabled={otherPlayers.length === 0}
            title={otherPlayers.length === 0 ? 'Invite at least one other player to the game first' : undefined}
            className="text-xs text-[#00FF87] font-bold hover:underline flex items-center gap-1 disabled:text-slate-500 disabled:no-underline disabled:cursor-not-allowed"
          >
            <Plus size={14} /> Propose a Bet
          </button>
        )}
      </div>

      <p className="text-[10px] text-slate-500">
        Friendly wagers between whoever agrees to them. Cabby only tracks who's in and whether it's settled — you pay each other however you want (Apple Pay, Cash App, cash).
        {otherPlayers.length === 0 && ' No one else has joined this game yet — invite a friend to make a bet with.'}
      </p>

      {error && <p className="text-xs font-bold text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">{error}</p>}

      {showForm && (
        <div className="p-4 rounded-2xl bg-white/5 border border-[#FFD700]/30 space-y-3">
          <input
            type="text"
            placeholder="What's the bet? (e.g. Closest to pin on 17)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-input form-input-sm"
          />
          <div className="relative">
            <DollarSign size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="number"
              min="0"
              step="1"
              placeholder="Amount (optional)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="form-input form-input-sm pl-7"
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Who's in?</p>
            <div className="flex flex-wrap gap-2">
              {otherPlayers.map(p => (
                <button
                  key={p.golferId}
                  type="button"
                  onClick={() => toggleParticipant(p.golferId)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                    selectedParticipants.includes(p.golferId) ? 'bg-[#FFD700]/20 border-[#FFD700] text-[#FFD700]' : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  {p.golferName}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 text-xs text-slate-400 hover:text-white font-bold py-2">Cancel</button>
            <button
              onClick={handlePropose}
              disabled={!description.trim() || selectedParticipants.length === 0 || submitting}
              className="flex-1 bg-[#FFD700] text-[#070B16] font-bold py-2 rounded-xl text-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />} Propose
            </button>
          </div>
        </div>
      )}

      {game.bets.length === 0 && !showForm && (
        <p className="text-xs text-slate-400 text-center py-2">No bets yet — bets are optional, propose one if your group's into it.</p>
      )}

      {openBets.map(bet => {
        const me = bet.participants.find(p => p.golferId === currentUser.id);
        const allAgreed = bet.participants.every(p => p.agreed);
        return (
          <div key={bet.id} className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-white">{bet.description}</p>
                <p className="text-[10px] text-slate-400">
                  {bet.amount > 0 ? `$${bet.amount.toFixed(2)} • ` : ''}Proposed by {bet.createdByName}
                </p>
              </div>
              {bet.createdBy === currentUser.id && (
                <button onClick={() => handleCancel(bet.id)} disabled={busyBetId === bet.id} className="text-slate-500 hover:text-red-400 shrink-0">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {bet.participants.map(p => (
                <span
                  key={p.golferId}
                  className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${
                    p.agreed ? 'bg-[#00FF87]/15 text-[#00FF87]' : 'bg-white/5 text-slate-400'
                  }`}
                >
                  {p.agreed && <Check size={10} />} {p.golferName}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              {me && !me.agreed && (
                <button
                  onClick={() => handleAgree(bet.id)}
                  disabled={busyBetId === bet.id}
                  className="text-xs bg-[#00FF87]/20 text-[#00FF87] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50"
                >
                  {busyBetId === bet.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} I'm In
                </button>
              )}

              {allAgreed && settlingBetId !== bet.id && (
                <button onClick={() => setSettlingBetId(bet.id)} className="text-xs bg-white/10 text-white font-bold px-3 py-1.5 rounded-lg">
                  Mark Settled
                </button>
              )}
            </div>

            {settlingBetId === bet.id && (
              <div className="p-2.5 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/30 space-y-2">
                <p className="text-[10px] text-slate-300">Who won? (optional)</p>
                <div className="flex flex-wrap gap-1.5">
                  {bet.participants.map(p => (
                    <button
                      key={p.golferId}
                      onClick={() => handleSettle(bet.id, p.golferId)}
                      disabled={busyBetId === bet.id}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/10 text-white hover:bg-[#FFD700]/20 hover:text-[#FFD700] disabled:opacity-50"
                    >
                      {p.golferName}
                    </button>
                  ))}
                  <button
                    onClick={() => handleSettle(bet.id)}
                    disabled={busyBetId === bet.id}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/10 text-slate-300 disabled:opacity-50"
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {settledBets.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-white/5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Settled</p>
          {settledBets.map(bet => (
            <div key={bet.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
              <p className="text-xs text-slate-300">{bet.description}</p>
              <p className="text-[10px] text-slate-500">
                {bet.winnerGolferId ? bet.participants.find(p => p.golferId === bet.winnerGolferId)?.golferName + ' won' : 'Settled'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
