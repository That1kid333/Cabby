import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GolfCourse, GolferProfile, GolfRound, ActivityItem } from '../types';
import { INITIAL_COURSES, INITIAL_GOLFERS, INITIAL_ROUNDS, INITIAL_ACTIVITIES } from '../lib/sampleData';
import { calculateDifferential, calculateHandicapIndex } from '../lib/whsEngine';

interface AppContextType {
  currentUser: GolferProfile;
  golfers: GolferProfile[];
  rounds: GolfRound[];
  courses: GolfCourse[];
  activities: ActivityItem[];
  userRounds: GolfRound[]; // Rounds belonging to current user
  
  // Actions
  addRound: (roundData: Omit<GolfRound, 'id' | 'differential' | 'golferId' | 'golferName' | 'golferAvatar'>) => void;
  deleteRound: (roundId: string) => void;
  addFriendByCode: (code: string) => { success: boolean; message: string };
  addCustomCourse: (course: GolfCourse) => void;
  reactToActivity: (activityId: string, reactionType: 'fire' | 'golf' | 'applause' | 'trophy') => void;
  switchActiveGolfer: (golferId: string) => void;
  verifyRound: (roundId: string) => void;
  updateProfile: (updatedData: Partial<GolferProfile>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'cabby_golf_data_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from LocalStorage if present, else sample data
  const [golfers, setGolfers] = useState<GolferProfile[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_golfers`);
    return saved ? JSON.parse(saved) : INITIAL_GOLFERS;
  });

  const [currentGolferId, setCurrentGolferId] = useState<string>('golfer-jt');

  const [rounds, setRounds] = useState<GolfRound[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_rounds`);
    return saved ? JSON.parse(saved) : INITIAL_ROUNDS;
  });

  const [courses, setCourses] = useState<GolfCourse[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_courses`);
    return saved ? JSON.parse(saved) : INITIAL_COURSES;
  });

  const [activities, setActivities] = useState<ActivityItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_activities`);
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
  });

  // Save changes to LocalStorage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_golfers`, JSON.stringify(golfers));
  }, [golfers]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_rounds`, JSON.stringify(rounds));
  }, [rounds]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_courses`, JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_activities`, JSON.stringify(activities));
  }, [activities]);

  const currentUser = golfers.find(g => g.id === currentGolferId) || golfers[0];
  const userRounds = rounds.filter(r => r.golferId === currentUser.id);

  // Recalculate handicap index for a golfer whenever their rounds change
  const recalculateGolferHandicap = (golferId: string, currentRounds: GolfRound[]) => {
    const golferRounds = currentRounds.filter(r => r.golferId === golferId);
    const { handicapIndex, bestRoundIds } = calculateHandicapIndex(golferRounds);
    
    // Update isBestRound flag on rounds
    setRounds(prev => prev.map(r => {
      if (r.golferId === golferId) {
        return { ...r, isBestRound: bestRoundIds.includes(r.id) };
      }
      return r;
    }));

    // Update golfer profile
    setGolfers(prev => prev.map(g => {
      if (g.id === golferId) {
        const lowestDiff = golferRounds.length > 0
          ? Math.min(...golferRounds.map(r => r.differential))
          : 99.9;
        const bestGross = golferRounds.length > 0
          ? Math.min(...golferRounds.map(r => r.score))
          : 999;
        const lowestIndex = Math.min(g.lowestHandicapIndex || 54.0, handicapIndex);

        return {
          ...g,
          handicapIndex,
          lowestHandicapIndex: lowestIndex,
          totalRounds: golferRounds.length,
          bestGrossScore: bestGross,
          bestDifferential: lowestDiff
        };
      }
      return g;
    }));
  };

  const addRound = (roundData: Omit<GolfRound, 'id' | 'differential' | 'golferId' | 'golferName' | 'golferAvatar'>) => {
    const differential = calculateDifferential(
      roundData.score,
      roundData.rating,
      roundData.slope,
      roundData.pcc,
      roundData.holesPlayed
    );

    const newRoundId = `round-${Date.now()}`;
    const newRound: GolfRound = {
      ...roundData,
      id: newRoundId,
      golferId: currentUser.id,
      golferName: currentUser.name,
      golferAvatar: currentUser.avatar,
      differential,
      verifiedCount: 1
    };

    const updatedRounds = [newRound, ...rounds];
    setRounds(updatedRounds);

    // Recalculate WHS Index
    recalculateGolferHandicap(currentUser.id, updatedRounds);

    // Trigger celebration confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#05C46B', '#00FF87', '#FFD700', '#FFFFFF']
    });

    // Create activity post
    const isPersonalBest = currentUser.bestGrossScore > roundData.score;
    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      golferId: currentUser.id,
      golferName: currentUser.name,
      golferAvatar: currentUser.avatar,
      roundId: newRoundId,
      type: isPersonalBest ? 'personal_best' : 'round_logged',
      title: isPersonalBest ? '🔥 New Personal Best Round!' : `Logged ${roundData.holesPlayed} Holes at ${roundData.courseName}`,
      subtitle: `Shot ${roundData.score} (${roundData.score > roundData.par ? '+' : ''}${roundData.score - roundData.par}) • Differential: ${differential}`,
      timestamp: 'Just now',
      reactions: { fire: 1, golf: 1, applause: 1, trophy: isPersonalBest ? 1 : 0 },
      userReactions: ['fire']
    };

    setActivities(prev => [newActivity, ...prev]);
  };

  const deleteRound = (roundId: string) => {
    const updatedRounds = rounds.filter(r => r.id !== roundId);
    setRounds(updatedRounds);
    recalculateGolferHandicap(currentUser.id, updatedRounds);
  };

  const addFriendByCode = (code: string): { success: boolean; message: string } => {
    const cleanCode = code.trim().toUpperCase();
    const foundGolfer = golfers.find(g => g.friendCode.toUpperCase() === cleanCode);

    if (!foundGolfer) {
      return { success: false, message: 'Invalid friend code. Please check and try again!' };
    }

    if (foundGolfer.id === currentUser.id) {
      return { success: false, message: 'That is your own Cabby friend code!' };
    }

    if (currentUser.friends.includes(foundGolfer.id)) {
      return { success: false, message: `${foundGolfer.name} is already in your friends roster!` };
    }

    // Add friend mutually
    setGolfers(prev => prev.map(g => {
      if (g.id === currentUser.id) {
        return { ...g, friends: [...g.friends, foundGolfer.id] };
      }
      if (g.id === foundGolfer.id) {
        return { ...g, friends: [...g.friends, currentUser.id] };
      }
      return g;
    }));

    return { success: true, message: `Successfully connected with ${foundGolfer.name}!` };
  };

  const addCustomCourse = (course: GolfCourse) => {
    setCourses(prev => [course, ...prev]);
  };

  const reactToActivity = (activityId: string, reactionType: 'fire' | 'golf' | 'applause' | 'trophy') => {
    setActivities(prev => prev.map(act => {
      if (act.id === activityId) {
        const userReactions = act.userReactions || [];
        const hasReacted = userReactions.includes(reactionType);

        const newReactions = { ...act.reactions };
        let newUserReactions = [...userReactions];

        if (hasReacted) {
          newReactions[reactionType] = Math.max(0, newReactions[reactionType] - 1);
          newUserReactions = newUserReactions.filter(r => r !== reactionType);
        } else {
          newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;
          newUserReactions.push(reactionType);
        }

        return { ...act, reactions: newReactions, userReactions: newUserReactions };
      }
      return act;
    }));
  };

  const switchActiveGolfer = (golferId: string) => {
    setCurrentGolferId(golferId);
  };

  const verifyRound = (roundId: string) => {
    setRounds(prev => prev.map(r => {
      if (r.id === roundId) {
        const verifiedBy = r.verifiedBy || [];
        if (!verifiedBy.includes(currentUser.id)) {
          return {
            ...r,
            verifiedBy: [...verifiedBy, currentUser.id],
            verifiedCount: (r.verifiedCount || 0) + 1
          };
        }
      }
      return r;
    }));
  };

  const updateProfile = (updatedData: Partial<GolferProfile>) => {
    setGolfers(prev => prev.map(g => {
      if (g.id === currentUser.id) {
        return { ...g, ...updatedData };
      }
      return g;
    }));
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        golfers,
        rounds,
        courses,
        activities,
        userRounds,
        addRound,
        deleteRound,
        addFriendByCode,
        addCustomCourse,
        reactToActivity,
        switchActiveGolfer,
        verifyRound,
        updateProfile
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
