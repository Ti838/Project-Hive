-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  ProjectHive — Messaging & Collaboration Schema Overhaul (v2)            ║
-- ║  Run in: Supabase Dashboard → SQL Editor → New Query → Run All           ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ─── 1. Enhance messages table with delivery status, media, voice & pin columns ──
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'sent'
    CHECK (status IN ('sent', 'delivered', 'seen')),
  ADD COLUMN IF NOT EXISTS media_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS voice_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS voice_duration INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- ─── 2. High-Performance Composite Indexes for Messaging ───────────────────────
-- Fast cursor/offset room pagination index
CREATE INDEX IF NOT EXISTS idx_messages_room_created ON messages(room_id, created_at DESC);

-- Fast delivery status lookup per sender
CREATE INDEX IF NOT EXISTS idx_messages_sender_status ON messages(sender_id, status);

-- Partial index for fast unread message scans
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(room_id) WHERE NOT ('{}'::uuid[] && read_by);

-- ─── 3. Per-User Pinned Conversations Ledger ──────────────────────────────────
CREATE TABLE IF NOT EXISTS conversation_pins (
  user_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  room_id   VARCHAR(255) NOT NULL,
  pinned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, room_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_pins_user ON conversation_pins(user_id);

-- Enable RLS & Security policies for conversation_pins
ALTER TABLE conversation_pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_conv_pins"
  ON conversation_pins FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── 4. Verification Check ───────────────────────────────────────────────────
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;
