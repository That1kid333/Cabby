import React, { useEffect, useState } from 'react';
import { Search, MapPin, Plus, Loader2, CheckCircle2 } from 'lucide-react';
import { GolfCourse } from '../types';
import { useApp } from '../context/AppContext';
import { searchExternalCourses, getExternalCourseTees, getExternalCourseHoles, ExternalCourseResult, ExternalTee } from '../lib/golfCourseApi';

interface CourseSearchProps {
  onSelect: (course: GolfCourse) => void;
}

export const CourseSearch: React.FC<CourseSearchProps> = ({ onSelect }) => {
  const { courses, addCustomCourse } = useApp();

  const [query, setQuery] = useState('');
  const [externalResults, setExternalResults] = useState<ExternalCourseResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [pendingTees, setPendingTees] = useState<{ result: ExternalCourseResult; tees: ExternalTee[] } | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingTee, setConfirmingTee] = useState<number | null>(null);
  const [savingManual, setSavingManual] = useState(false);

  const [manualName, setManualName] = useState('');
  const [manualLocation, setManualLocation] = useState('');
  const [manualTeeName, setManualTeeName] = useState('White');
  const [manualRating, setManualRating] = useState(72.0);
  const [manualSlope, setManualSlope] = useState(113);
  const [manualPar, setManualPar] = useState(72);

  const localMatches = query.trim().length > 0
    ? courses.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.location.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  useEffect(() => {
    if (query.trim().length < 3) {
      setExternalResults([]);
      return;
    }

    const handle = setTimeout(async () => {
      setSearching(true);
      setError(null);
      try {
        const results = await searchExternalCourses(query);
        setExternalResults(results);
      } catch {
        setError('Course lookup is unavailable right now — try adding it manually.');
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(handle);
  }, [query]);

  const handlePickExternal = async (result: ExternalCourseResult) => {
    setImporting(result.externalId);
    setError(null);
    try {
      const tees = await getExternalCourseTees(result.externalId);
      if (tees.length === 0) {
        // This course exists in OpenGolfAPI but has no tee-level rating/slope on file
        // (common for smaller or private clubs) — fall through to manual entry instead
        // of showing a picker with nothing to pick.
        setError(`${result.name} doesn't have tee data on file yet — add its rating and slope from your scorecard below.`);
        setManualName(result.name);
        setManualLocation([result.city, result.state].filter(Boolean).join(', '));
        setShowManualForm(true);
      } else {
        setPendingTees({ result, tees });
      }
    } catch {
      setError('Could not load tee data for this course — try adding it manually.');
    } finally {
      setImporting(null);
    }
  };

  const handleConfirmTee = async (tee: ExternalTee, index: number) => {
    if (!pendingTees || confirmingTee !== null) return;
    const { result } = pendingTees;

    setConfirmingTee(index);
    setError(null);

    // Best-effort — a missing hole-par lookup shouldn't block saving the course.
    const holes = await getExternalCourseHoles(result.externalId).catch(() => []);

    const saved = await addCustomCourse({
      name: result.name,
      location: [result.city, result.state].filter(Boolean).join(', ') || 'Unknown location',
      city: result.city,
      state: result.state,
      tees: [{ id: '', name: tee.name, color: '#2563EB', rating: tee.rating, slope: tee.slope, par: tee.par, yardage: tee.yardage }],
      holes: holes.length > 0 ? holes : undefined
    });

    setConfirmingTee(null);

    if (saved) {
      onSelect(saved);
      setPendingTees(null);
    } else {
      setError('Could not save this course. Check your connection and try again — the database may need the latest schema.sql applied.');
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || savingManual) return;

    setSavingManual(true);
    setError(null);

    const saved = await addCustomCourse({
      name: manualName,
      location: manualLocation || 'Local course',
      tees: [{ id: '', name: manualTeeName, color: '#2563EB', rating: Number(manualRating), slope: Number(manualSlope), par: Number(manualPar) }]
    });

    setSavingManual(false);

    if (saved) {
      onSelect(saved);
      setShowManualForm(false);
    } else {
      setError('Could not save this course. Check your connection and try again — the database may need the latest schema.sql applied.');
    }
  };

  if (pendingTees) {
    return (
      <div className="p-4 rounded-2xl bg-white/5 border border-[#00FF87]/30 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">{pendingTees.result.name}</h3>
            <p className="text-[11px] text-slate-400">{[pendingTees.result.city, pendingTees.result.state].filter(Boolean).join(', ')}</p>
          </div>
          <button type="button" onClick={() => { setPendingTees(null); setError(null); }} className="text-[11px] text-slate-400 hover:text-white">
            Back
          </button>
        </div>
        <p className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">Pick the tee you played</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {pendingTees.tees.map((tee, i) => (
            <button
              key={i}
              type="button"
              disabled={confirmingTee !== null}
              onClick={() => handleConfirmTee(tee, i)}
              className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:border-[#00FF87]/50 text-left transition-all disabled:opacity-50 flex items-center justify-between gap-2"
            >
              <div>
                <p className="text-xs font-bold text-white">{tee.name}</p>
                <p className="text-[10px] text-slate-400">R: {tee.rating} / S: {tee.slope}</p>
              </div>
              {confirmingTee === i && <Loader2 size={14} className="animate-spin text-[#00FF87] shrink-0" />}
            </button>
          ))}
        </div>
        {error && <p className="text-xs font-bold text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for your course by name..."
          className="form-input form-input-icon"
        />
        {searching && <Loader2 size={16} className="absolute right-3.5 top-3 text-slate-400 animate-spin" />}
      </div>

      {error && <p className="text-xs text-amber-400">{error}</p>}

      {localMatches.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Already in Cabby</p>
          {localMatches.map(course => (
            <button
              key={course.id}
              type="button"
              onClick={() => onSelect(course)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#00FF87]/40 text-left transition-all"
            >
              <div>
                <p className="text-xs font-bold text-white">{course.name}</p>
                <p className="text-[10px] text-slate-400 flex items-center gap-1"><MapPin size={10} /> {course.location}</p>
              </div>
              <CheckCircle2 size={16} className="text-[#00FF87]" />
            </button>
          ))}
        </div>
      )}

      {externalResults.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Real courses (via OpenGolfAPI)</p>
          {externalResults.map(result => (
            <button
              key={result.externalId}
              type="button"
              disabled={importing === result.externalId}
              onClick={() => handlePickExternal(result)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#00FF87]/40 text-left transition-all disabled:opacity-60"
            >
              <div>
                <p className="text-xs font-bold text-white">{result.name}</p>
                <p className="text-[10px] text-slate-400 flex items-center gap-1"><MapPin size={10} /> {[result.city, result.state].filter(Boolean).join(', ')}</p>
              </div>
              {importing === result.externalId ? <Loader2 size={16} className="animate-spin text-slate-400" /> : <Plus size={16} className="text-[#00FF87]" />}
            </button>
          ))}
        </div>
      )}

      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowManualForm(!showManualForm)}
          className="text-xs text-[#00FF87] font-bold hover:underline"
        >
          Can't find it? Add it from your scorecard
        </button>
      </div>

      {showManualForm && (
        <div className="p-4 rounded-2xl bg-white/5 border border-[#00FF87]/30 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" placeholder="Course Name" value={manualName} onChange={(e) => setManualName(e.target.value)} className="form-input form-input-sm" />
            <input type="text" placeholder="Location (e.g. Austin, TX)" value={manualLocation} onChange={(e) => setManualLocation(e.target.value)} className="form-input form-input-sm" />
            <input type="text" placeholder="Tee Name (e.g. Blue)" value={manualTeeName} onChange={(e) => setManualTeeName(e.target.value)} className="form-input form-input-sm" />
            <div className="grid grid-cols-3 gap-2">
              <input type="number" step="0.1" placeholder="Rating" value={manualRating} onChange={(e) => setManualRating(Number(e.target.value))} className="form-input form-input-sm" />
              <input type="number" placeholder="Slope" value={manualSlope} onChange={(e) => setManualSlope(Number(e.target.value))} className="form-input form-input-sm" />
              <input type="number" placeholder="Par" value={manualPar} onChange={(e) => setManualPar(Number(e.target.value))} className="form-input form-input-sm" />
            </div>
          </div>
          <button
            type="button"
            onClick={handleManualSubmit}
            disabled={savingManual}
            className="w-full bg-[#05C46B] text-[#070B16] font-bold py-2 rounded-xl text-xs hover:bg-[#00FF87] disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {savingManual && <Loader2 size={14} className="animate-spin" />}
            {savingManual ? 'Saving…' : 'Save & Select Course'}
          </button>
        </div>
      )}

      <p className="text-[10px] text-slate-500">
        Real course data via <a href="https://opengolfapi.org" target="_blank" rel="noreferrer" className="underline hover:text-slate-300">OpenGolfAPI</a> (ODbL) — added courses are saved for every Cabby golfer.
      </p>
    </div>
  );
};
