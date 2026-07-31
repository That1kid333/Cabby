import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GolfCourse, GolferProfile, GolfRound, ActivityItem } from '../types';
import { supabase, isSupabaseConfigured, seedDefaultCoursesIfEmpty } from '../lib/supabase';
import { calculateDifferential, calculateHandicapIndex } from '../lib/whsEngine';
import { INITIAL_GOLFERS, INITIAL_ROUNDS, INITIAL_ACTIVITIES, INITIAL_COURSES } from '../lib/sampleData';

interface AppContextType {
  currentUser: GolferProfile | null;
  isAuthenticated: boolean;
  golfers: GolferProfile[];
  rounds: GolfRound[];
  courses: GolfCourse[];
  activities: ActivityItem[];
  userRounds: GolfRound[];
  
  // Auth & Actions
  signUpUser: (email: string, pass: string, name: string, homeCourse: string) => Promise<{ success: boolean; message: string }>;
  signInUser: (email: string, pass: string) => Promise<{ success: boolean; message: string }>;
  signOutUser: () => Promise<void>;
  loginAsGuest: () => void;
  
  addRound: (roundData: Omit<GolfRound, 'id' | 'differential' | 'golferId' | 'golferName' | 'golferAvatar'>) => Promise<void>;
  deleteRound: (roundId: string) => Promise<void>;
  addFriendByCode: (code: string) => Promise<{ success: boolean; message: string }>;
  addCustomCourse: (course: GolfCourse) => Promise<void>;
  reactToActivity: (activityId: string, reactionType: 'fire' | 'golf' | 'applause' | 'trophy') => void;
  verifyRound: (roundId: string) => void;
  updateProfile: (updatedData: Partial<GolferProfile>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<GolferProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  const [golfers, setGolfers] = useState<GolferProfile[]>(INITIAL_GOLFERS);
  const [rounds, setRounds] = useState<GolfRound[]>(INITIAL_ROUNDS);
  const [courses, setCourses] = useState<GolfCourse[]>(INITIAL_COURSES);
  const [activities, setActivities] = useState<ActivityItem[]>(INITIAL_ACTIVITIES);

  // Initialize DB Data & Auth Listener
  useEffect(() => {
    async function initData() {
      // 1. Seed courses if needed & load courses
      const loadedCourses = await seedDefaultCoursesIfEmpty();
      setCourses(loadedCourses);

      // 2. Fetch golfers & rounds if Supabase is configured
      if (supabase && isSupabaseConfigured) {
        try {
          const { data: gData } = await supabase.from('golfers').select('*');
          if (gData && gData.length > 0) {
            const mappedGolfers: GolferProfile[] = gData.map(g => ({
              id: g.id,
              name: g.name,
              email: g.email,
              friendCode: g.friend_code,
              avatar: g.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
              homeCourse: g.home_course || 'Pebble Beach Golf Links',
              targetHandicap: 4.0,
              friends: [],
              joinedDate: g.created_at,
              handicapIndex: Number(g.handicap_index || 54.0),
              lowestHandicapIndex: Number(g.lowest_handicap_index || 54.0),
              totalRounds: Number(g.total_rounds || 0),
              bestGrossScore: Number(g.best_gross_score || 999),
              bestDifferential: Number(g.best_differential || 99.9),
              eaglesCount: Number(g.eagles_count || 0),
              holesInOneCount: Number(g.holes_in_one_count || 0)
            }));
            setGolfers(mappedGolfers);
          }

          const { data: rData } = await supabase.from('rounds').select('*').order('date', { ascending: false });
          if (rData && rData.length > 0) {
            const mappedRounds: GolfRound[] = rData.map(r => ({
              id: r.id,
              golferId: r.golfer_id,
              golferName: r.course_name, // fallback
              courseId: r.course_name,
              courseName: r.course_name,
              teeName: r.tee_name,
              date: r.date,
              score: r.score,
              holesPlayed: r.holes_played as 9 | 18,
              rating: Number(r.rating),
              slope: Number(r.slope),
              par: Number(r.par),
              pcc: Number(r.pcc || 0),
              differential: Number(r.differential),
              notes: r.notes
            }));
            setRounds(mappedRounds);
          }
        } catch (err) {
          console.error('Error fetching Supabase data:', err);
        }
      }
    }

    initData();
  }, []);

  // Supabase Auth Session listener
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsAuthenticated(true);
        loadUserProfile(session.user.id, session.user.email);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        loadUserProfile(session.user.id, session.user.email);
      } else if (!currentUser) {
        setIsAuthenticated(false);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string, email?: string) => {
    if (!supabase) return;
    const { data } = await supabase.from('golfers').select('*').eq('user_id', userId).single();
    if (data) {
      setCurrentUser({
        id: data.id,
        name: data.name,
        email: data.email || email,
        friendCode: data.friend_code,
        avatar: data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        homeCourse: data.home_course || 'Pebble Beach Golf Links',
        targetHandicap: 4.0,
        friends: [],
        joinedDate: data.created_at,
        handicapIndex: Number(data.handicap_index || 54.0),
        lowestHandicapIndex: Number(data.lowest_handicap_index || 54.0),
        totalRounds: Number(data.total_rounds || 0),
        bestGrossScore: Number(data.best_gross_score || 999),
        bestDifferential: Number(data.best_differential || 99.9),
        eaglesCount: Number(data.eagles_count || 0),
        holesInOneCount: Number(data.holes_in_one_count || 0)
      });
    }
  };

  const loginAsGuest = () => {
    setCurrentUser(INITIAL_GOLFERS[0]); // JT
    setIsAuthenticated(true);
  };

  const signUpUser = async (email: string, pass: string, name: string, homeCourse: string) => {
    if (!supabase) {
      // Fallback guest creation
      const friendCode = `CB-${Math.floor(1000 + Math.random() * 9000)}-${name.slice(0, 2).toUpperCase()}`;
      const newG: GolferProfile = {
        id: `g-${Date.now()}`,
        name,
        email,
        friendCode,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        homeCourse,
        targetHandicap: 5.0,
        friends: [],
        joinedDate: new Date().toISOString(),
        handicapIndex: 54.0,
        lowestHandicapIndex: 54.0,
        totalRounds: 0,
        bestGrossScore: 999,
        bestDifferential: 99.9,
        eaglesCount: 0,
        holesInOneCount: 0
      };
      setGolfers(prev => [newG, ...prev]);
      setCurrentUser(newG);
      setIsAuthenticated(true);
      return { success: true, message: 'Account created successfully!' };
    }

    const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password: pass });
    if (authErr || !authData.user) {
      return { success: false, message: authErr?.message || 'Failed to create account.' };
    }

    const friendCode = `CB-${Math.floor(1000 + Math.random() * 9000)}-${name.slice(0, 2).toUpperCase()}`;

    const { data: gData, error: gErr } = await supabase
      .from('golfers')
      .insert({
        user_id: authData.user.id,
        name,
        email,
        friend_code: friendCode,
        home_course: homeCourse,
        handicap_index: 54.0,
        lowest_handicap_index: 54.0
      })
      .select()
      .single();

    if (gErr) {
      return { success: false, message: gErr.message };
    }

    const newGolfer: GolferProfile = {
      id: gData.id,
      name: gData.name,
      email: gData.email,
      friendCode: gData.friend_code,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      homeCourse: gData.home_course,
      targetHandicap: 5.0,
      friends: [],
      joinedDate: gData.created_at,
      handicapIndex: 54.0,
      lowestHandicapIndex: 54.0,
      totalRounds: 0,
      bestGrossScore: 999,
      bestDifferential: 99.9,
      eaglesCount: 0,
      holesInOneCount: 0
    };

    setGolfers(prev => [newGolfer, ...prev]);
    setCurrentUser(newGolfer);
    setIsAuthenticated(true);
    return { success: true, message: 'Account created successfully!' };
  };

  const signInUser = async (email: string, pass: string) => {
    if (!supabase) {
      loginAsGuest();
      return { success: true, message: 'Signed in as demo guest.' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error || !data.user) {
      return { success: false, message: error?.message || 'Invalid credentials.' };
    }

    await loadUserProfile(data.user.id, data.user.email);
    setIsAuthenticated(true);
    return { success: true, message: 'Welcome back!' };
  };

  const signOutUser = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const userRounds = currentUser ? rounds.filter(r => r.golferId === currentUser.id) : [];

  const addRound = async (roundData: Omit<GolfRound, 'id' | 'differential' | 'golferId' | 'golferName' | 'golferAvatar'>) => {
    if (!currentUser) return;

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

    if (supabase) {
      await supabase.from('rounds').insert({
        golfer_id: currentUser.id,
        course_name: roundData.courseName,
        tee_name: roundData.teeName,
        date: roundData.date,
        score: roundData.score,
        holes_played: roundData.holesPlayed,
        rating: roundData.rating,
        slope: roundData.slope,
        par: roundData.par,
        pcc: roundData.pcc,
        differential,
        notes: roundData.notes
      });
    }

    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#00FF87', '#00E676', '#FFD700', '#FFFFFF']
    });

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

  const deleteRound = async (roundId: string) => {
    setRounds(prev => prev.filter(r => r.id !== roundId));
    if (supabase) {
      await supabase.from('rounds').delete().eq('id', roundId);
    }
  };

  const addFriendByCode = async (code: string) => {
    if (!currentUser) return { success: false, message: 'Please sign in first.' };
    const cleanCode = code.trim().toUpperCase();
    const found = golfers.find(g => g.friendCode.toUpperCase() === cleanCode);

    if (!found) return { success: false, message: 'Invalid friend code.' };
    if (found.id === currentUser.id) return { success: false, message: 'This is your own code!' };

    setGolfers(prev => prev.map(g => {
      if (g.id === currentUser.id) return { ...g, friends: [...g.friends, found.id] };
      return g;
    }));

    return { success: true, message: `Connected with ${found.name}!` };
  };

  const addCustomCourse = async (course: GolfCourse) => {
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

  const verifyRound = (roundId: string) => {
    if (!currentUser) return;
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

  const updateProfile = async (updatedData: Partial<GolferProfile>) => {
    if (!currentUser) return;
    setCurrentUser(prev => prev ? { ...prev, ...updatedData } : null);
    if (supabase) {
      await supabase.from('golfers').update({
        name: updatedData.name,
        home_course: updatedData.homeCourse,
        bio: updatedData.bio
      }).eq('id', currentUser.id);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        golfers,
        rounds,
        courses,
        activities,
        userRounds,
        signUpUser,
        signInUser,
        signOutUser,
        loginAsGuest,
        addRound,
        deleteRound,
        addFriendByCode,
        addCustomCourse,
        reactToActivity,
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
