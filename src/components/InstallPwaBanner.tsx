import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export const InstallPwaBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!showBanner || !deferredPrompt) return null;

  const handleInstallClick = async () => {
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setShowBanner(false);
    }
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 max-w-md mx-auto z-50 glass-panel p-4 rounded-2xl border-[#7FA65C]/40 bg-gradient-to-r from-[#20241A] to-[#171911] shadow-2xl flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#4F6B3A]/20 text-[#7FA65C] flex items-center justify-center font-bold">
          <Smartphone size={20} />
        </div>
        <div>
          <h4 className="text-xs font-extrabold text-white font-['Outfit']">Install Cabby App</h4>
          <p className="text-[10px] text-stone-300">Add to Home Screen for fast offline round logging!</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="px-3 py-1.5 rounded-xl bg-[#4F6B3A] text-[#171911] text-xs font-bold hover:bg-[#7FA65C]"
        >
          Install
        </button>
        <button
          onClick={() => setShowBanner(false)}
          className="p-1 rounded-lg text-stone-400 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
