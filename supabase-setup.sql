-- Kawabel Database Setup
-- Run this in Supabase Dashboard → SQL Editor → New Query

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  google_id TEXT,
  avatar_url TEXT,
  grade TEXT DEFAULT 'SD',
  stars INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  pin TEXT,
  parent_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progress table
CREATE TABLE IF NOT EXISTS progress (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id),
  subject TEXT NOT NULL,
  topic TEXT DEFAULT '',
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  type TEXT DEFAULT 'homework',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_progress_student ON progress(student_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_progress_created ON progress(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_students_parent_code ON students(parent_code);

-- Function to increment stars
CREATE OR REPLACE FUNCTION increment_stars(sid INTEGER, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE students SET stars = stars + amount, updated_at = NOW() WHERE id = sid;
END;
$$ LANGUAGE plpgsql;

-- Gamification table (syncs client-side state for signed-in users)
CREATE TABLE IF NOT EXISTS gamification (
  student_id INTEGER PRIMARY KEY REFERENCES students(id),
  xp INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  last_active_date TEXT,
  gems INTEGER DEFAULT 0,
  hearts INTEGER DEFAULT 5,
  hearts_lost_at BIGINT,
  chests_available INTEGER DEFAULT 0,
  chests_opened INTEGER DEFAULT 0,
  achievements TEXT[] DEFAULT '{}',
  friend_ids INTEGER[] DEFAULT '{}',
  daily_goal_xp INTEGER DEFAULT 50,
  daily_xp INTEGER DEFAULT 0,
  daily_xp_date TEXT,
  streak_freezes INTEGER DEFAULT 0,
  combo INTEGER DEFAULT 0,
  max_combo INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily usage tracking (server-side enforcement)
CREATE TABLE IF NOT EXISTS daily_usage (
  student_id INTEGER REFERENCES students(id),
  date TEXT NOT NULL,
  chats INTEGER DEFAULT 0,
  photos INTEGER DEFAULT 0,
  quizzes INTEGER DEFAULT 0,
  dictations INTEGER DEFAULT 0,
  PRIMARY KEY (student_id, date)
);

-- Subscriptions (server-side source of truth)
CREATE TABLE IF NOT EXISTS subscriptions (
  student_id INTEGER PRIMARY KEY REFERENCES students(id),
  plan TEXT DEFAULT 'free',
  trial_start_date TEXT,
  premium_until TEXT,
  redeemed_vouchers TEXT[] DEFAULT '{}'
);

-- Friendships (bidirectional)
CREATE TABLE IF NOT EXISTS friendships (
  student_id INTEGER REFERENCES students(id),
  friend_id INTEGER REFERENCES students(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (student_id, friend_id)
);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);

-- Weekly reports for parents
CREATE TABLE IF NOT EXISTS weekly_reports (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id),
  week_start TEXT NOT NULL,
  report_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_student ON weekly_reports(student_id);

-- Parent WhatsApp for notifications
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_whatsapp TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS weekly_report_enabled BOOLEAN DEFAULT false;
