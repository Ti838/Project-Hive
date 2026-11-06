-- ╔══════════════════════════════════════════════════════════════════════════════════════╗
-- ║  PROJECTHIVE: ALL-IN-ONE MASTER PRODUCTION DATABASE & SECURITY HARDENING ENGINE   ║
-- ║  Platform: Supabase PostgreSQL Singapore Cluster                                   ║
-- ║  Execution Mode: 100% Idempotent (Zero Data Loss, Safe on Pre-existing Tables)    ║
-- ║  Guarantees: Tables, Foreign Keys, B-Tree Indexes, RLS, Trigger & Storage Security ║
-- ╚══════════════════════════════════════════════════════════════════════════════════════╝

-- ─── 0. EXTENSIONS ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. CORE USER ACCOUNTS & REPUTATION IDENTITY ──────────────────────────────
CREATE TABLE IF NOT EXISTS "public"."users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "password_hash" VARCHAR(255) NOT NULL,
  "first_name" VARCHAR(100) NOT NULL,
  "last_name" VARCHAR(100) NOT NULL,
  "role" VARCHAR(50) NOT NULL DEFAULT 'user' CHECK ("role" IN ('user', 'moderator', 'admin', 'super_admin')),
  "is_verified" BOOLEAN NOT NULL DEFAULT FALSE,
  "is_banned" BOOLEAN NOT NULL DEFAULT FALSE,
  "strikes" INTEGER NOT NULL DEFAULT 0,
  "avatar" TEXT,
  "avatar_color" VARCHAR(50) DEFAULT 'indigo',
  "cover_image" TEXT,
  "bio" TEXT,
  "university" VARCHAR(255),
  "department" VARCHAR(255),
  "academic_year" VARCHAR(50),
  "github" VARCHAR(255),
  "leetcode" VARCHAR(255),
  "scholar" VARCHAR(255),
  "devpost" VARCHAR(255),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all verified identity columns exist if table was previously created
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "github" VARCHAR(255);
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "leetcode" VARCHAR(255);
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "scholar" VARCHAR(255);
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "devpost" VARCHAR(255);
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "strikes" INTEGER DEFAULT 0;
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "is_banned" BOOLEAN DEFAULT FALSE;

-- ─── 2. USER SETTINGS & PREFERENCES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "public"."user_settings" (
  "user_id" UUID PRIMARY KEY REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "theme" VARCHAR(20) NOT NULL DEFAULT 'system' CHECK ("theme" IN ('light', 'dark', 'system')),
  "privacy" JSONB NOT NULL DEFAULT '{"is_recruitable": true, "show_email": false, "show_academic": true}'::jsonb,
  "notifications" JSONB NOT NULL DEFAULT '{"email": true, "in_app": true, "sprint_alerts": true}'::jsonb,
  "ai_preferences" JSONB NOT NULL DEFAULT '{"tier": "balanced", "auto_suggest": true}'::jsonb,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 3. ACADEMIC SQUADS & TEAMS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "public"."teams" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "category" VARCHAR(100) NOT NULL DEFAULT 'General',
  "leader_id" UUID NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "max_members" INTEGER NOT NULL DEFAULT 6,
  "status" VARCHAR(50) NOT NULL DEFAULT 'open',
  "rules" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "avatar_url" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Column safety for pre-existing teams table
ALTER TABLE "public"."teams" ADD COLUMN IF NOT EXISTS "max_members" INTEGER DEFAULT 6;
ALTER TABLE "public"."teams" ADD COLUMN IF NOT EXISTS "status" VARCHAR(50) DEFAULT 'open';
ALTER TABLE "public"."teams" ADD COLUMN IF NOT EXISTS "rules" JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS "public"."team_members" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "team_id" UUID NOT NULL REFERENCES "public"."teams"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "role" VARCHAR(50) NOT NULL DEFAULT 'member' CHECK ("role" IN ('leader', 'maintainer', 'member')),
  "joined_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_team_members_team_user ON "public"."team_members" ("team_id", "user_id");

-- ─── 4. INCUBATION PROJECTS & SPRINT WORKSPACES ──────────────────────────────
CREATE TABLE IF NOT EXISTS "public"."projects" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "owner_id" UUID NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "team_id" UUID REFERENCES "public"."teams"("id") ON DELETE SET NULL,
  "category" VARCHAR(100) NOT NULL DEFAULT 'General',
  "status" VARCHAR(50) NOT NULL DEFAULT 'planning',
  "github_url" TEXT,
  "demo_url" TEXT,
  "tags" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "upvotes" INTEGER NOT NULL DEFAULT 0,
  "is_featured" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "public"."tasks" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" UUID NOT NULL REFERENCES "public"."projects"("id") ON DELETE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "status" VARCHAR(50) NOT NULL DEFAULT 'todo' CHECK ("status" IN ('todo', 'in_progress', 'review', 'done')),
  "priority" VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK ("priority" IN ('low', 'normal', 'high', 'urgent')),
  "assigned_to" UUID REFERENCES "public"."users"("id") ON DELETE SET NULL,
  "due_date" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 5. REALTIME CONVERSATIONS & MESSAGING ────────────────────────────────────
CREATE TABLE IF NOT EXISTS "public"."conversations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "type" VARCHAR(20) NOT NULL DEFAULT 'direct' CHECK ("type" IN ('direct', 'group', 'team')),
  "target_id" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "public"."messages" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversation_id" UUID REFERENCES "public"."conversations"("id") ON DELETE CASCADE,
  "room_id" VARCHAR(255),
  "sender_id" UUID NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "content" TEXT NOT NULL,
  "type" VARCHAR(50) NOT NULL DEFAULT 'text',
  "file_url" TEXT,
  "reply_to" UUID REFERENCES "public"."messages"("id") ON DELETE SET NULL,
  "reactions" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "is_read" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Column safety for pre-existing messages table
ALTER TABLE "public"."messages" ADD COLUMN IF NOT EXISTS "conversation_id" UUID REFERENCES "public"."conversations"("id") ON DELETE CASCADE;
ALTER TABLE "public"."messages" ADD COLUMN IF NOT EXISTS "file_url" TEXT;
ALTER TABLE "public"."messages" ADD COLUMN IF NOT EXISTS "is_read" BOOLEAN DEFAULT FALSE;

-- ─── 6. LIVEKIT WEBRTC CALLING SESSIONS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS "public"."call_sessions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "room_name" VARCHAR(255) NOT NULL UNIQUE,
  "call_type" VARCHAR(20) NOT NULL CHECK ("call_type" IN ('audio', 'video')),
  "initiator_id" UUID NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "recipient_id" UUID REFERENCES "public"."users"("id") ON DELETE SET NULL,
  "team_id" UUID REFERENCES "public"."teams"("id") ON DELETE SET NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'initiated',
  "started_at" TIMESTAMPTZ DEFAULT NOW(),
  "connected_at" TIMESTAMPTZ,
  "ended_at" TIMESTAMPTZ,
  "duration_seconds" INTEGER DEFAULT 0,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

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

-- ─── 7. CAMPUS SOCIAL FEED & SHOWCASE ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "public"."posts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "author_id" UUID NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "content" TEXT NOT NULL,
  "media_urls" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "tags" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "upvotes" INTEGER NOT NULL DEFAULT 0,
  "poll_data" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "public"."posts" ADD COLUMN IF NOT EXISTS "tags" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE "public"."posts" ADD COLUMN IF NOT EXISTS "upvotes" INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS "public"."post_comments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "post_id" UUID NOT NULL REFERENCES "public"."posts"("id") ON DELETE CASCADE,
  "author_id" UUID NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "content" TEXT NOT NULL,
  "parent_id" UUID REFERENCES "public"."post_comments"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "public"."post_comments" ADD COLUMN IF NOT EXISTS "parent_id" UUID REFERENCES "public"."post_comments"("id") ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS "public"."notifications" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "type" VARCHAR(50) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "message" TEXT NOT NULL,
  "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "is_read" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 8. TWO-WAY HELPLINE & SUPPORT TICKETS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ticket_number" VARCHAR(50),
  "user_id" UUID NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "subject" TEXT NOT NULL,
  "category" VARCHAR(100) NOT NULL DEFAULT 'General',
  "priority" VARCHAR(20) NOT NULL DEFAULT 'normal',
  "status" VARCHAR(50) NOT NULL DEFAULT 'Open',
  "messages" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "related_team_id" UUID REFERENCES "public"."teams"("id") ON DELETE SET NULL,
  "related_project_id" UUID REFERENCES "public"."projects"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Column safety for pre-existing support_tickets table
ALTER TABLE "public"."support_tickets" ADD COLUMN IF NOT EXISTS "ticket_number" VARCHAR(50);
ALTER TABLE "public"."support_tickets" ADD COLUMN IF NOT EXISTS "priority" VARCHAR(20) DEFAULT 'normal';
ALTER TABLE "public"."support_tickets" ADD COLUMN IF NOT EXISTS "messages" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE "public"."support_tickets" ADD COLUMN IF NOT EXISTS "related_team_id" UUID REFERENCES "public"."teams"("id") ON DELETE SET NULL;
ALTER TABLE "public"."support_tickets" ADD COLUMN IF NOT EXISTS "related_project_id" UUID REFERENCES "public"."projects"("id") ON DELETE SET NULL;

-- Backfill ticket_number for any existing rows
UPDATE "public"."support_tickets"
SET "ticket_number" = 'TICK-' || UPPER(SUBSTRING(id::text FROM 1 FOR 8))
WHERE "ticket_number" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_support_tickets_number ON "public"."support_tickets" ("ticket_number");

-- ─── 9. ADMINISTRATIVE AUDIT LEDGER & SYSTEM FLAGS ────────────────────────────
CREATE TABLE IF NOT EXISTS "public"."admin_audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "admin_id" UUID REFERENCES "public"."users"("id") ON DELETE SET NULL,
  "admin_email" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "target_type" TEXT NOT NULL,
  "target_id" TEXT,
  "details" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "ip_address" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "public"."system_flags" (
  "key" VARCHAR(100) PRIMARY KEY,
  "value" BOOLEAN NOT NULL DEFAULT FALSE,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO "public"."system_flags" ("key", "value") VALUES
  ('maintenanceMode', FALSE),
  ('registrationEnabled', TRUE),
  ('emailVerification', FALSE)
ON CONFLICT ("key") DO NOTHING;

-- ─── 10. HIGH-PERFORMANCE COMPOSITE B-TREE INDEXES ────────────────────────────
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

-- ─── 11. ROW LEVEL SECURITY (RLS) ACTIVATION ───────────────────────────────────
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

-- ─── 12. DUAL SERVICE-ROLE BYPASS (Backend Node.js Operational Engine) ────────
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

-- ─── 13. SECURE AUTHENTICATED USER POLICIES ────────────────────────────────────

-- USERS
DROP POLICY IF EXISTS "authenticated_select_users" ON "public"."users";
CREATE POLICY "authenticated_select_users" ON "public"."users" FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_update_users" ON "public"."users";
CREATE POLICY "authenticated_update_users" ON "public"."users" FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- USER SETTINGS
DROP POLICY IF EXISTS "auth_user_settings_all" ON "public"."user_settings";
CREATE POLICY "auth_user_settings_all" ON "public"."user_settings" FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- TEAMS
DROP POLICY IF EXISTS "authenticated_select_teams" ON "public"."teams";
CREATE POLICY "authenticated_select_teams" ON "public"."teams" FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_teams" ON "public"."teams";
CREATE POLICY "authenticated_insert_teams" ON "public"."teams" FOR INSERT TO authenticated WITH CHECK (auth.uid() = leader_id);

DROP POLICY IF EXISTS "authenticated_update_teams" ON "public"."teams";
CREATE POLICY "authenticated_update_teams" ON "public"."teams" FOR UPDATE TO authenticated USING (auth.uid() = leader_id) WITH CHECK (auth.uid() = leader_id);

DROP POLICY IF EXISTS "authenticated_delete_teams" ON "public"."teams";
CREATE POLICY "authenticated_delete_teams" ON "public"."teams" FOR DELETE TO authenticated USING (auth.uid() = leader_id);

-- TEAM MEMBERS
DROP POLICY IF EXISTS "authenticated_select_team_members" ON "public"."team_members";
CREATE POLICY "authenticated_select_team_members" ON "public"."team_members" FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_team_members" ON "public"."team_members";
CREATE POLICY "authenticated_insert_team_members" ON "public"."team_members" FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM "public"."teams" WHERE id = team_id AND leader_id = auth.uid()));

DROP POLICY IF EXISTS "authenticated_delete_team_members" ON "public"."team_members";
CREATE POLICY "authenticated_delete_team_members" ON "public"."team_members" FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM "public"."teams" WHERE id = team_id AND leader_id = auth.uid()));

-- PROJECTS
DROP POLICY IF EXISTS "authenticated_select_projects" ON "public"."projects";
CREATE POLICY "authenticated_select_projects" ON "public"."projects" FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_projects" ON "public"."projects";
CREATE POLICY "authenticated_insert_projects" ON "public"."projects" FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "authenticated_update_projects" ON "public"."projects";
CREATE POLICY "authenticated_update_projects" ON "public"."projects" FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "authenticated_delete_projects" ON "public"."projects";
CREATE POLICY "authenticated_delete_projects" ON "public"."projects" FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- TASKS
DROP POLICY IF EXISTS "authenticated_tasks_select" ON "public"."tasks";
CREATE POLICY "authenticated_tasks_select" ON "public"."tasks" FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_tasks_modify" ON "public"."tasks";
CREATE POLICY "authenticated_tasks_modify" ON "public"."tasks" FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM "public"."projects" WHERE id = project_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM "public"."projects" WHERE id = project_id AND owner_id = auth.uid()));

-- CONVERSATIONS
DROP POLICY IF EXISTS "authenticated_select_conversations" ON "public"."conversations";
CREATE POLICY "authenticated_select_conversations" ON "public"."conversations" FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_conversations" ON "public"."conversations";
CREATE POLICY "authenticated_insert_conversations" ON "public"."conversations" FOR INSERT TO authenticated WITH CHECK (true);

-- MESSAGES
DROP POLICY IF EXISTS "authenticated_select_messages" ON "public"."messages";
CREATE POLICY "authenticated_select_messages" ON "public"."messages" FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_messages" ON "public"."messages";
CREATE POLICY "authenticated_insert_messages" ON "public"."messages" FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "authenticated_update_messages" ON "public"."messages";
CREATE POLICY "authenticated_update_messages" ON "public"."messages" FOR UPDATE TO authenticated USING (auth.uid() = sender_id) WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "authenticated_delete_messages" ON "public"."messages";
CREATE POLICY "authenticated_delete_messages" ON "public"."messages" FOR DELETE TO authenticated USING (auth.uid() = sender_id);

-- POSTS & COMMENTS
DROP POLICY IF EXISTS "authenticated_select_posts" ON "public"."posts";
CREATE POLICY "authenticated_select_posts" ON "public"."posts" FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "authenticated_insert_posts" ON "public"."posts";
CREATE POLICY "authenticated_insert_posts" ON "public"."posts" FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "authenticated_update_posts" ON "public"."posts";
CREATE POLICY "authenticated_update_posts" ON "public"."posts" FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "authenticated_delete_posts" ON "public"."posts";
CREATE POLICY "authenticated_delete_posts" ON "public"."posts" FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- POST COMMENTS
DROP POLICY IF EXISTS "authenticated_select_post_comments" ON "public"."post_comments";
CREATE POLICY "authenticated_select_post_comments" ON "public"."post_comments" FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "authenticated_insert_post_comments" ON "public"."post_comments";
CREATE POLICY "authenticated_insert_post_comments" ON "public"."post_comments" FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

-- NOTIFICATIONS
DROP POLICY IF EXISTS "auth_notifications_all" ON "public"."notifications";
CREATE POLICY "auth_notifications_all" ON "public"."notifications" FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CALLS
DROP POLICY IF EXISTS "auth_call_sessions" ON "public"."call_sessions";
CREATE POLICY "auth_call_sessions" ON "public"."call_sessions" FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_call_participants" ON "public"."call_participants";
CREATE POLICY "auth_call_participants" ON "public"."call_participants" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- SUPPORT TICKETS (Strict IDOR protection)
DROP POLICY IF EXISTS "user_select_own_support_tickets" ON "public"."support_tickets";
CREATE POLICY "user_select_own_support_tickets" ON "public"."support_tickets" FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_insert_own_support_tickets" ON "public"."support_tickets";
CREATE POLICY "user_insert_own_support_tickets" ON "public"."support_tickets" FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_update_own_support_tickets" ON "public"."support_tickets";
CREATE POLICY "user_update_own_support_tickets" ON "public"."support_tickets" FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SYSTEM FLAGS
DROP POLICY IF EXISTS "read_system_flags" ON "public"."system_flags";
CREATE POLICY "read_system_flags" ON "public"."system_flags" FOR SELECT TO authenticated, anon USING (true);

-- ─── 14. ANTI-PRIVILEGE ESCALATION TRIGGER ────────────────────────────────────
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

-- ─── 15. STORAGE BUCKETS CONFIGURATION ─────────────────────────────────────────
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

-- Storage RLS
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

-- ─── 16. FINAL VERIFICATION ───────────────────────────────────────────────────
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
