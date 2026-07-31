import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Share2 } from 'lucide-react';
import { Game } from '../types';

interface ShareGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game;
}

export const ShareGameModal: React.FC<ShareGameModalProps> = ({ isOpen, onClose, game }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}${window.location.pathname}#game-${game.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-card w-full max-w-md p-6 sm:p-8 rounded-3xl border-white/15 relative space-y-6 text-center">

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
        >
          <X size={20} />
        </button>

        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white font-['Outfit'] flex items-center justify-center gap-2">
            <Share2 className="text-[#00FF87]" size={22} /> Share This Game
          </h2>
          <p className="text-xs text-slate-400">
            Opens straight to {game.courseName} — anyone signed in to Cabby with this link can view and join.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white/5 border border-white/15 inline-block mx-auto shadow-2xl">
          <div className="bg-white p-4 rounded-2xl inline-block shadow-inner">
            <QRCodeSVG value={shareUrl} size={180} fgColor="#040711" bgColor="#FFFFFF" level="H" includeMargin={false} />
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="form-input text-xs flex-1"
            onFocus={(e) => e.target.select()}
          />
          <button onClick={handleCopy} className="btn-primary px-4 flex items-center gap-1.5 text-xs font-bold shrink-0">
            {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

      </div>
    </div>
  );
};
