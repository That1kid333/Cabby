import React, { useState } from 'react';
import { X, Calendar, Flag, Check, Zap, Hash, Award, HelpCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateDifferential } from '../lib/whsEngine';

interface LogRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogRoundModal: React.FC<LogRoundModalProps> = ({ isOpen, onClose }) => {
  const { courses, addRound, addCustomCourse } = useApp();

  const [mode, setMode] = useState<'quick' | 'scorecard'>('quick');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [selectedTeeId, setSelectedTeeId] = useState<string>(courses[0]?.tees[0]?.id || '');
  const [holesPlayed, setHolesPlayed] = useState<9 | 18>(18);
  const [score, setScore] = useState<number>(78);
  const [pcc, setPcc] = useState<number>(0); // Playing Conditions Calculation (-1 to +3)
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  // 18-hole scorecard state
  const [holeScores, setHoleScores] = useState<number[]>(Array(18).fill(4));
  const [holePutts, setHolePutts] = useState<number[]>(Array(18).fill(2));
  const [fairways, setFairways] = useState<boolean[]>(Array(18).fill(true));
  const [girs, setGirs] = useState<boolean[]>(Array(18).fill(true));

  // Custom course drawer toggle
  const [showAddCourse, setShowAddCourse] = useState<boolean>(false);
  const [newCourseName, setNewCourseName] = useState<string>('');
  const [newCourseLocation, setNewCourseLocation] = useState<string>('');
  const [newTeeName, setNewTeeName] = useState<string>('Blue Tees');
  const [newRating, setNewRating] = useState<number>(72.0);
  const [newSlope, setNewSlope] = useState<number>(113);
  const [newPar, setNewPar] = useState<number>(72);

  if (!isOpen) return null;

  const currentCourse = courses.find(c => c.id === selectedCourseId) || courses[0];
  const currentTee = currentCourse?.tees.find(t => t.id === selectedTeeId) || currentCourse?.tees[0];

  const rating = currentTee?.rating || 72;
  const slope = currentTee?.slope || 113;
  const par = currentTee?.par || 72;

  // Calculate live total score if in scorecard mode
  const calculatedScore = mode === 'scorecard'
    ? holeScores.reduce((a, b) => a + b, 0)
    : score;

  const previewDifferential = calculateDifferential(
    calculatedScore,
    rating,
    slope,
    pcc,
    holesPlayed
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    addRound({
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

    onClose();
  };

  const handleAddCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim()) return;

    const courseId = `custom-${Date.now()}`;
    const teeId = `tee-${Date.now()}`;

    const customCourse = {
      id: courseId,
      name: newCourseName,
      location: newCourseLocation || 'Local Course',
      tees: [
        {
          id: teeId,
          name: newTeeName,
          color: '#2563EB',
          rating: Number(newRating),
          slope: Number(newSlope),
          par: Number(newPar)
        }
      ]
    };

    addCustomCourse(customCourse);
    setSelectedCourseId(courseId);
    setSelectedTeeId(teeId);
    setShowAddCourse(false);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-3xl border-white/15 relative space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white font-['Outfit'] flex items-center gap-2">
              <Zap className="text-[#00FF87]" size={24} /> Post Golf Round
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
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#05C46B]/15 to-[#FFD700]/15 border border-[#00FF87]/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-300">Live Calculated Differential</p>
            <p className="text-[11px] text-slate-400">
              Course Rating {rating} • Slope {slope} • PCC {pcc > 0 ? `+${pcc}` : pcc}
            </p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-[#00FF87] font-['Outfit']">
              {previewDifferential > 0 ? `+${previewDifferential}` : previewDifferential}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Course Selection & Add Custom Course Button */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Golf Course
              </label>
              <button
                type="button"
                onClick={() => setShowAddCourse(!showAddCourse)}
                className="text-xs text-[#00FF87] font-bold hover:underline"
              >
                + Add Custom Course
              </button>
            </div>

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
              className="w-full bg-[#0E1626] border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm font-semibold focus:outline-none focus:border-[#00FF87]"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.location})
                </option>
              ))}
            </select>
          </div>

          {/* Inline Custom Course Creator */}
          {showAddCourse && (
            <div className="p-4 rounded-2xl bg-white/5 border border-[#00FF87]/30 space-y-3">
              <h3 className="text-xs font-bold text-[#00FF87]">Create Custom Course</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Course Name"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  className="bg-[#0E1626] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Location (e.g. Austin, TX)"
                  value={newCourseLocation}
                  onChange={(e) => setNewCourseLocation(e.target.value)}
                  className="bg-[#0E1626] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Tee Name (e.g. Blue)"
                  value={newTeeName}
                  onChange={(e) => setNewTeeName(e.target.value)}
                  className="bg-[#0E1626] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Rating"
                    value={newRating}
                    onChange={(e) => setNewRating(Number(e.target.value))}
                    className="bg-[#0E1626] border border-white/15 rounded-xl px-2 py-2 text-xs text-white"
                  />
                  <input
                    type="number"
                    placeholder="Slope"
                    value={newSlope}
                    onChange={(e) => setNewSlope(Number(e.target.value))}
                    className="bg-[#0E1626] border border-white/15 rounded-xl px-2 py-2 text-xs text-white"
                  />
                  <input
                    type="number"
                    placeholder="Par"
                    value={newPar}
                    onChange={(e) => setNewPar(Number(e.target.value))}
                    className="bg-[#0E1626] border border-white/15 rounded-xl px-2 py-2 text-xs text-white"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddCourseSubmit}
                className="w-full bg-[#05C46B] text-[#070B16] font-bold py-2 rounded-xl text-xs hover:bg-[#00FF87]"
              >
                Save & Select Course
              </button>
            </div>
          )}

          {/* Tee Box Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Tee Played
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {currentCourse?.tees.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTeeId(t.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedTeeId === t.id
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
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white font-black text-2xl font-['Outfit'] focus:outline-none focus:border-[#00FF87]"
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
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-[#00FF87]"
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
                className="w-full bg-[#0E1626] border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm font-semibold focus:outline-none focus:border-[#00FF87]"
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
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00FF87]"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#05C46B] to-[#00FF87] hover:opacity-95 text-[#070B16] font-black py-3.5 rounded-xl text-base shadow-lg shadow-[#05C46B]/30 transition-all font-['Outfit']"
          >
            Post Round & Recalculate WHS Index →
          </button>

        </form>

      </div>
    </div>
  );
};
