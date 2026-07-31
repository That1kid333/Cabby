import React, { useState } from 'react';
import { X, Zap, Pencil } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateDifferential } from '../lib/whsEngine';
import { GolfCourse, TeeBox } from '../types';
import { CourseSearch } from './CourseSearch';

interface LogRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogRoundModal: React.FC<LogRoundModalProps> = ({ isOpen, onClose }) => {
  const { addRound } = useApp();

  const [mode, setMode] = useState<'quick' | 'scorecard'>('quick');
  const [currentCourse, setCurrentCourse] = useState<GolfCourse | null>(null);
  const [currentTee, setCurrentTee] = useState<TeeBox | null>(null);
  const [holesPlayed, setHolesPlayed] = useState<9 | 18>(18);
  const [score, setScore] = useState<number>(78);
  const [pcc, setPcc] = useState<number>(0); // Playing Conditions Calculation (-1 to +3)
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  // 18-hole scorecard state
  const [holeScores, setHoleScores] = useState<number[]>(Array(18).fill(4));

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const rating = currentTee?.rating || 72;
  const slope = currentTee?.slope || 113;
  const par = currentTee?.par || 72;

  // Calculate live total score if in scorecard mode
  const calculatedScore = mode === 'scorecard'
    ? holeScores.reduce((a, b) => a + b, 0)
    : score;

  const previewDifferential = currentTee
    ? calculateDifferential(calculatedScore, rating, slope, pcc, holesPlayed)
    : null;

  const handleCourseSelected = (course: GolfCourse) => {
    setCurrentCourse(course);
    setCurrentTee(course.tees[0] || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCourse || !currentTee || submitting) return;

    setSubmitting(true);
    setError(null);

    const result = await addRound({
      courseId: currentCourse.id,
      courseName: currentCourse.name,
      teeName: currentTee.name,
      date,
      score: calculatedScore,
      holesPlayed,
      rating,
      slope,
      par,
      pcc,
      notes: notes.trim() || undefined
    });

    setSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Could not save that round. Please try again.');
      return;
    }

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-3xl border-white/15 relative space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white font-['Outfit'] flex items-center gap-2">
              <Zap className="text-[#00FF87]" size={22} /> Post Golf Round
            </h2>
            <p className="text-xs text-slate-400">
              Log your gross score and conditions to recalculate your official WHS Differential.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-[#0E1626] p-1 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => setMode('quick')}
            className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${
              mode === 'quick'
                ? 'bg-gradient-to-r from-[#05C46B] to-[#00FF87] text-[#070B16] shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Quick Score Entry
          </button>
          <button
            type="button"
            onClick={() => setMode('scorecard')}
            className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${
              mode === 'scorecard'
                ? 'bg-gradient-to-r from-[#05C46B] to-[#00FF87] text-[#070B16] shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Hole-By-Hole Scorecard (18 Holes)
          </button>
        </div>

        {/* Live Preview Differential Banner */}
        {currentTee && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#05C46B]/15 to-[#FFD700]/15 border border-[#00FF87]/30 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-300">Live Calculated Differential</p>
              <p className="text-[11px] text-slate-400">
                Course Rating {rating} • Slope {slope} • PCC {pcc > 0 ? `+${pcc}` : pcc}
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-[#00FF87] font-['Outfit']">
                {previewDifferential! > 0 ? `+${previewDifferential}` : previewDifferential}
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Course Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Golf Course
            </label>

            {currentCourse ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <p className="text-sm font-bold text-white">{currentCourse.name}</p>
                  <p className="text-[11px] text-slate-400">{currentCourse.location}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setCurrentCourse(null); setCurrentTee(null); }}
                  className="text-xs text-[#00FF87] font-bold hover:underline flex items-center gap-1"
                >
                  <Pencil size={12} /> Change
                </button>
              </div>
            ) : (
              <CourseSearch onSelect={handleCourseSelected} />
            )}
          </div>

          {/* Tee Box Selection */}
          {currentCourse && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Tee Played
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {currentCourse.tees.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setCurrentTee(t)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      currentTee?.id === t.id
                        ? 'bg-[#05C46B]/20 border-[#00FF87] text-white shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span>{t.name}</span>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      R: {t.rating} / S: {t.slope}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Round Options: Quick mode or Detailed Scorecard */}
          {mode === 'quick' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Total Gross Score
                </label>
                <input
                  type="number"
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="form-input font-black text-2xl font-['Outfit']"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Date Played
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="form-input font-bold"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                18-Hole Score Entry (Total: {calculatedScore})
              </h3>
              <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
                {holeScores.map((hScore, i) => (
                  <div key={i} className="text-center bg-white/5 p-2 rounded-xl border border-white/10">
                    <p className="text-[10px] text-slate-400 font-bold">#{i + 1}</p>
                    <input
                      type="number"
                      value={hScore}
                      onChange={(e) => {
                        const newArr = [...holeScores];
                        newArr[i] = Number(e.target.value);
                        setHoleScores(newArr);
                      }}
                      className="w-full bg-transparent text-center text-white font-bold text-sm focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PCC Adjustment & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                PCC Adjustment (-1 to +3)
              </label>
              <select
                value={pcc}
                onChange={(e) => setPcc(Number(e.target.value))}
                className="form-input font-semibold"
              >
                <option value={0}>0.0 (Normal Weather)</option>
                <option value={-1}>-1.0 (Extremely Easy Conditions)</option>
                <option value={1}>+1.0 (High Wind / Heavy Rain)</option>
                <option value={2}>+2.0 (Severe Storms)</option>
                <option value={3}>+3.0 (Extreme Weather)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Round Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Great putting, birdie on #18!"
                className="form-input"
              />
            </div>
          </div>

          {/* Submit Button */}
          {error && <p className="text-xs font-bold text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">{error}</p>}

          <button
            type="submit"
            disabled={!currentCourse || !currentTee || submitting}
            className="w-full bg-gradient-to-r from-[#05C46B] to-[#00FF87] hover:opacity-95 text-[#070B16] font-black py-3.5 rounded-xl text-base shadow-lg shadow-[#05C46B]/30 transition-all font-['Outfit'] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Posting…' : 'Post Round & Recalculate WHS Index →'}
          </button>

        </form>

      </div>
    </div>
  );
};
