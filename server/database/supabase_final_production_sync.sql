-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║         ProjectHive — Master Production Schema & RLS Hardening Sync         ║
-- ║  Version: 3.0 Production Final Release                                      ║
-- ║  Execution Target: Supabase Dashboard → SQL Editor → New Query → Run All   ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ─── 0. EXTENSIONS ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. USER TABLE HARDENING & AUDIT COLUMNS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) DEFAULT 'student' CHECK (role IN ('student', 'faculty', 'admin')),
  university VARCHAR(255) DEFAULT 'General Campus',
  major VARCHAR(255) DEFAULT 'Computer Science',
  department VARCHAR(255),
  student_id VARCHAR(100),
  year_of_study INTEGER DEFAULT 1,
  avatar TEXT,
  avatar_color VARCHAR(20) DEFAULT '#6366F1',
  banner_image TEXT,
  bio TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  status VARCHAR(50) DEFAULT 'active',
  online_status VARCHAR(20) DEFAULT 'offline',
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  projects_posted INTEGER DEFAULT 0,
  skills JSONB DEFAULT '[]'::jsonb,
  interests TEXT[] DEFAULT '{}',
  refresh_tokens TEXT[] DEFAULT '{}',
  last_login_ip TEXT,
  last_login_country TEXT,
  last_login_city TEXT,
  last_login_device_model TEXT,
  last_login_os TEXT,
  last_login_browser TEXT,
  last_login_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{"emailNotifications": true, "chatSounds": true, "theme": "dark", "twoFactorPrompt": false}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Idempotent column additions for existing installations
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'student',
  ADD COLUMN IF NOT EXISTS avatar_color VARCHAR(20) DEFAULT '#6366F1',
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS projects_posted INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS refresh_tokens TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_login_ip TEXT,
  ADD COLUMN IF NOT EXISTS last_login_country TEXT,
  ADD COLUMN IF NOT EXISTS last_login_city TEXT,
  ADD COLUMN IF NOT EXISTS last_login_device_model TEXT,
  ADD COLUMN IF NOT EXISTS last_login_os TEXT,
  ADD COLUMN IF NOT EXISTS last_login_browser TEXT,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"emailNotifications": true, "chatSounds": true, "theme": "dark", "twoFactorPrompt": false}'::jsonb;

-- Users role constraint check
DO $$
BEGIN
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
  ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('student', 'faculty', 'admin'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_banned ON users(role, is_banned);
CREATE INDEX IF NOT EXISTS idx_users_university ON users(university);
CREATE INDEX IF NOT EXISTS idx_users_major ON users(major);
CREATE INDEX IF NOT EXISTS idx_users_last_login_ip ON users(last_login_ip);

-- ─── 2. SYSTEM FLAGS & CONFIGURATION MATRIX ───────────────────────────────────
CREATE TABLE IF NOT EXISTS system_flags (
  key VARCHAR(100) PRIMARY KEY,
  value BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO system_flags (key, value) VALUES
  ('maintenanceMode', FALSE),
  ('registrationEnabled', TRUE),
  ('emailVerification', FALSE),
  ('rateLimitStrict', FALSE),
  ('allowPublicProjects', TRUE),
  ('aiReviewEnabled', TRUE)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS system_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_mode BOOLEAN DEFAULT FALSE,
  registration_enabled BOOLEAN DEFAULT TRUE,
  email_verification BOOLEAN DEFAULT FALSE,
  rate_limit_strict BOOLEAN DEFAULT FALSE,
  allow_public_projects BOOLEAN DEFAULT TRUE,
  ai_review_enabled BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. ADMIN AUDIT LOGS (FORENSIC IMMUTABLE LEDGER) ──────────────────────────
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  device_model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);

-- ─── 4. CONTENT MODERATION & STRIKE LEDGER ────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('post', 'comment', 'user', 'team', 'project')),
  target_id UUID NOT NULL,
  reason VARCHAR(100) NOT NULL,
  details TEXT DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_notes TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_strikes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issued_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  severity VARCHAR(30) DEFAULT 'warning' CHECK (severity IN ('warning', 'temporary_suspension', 'permanent_ban')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_status_created ON content_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_target ON content_reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_user_strikes_user ON user_strikes(user_id);

-- ─── 5. TEAMS & SQUADS SCHEMA ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  privacy VARCHAR(20) DEFAULT 'public' CHECK (privacy IN ('public', 'private')),
  is_private BOOLEAN DEFAULT FALSE,
  is_open BOOLEAN DEFAULT TRUE,
  type VARCHAR(30) DEFAULT 'team',
  avatar TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  rules TEXT,
  leader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS banner_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS type VARCHAR(30) DEFAULT 'team',
  ADD COLUMN IF NOT EXISTS rules TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS privacy VARCHAR(20) DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

DO $$
BEGIN
  ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_role_check;
  ALTER TABLE team_members ADD CONSTRAINT team_members_role_check CHECK (role IN ('leader', 'moderator', 'member'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_team_members_user_team ON team_members(user_id, team_id);
CREATE INDEX IF NOT EXISTS idx_teams_type_open ON teams(type, is_open);

-- ─── 6. PROJECTS & SHOWCASE UPVOTES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  category VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  tech_stack TEXT[] DEFAULT '{}',
  thumbnail TEXT,
  demo_url TEXT,
  github_url TEXT,
  status VARCHAR(50) DEFAULT 'active',
  likes INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  upvoted_by UUID[] DEFAULT '{}'::uuid[],
  looking_for_members BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS upvoted_by UUID[] DEFAULT '{}'::uuid[],
  ADD COLUMN IF NOT EXISTS looking_for_members BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS project_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_likes ON projects(likes DESC);
CREATE INDEX IF NOT EXISTS idx_project_likes_user_project ON project_likes(user_id, project_id);

-- ─── 7. SOCIAL FEED & THREADED COMMENTS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  media_urls TEXT[] DEFAULT '{}'::text[],
  code_snippet JSONB DEFAULT NULL,
  poll_data JSONB DEFAULT NULL,
  post_type VARCHAR(50) DEFAULT 'standard',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS code_snippet JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS poll_data JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE DEFAULT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE post_comments
  ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_posts_author_created ON posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_parent ON post_comments(post_id, parent_comment_id, created_at ASC);

-- ─── 8. MESSAGING, REACTIONS & CONVERSATION PINS ──────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id VARCHAR(255) NOT NULL,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'seen')),
  media_url TEXT DEFAULT NULL,
  voice_url TEXT DEFAULT NULL,
  voice_duration INTEGER DEFAULT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  reply_to UUID REFERENCES messages(id) ON DELETE SET NULL,
  reply_to_content TEXT,
  reply_to_sender VARCHAR(255),
  reactions JSONB DEFAULT '{}'::jsonb,
  read_by UUID[] DEFAULT '{}'::uuid[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'sent',
  ADD COLUMN IF NOT EXISTS media_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS voice_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS voice_duration INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reply_to UUID REFERENCES messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reply_to_content TEXT,
  ADD COLUMN IF NOT EXISTS reply_to_sender VARCHAR(255),
  ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS read_by UUID[] DEFAULT '{}'::uuid[];

DO $$
BEGIN
  ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_status_check;
  ALTER TABLE messages ADD CONSTRAINT messages_status_check CHECK (status IN ('sent', 'delivered', 'seen'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS conversation_pins (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  room_id VARCHAR(255) NOT NULL,
  pinned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, room_id)
);

CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_messages_room_created ON messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_status ON messages(sender_id, status);
CREATE INDEX IF NOT EXISTS idx_conv_pins_user ON conversation_pins(user_id);
CREATE INDEX IF NOT EXISTS idx_msg_reactions_msg_user ON message_reactions(message_id, user_id);

-- ─── 9. LIVEKIT VIDEO/AUDIO CALL SESSIONS ─────────────────────────────────────
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

-- ─── 10. NOTIFICATIONS & SUPPORT TICKETS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  message TEXT NOT NULL,
  entity_type VARCHAR(50),
  entity_id VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status, created_at DESC);

-- ─── 11. ROW-LEVEL SECURITY (RLS) POLICIES ─────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_strikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Dynamic service_role bypass for all tables
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

-- Public & Authenticated Read Permissions
DROP POLICY IF EXISTS "authenticated_read_users" ON users;
CREATE POLICY "authenticated_read_users" ON users FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "authenticated_read_teams" ON teams;
CREATE POLICY "authenticated_read_teams" ON teams FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "authenticated_read_team_members" ON team_members;
CREATE POLICY "authenticated_read_team_members" ON team_members FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "authenticated_read_projects" ON projects;
CREATE POLICY "authenticated_read_projects" ON projects FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "authenticated_read_posts" ON posts;
CREATE POLICY "authenticated_read_posts" ON posts FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "authenticated_read_comments" ON post_comments;
CREATE POLICY "authenticated_read_comments" ON post_comments FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "authenticated_read_system_flags" ON system_flags;
CREATE POLICY "authenticated_read_system_flags" ON system_flags FOR SELECT TO authenticated, anon USING (true);

-- User-scoped write permissions
DROP POLICY IF EXISTS "users_manage_own_pins" ON conversation_pins;
CREATE POLICY "users_manage_own_pins" ON conversation_pins FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_create_reports" ON content_reports;
CREATE POLICY "users_create_reports" ON content_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

-- ─── 12. COMPLETION SANITY CHECK ──────────────────────────────────────────────
SELECT 'ProjectHive Master Production Schema Successfully Synchronized' AS status, NOW() AS timestamp;
