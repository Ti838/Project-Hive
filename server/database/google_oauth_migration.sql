-- ─── Google OAuth Migration ────────────────────────────────────────────────
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/iekfvgjxkmgduxdvkuxf/sql

-- 1. Add google_id column (unique, nullable)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;

-- 2. Make password_hash nullable (OAuth users have no password)
ALTER TABLE users
  ALTER COLUMN password_hash DROP NOT NULL;

-- 3. Add auth_provider column to track login method
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email'
    CHECK (auth_provider IN ('email', 'google', 'github'));

-- 4. Create index for fast google_id lookup
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)
  WHERE google_id IS NOT NULL;

-- 5. Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('google_id', 'password_hash', 'auth_provider');
