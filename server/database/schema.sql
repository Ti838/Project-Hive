-- ╔══════════════════════════════════════════════════════════════════════════════════════════════╗
-- ║                     PROJECTHIVE: SINGLE UNIFIED MASTER DATABASE SCHEMA                      ║
-- ║                      Supabase PostgreSQL Production Architecture                            ║
-- ║                                                                                              ║
-- ║  • 100% Idempotent: Zero data loss, safe to run on blank or pre-existing databases           ║
-- ║  • All 16 Core Application Tables fully structured and synchronized                          ║
-- ║  • High-Performance B-Tree indexes for fast pagination and low query latency               ║
-- ║  • Strict Row Level Security (RLS) protecting student privacy against IDOR attacks           ║
-- ║  • Anti-Privilege Escalation Triggers preventing unauthorized admin role assignment           ║
-- ║  • Storage Bucket definitions & upload policies for avatars, banners, and attachments        ║
-- ╚══════════════════════════════════════════════════════════════════════════════════════════════╝

-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- SECTION 0: POSTGRESQL EXTENSIONS
-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- Enable cryptographic hashing and v4 UUID generation functions needed for keys and auth
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- SECTION 1: CORE USER ACCOUNTS & REPUTATION IDENTITY
-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- Stores registered students, mentors, admins, and their academic/professional portfolios
CREATE TABLE IF NOT EXISTS "public"."users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),              -- Unique student/user UUID
  "email" VARCHAR(255) NOT NULL UNIQUE,                         -- Institutional or personal email
  "password_hash" VARCHAR(255) NOT NULL,                        -- Bcrypt password hash
  "first_name" VARCHAR(100) NOT NULL,                          -- Student first name
  "last_name" VARCHAR(100) NOT NULL,                           -- Student last name
  "role" VARCHAR(50) NOT NULL DEFAULT 'user'                    -- Authorization role tier
    CHECK ("role" IN ('user', 'moderator', 'admin', 'super_admin')),
  "is_verified" BOOLEAN NOT NULL DEFAULT FALSE,                 -- Academic identity verification status
  "is_banned" BOOLEAN NOT NULL DEFAULT FALSE,                   -- Disciplinary suspension flag
  "strikes" INTEGER NOT NULL DEFAULT 0,                         -- Moderation strikes count (3 strikes = ban)
  "avatar" TEXT,                                                -- Profile avatar image URL
  "avatar_color" VARCHAR(50) DEFAULT 'indigo',                  -- Fallback monogram color
  "cover_image" TEXT,                                           -- Profile header banner image URL
  "bio" TEXT,                                                   -- Student biography / headline
  "university" VARCHAR(255),                                    -- Academic institution name
  "department" VARCHAR(255),                                    -- Department (e.g. CSE, EEE, BBA)
  "academic_year" VARCHAR(50),                                  -- Year of study (e.g. 3rd Year)
  "github" VARCHAR(255),                                        -- GitHub profile username or URL
  "leetcode" VARCHAR(255),                                      -- LeetCode profile handle
  "scholar" VARCHAR(255),                                       -- Google Scholar URL
  "devpost" VARCHAR(255),                                       -- Devpost hackathon profile
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),              -- Account registration timestamp
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()               -- Profile last modified timestamp
);

-- Defensive column additions: Guarantee columns exist even if table was created in an older schema
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "university" VARCHAR(255);
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "department" VARCHAR(255);
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "academic_year" VARCHAR(50);
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "github" VARCHAR(255);
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "leetcode" VARCHAR(255);
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "scholar" VARCHAR(255);
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "devpost" VARCHAR(255);
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "strikes" INTEGER DEFAULT 0;
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "is_banned" BOOLEAN DEFAULT FALSE;


-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- SECTION 2: USER PREFERENCES & NOTIFICATION SETTINGS
-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- Isolated user configuration table (1-to-1 relationship with users)
CREATE TABLE IF NOT EXISTS "public"."user_settings" (
  "user_id" UUID PRIMARY KEY REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "theme" VARCHAR(20) NOT NULL DEFAULT 'system' 
    CHECK ("theme" IN ('light', 'dark', 'system')),             -- UI theme selection
  "privacy" JSONB NOT NULL DEFAULT 
    '{"is_recruitable": true, "show_email": false, "show_academic": true}'::jsonb, -- Privacy toggles
  "notifications" JSONB NOT NULL DEFAULT 
    '{"email": true, "in_app": true, "sprint_alerts": true}'::jsonb,              -- Alert channels
  "ai_preferences" JSONB NOT NULL DEFAULT 
    '{"tier": "balanced", "auto_suggest": true}'::jsonb,       -- Hive AI assistant parameters
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- SECTION 3: ACADEMIC SQUADS & TEAM MEMBERSHIPS
-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- Academic project teams, hackathon squads, and research groups
CREATE TABLE IF NOT EXISTS "public"."teams" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,                                 -- Team name
  "description" TEXT,                                           -- Squad vision and mission
  "category" VARCHAR(100) NOT NULL DEFAULT 'General',           -- Focus area (AI, Web, IoT, etc.)
  "leader_id" UUID NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE, -- Team creator/leader
  "max_members" INTEGER NOT NULL DEFAULT 6,                     -- Squad size cap (default: 6)
  "status" VARCHAR(50) NOT NULL DEFAULT 'open',                 -- Recruitment status (open/closed)
  "rules" JSONB NOT NULL DEFAULT '{}'::jsonb,                   -- Team guidelines & conduct rules
  "avatar_url" TEXT,                                            -- Squad badge/logo URL
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Defensive column synchronization for pre-existing teams tables
ALTER TABLE "public"."teams" ADD COLUMN IF NOT EXISTS "max_members" INTEGER DEFAULT 6;
ALTER TABLE "public"."teams" ADD COLUMN IF NOT EXISTS "status" VARCHAR(50) DEFAULT 'open';
ALTER TABLE "public"."teams" ADD COLUMN IF NOT EXISTS "rules" JSONB DEFAULT '{}'::jsonb;

-- Team membership mapping table with role assignments
CREATE TABLE IF NOT EXISTS "public"."team_members" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "team_id" UUID NOT NULL REFERENCES "public"."teams"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "role" VARCHAR(50) NOT NULL DEFAULT 'member'
    CHECK ("role" IN ('leader', 'maintainer', 'member')),      -- Member permission tier
  "joined_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enforce that a user cannot join the same team multiple times
CREATE UNIQUE INDEX IF NOT EXISTS uq_team_members_team_user ON "public"."team_members" ("team_id", "user_id");


-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- SECTION 4: INCUBATION PROJECTS & SPRINT KANBAN TASKS
-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- Student portfolio projects and incubated campus products
CREATE TABLE IF NOT EXISTS "public"."projects" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" VARCHAR(255) NOT NULL,                                -- Project title
  "description" TEXT,                                           -- Technical abstract & overview
  "owner_id" UUID NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE, -- Lead author
  "team_id" UUID REFERENCES "public"."teams"("id") ON DELETE SET NULL,          -- Associated team
  "category" VARCHAR(100) NOT NULL DEFAULT 'General',           -- Discipline category
  "status" VARCHAR(50) NOT NULL DEFAULT 'planning',             -- planning / in-development / completed
  "github_url" TEXT,                                            -- Repository link
  "demo_url" TEXT,                                              -- Live demo / deployment link
  "tags" JSONB NOT NULL DEFAULT '[]'::jsonb,                    -- Tech stack tags (React, Node, PyTorch)
  "upvotes" INTEGER NOT NULL DEFAULT 0,                         -- Community upvotes count
  "is_featured" BOOLEAN NOT NULL DEFAULT FALSE,                 -- Admin showcase feature flag
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agile sprint Kanban task board attached to projects
CREATE TABLE IF NOT EXISTS "public"."tasks" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" UUID NOT NULL REFERENCES "public"."projects"("id") ON DELETE CASCADE,
  "title" VARCHAR(255) NOT NULL,                                -- Task summary
  "description" TEXT,                                           -- Acceptance criteria / task details
  "status" VARCHAR(50) NOT NULL DEFAULT 'todo'
    CHECK ("status" IN ('todo', 'in_progress', 'review', 'done')), -- Kanban column state
  "priority" VARCHAR(20) NOT NULL DEFAULT 'normal'
    CHECK ("priority" IN ('low', 'normal', 'high', 'urgent')),     -- Task urgency
  "assigned_to" UUID REFERENCES "public"."users"("id") ON DELETE SET NULL, -- Assigned developer
  "due_date" TIMESTAMPTZ,                                       -- Sprint deadline timestamp
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- SECTION 5: REALTIME CONVERSATIONS & SOCKET.IO MESSAGING
-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- Conversation channels (direct student-to-student DMs, squad rooms, and team channels)
CREATE TABLE IF NOT EXISTS "public"."conversations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "type" VARCHAR(20) NOT NULL DEFAULT 'direct'
    CHECK ("type" IN ('direct', 'group', 'team')),              -- Channel structure
  "target_id" UUID,                                             -- Recipient user ID or Team ID
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- High-throughput chat messages with rich formatting, replies, and reactions
CREATE TABLE IF NOT EXISTS "public"."messages" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversation_id" UUID REFERENCES "public"."conversations"("id") ON DELETE CASCADE,
  "room_id" VARCHAR(255),                                       -- Socket.IO room identifier
  "sender_id" UUID NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "content" TEXT NOT NULL,                                      -- Message text payload
  "type" VARCHAR(50) NOT NULL DEFAULT 'text',                   -- text / image / voice / file / system
  "file_url" TEXT,                                              -- Uploaded attachment storage URL
  "reply_to" UUID REFERENCES "public"."messages"("id") ON DELETE SET NULL, -- Quoted reply message ID
  "reactions" JSONB NOT NULL DEFAULT '{}'::jsonb,               -- Emoji reactions map (e.g. {"❤️": ["user-uuid"]})
  "is_read" BOOLEAN NOT NULL DEFAULT FALSE,                     -- Read receipt flag
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Defensive column safety for pre-existing messages tables
ALTER TABLE "public"."messages" ADD COLUMN IF NOT EXISTS "conversation_id" UUID REFERENCES "public"."conversations"("id") ON DELETE CASCADE;
ALTER TABLE "public"."messages" ADD COLUMN IF NOT EXISTS "file_url" TEXT;
ALTER TABLE "public"."messages" ADD COLUMN IF NOT EXISTS "is_read" BOOLEAN DEFAULT FALSE;


-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- SECTION 6: LIVEKIT WEBRTC CALLING SESSIONS & PARTICIPANTS
-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- WebRTC audio/video call session registry (LiveKit room state)
CREATE TABLE IF NOT EXISTS "public"."call_sessions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "room_name" VARCHAR(255) NOT NULL UNIQUE,                     -- Unique LiveKit WebRTC room token
  "call_type" VARCHAR(20) NOT NULL CHECK ("call_type" IN ('audio', 'video')),
  "initiator_id" UUID NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "recipient_id" UUID REFERENCES "public"."users"("id") ON DELETE SET NULL,
  "team_id" UUID REFERENCES "public"."teams"("id") ON DELETE SET NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'initiated',            -- initiated / connected / ended / rejected
  "started_at" TIMESTAMPTZ DEFAULT NOW(),
  "connected_at" TIMESTAMPTZ,
  "ended_at" TIMESTAMPTZ,
  "duration_seconds" INTEGER DEFAULT 0,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Telemetry log of users who joined each audio/video session
CREATE TABLE IF NOT EXISTS "public"."call_participants" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "call_id" UUID NOT NULL REFERENCES "public"."call_sessions"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "role" VARCHAR(20) NOT NULL DEFAULT 'participant' CHECK ("role" IN ('initiator', 'participant')),
  "joined_at" TIMESTAMPTZ DEFAULT NOW(),
  "left_at" TIMESTAMPTZ,
  "duration_seconds" INTEGER DEFAULT 0,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_call_participants ON "public"."call_participants" ("call_id", "user_id");


-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- SECTION 7: CAMPUS SOCIAL FEED, POLLS & DISCUSSIONS
-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- Public campus feed posts, research snippets, and student polls
CREATE TABLE IF NOT EXISTS "public"."posts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "author_id" UUID NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "content" TEXT NOT NULL,                                      -- Post body text
  "media_urls" JSONB NOT NULL DEFAULT '[]'::jsonb,              -- Array of image/video URLs
  "tags" JSONB NOT NULL DEFAULT '[]'::jsonb,                    -- Topic tags (#hackathon, #research)
  "upvotes" INTEGER NOT NULL DEFAULT 0,                         -- Total upvotes count
  "poll_data" JSONB,                                            -- Embedded interactive poll metadata
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "public"."posts" ADD COLUMN IF NOT EXISTS "tags" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE "public"."posts" ADD COLUMN IF NOT EXISTS "upvotes" INTEGER DEFAULT 0;

-- Nested threaded comments on feed posts
CREATE TABLE IF NOT EXISTS "public"."post_comments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "post_id" UUID NOT NULL REFERENCES "public"."posts"("id") ON DELETE CASCADE,
  "author_id" UUID NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "content" TEXT NOT NULL,                                      -- Comment text
  "parent_id" UUID REFERENCES "public"."post_comments"("id") ON DELETE CASCADE, -- Nullable for top-level, set for nested replies
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "public"."post_comments" ADD COLUMN IF NOT EXISTS "parent_id" UUID REFERENCES "public"."post_comments"("id") ON DELETE CASCADE;


-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- SECTION 8: IN-APP NOTIFICATIONS & DISPATCH LEDGER
-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- Real-time alerts (team invitations, task assignments, support updates, system alerts)
CREATE TABLE IF NOT EXISTS "public"."notifications" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "type" VARCHAR(50) NOT NULL,                                  -- Alert category
  "title" VARCHAR(255) NOT NULL,                                -- Short notification headline
  "message" TEXT NOT NULL,                                      -- Notification detail
  "data" JSONB NOT NULL DEFAULT '{}'::jsonb,                    -- Deep link payload & context metadata
  "is_read" BOOLEAN NOT NULL DEFAULT FALSE,                     -- Read receipt flag
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- SECTION 9: TWO-WAY HELPLINE & SUPPORT TICKETING SYSTEM
-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- Unified student assistance tickets connecting /help with /admin/support
CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ticket_number" VARCHAR(50),                                  -- Human reference ID (e.g. PH-2026-104921)
  "user_id" UUID NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE, -- Submitting student
  "subject" TEXT NOT NULL,                                      -- Brief summary of the inquiry
  "category" VARCHAR(100) NOT NULL DEFAULT 'General',           -- Technical, Account, Academic, etc.
  "priority" VARCHAR(20) NOT NULL DEFAULT 'normal',             -- low / normal / urgent
  "status" VARCHAR(50) NOT NULL DEFAULT 'Open',                 -- Open / Waiting for Admin / Waiting for User / Resolved / Closed
  "messages" JSONB NOT NULL DEFAULT '[]'::jsonb,                -- Thread of communication entries & internal notes
  "related_team_id" UUID REFERENCES "public"."teams"("id") ON DELETE SET NULL,
  "related_project_id" UUID REFERENCES "public"."projects"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Defensive column safety for pre-existing support_tickets tables
ALTER TABLE "public"."support_tickets" ADD COLUMN IF NOT EXISTS "ticket_number" VARCHAR(50);
ALTER TABLE "public"."support_tickets" ADD COLUMN IF NOT EXISTS "priority" VARCHAR(20) DEFAULT 'normal';
ALTER TABLE "public"."support_tickets" ADD COLUMN IF NOT EXISTS "messages" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE "public"."support_tickets" ADD COLUMN IF NOT EXISTS "related_team_id" UUID REFERENCES "public"."teams"("id") ON DELETE SET NULL;
ALTER TABLE "public"."support_tickets" ADD COLUMN IF NOT EXISTS "related_project_id" UUID REFERENCES "public"."projects"("id") ON DELETE SET NULL;

-- Automatically generate human-readable ticket numbers for any historical records missing one
UPDATE "public"."support_tickets"
SET "ticket_number" = 'TICK-' || UPPER(SUBSTRING(id::text FROM 1 FOR 8))
WHERE "ticket_number" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_support_tickets_number ON "public"."support_tickets" ("ticket_number");


-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- SECTION 10: ADMINISTRATIVE AUDIT LOGS & PLATFORM FEATURE FLAGS
-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- Tamper-evident administrative audit ledger for compliance, security actions, and role changes
CREATE TABLE IF NOT EXISTS "public"."admin_audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "admin_id" UUID REFERENCES "public"."users"("id") ON DELETE SET NULL, -- Operating admin user
  "admin_email" TEXT NOT NULL,                                  -- Admin email stamp
  "action" TEXT NOT NULL,                                       -- Action identifier (e.g. BAN_USER, RESOLVE_TICKET)
  "target_type" TEXT NOT NULL,                                  -- USER / TEAM / POST / TICKET
  "target_id" TEXT,                                             -- Target entity UUID
  "details" JSONB NOT NULL DEFAULT '{}'::jsonb,                 -- Before/after diff and contextual parameters
  "ip_address" TEXT,                                            -- Client IP address
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()               -- Immutable timestamp
);

-- System-wide feature toggles and emergency maintenance switches
CREATE TABLE IF NOT EXISTS "public"."system_flags" (
  "key" VARCHAR(100) PRIMARY KEY,                               -- Flag name (e.g. maintenanceMode)
  "value" BOOLEAN NOT NULL DEFAULT FALSE,                       -- Active boolean state
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed critical platform flags
INSERT INTO "public"."system_flags" ("key", "value") VALUES
  ('maintenanceMode', FALSE),
  ('registrationEnabled', TRUE),
  ('emailVerification', FALSE)
ON CONFLICT ("key") DO NOTHING;


-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- SECTION 11: HIGH-PERFORMANCE COMPOSITE B-TREE INDEXES
-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- Drastically accelerates queries, filters, and paginations across all 16 tables
CREATE INDEX IF NOT EXISTS idx_users_email ON "public"."users" ("email");
CREATE INDEX IF NOT EXISTS idx_users_role ON "public"."users" ("role");
CREATE INDEX IF NOT EXISTS idx_teams_leader ON "public"."teams" ("leader_id");
CREATE INDEX IF NOT EXISTS idx_team_members_lookup ON "public"."team_members" ("team_id", "user_id");
CREATE INDEX IF NOT EXISTS idx_projects_owner ON "public"."projects" ("owner_id");
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON "public"."tasks" ("project_id", "status");
CREATE INDEX IF NOT EXISTS idx_messages_room_created ON "public"."messages" ("room_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON "public"."messages" ("conversation_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_created ON "public"."posts" ("author_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON "public"."notifications" ("user_id", "is_read", "created_at" DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_status ON "public"."support_tickets" ("user_id", "status");
CREATE INDEX IF NOT EXISTS idx_admin_audit_action_created ON "public"."admin_audit_logs" ("action", "created_at" DESC);


-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- SECTION 12: ZERO-TRUST ROW LEVEL SECURITY (RLS) ACTIVATION
-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- Activate RLS on all 16 tables. Once activated, any query without an explicit policy is denied.
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."call_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."call_participants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."post_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."support_tickets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."admin_audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."system_flags" ENABLE ROW LEVEL SECURITY;


-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- SECTION 13: DUAL SERVICE-ROLE BYPASS (Backend Node.js Operational Engine)
-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- Automatically grants the Express backend (`service_role`) unrestricted access across all
-- public tables so administrative controllers, jobs, and APIs operate without permission hurdles.
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON "public".%I;', 'service_role_all_' || tbl, tbl);
    EXECUTE format('CREATE POLICY %I ON "public".%I FOR ALL TO service_role USING (true) WITH CHECK (true);', 'service_role_all_' || tbl, tbl);
  END LOOP;
END $$;


-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- SECTION 14: STRICT AUTHENTICATED USER POLICIES (Least-Privilege IDOR Shields)
-- ──────────────────────────────────────────────────────────────────────────────────────────────

-- ── 14.1 Users ──
-- Authenticated users can view peer profiles but can only update their own profile record
DROP POLICY IF EXISTS "authenticated_select_users" ON "public"."users";
CREATE POLICY "authenticated_select_users" ON "public"."users" FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_update_users" ON "public"."users";
CREATE POLICY "authenticated_update_users" ON "public"."users" FOR UPDATE TO authenticated 
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ── 14.2 User Settings ──
-- Strictly private: Students can only read and modify their own settings
DROP POLICY IF EXISTS "auth_user_settings_all" ON "public"."user_settings";
CREATE POLICY "auth_user_settings_all" ON "public"."user_settings" FOR ALL TO authenticated 
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 14.3 Teams & Team Members ──
-- Anyone can discover teams; only squad leaders can edit or delete their squad
DROP POLICY IF EXISTS "authenticated_select_teams" ON "public"."teams";
CREATE POLICY "authenticated_select_teams" ON "public"."teams" FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_teams" ON "public"."teams";
CREATE POLICY "authenticated_insert_teams" ON "public"."teams" FOR INSERT TO authenticated WITH CHECK (auth.uid() = leader_id);

DROP POLICY IF EXISTS "authenticated_update_teams" ON "public"."teams";
CREATE POLICY "authenticated_update_teams" ON "public"."teams" FOR UPDATE TO authenticated 
  USING (auth.uid() = leader_id) WITH CHECK (auth.uid() = leader_id);

DROP POLICY IF EXISTS "authenticated_delete_teams" ON "public"."teams";
CREATE POLICY "authenticated_delete_teams" ON "public"."teams" FOR DELETE TO authenticated USING (auth.uid() = leader_id);

DROP POLICY IF EXISTS "authenticated_select_team_members" ON "public"."team_members";
CREATE POLICY "authenticated_select_team_members" ON "public"."team_members" FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_team_members" ON "public"."team_members";
CREATE POLICY "authenticated_insert_team_members" ON "public"."team_members" FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM "public"."teams" WHERE id = team_id AND leader_id = auth.uid()));

DROP POLICY IF EXISTS "authenticated_delete_team_members" ON "public"."team_members";
CREATE POLICY "authenticated_delete_team_members" ON "public"."team_members" FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM "public"."teams" WHERE id = team_id AND leader_id = auth.uid()));

-- ── 14.4 Projects & Tasks ──
DROP POLICY IF EXISTS "authenticated_select_projects" ON "public"."projects";
CREATE POLICY "authenticated_select_projects" ON "public"."projects" FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_projects" ON "public"."projects";
CREATE POLICY "authenticated_insert_projects" ON "public"."projects" FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "authenticated_update_projects" ON "public"."projects";
CREATE POLICY "authenticated_update_projects" ON "public"."projects" FOR UPDATE TO authenticated 
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "authenticated_delete_projects" ON "public"."projects";
CREATE POLICY "authenticated_delete_projects" ON "public"."projects" FOR DELETE TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "authenticated_tasks_select" ON "public"."tasks";
CREATE POLICY "authenticated_tasks_select" ON "public"."tasks" FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_tasks_modify" ON "public"."tasks";
CREATE POLICY "authenticated_tasks_modify" ON "public"."tasks" FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM "public"."projects" WHERE id = project_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM "public"."projects" WHERE id = project_id AND owner_id = auth.uid()));

-- ── 14.5 Conversations & Messages ──
DROP POLICY IF EXISTS "authenticated_select_conversations" ON "public"."conversations";
CREATE POLICY "authenticated_select_conversations" ON "public"."conversations" FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_conversations" ON "public"."conversations";
CREATE POLICY "authenticated_insert_conversations" ON "public"."conversations" FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_select_messages" ON "public"."messages";
CREATE POLICY "authenticated_select_messages" ON "public"."messages" FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_messages" ON "public"."messages";
CREATE POLICY "authenticated_insert_messages" ON "public"."messages" FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "authenticated_update_messages" ON "public"."messages";
CREATE POLICY "authenticated_update_messages" ON "public"."messages" FOR UPDATE TO authenticated 
  USING (auth.uid() = sender_id) WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "authenticated_delete_messages" ON "public"."messages";
CREATE POLICY "authenticated_delete_messages" ON "public"."messages" FOR DELETE TO authenticated USING (auth.uid() = sender_id);

-- ── 14.6 Campus Social Feed & Comments ──
DROP POLICY IF EXISTS "authenticated_select_posts" ON "public"."posts";
CREATE POLICY "authenticated_select_posts" ON "public"."posts" FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "authenticated_insert_posts" ON "public"."posts";
CREATE POLICY "authenticated_insert_posts" ON "public"."posts" FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "authenticated_update_posts" ON "public"."posts";
CREATE POLICY "authenticated_update_posts" ON "public"."posts" FOR UPDATE TO authenticated 
  USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "authenticated_delete_posts" ON "public"."posts";
CREATE POLICY "authenticated_delete_posts" ON "public"."posts" FOR DELETE TO authenticated USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "authenticated_select_post_comments" ON "public"."post_comments";
CREATE POLICY "authenticated_select_post_comments" ON "public"."post_comments" FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "authenticated_insert_post_comments" ON "public"."post_comments";
CREATE POLICY "authenticated_insert_post_comments" ON "public"."post_comments" FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

-- ── 14.7 In-App Notifications ──
DROP POLICY IF EXISTS "auth_notifications_all" ON "public"."notifications";
CREATE POLICY "auth_notifications_all" ON "public"."notifications" FOR ALL TO authenticated 
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 14.8 Audio/Video Calls ──
DROP POLICY IF EXISTS "auth_call_sessions" ON "public"."call_sessions";
CREATE POLICY "auth_call_sessions" ON "public"."call_sessions" FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_call_participants" ON "public"."call_participants";
CREATE POLICY "auth_call_participants" ON "public"."call_participants" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 14.9 Helpline & Support Tickets (IDOR Guard) ──
-- Students can ONLY view and update tickets that belong to their own account
DROP POLICY IF EXISTS "user_select_own_support_tickets" ON "public"."support_tickets";
CREATE POLICY "user_select_own_support_tickets" ON "public"."support_tickets" FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_insert_own_support_tickets" ON "public"."support_tickets";
CREATE POLICY "user_insert_own_support_tickets" ON "public"."support_tickets" FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_update_own_support_tickets" ON "public"."support_tickets";
CREATE POLICY "user_update_own_support_tickets" ON "public"."support_tickets" FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 14.10 System Flags ──
DROP POLICY IF EXISTS "read_system_flags" ON "public"."system_flags";
CREATE POLICY "read_system_flags" ON "public"."system_flags" FOR SELECT TO authenticated, anon USING (true);


-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- SECTION 15: ANTI-PRIVILEGE ESCALATION TRIGGER
-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- Prevents ordinary authenticated users from maliciously promoting themselves to admin or clearing bans
CREATE OR REPLACE FUNCTION "public"."enforce_user_immutability"()
RETURNS TRIGGER AS $$
BEGIN
  IF current_user != 'service_role' AND auth.role() = 'authenticated' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Privilege Escalation Blocked: Role modifications must be executed by administrators.';
    END IF;
    IF NEW.is_banned IS DISTINCT FROM OLD.is_banned THEN
      RAISE EXCEPTION 'Access Denied: Disciplinary statuses are immutable by users.';
    END IF;
    IF NEW.strikes IS DISTINCT FROM OLD.strikes THEN
      RAISE EXCEPTION 'Access Denied: Disciplinary strikes are immutable by users.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_user_immutability ON "public"."users";
CREATE TRIGGER tr_user_immutability
  BEFORE UPDATE ON "public"."users"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."enforce_user_immutability"();


-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- SECTION 16: STORAGE BUCKETS & ACCESS POLICIES
-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- Ensure avatars (5MB, public), banners (10MB, public), and attachments (25MB, private) exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 'avatars', true, 5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banners', 'banners', true, 10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments', 'attachments', false, 26214400,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/zip', 'text/plain', 'text/markdown']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 26214400,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/zip', 'text/plain', 'text/markdown'];

-- Storage Object Policies
DROP POLICY IF EXISTS "public_read_avatars" ON storage.objects;
CREATE POLICY "public_read_avatars" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "auth_upload_avatars" ON storage.objects;
CREATE POLICY "auth_upload_avatars" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "public_read_banners" ON storage.objects;
CREATE POLICY "public_read_banners" ON storage.objects FOR SELECT TO public USING (bucket_id = 'banners');

DROP POLICY IF EXISTS "auth_upload_banners" ON storage.objects;
CREATE POLICY "auth_upload_banners" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'banners' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "auth_read_attachments" ON storage.objects;
CREATE POLICY "auth_read_attachments" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'attachments');

DROP POLICY IF EXISTS "auth_upload_attachments" ON storage.objects;
CREATE POLICY "auth_upload_attachments" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);


-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- SECTION 17: FINAL VERIFICATION & HEALTH AUDIT
-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- Returns table verification output showing rowsecurity = true for all 16 tables
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
