-- ─── PATCH DISCOVERY & COMMUNITIES (LinkedIn & Discord Standards) ─────────────
-- Enhances teams table for dual Squad & Community support, expands team_members roles,
-- and adds performance indexes for student discovery searches.

-- 1. TEAMS EXTENSIONS (SQUADS & COMMUNITIES)
DO $$
BEGIN
  -- avatar_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE teams ADD COLUMN avatar_url TEXT DEFAULT NULL;
  END IF;

  -- banner_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'banner_url'
  ) THEN
    ALTER TABLE teams ADD COLUMN banner_url TEXT DEFAULT NULL;
  END IF;

  -- type: 'team' (squad) | 'community' (guild/club)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'type'
  ) THEN
    ALTER TABLE teams ADD COLUMN type VARCHAR(30) DEFAULT 'team';
  END IF;

  -- rules / guidelines
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'rules'
  ) THEN
    ALTER TABLE teams ADD COLUMN rules TEXT DEFAULT NULL;
  END IF;
END $$;

-- 2. TEAM MEMBERS ROLE EXTENSION (LEADER, MODERATOR, MEMBER)
DO $$
BEGIN
  -- Drop existing check constraint if present and re-create with 'moderator'
  ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_role_check;
  ALTER TABLE team_members ADD CONSTRAINT team_members_role_check
    CHECK (role IN ('leader', 'moderator', 'member'));
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- 3. DISCOVERY & FACETED SEARCH INDEXES
CREATE INDEX IF NOT EXISTS idx_users_university ON users(university);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_major ON users(major);
CREATE INDEX IF NOT EXISTS idx_users_year_of_study ON users(year_of_study);
CREATE INDEX IF NOT EXISTS idx_skills_user_name ON skills(user_id, LOWER(name));
CREATE INDEX IF NOT EXISTS idx_teams_type_open ON teams(type, is_open);
CREATE INDEX IF NOT EXISTS idx_join_requests_user_status ON join_requests(user_id, status);
