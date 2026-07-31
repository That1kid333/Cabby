import React, { useState } from 'react';
import { Trophy, QrCode, Zap, ArrowRight, Calculator, Sparkles } from 'lucide-react';
import { calculateCourseHandicap, formatHandicapIndex } from '../lib/whsEngine';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  // Quick WHS Demo Calculator state on Landing Page
  const [demoIndex, setDemoIndex] = useState<number>(7.4);
  const [demoSlope, setDemoSlope] = useState<number>(136);
  const [demoRating, setDemoRating] = useState<number>(73.3);
  const [demoPar, setDemoPar] = useState<number>(72);

  const demoCourseHandicap = calculateCourseHandicap(demoIndex, demoSlope, demoRating, demoPar);

  return (
    <div className="space-y-20 pb-16 text-stone-100">
      
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 overflow-hidden">

        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#7FA65C]/10 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[350px] h-[350px] bg-[#C9A24B]/8 rounded-full blur-[110px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 text-center space-y-8 relative z-10">

          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#7FA65C]/15 border border-[#7FA65C]/40 text-[#7FA65C] text-xs font-bold">
            <Sparkles size={14} /> WHS 2024 COMPLIANT GOLF CLUBHOUSE APP
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight font-['Outfit'] leading-[1.1]">
            Track Your Handicap <br />
            <span className="text-gradient-emerald">Like A PGA Pro.</span>
          </h1>

          <p className="text-base sm:text-lg text-stone-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Forget ugly spreadsheets & clunky paid apps. <strong className="text-white">Cabby</strong> delivers accurate WHS calculations, course handicap converters, and live buddy high-score leaderboards.
          </p>

          {/* CTA Button Group */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onOpenAuth('signup')}
              className="btn-primary text-base px-8 py-4 shadow-xl shadow-black/25 font-black font-['Outfit']"
            >
              Get Started Free <ArrowRight size={20} />
            </button>

            <button
              onClick={() => onOpenAuth('login')}
              className="btn-secondary text-base px-7 py-4"
            >
              Member Sign In
            </button>
          </div>

          {/* Example Preview Card */}
          <div className="pt-8 max-w-4xl mx-auto">
            <div className="glass-card p-4 sm:p-6 rounded-3xl border-[#7FA65C]/30 shadow-2xl relative group">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-[#7FA65C]/10 to-[#C9A24B]/10 pointer-events-none opacity-50" />

              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-[#14150F]/90 border border-white/10 text-left">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#7FA65C]" />
                    <span className="text-xs font-bold text-[#7FA65C]">EXAMPLE HANDICAP INDEX</span>
                  </div>
                  <h3 className="text-4xl font-extrabold text-white font-['Outfit']">7.2 Index</h3>
                  <p className="text-xs text-stone-400">Average of best 8 differentials from last 20 rounds</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[100px]">
                    <p className="text-[10px] text-stone-400 font-semibold">Best Gross</p>
                    <p className="text-xl font-bold text-white">75</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[100px]">
                    <p className="text-[10px] text-stone-400 font-semibold">Lowest Diff</p>
                    <p className="text-xl font-bold text-[#7FA65C]">3.1</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#C9A24B]/15 border border-[#C9A24B]/30 text-center min-w-[100px]">
                    <p className="text-[10px] text-[#C9A24B] font-semibold">Club Rank</p>
                    <p className="text-xl font-bold text-[#C9A24B]">#1</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </section>

      {/* Interactive WHS Calculator Preview */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="glass-card p-8 rounded-3xl border-white/10 space-y-6 relative">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-stone-300 text-xs font-bold">
              <Calculator size={14} className="text-[#7FA65C]" /> INTERACTIVE WHS DEMO
            </div>
            <h2 className="text-3xl font-black text-white font-['Outfit']">
              Test The Course Handicap Calculator
            </h2>
            <p className="text-xs text-stone-400">
              Drag parameters below to see how WHS converts your Handicap Index to your playing target for any tee set.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-4">
            {/* Left Controls */}
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-stone-300">Handicap Index</span>
                  <span className="text-[#7FA65C]">{formatHandicapIndex(demoIndex)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="36"
                  step="0.5"
                  value={demoIndex}
                  onChange={(e) => setDemoIndex(Number(e.target.value))}
                  className="w-full accent-[#7FA65C]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-stone-300">Tee Slope Rating (Difficulty)</span>
                  <span className="text-white">{demoSlope}</span>
                </div>
                <input
                  type="range"
                  min="55"
                  max="155"
                  value={demoSlope}
                  onChange={(e) => setDemoSlope(Number(e.target.value))}
                  className="w-full accent-[#7FA65C]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-stone-300">Course Rating / Par</span>
                  <span className="text-white">{demoRating} / {demoPar}</span>
                </div>
                <input
                  type="range"
                  min="65"
                  max="80"
                  step="0.5"
                  value={demoRating}
                  onChange={(e) => setDemoRating(Number(e.target.value))}
                  className="w-full accent-[#7FA65C]"
                />
              </div>
            </div>

            {/* Right Output Badge */}
            <div className="glass-card p-6 rounded-2xl border-[#7FA65C]/40 bg-[#14150F]/80 text-center space-y-2">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Target Course Handicap
              </p>
              <p className="text-6xl font-black text-[#7FA65C] font-['Outfit']">
                {demoCourseHandicap}
              </p>
              <p className="text-xs text-stone-300">
                You get <strong className="text-white">{demoCourseHandicap} strokes</strong> on this course!
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Core Feature Pillars */}
      <section className="max-w-6xl mx-auto px-4 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-extrabold text-white font-['Outfit']">
            Everything Golfers Need In One App
          </h2>
          <p className="text-sm text-stone-400">
            Designed for golf junkies who want accuracy, friendly competition, and modern UX.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-3xl border-white/10 space-y-3 hover:border-[#7FA65C]/40 transition-all">
            <div className="p-3 rounded-2xl bg-[#7FA65C]/20 text-[#7FA65C] w-fit">
              <Trophy size={24} />
            </div>
            <h3 className="text-xl font-bold text-white font-['Outfit']">Buddy High-Score Leaderboards</h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              Compete live with your golf crew across Handicap Index, Gross Stroke rounds, lowest differentials, and Eagles Hall of Fame.
            </p>
          </div>

          <div className="glass-card p-6 rounded-3xl border-white/10 space-y-3 hover:border-[#7FA65C]/40 transition-all">
            <div className="p-3 rounded-2xl bg-[#C9A24B]/20 text-[#C9A24B] w-fit">
              <QrCode size={24} />
            </div>
            <h3 className="text-xl font-bold text-white font-['Outfit']">QR Code Friend Cards</h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              Share your custom QR code or referral code with buddies on the first tee box to sync scores instantly.
            </p>
          </div>

          <div className="glass-card p-6 rounded-3xl border-white/10 space-y-3 hover:border-[#7FA65C]/40 transition-all">
            <div className="p-3 rounded-2xl bg-[#8FA6A3]/20 text-[#8FA6A3] w-fit">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold text-white font-['Outfit']">PWA & Offline Logger</h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              Install Cabby directly on your iOS or Android home screen. Log 18-hole scorecards offline even without cellular coverage on the course.
            </p>
          </div>
        </div>

      </section>

      {/* Bottom Sign-Up Banner */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="glass-card p-8 sm:p-12 rounded-3xl border-[#7FA65C]/40 bg-gradient-to-r from-[#20241A] via-[#262A1D] to-[#14150F] text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-['Outfit']">
            Ready To Level Up Your Golf Game?
          </h2>
          <p className="text-sm text-stone-300 max-w-lg mx-auto">
            Join Cabby today, calculate your official Handicap Index, and invite your golfing buddies.
          </p>

          <button
            onClick={() => onOpenAuth('signup')}
            className="btn-primary text-base px-8 py-4 shadow-xl shadow-black/25 font-black font-['Outfit']"
          >
            Create Your Free Account Now <ArrowRight size={18} />
          </button>
        </div>
      </section>

    </div>
  );
};
