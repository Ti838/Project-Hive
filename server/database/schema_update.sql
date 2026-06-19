-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  ProjectHive — Schema Update for Production                            ║
-- ║  Run this in: Supabase Dashboard → SQL Editor → New Query → Run        ║
-- ║                                                                        ║
-- ║  NOTE: Run this AFTER the main schema.sql has been applied.            ║
-- ║  This adds missing columns & tables the live system needs.             ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ─── 1. ADD is_featured COLUMN TO PROJECTS ───────────────────────────────────
-- This allows admins to feature/highlight projects from the admin dashboard
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- ─── 2. CREATE DM_REQUESTS TABLE (Facebook-style message requests) ───────────
-- When a non-friend sends a DM, it goes to "message requests" first
CREATE TABLE IF NOT EXISTS dm_requests (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  room_id      VARCHAR(255) NOT NULL,
  status       VARCHAR(20) DEFAULT 'pending'
               CHECK (status IN ('pending','accepted','declined')),
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id)
);

-- Row Level Security for dm_requests
ALTER TABLE dm_requests ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dm_requests' AND policyname = 'service_role_all_dm_requests'
  ) THEN
    EXECUTE 'CREATE POLICY "service_role_all_dm_requests" ON dm_requests FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Indexes for dm_requests performance
CREATE INDEX IF NOT EXISTS idx_dm_requests_to_user ON dm_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_dm_requests_room ON dm_requests(room_id);

-- ─── 3. ADD SAVED_PROJECTS TABLE (User's saved/bookmarked projects) ──────────
CREATE TABLE IF NOT EXISTS saved_projects (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

ALTER TABLE saved_projects ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'saved_projects' AND policyname = 'service_role_all_saved_projects'
  ) THEN
    EXECUTE 'CREATE POLICY "service_role_all_saved_projects" ON saved_projects FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- ─── DONE ────────────────────────────────────────────────────────────────────
-- After running this, your database is fully production-ready!
