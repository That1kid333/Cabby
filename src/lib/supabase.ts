import { createClient } from '@supabase/supabase-js';
import { GolfCourse, GolferProfile, GolfRound, ActivityItem } from '../types';
import { INITIAL_COURSES } from './sampleData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Auto-seeds default championship courses into Supabase if public.courses table is empty.
 */
export async function seedDefaultCoursesIfEmpty(): Promise<GolfCourse[]> {
  if (!supabase) return INITIAL_COURSES;

  try {
    const { data: existingCourses, error } = await supabase.from('courses').select('*, tees:tee_boxes(*)');
    
    if (error || !existingCourses || existingCourses.length === 0) {
      console.log('Seeding initial golf courses into Supabase...');

      for (const course of INITIAL_COURSES) {
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

        if (insertedCourse && !cErr) {
          const teeInserts = course.tees.map(t => ({
            course_id: insertedCourse.id,
            name: t.name,
            color: t.color,
            rating: t.rating,
            slope: t.slope,
            par: t.par,
            yardage: t.yardage
          }));
          await supabase.from('tee_boxes').insert(teeInserts);
        }
      }

      // Re-query newly seeded courses
      const { data: reQueried } = await supabase.from('courses').select('*, tees:tee_boxes(*)');
      if (reQueried) {
        return reQueried.map(c => ({
          id: c.id,
          name: c.name,
          location: c.location,
          city: c.city,
          state: c.state,
          tees: c.tees || []
        }));
      }
    }

    return (existingCourses || []).map(c => ({
      id: c.id,
      name: c.name,
      location: c.location,
      city: c.city,
      state: c.state,
      tees: c.tees || []
    }));
  } catch (err) {
    console.error('Error seeding courses:', err);
    return INITIAL_COURSES;
  }
}
