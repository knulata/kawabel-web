-- Enable Row Level Security + create keepalive table
-- Run this in Supabase Dashboard → SQL Editor → New Query
--
-- Safe to run multiple times. Only enables RLS on tables that exist.
-- Kawabel accesses the database via the service_role key server-side,
-- which bypasses RLS, so this doesn't break anything.

DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'students',
    'progress',
    'gamification',
    'daily_usage',
    'subscriptions',
    'friendships',
    'weekly_reports'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      RAISE NOTICE 'Enabled RLS on %', t;
    ELSE
      RAISE NOTICE 'Skipped % (does not exist)', t;
    END IF;
  END LOOP;
END $$;

-- Keepalive table — used by /api/health cron to keep Supabase from
-- archiving the project due to inactivity. A write happens daily.
CREATE TABLE IF NOT EXISTS keepalive (
  id INTEGER PRIMARY KEY DEFAULT 1,
  last_ping TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT keepalive_single_row CHECK (id = 1)
);

ALTER TABLE keepalive ENABLE ROW LEVEL SECURITY;

INSERT INTO keepalive (id, last_ping)
VALUES (1, NOW())
ON CONFLICT (id) DO NOTHING;
