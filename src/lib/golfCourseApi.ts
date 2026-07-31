// Wraps OpenGolfAPI (https://opengolfapi.org) — a free, key-free, community-maintained
// database of 32,000+ real golf courses (ODbL-1.0 licensed). Used to look up real,
// current course ratings/slopes instead of asking every golfer to guess at numbers.
const BASE_URL = 'https://api.opengolfapi.org/v1';

export interface ExternalCourseResult {
  externalId: string;
  name: string;
  city?: string;
  state?: string;
  par: number;
}

export interface ExternalTee {
  name: string;
  color?: string;
  gender?: string;
  rating: number;
  slope: number;
  par: number;
  yardage?: number;
}

export async function searchExternalCourses(query: string): Promise<ExternalCourseResult[]> {
  if (!query.trim()) return [];

  const res = await fetch(`${BASE_URL}/courses/search?q=${encodeURIComponent(query)}&limit=8`);
  if (!res.ok) throw new Error('Course lookup failed');

  const data = await res.json();
  return (data.courses || []).map((c: any) => ({
    externalId: c.id,
    name: c.course_name || c.name,
    city: c.city,
    state: c.state,
    par: c.par
  }));
}

export async function getExternalCourseTees(externalId: string): Promise<ExternalTee[]> {
  const res = await fetch(`${BASE_URL}/courses/${externalId}/tees`);
  if (!res.ok) throw new Error('Tee lookup failed');

  const data = await res.json();
  return (data.tees || []).map((t: any) => ({
    name: t.gender && t.gender !== 'Male' ? `${t.tee_name} (${t.gender})` : t.tee_name,
    color: t.tee_color,
    gender: t.gender,
    rating: t.course_rating,
    slope: t.slope,
    par: t.par,
    yardage: t.yardage
  }));
}

export interface ExternalHole {
  number: number;
  par: number;
}

/** Real per-hole par, when OpenGolfAPI has it on file. Returns [] rather than throwing if not. */
export async function getExternalCourseHoles(externalId: string): Promise<ExternalHole[]> {
  try {
    const res = await fetch(`${BASE_URL}/courses/${externalId}/holes`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.holes || [])
      .filter((h: any) => typeof h.number === 'number' && typeof h.par === 'number')
      .map((h: any) => ({ number: h.number, par: h.par }));
  } catch {
    return [];
  }
}
