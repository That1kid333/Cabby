import React from 'react';
import { QrCode, PlusCircle, Trophy, Calculator, TrendingUp, Users, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatHandicapIndex } from '../lib/whsEngine';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenLogModal: () => void;
  onOpenQrShare: () => void;
  onOpenQrScanner: () => void;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenLogModal,
  onOpenQrShare,
  onOpenQrScanner,
  onOpenProfile
}) => {
  const { currentUser, golfers, switchActiveGolfer } = useApp();

  return (
    <header className="sticky top-0 z-50 bg-[#070B16]/90 backdrop-blur-md border-b border-white/10 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand & Logo */}
        <div 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-[#05C46B] to-[#00FF87] p-[1.5px] shadow-lg shadow-[#05C46B]/20">
            <img 
              src="/cabby-logo.svg" 
              alt="Cabby Logo" 
              className="w-full h-full object-cover bg-[#0B132B] rounded-[10px] p-1 group-hover:scale-105 transition-transform"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-2xl tracking-tight text-white font-['Outfit']">
                CABBY
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/40 uppercase tracking-widest">
                WHS 2024
              </span>
            </div>
            <p className="text-[11px] text-slate-400 -mt-1 font-medium hidden sm:block">
              Golf Handicap & Buddy Leaderboard
            </p>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-[#0E1626]/80 p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-[#05C46B] to-[#00FF87] text-[#070B16] shadow-md shadow-[#05C46B]/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <TrendingUp size={16} />
            Handicap
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-gradient-to-r from-[#05C46B] to-[#00FF87] text-[#070B16] shadow-md shadow-[#05C46B]/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Trophy size={16} />
            Leaderboards
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'calculator'
                ? 'bg-gradient-to-r from-[#05C46B] to-[#00FF87] text-[#070B16] shadow-md shadow-[#05C46B]/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calculator size={16} />
            Course Handicap
          </button>

          <button
            onClick={() => setActiveTab('courses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'courses'
                ? 'bg-gradient-to-r from-[#05C46B] to-[#00FF87] text-[#070B16] shadow-md shadow-[#05C46B]/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <MapPin size={16} />
            Courses
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Quick Log Round Button */}
          <button
            onClick={onOpenLogModal}
            className="flex items-center gap-2 bg-gradient-to-r from-[#05C46B] to-[#00FF87] hover:from-[#00FF87] hover:to-[#05C46B] text-[#070B16] font-bold px-3.5 py-2 rounded-xl shadow-lg shadow-[#05C46B]/25 hover:scale-105 transition-all text-sm"
          >
            <PlusCircle size={18} />
            <span className="hidden sm:inline">Post Round</span>
          </button>

          {/* QR Share Code Button */}
          <button
            onClick={onOpenQrShare}
            title="My Cabby QR & Friend Code"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all"
          >
            <QrCode size={20} />
          </button>

          {/* Switch Golfer Profile Dropdown (for testing friend views) */}
          <div className="relative group">
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-1.5 sm:pr-3 transition-all"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-lg object-cover ring-2 ring-[#05C46B]"
              />
              <div className="text-left hidden lg:block">
                <p className="text-xs font-bold text-white leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-[#00FF87] font-semibold">
                  Index: {formatHandicapIndex(currentUser.handicapIndex)}
                </p>
              </div>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
