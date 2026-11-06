-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  ProjectHive — Complete Master Production Database Schema & Optimization  ║
-- ║  Supabase PostgreSQL Singapore Node (Idempotent & Zero-Destructive)       ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. CORE USER & SECURITY ACCOUNTS ─────────────────────────────────────────
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

ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "github" VARCHAR(255);
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "leetcode" VARCHAR(255);
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "scholar" VARCHAR(255);
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "devpost" VARCHAR(255);
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "strikes" INTEGER DEFAULT 0;
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "is_banned" BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS "public"."user_settings" (
  "user_id" UUID PRIMARY KEY REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "theme" VARCHAR(20) NOT NULL DEFAULT 'system' CHECK ("theme" IN ('light', 'dark', 'system')),
  "privacy" JSONB NOT NULL DEFAULT '{"is_recruitable": true, "show_email": false, "show_academic": true}'::jsonb,
  "notifications" JSONB NOT NULL DEFAULT '{"email": true, "in_app": true, "sprint_alerts": true}'::jsonb,
  "ai_preferences" JSONB NOT NULL DEFAULT '{"tier": "balanced", "auto_suggest": true}'::jsonb,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2. ACADEMIC SQUADS & TEAMS ───────────────────────────────────────────────
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

-- ─── 3. INCUBATION PROJECTS & SPRINT TASKS ────────────────────────────────────
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

-- ─── 4. HIGH-THROUGHPUT REALTIME MESSAGING ─────────────────────────────────────
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

ALTER TABLE "public"."messages" ADD COLUMN IF NOT EXISTS "conversation_id" UUID REFERENCES "public"."conversations"("id") ON DELETE CASCADE;
ALTER TABLE "public"."messages" ADD COLUMN IF NOT EXISTS "file_url" TEXT;
ALTER TABLE "public"."messages" ADD COLUMN IF NOT EXISTS "is_read" BOOLEAN DEFAULT FALSE;

-- ─── 5. CAMPUS SOCIAL FEED & ACADEMIC SHOWCASE ─────────────────────────────────
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

-- ─── 6. SUPPORT HELPLINE & TWO-WAY TICKETS ─────────────────────────────────────
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

ALTER TABLE "public"."support_tickets" ADD COLUMN IF NOT EXISTS "ticket_number" VARCHAR(50);
ALTER TABLE "public"."support_tickets" ADD COLUMN IF NOT EXISTS "priority" VARCHAR(20) DEFAULT 'normal';
ALTER TABLE "public"."support_tickets" ADD COLUMN IF NOT EXISTS "messages" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE "public"."support_tickets" ADD COLUMN IF NOT EXISTS "related_team_id" UUID REFERENCES "public"."teams"("id") ON DELETE SET NULL;
ALTER TABLE "public"."support_tickets" ADD COLUMN IF NOT EXISTS "related_project_id" UUID REFERENCES "public"."projects"("id") ON DELETE SET NULL;

UPDATE "public"."support_tickets"
SET "ticket_number" = 'TICK-' || UPPER(SUBSTRING(id::text FROM 1 FOR 8))
WHERE "ticket_number" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_support_tickets_number ON "public"."support_tickets" ("ticket_number");

-- ─── 7. ADMINISTRATIVE AUDIT & SYSTEM FLAGS ──────────────────────────────────
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

-- ─── 8. CRITICAL PERFORMANCE & COMPOSITE INDEXES ─────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email ON "public"."users" ("email");
CREATE INDEX IF NOT EXISTS idx_users_role ON "public"."users" ("role");
CREATE INDEX IF NOT EXISTS idx_teams_leader ON "public"."teams" ("leader_id");
CREATE INDEX IF NOT EXISTS idx_team_members_lookup ON "public"."team_members" ("team_id", "user_id");
CREATE INDEX IF NOT EXISTS idx_projects_owner ON "public"."projects" ("owner_id");
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON "public"."tasks" ("project_id", "status");
CREATE INDEX IF NOT EXISTS idx_messages_room_created ON "public"."messages" ("room_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON "public"."messages" ("conversation_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_created ON "public"."posts" ("author_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_status ON "public"."support_tickets" ("user_id", "status");
CREATE INDEX IF NOT EXISTS idx_admin_audit_action_created ON "public"."admin_audit_logs" ("action", "created_at" DESC);
