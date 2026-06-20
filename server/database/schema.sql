-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║          ProjectHive — Supabase PostgreSQL Schema                       ║
-- ║  Run this in: Supabase Dashboard → SQL Editor → New Query → Run         ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── USERS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name                VARCHAR(100) NOT NULL,
  last_name                 VARCHAR(100) NOT NULL,
  email                     VARCHAR(255) UNIQUE NOT NULL,
  password_hash             VARCHAR(255) NOT NULL,
  avatar                    TEXT,
  banner_image              TEXT,
  avatar_color              VARCHAR(20) DEFAULT '#6366F1',
  bio                       TEXT DEFAULT '',
  university                VARCHAR(255) DEFAULT '',
  major                     VARCHAR(255) DEFAULT '',
  year_of_study             INTEGER CHECK (year_of_study IS NULL OR year_of_study BETWEEN 1 AND 5),
  status                    VARCHAR(20) DEFAULT 'available'
                            CHECK (status IN ('available','busy','not-looking')),
  hours_per_week            INTEGER DEFAULT 10,
  github                    VARCHAR(500),
  linkedin                  VARCHAR(500),
  portfolio                 VARCHAR(500),
  role                      VARCHAR(20) DEFAULT 'student'
                            CHECK (role IN ('user','student','admin')),
  is_verified               BOOLEAN DEFAULT FALSE,
  email_verification_token  VARCHAR(255),
  email_verification_expires TIMESTAMP WITH TIME ZONE,
  password_reset_token      VARCHAR(255),
  password_reset_expires    TIMESTAMP WITH TIME ZONE,
  is_banned                 BOOLEAN DEFAULT FALSE,
  is_public                 BOOLEAN DEFAULT TRUE,
  completion_percentage     INTEGER DEFAULT 0,
  last_seen                 TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  online_status             VARCHAR(20) DEFAULT 'offline'
                            CHECK (online_status IN ('online','offline')),
  teams_created             INTEGER DEFAULT 0,
  teams_joined              INTEGER DEFAULT 0,
  projects_posted           INTEGER DEFAULT 0,
  refresh_tokens            TEXT[] DEFAULT '{}',
  created_at                TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at                TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── SKILLS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skills (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  name         VARCHAR(100) NOT NULL,
  level        VARCHAR(20) DEFAULT 'intermediate'
               CHECK (level IN ('beginner','intermediate','advanced')),
  endorsements INTEGER DEFAULT 0
);

-- ─── TEAMS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  category    VARCHAR(100) DEFAULT '',
  tags        TEXT[] DEFAULT '{}',
  max_size    INTEGER DEFAULT 5,
  is_open     BOOLEAN DEFAULT TRUE,
  leader_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── TEAM MEMBERS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id    UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  role       VARCHAR(20) DEFAULT 'member' CHECK (role IN ('leader','member')),
  joined_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- ─── PROJECTS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  category    VARCHAR(100) DEFAULT '',
  tags        TEXT[] DEFAULT '{}',
  tech_stack  TEXT[] DEFAULT '{}',
  github_url  VARCHAR(500),
  demo_url    VARCHAR(500),
  thumbnail   TEXT,
  owner_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  team_id     UUID REFERENCES teams(id) ON DELETE SET NULL,
  status      VARCHAR(20) DEFAULT 'active'
              CHECK (status IN ('active','completed','archived')),
  likes       INTEGER DEFAULT 0,
  views       INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── PROJECT LIKES ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_likes (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- ─── MESSAGES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id    VARCHAR(255) NOT NULL,
  sender_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  type       VARCHAR(20) DEFAULT 'text',
  read_by    UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast room lookup
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);

-- ─── DM REQUESTS ─────────────────────────────────────────────────────────────
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

CREATE INDEX IF NOT EXISTS idx_dm_requests_to_user ON dm_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_dm_requests_room ON dm_requests(room_id);

-- ─── SAVED PROJECTS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_projects (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(50) NOT NULL,
  title      VARCHAR(255),
  message    TEXT,
  data       JSONB DEFAULT '{}',
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- ─── FRIEND REQUESTS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS friend_requests (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  status       VARCHAR(20) DEFAULT 'pending'
               CHECK (status IN ('pending','accepted','rejected')),
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

-- ─── FRIENDS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS friends (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- ─── JOIN REQUESTS (Teams) ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS join_requests (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id    UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  message    TEXT DEFAULT '',
  status     VARCHAR(20) DEFAULT 'pending'
             CHECK (status IN ('pending','accepted','rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills       ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams        ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects     ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends      ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_likes ENABLE ROW LEVEL SECURITY;

-- Allow service_role to bypass all RLS (our backend uses service role)
CREATE POLICY "service_role_all_users"         ON users         FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_skills"        ON skills        FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_teams"         ON teams         FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_team_members"  ON team_members  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_projects"      ON projects      FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_messages"      ON messages      FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_dm_requests"   ON dm_requests   FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_saved_projects" ON saved_projects FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_notifications" ON notifications FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_friend_req"    ON friend_requests FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_friends"       ON friends       FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_join_req"      ON join_requests  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_proj_likes"    ON project_likes FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at    BEFORE UPDATE ON users    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER teams_updated_at    BEFORE UPDATE ON teams    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── POSTS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  post_type     VARCHAR(50) DEFAULT 'general',
  image_url     TEXT,
  link_metadata JSONB,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── POST REACTIONS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_reactions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(50) NOT NULL,
  UNIQUE(post_id, user_id)
);

-- ─── POST COMMENTS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_comments (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE posts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_posts"     ON posts          FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_reactions" ON post_reactions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_comments"  ON post_comments  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Triggers
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

