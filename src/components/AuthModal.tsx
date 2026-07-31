


import React, { useState } from 'react';
import { X, Mail, Lock, User, Flag } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'signup';
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'signup',
  onClose,
  onSuccess
}) => {
  const { signUpUser, signInUser } = useApp();

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [homeCourse, setHomeCourse] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          setErrorMsg('Please enter your Golfer Name or Tag.');
          setLoading(false);
          return;
        }

        const res = await signUpUser(email, password, name, homeCourse);
        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setErrorMsg(res.message);
        }
      } else {
        const res = await signInUser(email, password);
        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setErrorMsg(res.message);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-card w-full max-w-md p-6 sm:p-8 rounded-3xl border-white/15 relative space-y-6">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
        >
          <X size={20} />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl mx-auto bg-gradient-to-br from-[#00FF87] to-[#00E676] p-[1.5px] shadow-lg shadow-[#00FF87]/20">
            <img src="/cabby-logo.svg" alt="Cabby" className="w-full h-full object-cover bg-[#040711] rounded-[14px] p-1.5" />
          </div>
          <h2 className="text-2xl font-black text-white font-['Outfit']">
            {mode === 'signup' ? 'Join Cabby Golf' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-slate-400">
            {mode === 'signup' ? 'Create your profile to track your WHS Handicap Index.' : 'Sign in to access your clubhouse & leaderboards.'}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-[#0A0F1D] p-1 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${mode === 'signup'
                ? 'bg-gradient-to-r from-[#00FF87] to-[#00E676] text-[#040711] shadow-md'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${mode === 'login'
                ? 'bg-gradient-to-r from-[#00FF87] to-[#00E676] text-[#040711] shadow-md'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            Sign In
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">

          {mode === 'signup' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Golfer Name / Nickname</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Rivera"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#0A0F1D] border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00FF87]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Home Golf Course</label>
                <div className="relative">
                  <Flag size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Pebble Beach Golf Links"
                    value={homeCourse}
                    onChange={(e) => setHomeCourse(e.target.value)}
                    className="w-full bg-[#0A0F1D] border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00FF87]"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                required
                placeholder="you@golfclub.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0A0F1D] border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00FF87]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0A0F1D] border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00FF87]"
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs font-bold text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary font-black py-3 rounded-xl text-sm"
          >
            {loading ? 'Processing...' : mode === 'signup' ? 'Create Free Golfer Profile' : 'Sign In To Clubhouse'}
          </button>
        </form>

      </div>
    </div>
  );
};
