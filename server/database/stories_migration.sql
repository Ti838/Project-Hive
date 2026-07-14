-- ═══════════════════════════════════════════════════════════════
-- ProjectHive Stories Migration
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Stories table (24-hour expiry)
CREATE TABLE IF NOT EXISTS stories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_url   TEXT NOT NULL,
  media_type  VARCHAR(10) NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  caption     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Story views (who has seen which story)
CREATE TABLE IF NOT EXISTS story_views (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id   UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stories_author   ON stories(author_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires  ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_story_views_story ON story_views(story_id);

-- Auto-delete expired stories (optional: can also filter in query)
-- Supabase doesn't have built-in cron, so we filter expires_at > now() in queries
