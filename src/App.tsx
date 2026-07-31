import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { HandicapCard } from './components/HandicapCard';
import { CourseHandicapCalculator } from './components/CourseHandicapCalculator';
import { Leaderboards } from './components/Leaderboards';
import { ActivityFeed } from './components/ActivityFeed';
import { CourseDatabase } from './components/CourseDatabase';
import { StatsAnalytics } from './components/StatsAnalytics';
import { LogRoundModal } from './components/LogRoundModal';
import { QrShareModal } from './components/QrShareModal';
import { QrScannerModal } from './components/QrScannerModal';
import { ProfileModal } from './components/ProfileModal';
import { InstallPwaBanner } from './components/InstallPwaBanner';
import { GamesPage } from './components/GamesPage';
import { RecentGamesWidget } from './components/RecentGamesWidget';
import { Trophy, TrendingUp, MapPin, PlusCircle, Swords } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentUser, isAuthenticated } = useApp();
  const [activeTab, setActiveTab] = useState<string>(() => (/^#game-/.test(window.location.hash) ? 'games' : 'dashboard'));

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [isQrShareOpen, setIsQrShareOpen] = useState<boolean>(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen pb-24 md:pb-12 text-stone-100 flex flex-col justify-between bg-[#14150F]">
      
      {/* Top Header */}
      <div>
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenLogModal={() => setIsLogModalOpen(true)}
          onOpenQrShare={() => setIsQrShareOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenAuth={handleOpenAuth}
        />

        {/* Main Body Container */}
        <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-8">
          
          {!isAuthenticated ? (
            <LandingPage onOpenAuth={handleOpenAuth} />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <div className="space-y-8">
                  <HandicapCard
                    onOpenLogModal={() => setIsLogModalOpen(true)}
                    onOpenCalculator={() => setActiveTab('calculator')}
                    onOpenProfile={() => setIsProfileOpen(true)}
                  />

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                      <ActivityFeed />
                    </div>
                    <div className="space-y-8">
                      <RecentGamesWidget onOpenGames={() => setActiveTab('games')} />
                      <StatsAnalytics />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'games' && <GamesPage />}

              {activeTab === 'leaderboard' && (
                <Leaderboards
                  onOpenQrShare={() => setIsQrShareOpen(true)}
                  onOpenQrScanner={() => setIsQrScannerOpen(true)}
                />
              )}

              {activeTab === 'calculator' && (
                <CourseHandicapCalculator />
              )}

              {activeTab === 'courses' && (
                <CourseDatabase />
              )}
            </>
          )}

        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12 py-8 bg-[#14150F]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs text-stone-400">
          <div className="flex items-center gap-2">
            <img src="/cabby-logo.svg" alt="Cabby" className="w-6 h-6" />
            <span className="font-extrabold text-white font-['Outfit']">CABBY GOLF</span>
            <span>• World Handicap System (WHS 2024) Compliant</span>
          </div>

          <div className="flex items-center gap-4 text-stone-400 font-medium">
            <span>Netlify & Supabase Ready</span>
            <span>•</span>
            <span>PWA Enabled</span>
            <span>•</span>
            <span className="text-[#7FA65C] font-semibold">
              Made for golfers & their buddies
            </span>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Bar Navigation (When Authenticated) */}
      {isAuthenticated && (
        <div className="mobile-nav-bar md:hidden">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
              activeTab === 'dashboard' ? 'text-[#7FA65C]' : 'text-stone-400'
            }`}
          >
            <TrendingUp size={20} />
            Handicap
          </button>

          <button
            onClick={() => setActiveTab('games')}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
              activeTab === 'games' ? 'text-[#7FA65C]' : 'text-stone-400'
            }`}
          >
            <Swords size={20} />
            Games
          </button>

          <button
            onClick={() => setIsLogModalOpen(true)}
            className="flex flex-col items-center gap-1 text-[10px] font-extrabold text-[#14150F] -mt-5"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#7FA65C] to-[#6B8E4E] flex items-center justify-center shadow-lg shadow-black/25 border-2 border-[#14150F]">
              <PlusCircle size={24} />
            </div>
            Post
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
              activeTab === 'leaderboard' ? 'text-[#7FA65C]' : 'text-stone-400'
            }`}
          >
            <Trophy size={20} />
            Leaderboard
          </button>

          <button
            onClick={() => setActiveTab('courses')}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
              activeTab === 'courses' ? 'text-[#7FA65C]' : 'text-stone-400'
            }`}
          >
            <MapPin size={20} />
            Courses
          </button>
        </div>
      )}

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setActiveTab(/^#game-/.test(window.location.hash) ? 'games' : 'dashboard')}
      />

      <LogRoundModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
      />

      <QrShareModal
        isOpen={isQrShareOpen}
        onClose={() => setIsQrShareOpen(false)}
        onOpenScanner={() => setIsQrScannerOpen(true)}
      />

      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <InstallPwaBanner />

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
