import React, { useState } from 'react';
import { MapPin, Search, Plus, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CourseSearch } from './CourseSearch';

export const CourseDatabase: React.FC = () => {
  const { courses } = useApp();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const filteredCourses = courses.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white font-['Outfit'] flex items-center gap-2">
            <MapPin className="text-[#00FF87]" size={28} /> Golf Course & Tee Database
          </h1>
          <p className="text-xs text-slate-300">
            Real course ratings and slopes, added by Cabby golfers and sourced from OpenGolfAPI.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search courses or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input form-input-icon"
            />
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="btn-primary text-xs px-4 py-2.5 font-black shrink-0"
          >
            {showAdd ? <X size={16} /> : <Plus size={16} />}
            {showAdd ? 'Close' : 'Add Course'}
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="glass-panel p-6 rounded-3xl border-[#00FF87]/30">
          <CourseSearch onSelect={() => setShowAdd(false)} />
        </div>
      )}

      {filteredCourses.length === 0 && (
        <div className="glass-panel p-10 rounded-3xl border-white/10 text-center space-y-2">
          <MapPin className="mx-auto text-slate-500" size={28} />
          <p className="text-sm text-slate-300">
            {courses.length === 0 ? 'No courses added yet.' : 'No courses match your search.'}
          </p>
          {courses.length === 0 && (
            <button onClick={() => setShowAdd(true)} className="text-xs text-[#00FF87] hover:underline font-bold">
              Add the first one →
            </button>
          )}
        </div>
      )}

      {/* Courses Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCourses.map((course) => (
          <div
            key={course.id}
            className="glass-panel p-6 rounded-3xl space-y-4 border-white/10 hover:border-[#00FF87]/40 transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white font-['Outfit']">{course.name}</h2>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin size={12} className="text-[#00FF87]" /> {course.location}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#05C46B]/20 text-[#00FF87] border border-[#05C46B]/30">
                {course.tees.length} Tee Set{course.tees.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Tee Set List */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Course Ratings
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {course.tees.map((tee) => (
                  <div
                    key={tee.id}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span className="text-white">{tee.name}</span>
                      <span
                        className="w-3 h-3 rounded-full border border-white/40"
                        style={{ backgroundColor: tee.color }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-1 text-center pt-1 text-[11px]">
                      <div>
                        <span className="text-[9px] text-slate-400 block">Rating</span>
                        <span className="font-bold text-white">{tee.rating}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">Slope</span>
                        <span className="font-bold text-[#00FF87]">{tee.slope}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">Par</span>
                        <span className="font-bold text-white">{tee.par}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
