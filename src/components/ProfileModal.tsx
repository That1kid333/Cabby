import React, { useState } from 'react';
import { X, User, Home, Target, Shield, Check, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, golfers, updateProfile, switchActiveGolfer } = useApp();

  const [name, setName] = useState(currentUser.name);
  const [homeCourse, setHomeCourse] = useState(currentUser.homeCourse);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [targetHandicap, setTargetHandicap] = useState(currentUser.targetHandicap || 0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      homeCourse,
      bio,
      targetHandicap: Number(targetHandicap)
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel w-full max-w-lg p-6 sm:p-8 rounded-3xl border-white/15 relative space-y-6">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-[#05C46B]"
          />
          <div>
            <h2 className="text-xl font-extrabold text-white font-['Outfit']">{currentUser.name}</h2>
            <p className="text-xs text-[#00FF87] font-bold">Friend Code: {currentUser.friendCode}</p>
          </div>
        </div>

        {/* Switch Active Golfer Profile Drawer */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Switch Active Golfer (Friend Simulator)</span>
            <RefreshCw size={12} className="text-[#00FF87]" />
          </label>
          <select
            value={currentUser.id}
            onChange={(e) => {
              switchActiveGolfer(e.target.value);
              onClose();
            }}
            className="w-full bg-[#0E1626] border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white"
          >
            {golfers.map(g => (
              <option key={g.id} value={g.id}>
                {g.name} — Handicap Index: {g.handicapIndex > 0 ? g.handicapIndex : `+${Math.abs(g.handicapIndex)}`}
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">Golfer Name / Tag</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0E1626] border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">Home Golf Club</label>
            <input
              type="text"
              value={homeCourse}
              onChange={(e) => setHomeCourse(e.target.value)}
              className="w-full bg-[#0E1626] border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">Target Handicap Index Goal</label>
            <input
              type="number"
              step="0.1"
              value={targetHandicap}
              onChange={(e) => setTargetHandicap(Number(e.target.value))}
              className="w-full bg-[#0E1626] border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">Bio / Golf Mottos</label>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-[#0E1626] border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#05C46B] to-[#00FF87] text-[#070B16] font-bold py-3 rounded-xl text-sm"
          >
            Save Profile Changes
          </button>
        </form>

      </div>
    </div>
  );
};
