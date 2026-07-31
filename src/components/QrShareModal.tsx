import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, QrCode, UserPlus } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface QrShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenScanner: () => void;
}

export const QrShareModal: React.FC<QrShareModalProps> = ({
  isOpen,
  onClose,
  onOpenScanner
}) => {
  const { currentUser, addFriendByCode } = useApp();
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen || !currentUser) return null;

  const shareUrl = `${window.location.origin}/#add-${currentUser.friendCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentUser.friendCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddFriendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendCodeInput.trim()) return;

    const res = await addFriendByCode(friendCodeInput);
    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
      setFriendCodeInput('');
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
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
            <QrCode className="text-[#00FF87]" size={24} /> Connect Golf Buddies
          </h2>
          <p className="text-xs text-slate-400">
            Share your QR code or referral code to sync high scores and round feeds.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white/5 border border-white/15 inline-block mx-auto shadow-2xl space-y-3">
          <div className="bg-white p-4 rounded-2xl inline-block shadow-inner">
            <QRCodeSVG
              value={shareUrl}
              size={180}
              fgColor="#040711"
              bgColor="#FFFFFF"
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              My Unique Cabby Code
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-black text-[#00FF87] tracking-wider font-mono">
                {currentUser.friendCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                {copied ? <Check size={16} className="text-[#00FF87]" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            onClose();
            onOpenScanner();
          }}
          className="w-full bg-white/10 hover:bg-white/15 text-white font-bold py-2.5 rounded-xl border border-white/10 text-xs flex items-center justify-center gap-2"
        >
          <QrCode size={16} className="text-[#00FF87]" /> Scan Buddy's QR Code with Camera
        </button>

        <form onSubmit={handleAddFriendSubmit} className="space-y-3 border-t border-white/10 pt-4 text-left">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Enter Buddy Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={friendCodeInput}
              onChange={(e) => setFriendCodeInput(e.target.value)}
              placeholder="e.g. CB-1234-AB"
              className="flex-1 bg-[#0A0F1D] border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm font-mono font-bold uppercase focus:outline-none focus:border-[#00FF87]"
            />
            <button
              type="submit"
              className="btn-primary text-xs px-4 py-2.5 font-extrabold font-['Outfit']"
            >
              Connect
            </button>
          </div>

          {statusMessage && (
            <p className={`text-xs font-bold ${statusMessage.type === 'success' ? 'text-[#00FF87]' : 'text-red-400'}`}>
              {statusMessage.text}
            </p>
          )}
        </form>

      </div>
    </div>
  );
};
