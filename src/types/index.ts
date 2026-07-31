export interface TeeBox {
  id: string;
  name: string; // e.g. "Championship Gold", "Blue", "White", "Red"
  color: string; // Hex color code
  rating: number; // e.g., 72.4
  slope: number; // e.g., 135
  par: number; // e.g., 72
  yardage?: number;
}

export interface GolfCourse {
  id: string;
  name: string;
  location: string;
  city?: string;
  state?: string;
  tees: TeeBox[];
}

export interface StrokeDetail {
  hole: number;
  par: number;
  score: number;
  putts?: number;
  fairwayHit?: boolean;
  gir?: boolean; // Green in Regulation
  penalties?: number;
}

export interface GolfRound {
  id: string;
  golferId: string;
  golferName: string;
  courseId: string;
  courseName: string;
  teeName: string;
  date: string; // YYYY-MM-DD
  score: number; // Gross score (e.g. 82)
  holesPlayed: 9 | 18; // 18 or 9 holes
  rating: number; // Course rating for played tee
  slope: number; // Slope rating for played tee
  par: number; // Course par (usually 72 or 71)
  pcc: number; // Playing Conditions Calculation (-1.0 to +3.0)
  differential: number; // Calculated Score Differential
  isBestRound?: boolean; // Whether this round counts in top 8
  notes?: string;
  holeDetails?: StrokeDetail[];
  verifiedBy?: string[]; // IDs of friends who verified this round
  verifiedCount?: number;
}

export interface GolferProfile {
  id: string;
  name: string;
  email?: string;
  friendCode: string; // Unique friend code like "CB-8821-JT"
  homeCourse: string;
  targetHandicap?: number;
  bio?: string;
  friends: string[]; // List of friend golfer IDs
  joinedDate: string;
  handicapIndex: number;
  lowestHandicapIndex: number;
  totalRounds: number;
  bestGrossScore: number;
  bestDifferential: number;
  eaglesCount: number;
  holesInOneCount: number;
}

export interface ActivityItem {
  id: string;
  golferId: string;
  golferName: string;
  roundId?: string;
  type: 'round_logged' | 'handicap_dropped' | 'personal_best' | 'hole_in_one' | 'friend_joined';
  title: string;
  subtitle: string;
  timestamp: string;
  reactions: {
    fire: number;
    golf: number;
    applause: number;
    trophy: number;
  };
  userReactions?: string[]; // Reaction keys clicked by current user
}

export interface LeaderboardEntry {
  rank: number;
  golfer: GolferProfile;
  handicapIndex: number;
  bestRound: number;
  bestDifferential: number;
  totalRounds: number;
  trend: 'up' | 'down' | 'same';
}
