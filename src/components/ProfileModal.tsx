import React, { useState } from 'react';
import { X, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Avatar } from './Avatar';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateProfile, signOutUser } = useApp();

  const [name, setName] = useState(currentUser?.name || '');
  const [homeCourse, setHomeCourse] = useState(currentUser?.homeCourse || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [targetHandicap, setTargetHandicap] = useState(currentUser?.targetHandicap || 0);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      name,
      homeCourse,
      bio,
      targetHandicap: Number(targetHandicap)
    });
    onClose();
  };

  const handleSignOut = async () => {
    await signOutUser();
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="glass-card w-full max-w-lg p-6 sm:p-8 rounded-3xl border-white/15 relative space-y-6">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
        >
          <X size={20} />
        </button>

        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <Avatar name={currentUser.name} size={56} />
            <div>
              <h2 className="text-xl font-black text-white font-['Outfit']">{currentUser.name}</h2>
              <p className="text-xs text-[#00FF87] font-bold">Friend Code: {currentUser.friendCode}</p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold flex items-center gap-1.5"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">Golfer Name / Tag</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">Home Golf Club</label>
            <input
              type="text"
              value={homeCourse}
              onChange={(e) => setHomeCourse(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">Target Handicap Index Goal</label>
            <input
              type="number"
              step="0.1"
              value={targetHandicap}
              onChange={(e) => setTargetHandicap(Number(e.target.value))}
              className="form-input"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">Bio / Golf Mottos</label>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="form-input"
            />
          </div>

          <button
            type="submit"
            className="w-full btn-primary font-black py-3 rounded-xl text-sm"
          >
            Save Profile Changes
          </button>
        </form>

      </div>
    </div>
  );
};
