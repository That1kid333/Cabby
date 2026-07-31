import { createClient } from '@supabase/supabase-js';
import { GolfCourse } from '../types';

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

  const { data, error } = await supabase.from('courses').select('*, tees:tee_boxes(*)');
  if (error || !data) return [];

  return data.map((c: any) => ({
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
    }))
  }));
}

/**
 * Saves a course (and its tees) to Supabase so every golfer benefits from it once added.
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

  const { data: insertedTees } = await supabase.from('tee_boxes').insert(teeInserts).select();

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
    }))
  };
}
