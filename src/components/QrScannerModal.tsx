import React, { useState } from 'react';
import { X, Camera, QrCode, Check, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({ isOpen, onClose }) => {
  const { golfers, addFriendByCode } = useApp();
  const [selectedGolferId, setSelectedGolferId] = useState(golfers[1]?.id || '');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulatedScan = (code: string) => {
    const res = addFriendByCode(code);
    setStatusMessage(res.message);
    if (res.success) {
      setTimeout(() => {
        onClose();
        setStatusMessage(null);
      }, 1500);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel w-full max-w-md p-6 rounded-3xl border-white/15 relative space-y-6 text-center">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
        >
          <X size={20} />
        </button>

        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-white font-['Outfit'] flex items-center justify-center gap-2">
            <Camera className="text-[#00FF87]" size={24} /> QR Code Camera Scanner
          </h2>
          <p className="text-xs text-slate-400">
            Point camera at a friend's Cabby QR code to instantly sync.
          </p>
        </div>

        {/* Viewfinder Camera Graphic */}
        <div className="relative w-64 h-64 mx-auto rounded-3xl overflow-hidden border-2 border-[#00FF87] bg-slate-900 flex flex-col items-center justify-center space-y-3 shadow-2xl">
          <div className="absolute inset-4 border border-dashed border-[#00FF87]/50 rounded-2xl animate-pulse pointer-events-none" />
          
          <Camera size={48} className="text-[#00FF87] animate-bounce" />
          <p className="text-xs text-slate-300 font-semibold px-4">
            Camera active... Align QR code in frame
          </p>
        </div>

        {/* Quick Simulator Test Selection */}
        <div className="space-y-2 text-left border-t border-white/10 pt-4">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Test Quick Scan with Golf Buddy:
          </label>
          <div className="flex gap-2">
            <select
              value={selectedGolferId}
              onChange={(e) => setSelectedGolferId(e.target.value)}
              className="flex-1 bg-[#0E1626] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
            >
              {golfers.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.friendCode})
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                const target = golfers.find(g => g.id === selectedGolferId);
                if (target) handleSimulatedScan(target.friendCode);
              }}
              className="bg-gradient-to-r from-[#05C46B] to-[#00FF87] text-[#070B16] font-bold px-4 py-2 rounded-xl text-xs"
            >
              Simulate Scan
            </button>
          </div>

          {statusMessage && (
            <p className="text-xs font-bold text-[#00FF87] text-center pt-2">
              {statusMessage}
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
