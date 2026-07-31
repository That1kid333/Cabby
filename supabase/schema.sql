-- Cabby Supabase Database Schema
-- Includes tables for golfers, rounds, courses, tees, friends, and activity feeds.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Golf Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  city TEXT,
  state TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tee Boxes Table
CREATE TABLE IF NOT EXISTS public.tee_boxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  rating NUMERIC(4, 1) NOT NULL,
  slope INTEGER NOT NULL,
  par INTEGER NOT NULL DEFAULT 72,
  yardage INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Golfers Profile Table
CREATE TABLE IF NOT EXISTS public.golfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  friend_code TEXT UNIQUE NOT NULL,
  avatar TEXT,
  home_course TEXT,
  bio TEXT,
  target_handicap NUMERIC(4, 1),
  handicap_index NUMERIC(4, 1) DEFAULT 54.0,
  lowest_handicap_index NUMERIC(4, 1) DEFAULT 54.0,
  total_rounds INTEGER DEFAULT 0,
  best_gross_score INTEGER DEFAULT 999,
  best_differential NUMERIC(4, 1) DEFAULT 99.9,
  eagles_count INTEGER DEFAULT 0,
  holes_in_one_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Friendships Junction Table
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  golfer_id UUID REFERENCES public.golfers(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES public.golfers(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'accepted',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(golfer_id, friend_id)
);

-- 5. Golf Rounds Table
CREATE TABLE IF NOT EXISTS public.rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  golfer_id UUID REFERENCES public.golfers(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  tee_name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  score INTEGER NOT NULL,
  holes_played INTEGER NOT NULL DEFAULT 18,
  rating NUMERIC(4, 1) NOT NULL,
  slope INTEGER NOT NULL,
  par INTEGER NOT NULL DEFAULT 72,
  pcc NUMERIC(3, 1) DEFAULT 0.0,
  differential NUMERIC(4, 1) NOT NULL,
  notes TEXT,
  hole_details JSONB,
  verified_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Activity Feed Table
CREATE TABLE IF NOT EXISTS public.activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  golfer_id UUID REFERENCES public.golfers(id) ON DELETE CASCADE,
  round_id UUID REFERENCES public.rounds(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  reactions JSONB DEFAULT '{"fire":0, "golf":0, "applause":0, "trophy":0}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Games — a live shared scorecard multiple friends play in together.
CREATE TABLE IF NOT EXISTS public.games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_name TEXT NOT NULL,
  course_location TEXT,
  holes_played INTEGER NOT NULL DEFAULT 18 CHECK (holes_played IN (9, 18)),
  status TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'live', 'completed')),
  created_by UUID REFERENCES public.golfers(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  winner_golfer_id UUID REFERENCES public.golfers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 8. Game Players — who's in a given game, and which tee they're playing.
CREATE TABLE IF NOT EXISTS public.game_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  golfer_id UUID REFERENCES public.golfers(id) ON DELETE CASCADE,
  tee_name TEXT NOT NULL,
  rating NUMERIC(4, 1) NOT NULL,
  slope INTEGER NOT NULL,
  par INTEGER NOT NULL DEFAULT 72,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, golfer_id)
);

-- 9. Game Scores — one row per hole per player. Updated live as holes are played.
CREATE TABLE IF NOT EXISTS public.game_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  golfer_id UUID REFERENCES public.golfers(id) ON DELETE CASCADE,
  hole_number INTEGER NOT NULL CHECK (hole_number BETWEEN 1 AND 18),
  strokes INTEGER NOT NULL CHECK (strokes > 0),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, golfer_id, hole_number)
);

-- Track game wins for the "Most Wins" leaderboard without an aggregate query.
ALTER TABLE public.golfers ADD COLUMN IF NOT EXISTS games_won INTEGER DEFAULT 0;

-- RLS (Row Level Security) Setup
--
-- courses/tee_boxes were previously left with RLS untouched (off by default).
-- That's fragile: Supabase's dashboard nags project owners to "Enable RLS" on
-- every public table, and if that gets clicked with no policies defined, every
-- insert/select silently fails with zero error visible anywhere in the app UI
-- until now. Explicitly enabling it here WITH matching permissive policies means
-- it behaves the same whether or not someone clicked that button in the dashboard.
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tee_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- Policies are dropped-and-recreated so this whole file is safe to re-run
-- against a database that already has an earlier version of these policies.
DROP POLICY IF EXISTS "Public courses read access" ON public.courses;
CREATE POLICY "Public courses read access" ON public.courses FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can add courses" ON public.courses;
CREATE POLICY "Users can add courses" ON public.courses FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can remove a course they broke while adding tees" ON public.courses;
CREATE POLICY "Users can remove a course they broke while adding tees" ON public.courses FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public tee_boxes read access" ON public.tee_boxes;
CREATE POLICY "Public tee_boxes read access" ON public.tee_boxes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can add tee boxes" ON public.tee_boxes;
CREATE POLICY "Users can add tee boxes" ON public.tee_boxes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public golfers read access" ON public.golfers;
CREATE POLICY "Public golfers read access" ON public.golfers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public rounds read access" ON public.rounds;
CREATE POLICY "Public rounds read access" ON public.rounds FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public activity read access" ON public.activity_feed;
CREATE POLICY "Public activity read access" ON public.activity_feed FOR SELECT USING (true);

-- NOTE: golfers had RLS enabled from day one but was missing an INSERT policy,
-- which silently blocked every sign-up. This is the fix.
DROP POLICY IF EXISTS "Users can create their own golfer row" ON public.golfers;
CREATE POLICY "Users can create their own golfer row" ON public.golfers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own golfer row" ON public.golfers;
CREATE POLICY "Users can update their own golfer row" ON public.golfers FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can insert their own rounds" ON public.rounds;
CREATE POLICY "Users can insert their own rounds" ON public.rounds FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can insert activity" ON public.activity_feed;
CREATE POLICY "Users can insert activity" ON public.activity_feed FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update activity reactions" ON public.activity_feed;
CREATE POLICY "Users can update activity reactions" ON public.activity_feed FOR UPDATE USING (true);

-- Games / game_players / game_scores follow the same permissive, app-level-trust
-- model as the rest of this schema (matches the anon-key single-tenant design
-- above) rather than per-row auth.uid() checks — visibility is enforced by the
-- app's queries, not the database.
DROP POLICY IF EXISTS "Public games read access" ON public.games;
CREATE POLICY "Public games read access" ON public.games FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create games" ON public.games;
CREATE POLICY "Users can create games" ON public.games FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update games" ON public.games;
CREATE POLICY "Users can update games" ON public.games FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public game_players read access" ON public.game_players;
CREATE POLICY "Public game_players read access" ON public.game_players FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can join games" ON public.game_players;
CREATE POLICY "Users can join games" ON public.game_players FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public game_scores read access" ON public.game_scores;
CREATE POLICY "Public game_scores read access" ON public.game_scores FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can post game scores" ON public.game_scores;
CREATE POLICY "Users can post game scores" ON public.game_scores FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update game scores" ON public.game_scores;
CREATE POLICY "Users can update game scores" ON public.game_scores FOR UPDATE USING (true);

-- Live updates: add the game tables to Supabase's realtime publication so
-- players see each other's scores and joins update without a manual refresh.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'games'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'game_players'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.game_players;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'game_scores'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.game_scores;
  END IF;
END $$;

-- Safe to re-run against an already-deployed database that predates these columns.
ALTER TABLE public.golfers ADD COLUMN IF NOT EXISTS target_handicap NUMERIC(4, 1);
ALTER TABLE public.rounds ADD COLUMN IF NOT EXISTS verified_count INTEGER DEFAULT 1;
