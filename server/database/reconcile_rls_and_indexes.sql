-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  ProjectHive — Phase 1: RLS Reconciliation, Policies & Performance Indexes║
-- ║  Target: Supabase Dashboard → SQL Editor → Run All                       ║
-- ║  Idempotent execution: Safe to run repeatedly without data loss          ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 1. GUARANTEE ALL TABLES EXIST WITH BASE CONSTRAINTS ──────────────────────
CREATE TABLE IF NOT EXISTS "public"."system_flags" (
  "key" VARCHAR(100) PRIMARY KEY,
  "value" BOOLEAN NOT NULL DEFAULT FALSE,
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO "public"."system_flags" ("key", "value") VALUES
  ('maintenanceMode', FALSE),
  ('registrationEnabled', TRUE),
  ('emailVerification', FALSE)
ON CONFLICT ("key") DO NOTHING;

CREATE TABLE IF NOT EXISTS "public"."call_sessions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "room_name" VARCHAR(255) NOT NULL UNIQUE,
  "call_type" VARCHAR(20) NOT NULL CHECK ("call_type" IN ('audio', 'video')),
  "initiator_id" UUID NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "recipient_id" UUID REFERENCES "public"."users"("id") ON DELETE SET NULL,
  "team_id" UUID REFERENCES "public"."teams"("id") ON DELETE SET NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'initiated' 
    CHECK ("status" IN ('initiated', 'ringing', 'connected', 'ended', 'rejected', 'missed', 'failed')),
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
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("call_id", "user_id")
);

CREATE TABLE IF NOT EXISTS "public"."message_reactions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "message_id" UUID REFERENCES "public"."messages"("id") ON DELETE CASCADE NOT NULL,
  "user_id" UUID REFERENCES "public"."users"("id") ON DELETE CASCADE NOT NULL,
  "emoji" VARCHAR(10) NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("message_id", "user_id", "emoji")
);

CREATE TABLE IF NOT EXISTS "public"."skill_endorsements" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "skill_id" UUID REFERENCES "public"."skills"("id") ON DELETE CASCADE NOT NULL,
  "endorser_id" UUID REFERENCES "public"."users"("id") ON DELETE CASCADE NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("skill_id", "endorser_id")
);

CREATE TABLE IF NOT EXISTS "public"."saved_posts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID REFERENCES "public"."users"("id") ON DELETE CASCADE NOT NULL,
  "post_id" UUID REFERENCES "public"."posts"("id") ON DELETE CASCADE NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("user_id", "post_id")
);

CREATE TABLE IF NOT EXISTS "public"."admin_audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "admin_id" UUID REFERENCES "public"."users"("id") ON DELETE SET NULL,
  "admin_email" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "target_type" TEXT NOT NULL,
  "target_id" TEXT,
  "details" JSONB DEFAULT '{}'::jsonb,
  "ip_address" TEXT,
  "device_model" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "category" VARCHAR(100) DEFAULT 'general',
  "subject" VARCHAR(255) NOT NULL,
  "message" TEXT NOT NULL,
  "status" VARCHAR(50) DEFAULT 'open' CHECK ("status" IN ('open', 'in_progress', 'resolved', 'closed')),
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "public"."stories" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "author_id" UUID NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "media_url" TEXT NOT NULL,
  "media_type" VARCHAR(10) NOT NULL DEFAULT 'image' CHECK ("media_type" IN ('image', 'video')),
  "caption" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "expires_at" TIMESTAMPTZ NOT NULL DEFAULT (NOW() + interval '24 hours')
);

CREATE TABLE IF NOT EXISTS "public"."story_views" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "story_id" UUID NOT NULL REFERENCES "public"."stories"("id") ON DELETE CASCADE,
  "viewer_id" UUID NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "viewed_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("story_id", "viewer_id")
);

CREATE TABLE IF NOT EXISTS "public"."follows" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "follower_id" UUID REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "following_id" UUID REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("follower_id", "following_id")
);

CREATE TABLE IF NOT EXISTS "public"."blocks" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "blocker_id" UUID REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "blocked_id" UUID REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("blocker_id", "blocked_id")
);

-- ─── 2. ENABLE ROW LEVEL SECURITY ACROSS ALL PUBLIC TABLES ───────────────────
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE "public".%I ENABLE ROW LEVEL SECURITY;', tbl);
  END LOOP;
END $$;

-- ─── 3. UNRESTRICTED BYPASS POLICIES FOR SERVICE_ROLE (BACKEND ENGINE) ───────
-- Guarantees Express/Node.js backend with service_role key never receives 42501
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "service_role_all_%I" ON "public".%I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "service_role_all_%I" ON "public".%I FOR ALL TO service_role USING (true) WITH CHECK (true);', tbl, tbl);
  END LOOP;
END $$;

-- ─── 4. VERIFIED READ/WRITE POLICIES FOR AUTHENTICATED USERS ─────────────────

-- USERS
DROP POLICY IF EXISTS "authenticated_select_users" ON "public"."users";
CREATE POLICY "authenticated_select_users" ON "public"."users"
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_update_users" ON "public"."users";
CREATE POLICY "authenticated_update_users" ON "public"."users"
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- TEAMS
DROP POLICY IF EXISTS "authenticated_select_teams" ON "public"."teams";
CREATE POLICY "authenticated_select_teams" ON "public"."teams"
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_teams" ON "public"."teams";
CREATE POLICY "authenticated_insert_teams" ON "public"."teams"
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = leader_id);

DROP POLICY IF EXISTS "authenticated_update_teams" ON "public"."teams";
CREATE POLICY "authenticated_update_teams" ON "public"."teams"
  FOR UPDATE TO authenticated
  USING (auth.uid() = leader_id)
  WITH CHECK (auth.uid() = leader_id);

DROP POLICY IF EXISTS "authenticated_delete_teams" ON "public"."teams";
CREATE POLICY "authenticated_delete_teams" ON "public"."teams"
  FOR DELETE TO authenticated
  USING (auth.uid() = leader_id);

-- TEAM_MEMBERS
DROP POLICY IF EXISTS "authenticated_select_team_members" ON "public"."team_members";
CREATE POLICY "authenticated_select_team_members" ON "public"."team_members"
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_team_members" ON "public"."team_members";
CREATE POLICY "authenticated_insert_team_members" ON "public"."team_members"
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM "public"."teams" WHERE id = team_id AND leader_id = auth.uid())
  );

DROP POLICY IF EXISTS "authenticated_delete_team_members" ON "public"."team_members";
CREATE POLICY "authenticated_delete_team_members" ON "public"."team_members"
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM "public"."teams" WHERE id = team_id AND leader_id = auth.uid())
  );

-- PROJECTS
DROP POLICY IF EXISTS "authenticated_select_projects" ON "public"."projects";
CREATE POLICY "authenticated_select_projects" ON "public"."projects"
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_projects" ON "public"."projects";
CREATE POLICY "authenticated_insert_projects" ON "public"."projects"
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "authenticated_update_projects" ON "public"."projects";
CREATE POLICY "authenticated_update_projects" ON "public"."projects"
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "authenticated_delete_projects" ON "public"."projects";
CREATE POLICY "authenticated_delete_projects" ON "public"."projects"
  FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

-- POSTS
DROP POLICY IF EXISTS "authenticated_select_posts" ON "public"."posts";
CREATE POLICY "authenticated_select_posts" ON "public"."posts"
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_posts" ON "public"."posts";
CREATE POLICY "authenticated_insert_posts" ON "public"."posts"
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "authenticated_update_posts" ON "public"."posts";
CREATE POLICY "authenticated_update_posts" ON "public"."posts"
  FOR UPDATE TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "authenticated_delete_posts" ON "public"."posts";
CREATE POLICY "authenticated_delete_posts" ON "public"."posts"
  FOR DELETE TO authenticated
  USING (auth.uid() = author_id);

-- POST REACTIONS
DROP POLICY IF EXISTS "authenticated_select_post_reactions" ON "public"."post_reactions";
CREATE POLICY "authenticated_select_post_reactions" ON "public"."post_reactions"
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_post_reactions" ON "public"."post_reactions";
CREATE POLICY "authenticated_insert_post_reactions" ON "public"."post_reactions"
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "authenticated_delete_post_reactions" ON "public"."post_reactions";
CREATE POLICY "authenticated_delete_post_reactions" ON "public"."post_reactions"
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- POST COMMENTS
DROP POLICY IF EXISTS "authenticated_select_post_comments" ON "public"."post_comments";
CREATE POLICY "authenticated_select_post_comments" ON "public"."post_comments"
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_post_comments" ON "public"."post_comments";
CREATE POLICY "authenticated_insert_post_comments" ON "public"."post_comments"
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "authenticated_update_post_comments" ON "public"."post_comments";
CREATE POLICY "authenticated_update_post_comments" ON "public"."post_comments"
  FOR UPDATE TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "authenticated_delete_post_comments" ON "public"."post_comments";
CREATE POLICY "authenticated_delete_post_comments" ON "public"."post_comments"
  FOR DELETE TO authenticated
  USING (auth.uid() = author_id);

-- MESSAGES
DROP POLICY IF EXISTS "authenticated_select_messages" ON "public"."messages";
CREATE POLICY "authenticated_select_messages" ON "public"."messages"
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_messages" ON "public"."messages";
CREATE POLICY "authenticated_insert_messages" ON "public"."messages"
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "authenticated_update_messages" ON "public"."messages";
CREATE POLICY "authenticated_update_messages" ON "public"."messages"
  FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "authenticated_delete_messages" ON "public"."messages";
CREATE POLICY "authenticated_delete_messages" ON "public"."messages"
  FOR DELETE TO authenticated
  USING (auth.uid() = sender_id);

-- LIVEKIT CALL SESSIONS & PARTICIPANTS
DROP POLICY IF EXISTS "authenticated_call_sessions" ON "public"."call_sessions";
CREATE POLICY "authenticated_call_sessions" ON "public"."call_sessions"
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_call_participants" ON "public"."call_participants";
CREATE POLICY "authenticated_call_participants" ON "public"."call_participants"
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- NOTIFICATIONS
DROP POLICY IF EXISTS "authenticated_select_notifications" ON "public"."notifications";
CREATE POLICY "authenticated_select_notifications" ON "public"."notifications"
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "authenticated_update_notifications" ON "public"."notifications";
CREATE POLICY "authenticated_update_notifications" ON "public"."notifications"
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "authenticated_delete_notifications" ON "public"."notifications";
CREATE POLICY "authenticated_delete_notifications" ON "public"."notifications"
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- SYSTEM FLAGS
DROP POLICY IF EXISTS "authenticated_read_flags" ON "public"."system_flags";
CREATE POLICY "authenticated_read_flags" ON "public"."system_flags"
  FOR SELECT TO authenticated, anon
  USING (true);

-- ─── 5. CRITICAL PERFORMANCE & COMPOSITE INDEXES ─────────────────────────────
-- Messages & Chat Room fast descending scan
CREATE INDEX IF NOT EXISTS idx_messages_room_created_at
  ON "public"."messages" ("room_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS idx_messages_reply_to
  ON "public"."messages" ("reply_to");

-- Feed Posts fast pagination
CREATE INDEX IF NOT EXISTS idx_posts_author_created
  ON "public"."posts" ("author_id", "created_at" DESC);

-- Notifications fast unread filtering
CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON "public"."notifications" ("user_id", "is_read", "created_at" DESC);

-- LiveKit Call Sessions room lookup and active state
CREATE INDEX IF NOT EXISTS idx_call_sessions_room_status
  ON "public"."call_sessions" ("room_name", "status");

CREATE INDEX IF NOT EXISTS idx_call_participants_call_user
  ON "public"."call_participants" ("call_id", "user_id");

-- Supporting social & entity composite indexes
CREATE INDEX IF NOT EXISTS idx_team_members_user_team
  ON "public"."team_members" ("user_id", "team_id");

CREATE INDEX IF NOT EXISTS idx_project_likes_project_user
  ON "public"."project_likes" ("project_id", "user_id");

CREATE INDEX IF NOT EXISTS idx_saved_projects_user_project
  ON "public"."saved_projects" ("user_id", "project_id");

CREATE INDEX IF NOT EXISTS idx_saved_posts_user_post
  ON "public"."saved_posts" ("user_id", "post_id");

CREATE INDEX IF NOT EXISTS idx_msg_reactions_msg_user
  ON "public"."message_reactions" ("message_id", "user_id");

CREATE INDEX IF NOT EXISTS idx_stories_author_expires
  ON "public"."stories" ("author_id", "expires_at" DESC);

CREATE INDEX IF NOT EXISTS idx_friends_user_friend
  ON "public"."friends" ("user_id", "friend_id");

CREATE INDEX IF NOT EXISTS idx_follows_follower_following
  ON "public"."follows" ("follower_id", "following_id");

CREATE INDEX IF NOT EXISTS idx_blocks_blocker_blocked
  ON "public"."blocks" ("blocker_id", "blocked_id");

-- ─── 6. VERIFICATION SUMMARY ──────────────────────────────────────────────────
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
