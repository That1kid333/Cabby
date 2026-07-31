import React from 'react';
import { QrCode, PlusCircle, Trophy, Calculator, TrendingUp, MapPin, Swords } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatHandicapIndex } from '../lib/whsEngine';
import { Avatar } from './Avatar';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenLogModal: () => void;
  onOpenQrShare: () => void;
  onOpenProfile: () => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenLogModal,
  onOpenQrShare,
  onOpenProfile,
  onOpenAuth
}) => {
  const { currentUser, isAuthenticated, signOutUser } = useApp();

  return (
    <header className="sticky top-0 z-50 bg-[#14150F]/90 backdrop-blur-xl border-b border-white/10 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative w-10 h-10 rounded-2xl overflow-hidden bg-gradient-to-br from-[#7FA65C] to-[#6B8E4E] p-[1.5px] shadow-lg shadow-black/20">
            <img 
              src="/cabby-logo.svg" 
              alt="Cabby Logo" 
              className="w-full h-full object-cover bg-[#14150F] rounded-[14px] p-1 group-hover:scale-105 transition-transform"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-2xl tracking-tight text-white font-['Outfit']">
                CABBY
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#C9A24B]/20 text-[#C9A24B] border border-[#C9A24B]/40 uppercase tracking-widest">
                WHS 2024
              </span>
            </div>
            <p className="text-[11px] text-stone-400 -mt-1 font-medium hidden sm:block">
              Golf Handicap & Buddy Leaderboard
            </p>
          </div>
        </div>

        {/* Navigation Tabs (When Logged In) */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1 bg-[#1E2118]/80 p-1.5 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-[#7FA65C] to-[#6B8E4E] text-[#14150F] shadow-md shadow-black/25'
                  : 'text-stone-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <TrendingUp size={16} />
              Handicap
            </button>

            <button
              onClick={() => setActiveTab('games')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'games'
                  ? 'bg-gradient-to-r from-[#7FA65C] to-[#6B8E4E] text-[#14150F] shadow-md shadow-black/25'
                  : 'text-stone-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Swords size={16} />
              Games
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-gradient-to-r from-[#7FA65C] to-[#6B8E4E] text-[#14150F] shadow-md shadow-black/25'
                  : 'text-stone-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Trophy size={16} />
              Leaderboards
            </button>

            <button
              onClick={() => setActiveTab('calculator')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'calculator'
                  ? 'bg-gradient-to-r from-[#7FA65C] to-[#6B8E4E] text-[#14150F] shadow-md shadow-black/25'
                  : 'text-stone-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calculator size={16} />
              Course Handicap
            </button>

            <button
              onClick={() => setActiveTab('courses')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'courses'
                  ? 'bg-gradient-to-r from-[#7FA65C] to-[#6B8E4E] text-[#14150F] shadow-md shadow-black/25'
                  : 'text-stone-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <MapPin size={16} />
              Courses
            </button>
          </nav>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated && currentUser ? (
            <>
              <button
                onClick={onOpenLogModal}
                className="btn-primary text-xs px-3.5 py-2 font-black font-['Outfit'] shadow-md shadow-black/20"
              >
                <PlusCircle size={16} />
                <span className="hidden sm:inline">Post Round</span>
              </button>

              <button
                onClick={onOpenQrShare}
                title="My Cabby QR & Friend Code"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white border border-white/10 transition-all"
              >
                <QrCode size={18} />
              </button>

              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-1.5 sm:pr-3 transition-all"
              >
                <Avatar name={currentUser.name} size={32} />
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-extrabold text-white leading-tight">{currentUser.name}</p>
                  <p className="text-[10px] text-[#7FA65C] font-bold">
                    Index: {formatHandicapIndex(currentUser.handicapIndex)}
                  </p>
                </div>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="btn-secondary text-xs px-4 py-2 font-bold"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('signup')}
                className="btn-primary text-xs px-4 py-2 font-black font-['Outfit']"
              >
                Join Free
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
