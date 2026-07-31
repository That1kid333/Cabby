import React, { useState } from 'react';
import { Calculator, Flag, Shield, Layers, HelpCircle, Check, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateCourseHandicap, calculatePlayingHandicap, formatHandicapIndex } from '../lib/whsEngine';

export const CourseHandicapCalculator: React.FC = () => {
  const { currentUser, courses } = useApp();

  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [selectedTeeId, setSelectedTeeId] = useState<string>(courses[0]?.tees[0]?.id || '');
  const [customIndex, setCustomIndex] = useState<string>((currentUser?.handicapIndex ?? 7.2).toString());
  const [allowance, setAllowance] = useState<number>(95); // Default 95% for Stroke Play

  const currentCourse = courses.find(c => c.id === selectedCourseId) || courses[0];
  const currentTee = currentCourse?.tees.find(t => t.id === selectedTeeId) || currentCourse?.tees[0];

  const indexValue = parseFloat(customIndex) || 0;
  const slope = currentTee?.slope || 113;
  const rating = currentTee?.rating || 72;
  const par = currentTee?.par || 72;

  const courseHandicap = calculateCourseHandicap(indexValue, slope, rating, par);
  const playingHandicap = calculatePlayingHandicap(courseHandicap, allowance);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Title Header */}
      <div className="glass-panel p-6 rounded-3xl border-white/10 space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#4F6B3A]/20 text-[#7FA65C] border border-[#4F6B3A]/40">
            <Calculator size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white font-['Outfit']">
              WHS Course Handicap Calculator
            </h1>
            <p className="text-xs text-stone-400">
              Convert your portable Handicap Index to your exact target Course Handicap for any tee box and game format.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Form Panel */}
        <div className="glass-panel p-6 rounded-3xl space-y-5 border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Flag size={18} className="text-[#7FA65C]" /> Select Course & Tees
          </h2>

          {/* Golfer Handicap Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-300 uppercase tracking-wider">
              Handicap Index
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                value={customIndex}
                onChange={(e) => setCustomIndex(e.target.value)}
                className="form-input font-bold font-['Outfit'] text-lg"
                placeholder="e.g. 7.2"
              />
              <button
                onClick={() => setCustomIndex((currentUser?.handicapIndex ?? 7.2).toString())}
                className="px-3 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-bold text-[#7FA65C] whitespace-nowrap border border-white/10"
              >
                Use My Index ({formatHandicapIndex(currentUser?.handicapIndex ?? 7.2)})
              </button>
            </div>
          </div>

          {/* Select Course */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-300 uppercase tracking-wider">
              Golf Course
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => {
                const cId = e.target.value;
                setSelectedCourseId(cId);
                const found = courses.find(c => c.id === cId);
                if (found && found.tees.length > 0) {
                  setSelectedTeeId(found.tees[0].id);
                }
              }}
              className="form-input font-semibold"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.location})
                </option>
              ))}
            </select>
          </div>

          {/* Select Tee Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-300 uppercase tracking-wider">
              Tee Set
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentCourse?.tees.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTeeId(t.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedTeeId === t.id
                      ? 'bg-[#4F6B3A]/20 border-[#7FA65C] text-white shadow-md'
                      : 'bg-white/5 border-white/10 text-stone-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span>{t.name}</span>
                    <span
                      className="w-3 h-3 rounded-full border border-white/40"
                      style={{ backgroundColor: t.color }}
                    />
                  </div>
                  <div className="text-[11px] text-stone-400 mt-1 flex justify-between">
                    <span>Rating: {t.rating}</span>
                    <span>Slope: {t.slope}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Game Format Allowance */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-300 uppercase tracking-wider">
              Match Format (Handicap Allowance)
            </label>
            <select
              value={allowance}
              onChange={(e) => setAllowance(Number(e.target.value))}
              className="form-input font-semibold"
            >
              <option value={95}>Individual Stroke Play (95%)</option>
              <option value={100}>Match Play (100%)</option>
              <option value={90}>Four-Ball / Best Ball (90%)</option>
              <option value={85}>Individual Stableford (95%)</option>
              <option value={35}>Scramble (35%)</option>
            </select>
          </div>

        </div>

        {/* Right Output Calculation Card */}
        <div className="glass-panel p-6 rounded-3xl border-[#7FA65C]/30 bg-gradient-to-b from-[#20241A] to-[#171911] flex flex-col justify-between space-y-6">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Target Tee Details
              </span>
              <span className="text-xs font-extrabold text-[#7FA65C]">
                {currentCourse?.name}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[10px] text-stone-400 font-semibold">Course Rating</p>
                <p className="text-lg font-bold text-white font-['Outfit']">{rating}</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[10px] text-stone-400 font-semibold">Slope Rating</p>
                <p className="text-lg font-bold text-white font-['Outfit']">{slope}</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[10px] text-stone-400 font-semibold">Par</p>
                <p className="text-lg font-bold text-white font-['Outfit']">{par}</p>
              </div>
            </div>

            {/* Course Handicap Giant Output */}
            <div className="p-5 rounded-2xl bg-[#4F6B3A]/10 border border-[#4F6B3A]/40 text-center space-y-1">
              <p className="text-xs font-bold text-[#7FA65C] uppercase tracking-wider">
                Your Course Handicap
              </p>
              <p className="text-6xl font-black text-white font-['Outfit'] drop-shadow-md">
                {courseHandicap >= 0 ? courseHandicap : `+${Math.abs(courseHandicap)}`}
              </p>
              <p className="text-xs text-stone-300 font-medium">
                Subtract <span className="text-[#7FA65C] font-bold">{courseHandicap} strokes</span> from your gross score for target net score!
              </p>
            </div>

            {/* Playing Handicap Output */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-stone-300">
                  Playing Handicap ({allowance}%)
                </p>
                <p className="text-[11px] text-stone-400">
                  Adjusted for competition format
                </p>
              </div>
              <p className="text-3xl font-extrabold text-[#C9A24B] font-['Outfit']">
                {playingHandicap}
              </p>
            </div>
          </div>

          {/* WHS Formula Reference */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] text-stone-400 space-y-1">
            <p className="font-bold text-stone-300 flex items-center gap-1">
              <HelpCircle size={12} className="text-[#7FA65C]" /> Official WHS Formula:
            </p>
            <p className="font-mono text-[10px] text-stone-300">
              ({indexValue} × {slope} / 113) + ({rating} - {par}) = {courseHandicap}
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
