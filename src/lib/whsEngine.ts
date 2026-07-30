import { GolfRound } from '../types';

/**
 * Calculates WHS Score Differential for a single round
 * Formula: (Gross Score - Course Rating - PCC) * 113 / Slope Rating
 */
export function calculateDifferential(
  grossScore: number,
  courseRating: number,
  slopeRating: number,
  pcc: number = 0,
  holesPlayed: 9 | 18 = 18
): number {
  if (holesPlayed === 9) {
    // 9-hole differential scaled to 18-hole equivalent
    const scaledScore = grossScore * 2;
    const scaledRating = courseRating * 2;
    const diff = ((scaledScore - scaledRating - pcc) * 113) / slopeRating;
    return Math.round(diff * 10) / 10;
  }

  const diff = ((grossScore - courseRating - pcc) * 113) / slopeRating;
  return Math.round(diff * 10) / 10;
}

/**
 * Calculates WHS Handicap Index from a list of rounds according to WHS 2024 Rules.
 * Evaluates the latest 20 rounds, selects the required lowest differentials, applies scaling adjustments,
 * and identifies which rounds are currently counted in the "Best 8" calculation.
 */
export function calculateHandicapIndex(rounds: GolfRound[]): {
  handicapIndex: number;
  bestRoundIds: string[];
  differentialsUsed: number;
  totalEvaluatedRounds: number;
} {
  if (!rounds || rounds.length === 0) {
    return { handicapIndex: 54.0, bestRoundIds: [], differentialsUsed: 0, totalEvaluatedRounds: 0 };
  }

  // Sort rounds chronologically (latest 20 rounds)
  const sortedRounds = [...rounds]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20);

  const numRounds = sortedRounds.length;

  // Determine how many lowest differentials to select and any adjustment needed
  let numToUse = 1;
  let adjustment = 0;

  if (numRounds === 3) {
    numToUse = 1;
    adjustment = -2.0;
  } else if (numRounds === 4) {
    numToUse = 1;
    adjustment = -1.0;
  } else if (numRounds === 5) {
    numToUse = 1;
    adjustment = 0;
  } else if (numRounds === 6) {
    numToUse = 2;
    adjustment = -1.0;
  } else if (numRounds >= 7 && numRounds <= 8) {
    numToUse = 2;
    adjustment = 0;
  } else if (numRounds >= 9 && numRounds <= 11) {
    numToUse = 3;
    adjustment = 0;
  } else if (numRounds >= 12 && numRounds <= 14) {
    numToUse = 4;
    adjustment = 0;
  } else if (numRounds >= 15 && numRounds <= 16) {
    numToUse = 5;
    adjustment = 0;
  } else if (numRounds >= 17 && numRounds <= 18) {
    numToUse = 6;
    adjustment = 0;
  } else if (numRounds === 19) {
    numToUse = 7;
    adjustment = 0;
  } else if (numRounds >= 20) {
    numToUse = 8;
    adjustment = 0;
  }

  // Map rounds with index to keep track of IDs
  const mapped = sortedRounds.map(r => ({
    id: r.id,
    differential: r.differential
  }));

  // Sort by lowest differential ascending
  mapped.sort((a, b) => a.differential - b.differential);

  // Take the lowest N rounds
  const bestSelected = mapped.slice(0, numToUse);
  const bestRoundIds = bestSelected.map(b => b.id);

  const sum = bestSelected.reduce((acc, curr) => acc + curr.differential, 0);
  const average = sum / numToUse;

  let rawIndex = average + adjustment;
  // WHS caps maximum handicap index at 54.0 and minimum at +5.0 (-5.0)
  rawIndex = Math.max(-5.0, Math.min(54.0, rawIndex));

  // Truncate to 1 decimal place per WHS rules
  const handicapIndex = Math.floor(rawIndex * 10) / 10;

  return {
    handicapIndex,
    bestRoundIds,
    differentialsUsed: numToUse,
    totalEvaluatedRounds: numRounds
  };
}

/**
 * Calculates Course Handicap for a specific tee set
 * Formula: (Handicap Index * Slope Rating / 113) + (Course Rating - Par)
 */
export function calculateCourseHandicap(
  handicapIndex: number,
  slopeRating: number,
  courseRating: number,
  par: number
): number {
  const rawCourseHandicap = (handicapIndex * slopeRating) / 113 + (courseRating - par);
  return Math.round(rawCourseHandicap);
}

/**
 * Calculates Playing Handicap based on match format handicap allowance percentage
 */
export function calculatePlayingHandicap(
  courseHandicap: number,
  allowancePercentage: number = 95
): number {
  return Math.round((courseHandicap * allowancePercentage) / 100);
}

/**
 * Formats Handicap Index nicely (e.g. 8.4 or "+1.2" for scratch/plus golfers)
 */
export function formatHandicapIndex(index: number): string {
  if (index < 0) {
    return `+${Math.abs(index).toFixed(1)}`;
  }
  return index.toFixed(1);
}
