-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  ProjectHive — Missing Columns Patch                                     ║
-- ║  Run in: Supabase Dashboard → SQL Editor → New Query → Run All           ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Add reply_to column to messages table (if not exists)
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS reply_to         UUID REFERENCES messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reply_to_content TEXT,
  ADD COLUMN IF NOT EXISTS reply_to_sender  VARCHAR(255),
  ADD COLUMN IF NOT EXISTS reactions        JSONB DEFAULT '{}';

-- Add index for reply lookups
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to);

-- Verify columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;
