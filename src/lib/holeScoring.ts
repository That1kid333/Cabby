/**
 * Parses a hole score entry into an actual stroke count.
 *
 * When a hole's real par is known, accepts golf shorthand relative to par
 * ("-1" birdie, "+2" double bogey, "E" or "0" for even) in addition to a plain
 * stroke count. Without a known par, only plain positive stroke counts are
 * accepted — there's nothing to compute a relative score against.
 */
export function parseHoleScore(raw: string, holePar?: number): number | null {
  const trimmed = raw.trim().toUpperCase();
  if (!trimmed) return null;

  if (holePar) {
    if (trimmed === 'E') return holePar;
    if (/^[+-]\d+$/.test(trimmed)) {
      const strokes = holePar + parseInt(trimmed, 10);
      return strokes > 0 ? strokes : null;
    }
  }

  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

/** Short label for a score relative to its hole's par, e.g. "-1", "E", "+2". */
export function relativeToParLabel(strokes: number, holePar: number): string {
  const diff = strokes - holePar;
  if (diff === 0) return 'E';
  return diff > 0 ? `+${diff}` : `${diff}`;
}
