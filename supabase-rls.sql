-- Enable Row Level Security on all tables
-- Run this in Supabase Dashboard → SQL Editor → New Query
--
-- This fixes Supabase security warnings. Kawabel only accesses the database
-- via the service_role key from server-side API routes, which bypasses RLS,
-- so enabling RLS won't break anything. It just blocks public access via
-- the anon key (which we don't use anyway).

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

-- Keepalive table — used by /api/health cron to keep Supabase from
-- archiving the project due to inactivity. A write happens daily.
CREATE TABLE IF NOT EXISTS keepalive (
  id INTEGER PRIMARY KEY DEFAULT 1,
  last_ping TIMESTAMPTZ DEFAULT NOW(),
  ping_count INTEGER DEFAULT 0,
  CONSTRAINT keepalive_single_row CHECK (id = 1)
);

ALTER TABLE keepalive ENABLE ROW LEVEL SECURITY;

-- Seed the single row
INSERT INTO keepalive (id, last_ping, ping_count)
VALUES (1, NOW(), 0)
ON CONFLICT (id) DO NOTHING;
