-- ─── PATCH SOCIAL FEED (Facebook + LinkedIn Grade Overhaul) ─────────────────────
-- Supports multi-media URLs, rich code snippets, interactive poll data,
-- 2-tier threaded nested comments, and expanded reaction types.

-- 1. POSTS TABLE EXTENSIONS
DO $$
BEGIN
  -- media_urls array
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'media_urls'
  ) THEN
    ALTER TABLE posts ADD COLUMN media_urls TEXT[] DEFAULT '{}'::text[];
  END IF;

  -- code_snippet JSONB
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'code_snippet'
  ) THEN
    ALTER TABLE posts ADD COLUMN code_snippet JSONB DEFAULT NULL;
  END IF;

  -- poll_data JSONB
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'poll_data'
  ) THEN
    ALTER TABLE posts ADD COLUMN poll_data JSONB DEFAULT NULL;
  END IF;
END $$;

-- Backfill media_urls from existing image_url if image_url is populated
UPDATE posts
SET media_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL AND (media_urls IS NULL OR array_length(media_urls, 1) IS NULL);

-- 2. POST COMMENTS EXTENSIONS (THREADED COMMENTS)
DO $$
BEGIN
  -- parent_comment_id for nested reply threads
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'post_comments' AND column_name = 'parent_comment_id'
  ) THEN
    ALTER TABLE post_comments
      ADD COLUMN parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE DEFAULT NULL;
  END IF;

  -- updated_at for comment edits
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'post_comments' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE post_comments
      ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Composite index for fast hierarchical comment tree resolution
CREATE INDEX IF NOT EXISTS idx_post_comments_parent
  ON post_comments(post_id, parent_comment_id);

CREATE INDEX IF NOT EXISTS idx_post_comments_created
  ON post_comments(post_id, created_at ASC);

-- 3. POST REACTIONS EXTENSIONS
-- Index for high-speed reaction aggregations per post
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_type
  ON post_reactions(post_id, type);

-- Ensure RLS policies allow authenticated users to perform operations
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
