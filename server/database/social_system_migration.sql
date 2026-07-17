-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║        ProjectHive — Social System Migration (Follows & Blocks)          ║
-- ║  Run this in: Supabase Dashboard → SQL Editor → New Query → Run         ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ─── FOLLOWS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- ─── BLOCKS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blocks (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  blocked_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks  ENABLE ROW LEVEL SECURITY;

-- Allow service_role to bypass all RLS (our backend uses service role)
CREATE POLICY "service_role_all_follows" ON follows FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_blocks"  ON blocks  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Index optimization for queries
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_id);
