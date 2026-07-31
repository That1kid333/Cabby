import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GolfCourse, GolferProfile, GolfRound, ActivityItem } from '../types';
import { supabase, loadCourses, saveCourse, upsertCourseHolePar } from '../lib/supabase';
import { calculateDifferential } from '../lib/whsEngine';
import { GameDeletionRollback } from '../lib/games';

interface AppContextType {
  currentUser: GolferProfile | null;
  isAuthenticated: boolean;
  golfers: GolferProfile[];
  rounds: GolfRound[];
  courses: GolfCourse[];
  activities: ActivityItem[];
  userRounds: GolfRound[];
  loading: boolean;

  // Auth & Actions
  signUpUser: (email: string, pass: string, name: string, homeCourse: string) => Promise<{ success: boolean; message: string }>;
  signInUser: (email: string, pass: string) => Promise<{ success: boolean; message: string }>;
  signOutUser: () => Promise<void>;

  addRound: (roundData: Omit<GolfRound, 'id' | 'differential' | 'golferId' | 'golferName'>) => Promise<{ success: boolean; error?: string }>;
  deleteRound: (roundId: string) => Promise<void>;
  addFriendByCode: (code: string) => Promise<{ success: boolean; message: string }>;
  addCustomCourse: (course: Omit<GolfCourse, 'id'>) => Promise<GolfCourse | null>;
  reactToActivity: (activityId: string, reactionType: 'fire' | 'golf' | 'applause' | 'trophy') => void;
  verifyRound: (roundId: string) => void;
  updateProfile: (updatedData: Partial<GolferProfile>) => Promise<{ success: boolean; error?: string }>;
  postActivity: (payload: { type: ActivityItem['type']; title: string; subtitle: string; gameId?: string }) => Promise<void>;
  bumpGamesWon: (golferId: string) => void;
  applyGameResults: (results: { round: GolfRound; updatedGolfer: Partial<GolferProfile> & { id: string } }[]) => void;
  applyGameDeletionRollback: (rollback: GameDeletionRollback) => void;
  updateCourseHolePar: (courseId: string, holeNumber: number, par: number) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function mapGolfer(g: any): GolferProfile {
  return {
    id: g.id,
    name: g.name,
    email: g.email,
    friendCode: g.friend_code,
    homeCourse: g.home_course || '',
    bio: g.bio,
    targetHandicap: g.target_handicap != null ? Number(g.target_handicap) : undefined,
    friends: [],
    joinedDate: g.created_at,
    handicapIndex: Number(g.handicap_index ?? 54.0),
    lowestHandicapIndex: Number(g.lowest_handicap_index ?? 54.0),
    totalRounds: Number(g.total_rounds ?? 0),
    bestGrossScore: Number(g.best_gross_score ?? 999),
    bestDifferential: Number(g.best_differential ?? 99.9),
    eaglesCount: Number(g.eagles_count ?? 0),
    holesInOneCount: Number(g.holes_in_one_count ?? 0),
    gamesWon: Number(g.games_won ?? 0)
  };
}

function mapRound(r: any, golferName = ''): GolfRound {
  return {
    id: r.id,
    golferId: r.golfer_id,
    golferName,
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
    notes: r.notes,
    verifiedCount: r.verified_count ?? 1
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<GolferProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const [golfers, setGolfers] = useState<GolferProfile[]>([]);
  const [rounds, setRounds] = useState<GolfRound[]>([]);
  const [courses, setCourses] = useState<GolfCourse[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Initial data load
  useEffect(() => {
    async function initData() {
      setCourses(await loadCourses());

      if (supabase) {
        const { data: gData } = await supabase.from('golfers').select('*');
        const nameById = new Map<string, string>();
        if (gData) {
          gData.forEach((g: any) => nameById.set(g.id, g.name));
          setGolfers(gData.map(mapGolfer));
        }

        const { data: rData } = await supabase.from('rounds').select('*').order('date', { ascending: false });
        if (rData) setRounds(rData.map((r: any) => mapRound(r, nameById.get(r.golfer_id) || 'Unknown Golfer')));

        const { data: aData } = await supabase.from('activity_feed').select('*').order('created_at', { ascending: false }).limit(30);
        if (aData) {
          setActivities(aData.map((a: any) => ({
            id: a.id,
            golferId: a.golfer_id,
            golferName: nameById.get(a.golfer_id) || 'Unknown Golfer',
            roundId: a.round_id,
            type: a.type,
            title: a.title,
            subtitle: a.subtitle,
            timestamp: a.created_at,
            reactions: a.reactions || { fire: 0, golf: 0, applause: 0, trophy: 0 }
          })));
        }
      }

      setLoading(false);
    }

    initData();
  }, []);

  // Supabase Auth Session listener
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

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
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string, email?: string) => {
    if (!supabase) return;
    const { data } = await supabase.from('golfers').select('*').eq('user_id', userId).single();
    if (!data) return;

    const { data: friendRows } = await supabase.from('friendships').select('friend_id').eq('golfer_id', data.id);
    const friends = (friendRows || []).map((f: any) => f.friend_id);

    setCurrentUser({ ...mapGolfer({ ...data, email: data.email || email }), friends });
  };

  const signUpUser = async (email: string, pass: string, name: string, homeCourse: string) => {
    if (!supabase) {
      return { success: false, message: 'Cabby is not connected to a database yet. Add Supabase credentials to get started.' };
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

    if (gErr || !gData) {
      return { success: false, message: gErr?.message || 'Failed to create golfer profile.' };
    }

    const newGolfer = mapGolfer(gData);
    setGolfers(prev => [newGolfer, ...prev]);
    setCurrentUser(newGolfer);
    setIsAuthenticated(true);
    return { success: true, message: 'Account created successfully!' };
  };

  const signInUser = async (email: string, pass: string) => {
    if (!supabase) {
      return { success: false, message: 'Cabby is not connected to a database yet. Add Supabase credentials to get started.' };
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

  const addRound = async (roundData: Omit<GolfRound, 'id' | 'differential' | 'golferId' | 'golferName'>): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Please sign in first.' };
    if (!supabase) return { success: false, error: 'Cabby is not connected to a database.' };

    const differential = calculateDifferential(
      roundData.score,
      roundData.rating,
      roundData.slope,
      roundData.pcc,
      roundData.holesPlayed
    );

    const { data: inserted, error } = await supabase
      .from('rounds')
      .insert({
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
      })
      .select()
      .single();

    if (error || !inserted) {
      return { success: false, error: error?.message || 'Could not save that round. Please try again.' };
    }

    const newRound: GolfRound = { ...mapRound(inserted), golferName: currentUser.name };
    setRounds(prev => [newRound, ...prev]);

    const isPersonalBest = currentUser.bestGrossScore > roundData.score;

    const updatedUser: GolferProfile = {
      ...currentUser,
      totalRounds: currentUser.totalRounds + 1,
      bestGrossScore: Math.min(currentUser.bestGrossScore, roundData.score),
      bestDifferential: Math.min(currentUser.bestDifferential, differential)
    };
    setCurrentUser(updatedUser);
    setGolfers(prev => prev.map(g => (g.id === currentUser.id ? updatedUser : g)));

    await supabase.from('golfers').update({
      total_rounds: updatedUser.totalRounds,
      best_gross_score: updatedUser.bestGrossScore,
      best_differential: updatedUser.bestDifferential
    }).eq('id', currentUser.id);

    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00FF87', '#00E676', '#FFD700', '#FFFFFF']
    });

    const activityPayload = {
      golfer_id: currentUser.id,
      round_id: newRound.id,
      type: isPersonalBest ? 'personal_best' : 'round_logged',
      title: isPersonalBest ? 'New personal best round!' : `Logged ${roundData.holesPlayed} holes at ${roundData.courseName}`,
      subtitle: `Shot ${roundData.score} (${roundData.score > roundData.par ? '+' : ''}${roundData.score - roundData.par}) • Differential: ${differential}`,
      reactions: { fire: 0, golf: 0, applause: 0, trophy: 0 }
    };

    const { data: insertedActivity } = await supabase.from('activity_feed').insert(activityPayload).select().single();
    if (insertedActivity) {
      setActivities(prev => [{
        id: insertedActivity.id,
        golferId: insertedActivity.golfer_id,
        golferName: currentUser.name,
        roundId: insertedActivity.round_id,
        type: insertedActivity.type,
        title: insertedActivity.title,
        subtitle: insertedActivity.subtitle,
        timestamp: insertedActivity.created_at,
        reactions: insertedActivity.reactions
      }, ...prev]);
    }

    return { success: true };
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
    if (currentUser.friends.includes(found.id)) return { success: false, message: `You're already connected with ${found.name}.` };

    if (supabase) {
      const { error } = await supabase.from('friendships').insert({ golfer_id: currentUser.id, friend_id: found.id });
      if (error) return { success: false, message: 'Could not save this connection. Try again.' };
    }

    const updatedUser = { ...currentUser, friends: [...currentUser.friends, found.id] };
    setCurrentUser(updatedUser);
    setGolfers(prev => prev.map(g => (g.id === currentUser.id ? updatedUser : g)));

    return { success: true, message: `Connected with ${found.name}!` };
  };

  const addCustomCourse = async (course: Omit<GolfCourse, 'id'>) => {
    const saved = await saveCourse(course);
    if (saved) {
      setCourses(prev => [saved, ...prev]);
    }
    return saved;
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

        if (supabase) {
          supabase.from('activity_feed').update({ reactions: newReactions }).eq('id', activityId);
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

  const updateProfile = async (updatedData: Partial<GolferProfile>): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Please sign in first.' };
    if (!supabase) return { success: false, error: 'Cabby is not connected to a database.' };

    const { error } = await supabase.from('golfers').update({
      name: updatedData.name,
      home_course: updatedData.homeCourse,
      bio: updatedData.bio,
      target_handicap: updatedData.targetHandicap
    }).eq('id', currentUser.id);

    if (error) return { success: false, error: error.message };

    const merged = { ...currentUser, ...updatedData };
    setCurrentUser(merged);
    setGolfers(prev => prev.map(g => (g.id === currentUser.id ? merged : g)));
    return { success: true };
  };

  const postActivity = async (payload: { type: ActivityItem['type']; title: string; subtitle: string; gameId?: string }) => {
    if (!currentUser || !supabase) return;

    const { data } = await supabase.from('activity_feed').insert({
      golfer_id: currentUser.id,
      type: payload.type,
      title: payload.title,
      subtitle: payload.subtitle,
      game_id: payload.gameId,
      reactions: { fire: 0, golf: 0, applause: 0, trophy: 0 }
    }).select().single();

    if (data) {
      setActivities(prev => [{
        id: data.id,
        golferId: data.golfer_id,
        golferName: currentUser.name,
        roundId: data.round_id,
        type: data.type,
        title: data.title,
        subtitle: data.subtitle,
        timestamp: data.created_at,
        reactions: data.reactions
      }, ...prev]);
    }
  };

  const bumpGamesWon = (golferId: string) => {
    setGolfers(prev => prev.map(g => (g.id === golferId ? { ...g, gamesWon: g.gamesWon + 1 } : g)));
    if (currentUser?.id === golferId) {
      setCurrentUser(prev => (prev ? { ...prev, gamesWon: prev.gamesWon + 1 } : prev));
    }
  };

  const applyGameResults = (results: { round: GolfRound; updatedGolfer: Partial<GolferProfile> & { id: string } }[]) => {
    setRounds(prev => [...results.map(r => r.round), ...prev]);
    setGolfers(prev => prev.map(g => {
      const match = results.find(r => r.updatedGolfer.id === g.id);
      return match ? { ...g, ...match.updatedGolfer } : g;
    }));
    const myUpdate = results.find(r => r.updatedGolfer.id === currentUser?.id);
    if (myUpdate) {
      setCurrentUser(prev => (prev ? { ...prev, ...myUpdate.updatedGolfer } : prev));
    }
  };

  const applyGameDeletionRollback = (rollback: GameDeletionRollback) => {
    setRounds(prev => prev.filter(r => !rollback.removedRoundIds.includes(r.id)));
    setActivities(prev => prev.filter(a => !rollback.removedActivityIds.includes(a.id)));
    setGolfers(prev => prev.map(g => {
      const match = rollback.updatedGolfers.find(u => u.id === g.id);
      return match ? { ...g, ...match } : g;
    }));
    const myUpdate = rollback.updatedGolfers.find(u => u.id === currentUser?.id);
    if (myUpdate) {
      setCurrentUser(prev => (prev ? { ...prev, ...myUpdate } : prev));
    }
  };

  const updateCourseHolePar = async (courseId: string, holeNumber: number, par: number): Promise<boolean> => {
    const updatedHoles = await upsertCourseHolePar(courseId, holeNumber, par);
    if (!updatedHoles) return false;
    setCourses(prev => prev.map(c => (c.id === courseId ? { ...c, holes: updatedHoles } : c)));
    return true;
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
        loading,
        signUpUser,
        signInUser,
        signOutUser,
        addRound,
        deleteRound,
        addFriendByCode,
        addCustomCourse,
        reactToActivity,
        verifyRound,
        updateProfile,
        postActivity,
        bumpGamesWon,
        applyGameResults,
        applyGameDeletionRollback,
        updateCourseHolePar
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
