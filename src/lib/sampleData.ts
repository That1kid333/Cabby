import { GolfCourse, GolferProfile, GolfRound, ActivityItem } from '../types';

export const INITIAL_COURSES: GolfCourse[] = [
  {
    id: 'augusta-national',
    name: 'Augusta National Golf Club',
    location: 'Augusta, GA',
    city: 'Augusta',
    state: 'GA',
    tees: [
      { id: 't-masters', name: 'Tournament (Masters)', color: '#10B981', rating: 76.2, slope: 148, par: 72, yardage: 7545 },
      { id: 't-members', name: 'Member Tees', color: '#3B82F6', rating: 73.1, slope: 137, par: 72, yardage: 6860 },
      { id: 't-forward', name: 'Forward Tees', color: '#F59E0B', rating: 69.8, slope: 126, par: 72, yardage: 6300 }
    ]
  },
  {
    id: 'pebble-beach',
    name: 'Pebble Beach Golf Links',
    location: 'Pebble Beach, CA',
    city: 'Pebble Beach',
    state: 'CA',
    tees: [
      { id: 't-black', name: 'Championship Black', color: '#1F2937', rating: 75.5, slope: 145, par: 72, yardage: 7075 },
      { id: 't-blue', name: 'Blue Tees', color: '#2563EB', rating: 73.3, slope: 136, par: 72, yardage: 6816 },
      { id: 't-white', name: 'White Tees', color: '#E2E8F0', rating: 71.0, slope: 130, par: 72, yardage: 6418 },
      { id: 't-gold', name: 'Gold Tees', color: '#D97706', rating: 67.2, slope: 121, par: 72, yardage: 5543 }
    ]
  },
  {
    id: 'tpc-sawgrass',
    name: 'TPC Sawgrass (PLAYERS Stadium)',
    location: 'Ponte Vedra Beach, FL',
    city: 'Ponte Vedra Beach',
    state: 'FL',
    tees: [
      { id: 't-stadium', name: 'THE PLAYERS Stadium', color: '#0F172A', rating: 76.4, slope: 155, par: 72, yardage: 7245 },
      { id: 't-blue-saw', name: 'Blue', color: '#2563EB', rating: 73.9, slope: 144, par: 72, yardage: 6653 },
      { id: 't-white-saw', name: 'White', color: '#CBD5E1', rating: 71.3, slope: 136, par: 72, yardage: 6116 }
    ]
  },
  {
    id: 'st-andrews',
    name: 'St Andrews Links (Old Course)',
    location: 'St Andrews, Scotland',
    city: 'St Andrews',
    state: 'Fife',
    tees: [
      { id: 't-old-open', name: 'Open Championship Black', color: '#000000', rating: 75.1, slope: 142, par: 72, yardage: 7305 },
      { id: 't-old-white', name: 'Medal White', color: '#F8FAFC', rating: 73.1, slope: 132, par: 72, yardage: 6721 },
      { id: 't-old-yellow', name: 'Yellow', color: '#EAB308', rating: 70.4, slope: 125, par: 72, yardage: 6298 }
    ]
  },
  {
    id: 'cypress-point',
    name: 'Pinehurst No. 2',
    location: 'Pinehurst, NC',
    city: 'Pinehurst',
    state: 'NC',
    tees: [
      { id: 't-pine-championship', name: 'US Open Tees', color: '#15803D', rating: 76.5, slope: 148, par: 70, yardage: 7588 },
      { id: 't-pine-blue', name: 'Blue', color: '#1D4ED8', rating: 73.6, slope: 138, par: 70, yardage: 6934 },
      { id: 't-pine-white', name: 'White', color: '#F1F5F9', rating: 70.9, slope: 131, par: 70, yardage: 6309 }
    ]
  },
  {
    id: 'cypress-creek-public',
    name: 'Pine Valley Golf & Country Club',
    location: 'Pine Valley, NJ',
    city: 'Pine Valley',
    state: 'NJ',
    tees: [
      { id: 't-pv-black', name: 'Championship', color: '#111827', rating: 76.6, slope: 155, par: 70, yardage: 7181 },
      { id: 't-pv-blue', name: 'Member Blue', color: '#2563EB', rating: 73.8, slope: 146, par: 70, yardage: 6640 }
    ]
  }
];

export const INITIAL_GOLFERS: GolferProfile[] = [
  {
    id: 'golfer-jt',
    name: 'JT "Bomb & Gouge"',
    email: 'jt@cabbygolf.com',
    friendCode: 'CB-8821-JT',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    homeCourse: 'Pebble Beach Golf Links',
    targetHandicap: 4.0,
    bio: 'Avid golfer chasing scratch. Drive for show, putt for dough! ⛳',
    friends: ['golfer-tiger', 'golfer-scottie', 'golfer-rory', 'golfer-nelly'],
    joinedDate: '2025-01-15',
    handicapIndex: 7.2,
    lowestHandicapIndex: 6.8,
    totalRounds: 18,
    bestGrossScore: 75,
    bestDifferential: 4.1,
    eaglesCount: 3,
    holesInOneCount: 1
  },
  {
    id: 'golfer-tiger',
    name: 'Tiger W.',
    email: 'tiger@cabbygolf.com',
    friendCode: 'CB-1975-TW',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    homeCourse: 'Augusta National Golf Club',
    targetHandicap: -6.0,
    bio: 'Sundays are for Red & Black 🐅. 15 Majors & counting.',
    friends: ['golfer-jt', 'golfer-scottie', 'golfer-rory'],
    joinedDate: '2024-11-01',
    handicapIndex: -3.8,
    lowestHandicapIndex: -5.4,
    totalRounds: 24,
    bestGrossScore: 63,
    bestDifferential: -4.8,
    eaglesCount: 28,
    holesInOneCount: 4
  },
  {
    id: 'golfer-scottie',
    name: 'Scottie S.',
    email: 'scottie@cabbygolf.com',
    friendCode: 'CB-1996-SS',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    homeCourse: 'TPC Sawgrass',
    targetHandicap: -7.0,
    bio: 'Shuffle feet, pure strikes, winning green jackets. 🏆',
    friends: ['golfer-jt', 'golfer-tiger', 'golfer-rory'],
    joinedDate: '2024-12-10',
    handicapIndex: -5.1,
    lowestHandicapIndex: -5.8,
    totalRounds: 20,
    bestGrossScore: 62,
    bestDifferential: -6.2,
    eaglesCount: 19,
    holesInOneCount: 2
  },
  {
    id: 'golfer-rory',
    name: 'Rory M.',
    email: 'rory@cabbygolf.com',
    friendCode: 'CB-1989-RM',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
    homeCourse: 'St Andrews Links',
    targetHandicap: -5.0,
    bio: '340+ yard bombs off the tee. High draw specialist 🚀',
    friends: ['golfer-jt', 'golfer-tiger', 'golfer-scottie'],
    joinedDate: '2025-01-05',
    handicapIndex: -4.2,
    lowestHandicapIndex: -4.9,
    totalRounds: 22,
    bestGrossScore: 64,
    bestDifferential: -4.9,
    eaglesCount: 15,
    holesInOneCount: 1
  },
  {
    id: 'golfer-nelly',
    name: 'Nelly K.',
    email: 'nelly@cabbygolf.com',
    friendCode: 'CB-1998-NK',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    homeCourse: 'Pinehurst No. 2',
    targetHandicap: -5.5,
    bio: 'Smoothest swing in golf history. LPGA Champ ✨',
    friends: ['golfer-jt'],
    joinedDate: '2025-02-01',
    handicapIndex: -4.8,
    lowestHandicapIndex: -5.2,
    totalRounds: 19,
    bestGrossScore: 63,
    bestDifferential: -5.5,
    eaglesCount: 14,
    holesInOneCount: 2
  }
];

export const INITIAL_ROUNDS: GolfRound[] = [
  // JT's rounds
  {
    id: 'round-jt-1',
    golferId: 'golfer-jt',
    golferName: 'JT "Bomb & Gouge"',
    courseId: 'pebble-beach',
    courseName: 'Pebble Beach Golf Links',
    teeName: 'Blue Tees',
    date: '2026-07-28',
    score: 77,
    holesPlayed: 18,
    rating: 73.3,
    slope: 136,
    par: 72,
    pcc: 0,
    differential: 3.1,
    isBestRound: true,
    notes: 'Wind was howling off Carmel Bay! Drained a 25-footer on 18.',
    verifiedCount: 3
  },
  {
    id: 'round-jt-2',
    golferId: 'golfer-jt',
    golferName: 'JT "Bomb & Gouge"',
    courseId: 'augusta-national',
    courseName: 'Augusta National Golf Club',
    teeName: 'Member Tees',
    date: '2026-07-20',
    score: 79,
    holesPlayed: 18,
    rating: 73.1,
    slope: 137,
    par: 72,
    pcc: 0,
    differential: 4.9,
    isBestRound: true,
    notes: 'Survived Amen Corner with 2 pars and a birdie on 13!',
    verifiedCount: 4
  },
  {
    id: 'round-jt-3',
    golferId: 'golfer-jt',
    golferName: 'JT "Bomb & Gouge"',
    courseId: 'tpc-sawgrass',
    courseName: 'TPC Sawgrass (PLAYERS Stadium)',
    teeName: 'Blue',
    date: '2026-07-12',
    score: 81,
    holesPlayed: 18,
    rating: 73.9,
    slope: 144,
    par: 72,
    pcc: 0,
    differential: 5.6,
    isBestRound: true,
    notes: 'Hit the island green on #17 with a 9-iron!',
    verifiedCount: 2
  },
  {
    id: 'round-jt-4',
    golferId: 'golfer-jt',
    golferName: 'JT "Bomb & Gouge"',
    courseId: 'st-andrews',
    courseName: 'St Andrews Links (Old Course)',
    teeName: 'Medal White',
    date: '2026-06-30',
    score: 78,
    holesPlayed: 18,
    rating: 73.1,
    slope: 132,
    par: 72,
    pcc: 0,
    differential: 4.2,
    isBestRound: true,
    notes: 'Over the Road Hole hotel bunker clean shot!',
    verifiedCount: 5
  },
  {
    id: 'round-jt-5',
    golferId: 'golfer-jt',
    golferName: 'JT "Bomb & Gouge"',
    courseId: 'cypress-creek-public',
    courseName: 'Pine Valley Golf & Country Club',
    teeName: 'Member Blue',
    date: '2026-06-15',
    score: 84,
    holesPlayed: 18,
    rating: 73.8,
    slope: 146,
    par: 70,
    pcc: 1.0,
    differential: 7.1,
    isBestRound: false,
    notes: 'Tough hazards everywhere, putted great though.'
  },

  // Tiger's round
  {
    id: 'round-tiger-1',
    golferId: 'golfer-tiger',
    golferName: 'Tiger W.',
    courseId: 'augusta-national',
    courseName: 'Augusta National Golf Club',
    teeName: 'Tournament (Masters)',
    date: '2026-07-25',
    score: 67,
    holesPlayed: 18,
    rating: 76.2,
    slope: 148,
    par: 72,
    pcc: 0,
    differential: -7.0,
    isBestRound: true,
    notes: 'Iron play was locked in. Roars back at Augusta!'
  },

  // Scottie's round
  {
    id: 'round-scottie-1',
    golferId: 'golfer-scottie',
    golferName: 'Scottie S.',
    courseId: 'tpc-sawgrass',
    courseName: 'TPC Sawgrass (PLAYERS Stadium)',
    teeName: 'THE PLAYERS Stadium',
    date: '2026-07-27',
    score: 66,
    holesPlayed: 18,
    rating: 76.4,
    slope: 155,
    par: 72,
    pcc: 0,
    differential: -7.6,
    isBestRound: true,
    notes: 'Solid round. 14 of 14 fairways hit.'
  }
];

export const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    golferId: 'golfer-jt',
    golferName: 'JT "Bomb & Gouge"',
    golferAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    type: 'personal_best',
    title: 'New Personal Best Differential!',
    subtitle: 'Shot a 77 (+5) at Pebble Beach Golf Links (Blue Tees) • Differential: 3.1',
    timestamp: '2 hours ago',
    reactions: { fire: 8, golf: 12, applause: 15, trophy: 6 },
    userReactions: ['fire', 'golf']
  },
  {
    id: 'act-2',
    golferId: 'golfer-tiger',
    golferName: 'Tiger W.',
    golferAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    type: 'round_logged',
    title: 'Logged 18 holes at Augusta National',
    subtitle: 'Shot 67 (-5) • Differential: -7.0 • 6 birdies, 1 eagle!',
    timestamp: '1 day ago',
    reactions: { fire: 24, golf: 30, applause: 42, trophy: 19 }
  },
  {
    id: 'act-3',
    golferId: 'golfer-scottie',
    golferName: 'Scottie S.',
    golferAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    type: 'handicap_dropped',
    title: 'Handicap Index dropped to +5.1!',
    subtitle: 'Moved down -0.4 this week across 4 consecutive low rounds.',
    timestamp: '2 days ago',
    reactions: { fire: 14, golf: 9, applause: 18, trophy: 10 }
  }
];
