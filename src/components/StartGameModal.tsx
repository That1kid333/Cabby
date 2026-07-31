import React, { useState } from 'react';
import { X, Swords, Pencil } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GolfCourse, TeeBox, Game } from '../types';
import { CourseSearch } from './CourseSearch';
import { createGame } from '../lib/games';

interface StartGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (game: Game) => void;
}

export const StartGameModal: React.FC<StartGameModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { currentUser } = useApp();

  const [course, setCourse] = useState<GolfCourse | null>(null);
  const [tee, setTee] = useState<TeeBox | null>(null);
  const [holes, setHoles] = useState<9 | 18>(18);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCourseSelected = (selected: GolfCourse) => {
    setCourse(selected);
    setTee(selected.tees[0] || null);
  };

  const handleStart = async () => {
    if (!currentUser || !course || !tee) return;
    setCreating(true);
    setError(null);

    const { game, error: createError } = await createGame({ name: course.name, location: course.location }, holes, currentUser, tee);

    setCreating(false);
    if (!game) {
      setError(createError || 'Could not start the game. Check your connection and try again.');
      return;
    }

    onCreated(game);
    setCourse(null);
    setTee(null);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel w-full max-w-lg p-6 sm:p-8 rounded-3xl border-white/15 relative space-y-5">

        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white font-['Outfit'] flex items-center gap-2">
              <Swords className="text-[#7FA65C]" size={22} /> Start A Game
            </h2>
            <p className="text-xs text-stone-400">
              Your friends will see this game live and can join in before you finish the front nine.
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-stone-300 uppercase tracking-wider">Golf Course</label>
          {course ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <div>
                <p className="text-sm font-bold text-white">{course.name}</p>
                <p className="text-[11px] text-stone-400">{course.location}</p>
              </div>
              <button type="button" onClick={() => { setCourse(null); setTee(null); }} className="text-xs text-[#7FA65C] font-bold hover:underline flex items-center gap-1">
                <Pencil size={12} /> Change
              </button>
            </div>
          ) : (
            <CourseSearch onSelect={handleCourseSelected} />
          )}
        </div>

        {course && (
          <>
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-300 uppercase tracking-wider">Your Tee</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {course.tees.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTee(t)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      tee?.id === t.id ? 'bg-[#4F6B3A]/20 border-[#7FA65C] text-white shadow-md' : 'bg-white/5 border-white/10 text-stone-400 hover:text-white'
                    }`}
                  >
                    <span className="font-bold text-xs">{t.name}</span>
                    <div className="text-[10px] text-stone-400 mt-1">R: {t.rating} / S: {t.slope}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-300 uppercase tracking-wider">Holes</label>
              <div className="flex bg-[#1E2118] p-1 rounded-2xl border border-white/10">
                {([18, 9] as const).map(h => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHoles(h)}
                    className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${
                      holes === h ? 'bg-gradient-to-r from-[#4F6B3A] to-[#7FA65C] text-[#171911] shadow-md' : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    {h} Holes
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {error && <p className="text-xs font-bold text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">{error}</p>}

        <button
          type="button"
          onClick={handleStart}
          disabled={!course || !tee || creating}
          className="w-full bg-gradient-to-r from-[#4F6B3A] to-[#7FA65C] hover:opacity-95 text-[#171911] font-black py-3.5 rounded-xl text-base shadow-lg shadow-black/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {creating ? 'Starting…' : 'Start Game'}
        </button>

      </div>
    </div>
  );
};
