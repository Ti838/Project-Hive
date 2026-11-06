-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  ProjectHive — Hardened Production Security & RLS Policy Matrix          ║
-- ║  Target: Supabase Dashboard → SQL Editor → Run All                       ║
-- ║  Idempotent: Safe to execute repeatedly without dropping or data loss     ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ─── 1. SECURE SUPPORT TICKETS TABLE & AUDIT RLS ─────────────────────────────
CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ticket_number" VARCHAR(50) NOT NULL UNIQUE,
  "user_id" UUID NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "subject" TEXT NOT NULL,
  "category" VARCHAR(100) NOT NULL DEFAULT 'General',
  "priority" VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK ("priority" IN ('low', 'normal', 'urgent')),
  "status" VARCHAR(50) NOT NULL DEFAULT 'Open' CHECK ("status" IN ('Open', 'Waiting for Admin', 'Waiting for User', 'Resolved', 'Closed')),
  "messages" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "related_team_id" UUID REFERENCES "public"."teams"("id") ON DELETE SET NULL,
  "related_project_id" UUID REFERENCES "public"."projects"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE "public"."support_tickets" ENABLE ROW LEVEL SECURITY;

-- Service Role full access
DROP POLICY IF EXISTS "service_role_all_support_tickets" ON "public"."support_tickets";
CREATE POLICY "service_role_all_support_tickets" ON "public"."support_tickets"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- User can SELECT only their own tickets
DROP POLICY IF EXISTS "user_select_own_support_tickets" ON "public"."support_tickets";
CREATE POLICY "user_select_own_support_tickets" ON "public"."support_tickets"
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- User can INSERT tickets only for themselves
DROP POLICY IF EXISTS "user_insert_own_support_tickets" ON "public"."support_tickets";
CREATE POLICY "user_insert_own_support_tickets" ON "public"."support_tickets"
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User can UPDATE only their own tickets (e.g. reply or close)
DROP POLICY IF EXISTS "user_update_own_support_tickets" ON "public"."support_tickets";
CREATE POLICY "user_update_own_support_tickets" ON "public"."support_tickets"
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── 2. PREVENT PRIVILEGE ESCALATION ON USERS TABLE ─────────────────────────
-- Ensure users CANNOT update their own 'role', 'is_banned', or 'strikes' fields
-- via direct Supabase client requests
CREATE OR REPLACE FUNCTION "public"."enforce_user_immutability"()
RETURNS TRIGGER AS $$
BEGIN
  -- If executed by an ordinary user (not service_role)
  IF current_user != 'service_role' AND auth.role() = 'authenticated' THEN
    -- Lock role elevation
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Privilege Escalation Detected: You cannot modify your own role.';
    END IF;
    -- Lock disciplinary fields
    IF NEW.is_banned IS DISTINCT FROM OLD.is_banned THEN
      RAISE EXCEPTION 'Access Denied: You cannot modify your ban status.';
    END IF;
    IF NEW.strikes IS DISTINCT FROM OLD.strikes THEN
      RAISE EXCEPTION 'Access Denied: You cannot modify your disciplinary strikes.';
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

-- ─── 3. HARDEN STORAGE ACCESS POLICIES ───────────────────────────────────────
-- Avatars bucket: Public read, owner update/upload
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 'avatars', true, 5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Attachments bucket: Private read, authorized members
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments', 'attachments', false, 26214400, -- 25MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/zip', 'text/plain', 'text/markdown']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 26214400,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/zip', 'text/plain', 'text/markdown'];

-- Storage RLS on objects
DROP POLICY IF EXISTS "public_read_avatars" ON storage.objects;
CREATE POLICY "public_read_avatars" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "auth_upload_avatars" ON storage.objects;
CREATE POLICY "auth_upload_avatars" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "auth_update_avatars" ON storage.objects;
CREATE POLICY "auth_update_avatars" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Attachments: only authenticated users can read/write their folders
DROP POLICY IF EXISTS "auth_read_attachments" ON storage.objects;
CREATE POLICY "auth_read_attachments" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'attachments');

DROP POLICY IF EXISTS "auth_upload_attachments" ON storage.objects;
CREATE POLICY "auth_upload_attachments" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ─── 4. IMMUTABLE AUDIT LOG PROTECTION ───────────────────────────────────────
-- Ensure normal users can NEVER insert, update or delete audit logs
DROP POLICY IF EXISTS "users_read_audit_logs" ON "public"."admin_audit_logs";
DROP POLICY IF EXISTS "users_modify_audit_logs" ON "public"."admin_audit_logs";

-- Only service_role can write audit logs
CREATE POLICY "service_role_audit_logs" ON "public"."admin_audit_logs"
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Indexes for audit speed
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_status
  ON "public"."support_tickets" ("user_id", "status");

CREATE INDEX IF NOT EXISTS idx_support_tickets_updated
  ON "public"."support_tickets" ("updated_at" DESC);
