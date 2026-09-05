-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║         ProjectHive — Master Production Schema & RLS Hardening          ║
-- ║  Execution Target: Supabase Dashboard -> SQL Editor -> Run              ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 1. USER HARDENING & AUDIT COLUMNS ─────────────────────────────────────────
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS avatar_color VARCHAR(20) DEFAULT '#6366F1',
  ADD COLUMN IF NOT EXISTS refresh_tokens TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_login_ip TEXT,
  ADD COLUMN IF NOT EXISTS last_login_country TEXT,
  ADD COLUMN IF NOT EXISTS last_login_city TEXT,
  ADD COLUMN IF NOT EXISTS last_login_device_model TEXT,
  ADD COLUMN IF NOT EXISTS last_login_os TEXT,
  ADD COLUMN IF NOT EXISTS last_login_browser TEXT,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"emailNotifications": true, "chatSounds": true, "theme": "dark", "twoFactorPrompt": false}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_last_login_ip ON users(last_login_ip);

-- ─── 2. SYSTEM FLAGS (SURVIVES RESTARTS) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_flags (
  key VARCHAR(100) PRIMARY KEY,
  value BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO system_flags (key, value) VALUES
  ('maintenanceMode', FALSE),
  ('registrationEnabled', TRUE),
  ('emailVerification', FALSE)
ON CONFLICT (key) DO NOTHING;

-- ─── 3. ADMIN AUDIT LOGS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  device_model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action);

-- ─── 4. LIVEKIT CALL SESSIONS & PARTICIPANTS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_name VARCHAR(255) NOT NULL UNIQUE,
  call_type VARCHAR(20) NOT NULL CHECK (call_type IN ('audio', 'video')),
  initiator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES users(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'initiated' 
    CHECK (status IN ('initiated', 'ringing', 'connected', 'ended', 'rejected', 'missed', 'failed')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  connected_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS call_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'participant' CHECK (role IN ('initiator', 'participant')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(call_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_call_sessions_room ON call_sessions(room_name);
CREATE INDEX IF NOT EXISTS idx_call_sessions_status ON call_sessions(status);
CREATE INDEX IF NOT EXISTS idx_call_participants_call_user ON call_participants(call_id, user_id);

-- ─── 5. MESSAGING & REACTION PERFORMANCE SCHEMA ───────────────────────────────
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS reply_to UUID REFERENCES messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reply_to_content TEXT,
  ADD COLUMN IF NOT EXISTS reply_to_sender VARCHAR(255),
  ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_messages_room_created_at ON messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to);

CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_msg_reactions_msg_user ON message_reactions(message_id, user_id);

-- ─── 6. COMPOSITE INDEXES FOR HIGH-TRAFFIC ENTITIES ───────────────────────────
CREATE INDEX IF NOT EXISTS idx_team_members_user_team ON team_members(user_id, team_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_created ON posts(author_id, created_at DESC);

-- ─── 7. ROW LEVEL SECURITY (RLS) POLICIES ─────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Full bypass for backend service_role across all tables
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "service_role_all_%I" ON %I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "service_role_all_%I" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true);', tbl, tbl);
  END LOOP;
END $$;

-- 2. Authenticated user read policies (prevents empty array [] drops on client queries)
DROP POLICY IF EXISTS "authenticated_read_users" ON users;
CREATE POLICY "authenticated_read_users" ON users FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_read_teams" ON teams;
CREATE POLICY "authenticated_read_teams" ON teams FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_read_team_members" ON team_members;
CREATE POLICY "authenticated_read_team_members" ON team_members FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_read_flags" ON system_flags;
CREATE POLICY "authenticated_read_flags" ON system_flags FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "authenticated_call_sessions" ON call_sessions;
CREATE POLICY "authenticated_call_sessions" ON call_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_call_participants" ON call_participants;
CREATE POLICY "authenticated_call_participants" ON call_participants FOR ALL TO authenticated USING (true) WITH CHECK (true);
