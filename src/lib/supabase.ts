import { createClient } from '@supabase/supabase-js';
import { GolfCourse, HoleInfo } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Loads every course golfers have added so far. Starts empty — courses are only
 * ever real ones a golfer searched for (via OpenGolfAPI) or entered from a scorecard.
 */
export async function loadCourses(): Promise<GolfCourse[]> {
  if (!supabase) return [];

  const { data, error } = await supabase.from('courses').select('*, tees:tee_boxes(*), holes:course_holes(*)');
  if (error || !data) return [];

  // Defensive: hide any course stuck with zero tees (e.g. from a partial save
  // before this was guarded against) instead of surfacing an unpickable course.
  return data.filter((c: any) => (c.tees || []).length > 0).map((c: any) => ({
    id: c.id,
    name: c.name,
    location: c.location,
    city: c.city,
    state: c.state,
    tees: (c.tees || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      rating: Number(t.rating),
      slope: t.slope,
      par: t.par,
      yardage: t.yardage
    })),
    holes: (c.holes || []).length > 0
      ? (c.holes || [])
          .map((h: any) => ({ number: h.hole_number, par: h.par }))
          .sort((a: any, b: any) => a.number - b.number)
      : undefined
  }));
}

/**
 * Saves a course (and its tees) to Supabase so every golfer benefits from it once added.
 * `holes` is optional real per-hole par data — omitted for manually-entered courses.
 */
export async function saveCourse(course: Omit<GolfCourse, 'id'>): Promise<GolfCourse | null> {
  if (!supabase) return null;

  const { data: insertedCourse, error: cErr } = await supabase
    .from('courses')
    .insert({
      name: course.name,
      location: course.location,
      city: course.city,
      state: course.state
    })
    .select()
    .single();

  if (cErr || !insertedCourse) return null;

  const teeInserts = course.tees.map(t => ({
    course_id: insertedCourse.id,
    name: t.name,
    color: t.color || '#2563EB',
    rating: t.rating,
    slope: t.slope,
    par: t.par,
    yardage: t.yardage
  }));

  const { data: insertedTees, error: tErr } = await supabase.from('tee_boxes').insert(teeInserts).select();

  if (tErr || !insertedTees || insertedTees.length === 0) {
    // Don't leave a tee-less course stranded in the shared database for the next
    // golfer to get stuck on — roll back the course row if its tees failed to save.
    await supabase.from('courses').delete().eq('id', insertedCourse.id);
    return null;
  }

  let savedHoles: HoleInfo[] | undefined;
  if (course.holes && course.holes.length > 0) {
    const holeInserts = course.holes.map(h => ({
      course_id: insertedCourse.id,
      hole_number: h.number,
      par: h.par
    }));
    const { data: insertedHoles } = await supabase.from('course_holes').insert(holeInserts).select();
    if (insertedHoles && insertedHoles.length > 0) {
      savedHoles = insertedHoles.map((h: any) => ({ number: h.hole_number, par: h.par })).sort((a, b) => a.number - b.number);
    }
    // Hole-par save failing isn't fatal — the course/tees are still fully usable
    // for raw stroke entry, just without the +/- par shorthand.
  }

  return {
    id: insertedCourse.id,
    name: insertedCourse.name,
    location: insertedCourse.location,
    city: insertedCourse.city,
    state: insertedCourse.state,
    tees: (insertedTees || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      rating: Number(t.rating),
      slope: t.slope,
      par: t.par,
      yardage: t.yardage
    })),
    holes: savedHoles
  };
}

/**
 * Sets (or corrects) a hole's par for a course, shared with every golfer —
 * not per-browser local state. This matters because +/- par scoring computes
 * real strokes from this number; if it only lived in one player's browser,
 * different players in the same game could end up saving different actual
 * stroke counts for typing the same "-1". Returns the course's full, updated
 * hole list on success.
 */
export async function upsertCourseHolePar(courseId: string, holeNumber: number, par: number): Promise<HoleInfo[] | null> {
  if (!supabase) return null;

  const { error } = await supabase
    .from('course_holes')
    .upsert({ course_id: courseId, hole_number: holeNumber, par }, { onConflict: 'course_id,hole_number' });

  if (error) return null;

  const { data } = await supabase.from('course_holes').select('*').eq('course_id', courseId);
  if (!data) return null;

  return data.map((h: any) => ({ number: h.hole_number, par: h.par })).sort((a, b) => a.number - b.number);
}
