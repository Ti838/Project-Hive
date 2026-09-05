-- ─── USER SETTINGS PERSISTENCE MIGRATION ────────────────────────────────────
-- Adds JSONB settings column to the users table with standard defaults.

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"emailNotifications": true, "chatSounds": true, "theme": "dark", "twoFactorPrompt": false}'::jsonb;

-- Backfill any existing users that have NULL settings
UPDATE users 
SET settings = '{"emailNotifications": true, "chatSounds": true, "theme": "dark", "twoFactorPrompt": false}'::jsonb 
WHERE settings IS NULL;
