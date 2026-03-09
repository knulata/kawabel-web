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
