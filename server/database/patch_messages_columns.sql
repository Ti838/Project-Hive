-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  ProjectHive — Full Schema Patch                                          ║
-- ║  Run in: Supabase Dashboard → SQL Editor → New Query → Run All           ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ─── 1. Add missing columns to messages ──────────────────────────────────────
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS reply_to         UUID REFERENCES messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reply_to_content TEXT,
  ADD COLUMN IF NOT EXISTS reply_to_sender  VARCHAR(255),
  ADD COLUMN IF NOT EXISTS reactions        JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to);

-- ─── 2. message_reactions table (for per-user emoji reactions on DMs) ────────
CREATE TABLE IF NOT EXISTS message_reactions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES users(id)    ON DELETE CASCADE NOT NULL,
  emoji      VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_msg_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_msg_reactions_user    ON message_reactions(user_id);

ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_msg_reactions"
  ON message_reactions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── 3. system_flags table (persistent admin flags — survives restarts) ───────
CREATE TABLE IF NOT EXISTS system_flags (
  key        VARCHAR(100) PRIMARY KEY,
  value      BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE system_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_flags"
  ON system_flags FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Seed default flags
INSERT INTO system_flags (key, value) VALUES
  ('maintenanceMode',      FALSE),
  ('registrationEnabled',  TRUE),
  ('emailVerification',    FALSE)
ON CONFLICT (key) DO NOTHING;

-- ─── 4. skill_endorsements table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skill_endorsements (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_id   UUID REFERENCES skills(id)    ON DELETE CASCADE NOT NULL,
  endorser_id UUID REFERENCES users(id)   ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(skill_id, endorser_id)
);

CREATE INDEX IF NOT EXISTS idx_endorsements_skill ON skill_endorsements(skill_id);

ALTER TABLE skill_endorsements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_endorsements"
  ON skill_endorsements FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── 5. saved_posts table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_posts (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES users(id)    ON DELETE CASCADE NOT NULL,
  post_id    UUID REFERENCES posts(id)    ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_saved_posts"
  ON saved_posts FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── Verify ───────────────────────────────────────────────────────────────────
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
