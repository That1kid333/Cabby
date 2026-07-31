import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Not every browser supports live barcode detection (notably Safari/Firefox as of
// this writing) — declare it loosely rather than depending on a lib.d.ts that may not have it.
declare global {
  interface Window {
    BarcodeDetector?: new (options: { formats: string[] }) => {
      detect: (source: CanvasImageSource) => Promise<Array<{ rawValue: string }>>;
    };
  }
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({ isOpen, onClose }) => {
  const { addFriendByCode } = useApp();
  const [manualCode, setManualCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);

  const supportsDetector = typeof window !== 'undefined' && !!window.BarcodeDetector;

  const extractCode = (value: string) => {
    const hashMatch = value.match(/#add-(.+)$/);
    return hashMatch ? hashMatch[1] : value;
  };

  const handleScannedValue = async (value: string) => {
    setScanning(false);
    const res = await addFriendByCode(extractCode(value));
    setStatusMessage(res.success ? { type: 'success', text: res.message } : { type: 'error', text: res.message });
    if (res.success) {
      setTimeout(() => { onClose(); setStatusMessage(null); }, 1500);
    }
  };

  useEffect(() => {
    if (!isOpen || !supportsDetector) return;

    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setScanning(true);

        const detector = new window.BarcodeDetector!({ formats: ['qr_code'] });

        const tick = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) {
              handleScannedValue(codes[0].rawValue);
              return;
            }
          } catch {
            // transient detection errors are expected between frames; keep scanning
          }
          frameRef.current = requestAnimationFrame(tick);
        };
        frameRef.current = requestAnimationFrame(tick);
      } catch {
        setCameraError('Camera access was denied or is unavailable. You can still enter a friend code below.');
      }
    }

    start();

    return () => {
      cancelled = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, [isOpen, supportsDetector]);

  if (!isOpen) return null;

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await handleScannedValue(manualCode.trim());
  };

  return (
    <div className="modal-overlay">
      <div className="glass-card w-full max-w-md p-6 rounded-3xl border-white/15 relative space-y-6 text-center">

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
        >
          <X size={20} />
        </button>

        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white font-['Outfit'] flex items-center justify-center gap-2">
            <Camera className="text-[#00FF87]" size={24} /> Scan A Friend's QR Code
          </h2>
          <p className="text-xs text-slate-400">
            Point your camera at a buddy's Cabby QR code to connect instantly.
          </p>
        </div>

        {supportsDetector ? (
          <div className="relative w-64 h-64 mx-auto rounded-3xl overflow-hidden border-2 border-[#00FF87] bg-slate-900 shadow-2xl">
            <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-4 border border-dashed border-[#00FF87]/50 rounded-2xl pointer-events-none" />
            {!scanning && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 text-xs text-slate-300">
                Starting camera…
              </div>
            )}
          </div>
        ) : (
          <div className="w-64 h-64 mx-auto rounded-3xl border-2 border-white/10 bg-slate-900 flex flex-col items-center justify-center gap-2 px-6 text-center">
            <AlertTriangle size={28} className="text-amber-400" />
            <p className="text-xs text-slate-300">
              Your browser doesn't support live QR scanning. Enter the code below instead.
            </p>
          </div>
        )}

        {cameraError && (
          <p className="text-xs text-amber-400 flex items-center justify-center gap-1.5">
            <AlertTriangle size={14} /> {cameraError}
          </p>
        )}

        <form onSubmit={handleManualSubmit} className="space-y-2 text-left border-t border-white/10 pt-4">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Or enter their friend code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="e.g. CB-1234-AB"
              className="flex-1 bg-[#0A0F1D] border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm font-mono font-bold uppercase focus:outline-none focus:border-[#00FF87]"
            />
            <button type="submit" className="btn-primary text-xs px-4 py-2.5 font-extrabold">
              Connect
            </button>
          </div>

          {statusMessage && (
            <p className={`text-xs font-bold text-center pt-1 ${statusMessage.type === 'success' ? 'text-[#00FF87]' : 'text-red-400'}`}>
              {statusMessage.text}
            </p>
          )}
        </form>

      </div>
    </div>
  );
};
