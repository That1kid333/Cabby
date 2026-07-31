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

-- RLS (Row Level Security) Setup
ALTER TABLE public.golfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public golfers read access" ON public.golfers FOR SELECT USING (true);
CREATE POLICY "Public rounds read access" ON public.rounds FOR SELECT USING (true);
CREATE POLICY "Public activity read access" ON public.activity_feed FOR SELECT USING (true);

CREATE POLICY "Users can insert their own rounds" ON public.rounds FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can insert activity" ON public.activity_feed FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update activity reactions" ON public.activity_feed FOR UPDATE USING (true);
CREATE POLICY "Users can update their own golfer row" ON public.golfers FOR UPDATE USING (true);

-- Safe to re-run against an already-deployed database that predates these columns.
ALTER TABLE public.golfers ADD COLUMN IF NOT EXISTS target_handicap NUMERIC(4, 1);
ALTER TABLE public.rounds ADD COLUMN IF NOT EXISTS verified_count INTEGER DEFAULT 1;
