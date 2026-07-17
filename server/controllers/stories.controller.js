import { supabaseAdmin } from '../config/supabase.js';
import { getIo } from '../services/socket.service.js';

// ── Helper: normalize a story row ─────────────────────────────────────────────
function normStory(s) {
  return {
    id: s.id,
    mediaUrl: s.media_url,
    mediaType: s.media_type || 'image',
    caption: s.caption || null,
    createdAt: s.created_at,
    expiresAt: s.expires_at,
    viewCount: s.view_count ?? 0,
    hasViewed: s.has_viewed ?? false,
    author: s.author ? {
      id: s.author.id,
      firstName: s.author.first_name,
      lastName: s.author.last_name,
      avatar: s.author.avatar,
      avatarColor: s.author.avatar_color,
    } : null,
  };
}

// GET /api/stories — get active stories (own + friends, grouped by author)
export async function getStories(req, res, next) {
  try {
    const userId = req.user.id;
    const now = new Date().toISOString();

    // Get friend IDs
    const { data: friendships } = await supabaseAdmin
      .from('friends')
      .select('friend_id')
      .eq('user_id', userId);
    const friendIds = (friendships || []).map(f => f.friend_id);
    const authorIds = [userId, ...friendIds];

    // Fetch non-expired stories from self + friends
    const { data: stories, error } = await supabaseAdmin
      .from('stories')
      .select(`
        id, media_url, media_type, caption, created_at, expires_at,
        author:users!author_id(id, first_name, last_name, avatar, avatar_color)
      `)
      .in('author_id', authorIds)
      .gt('expires_at', now)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get which stories current user has already seen
    const storyIds = (stories || []).map(s => s.id);
    let viewedSet = new Set();
    let viewCountMap = {};

    if (storyIds.length > 0) {
      const [{ data: myViews }, { data: allViews }] = await Promise.all([
        supabaseAdmin.from('story_views').select('story_id').in('story_id', storyIds).eq('viewer_id', userId).then(r => r, () => ({ data: [] })),
        supabaseAdmin.from('story_views').select('story_id').in('story_id', storyIds).then(r => r, () => ({ data: [] })),
      ]);
      (myViews || []).forEach(v => viewedSet.add(v.story_id));
      (allViews || []).forEach(v => {
        viewCountMap[v.story_id] = (viewCountMap[v.story_id] || 0) + 1;
      });
    }

    // Normalize and group by author
    const normalized = (stories || []).map(s => normStory({
      ...s,
      view_count: viewCountMap[s.id] || 0,
      has_viewed: viewedSet.has(s.id),
    }));

    // Group stories by author for the UI ring display
    const grouped = [];
    const seen = new Map();
    for (const story of normalized) {
      const aid = story.author?.id;
      if (!aid) continue;
      if (!seen.has(aid)) {
        seen.set(aid, { author: story.author, stories: [], hasUnviewed: false });
        grouped.push(seen.get(aid));
      }
      const group = seen.get(aid);
      group.stories.push(story);
      if (!story.hasViewed) group.hasUnviewed = true;
    }

    // Own stories go first
    const ownGroup = grouped.find(g => g.author?.id === userId);
    const otherGroups = grouped.filter(g => g.author?.id !== userId);

    res.json({ groups: ownGroup ? [ownGroup, ...otherGroups] : otherGroups });
  } catch (err) { next(err); }
}

// POST /api/stories — create a story (image/video as base64 data URL)
export async function createStory(req, res, next) {
  try {
    const { mediaUrl, mediaType = 'image', caption } = req.body;

    if (!mediaUrl) return res.status(400).json({ error: 'mediaUrl is required' });
    if (!['image', 'video'].includes(mediaType)) return res.status(400).json({ error: 'Invalid mediaType' });

    // Validate it's a real data URL or https URL
    const isDataUrl = mediaUrl.startsWith('data:image') || mediaUrl.startsWith('data:video');
    const isHttpsUrl = mediaUrl.startsWith('https://');
    if (!isDataUrl && !isHttpsUrl) return res.status(400).json({ error: 'Invalid media URL format' });

    // Size check for data URLs (max 10MB encoded)
    if (isDataUrl && mediaUrl.length > 14 * 1024 * 1024) {
      return res.status(400).json({ error: 'Media too large. Maximum 10MB.' });
    }

    const { data: story, error } = await supabaseAdmin
      .from('stories')
      .insert({
        author_id: req.user.id,
        media_url: mediaUrl,
        media_type: mediaType,
        caption: caption?.trim() || null,
      })
      .select(`
        id, media_url, media_type, caption, created_at, expires_at,
        author:users!author_id(id, first_name, last_name, avatar, avatar_color)
      `)
      .single();

    if (error) throw error;

    const result = normStory({ ...story, view_count: 0, has_viewed: false });

    // Broadcast to friends so their feed updates
    try { getIo()?.emit('story:new', { authorId: req.user.id }); } catch (_) {}

    res.status(201).json({ story: result });
  } catch (err) { next(err); }
}

// POST /api/stories/:id/view — mark a story as viewed
export async function viewStory(req, res, next) {
  try {
    const { id: storyId } = req.params;
    const userId = req.user.id;

    // Check story exists and is not expired
    const { data: story } = await supabaseAdmin
      .from('stories')
      .select('id, expires_at, author_id')
      .eq('id', storyId)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (!story) return res.status(404).json({ error: 'Story not found or expired' });

    // Don't count self-views
    if (story.author_id === userId) return res.json({ viewed: true });

    // Upsert view (ignore duplicates)
    await supabaseAdmin
      .from('story_views')
      .upsert({ story_id: storyId, viewer_id: userId }, { onConflict: 'story_id,viewer_id', ignoreDuplicates: true });

    res.json({ viewed: true });
  } catch (err) { next(err); }
}

// DELETE /api/stories/:id — delete own story
export async function deleteStory(req, res, next) {
  try {
    const { data: story } = await supabaseAdmin
      .from('stories').select('author_id').eq('id', req.params.id).single();

    if (!story) return res.status(404).json({ error: 'Story not found' });
    if (story.author_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    await supabaseAdmin.from('stories').delete().eq('id', req.params.id);
    res.json({ message: 'Story deleted' });
  } catch (err) { next(err); }
}

// GET /api/stories/:id/views — get viewers for own story
export async function getStoryViews(req, res, next) {
  try {
    const { data: story } = await supabaseAdmin
      .from('stories').select('author_id').eq('id', req.params.id).single();

    if (!story) return res.status(404).json({ error: 'Story not found' });
    if (story.author_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const { data: views, error } = await supabaseAdmin
      .from('story_views')
      .select(`viewed_at, viewer:users!viewer_id(id, first_name, last_name, avatar)`)
      .eq('story_id', req.params.id)
      .order('viewed_at', { ascending: false });

    if (error) throw error;

    const result = (views || []).map(v => ({
      viewedAt: v.viewed_at,
      viewer: v.viewer ? {
        id: v.viewer.id,
        firstName: v.viewer.first_name,
        lastName: v.viewer.last_name,
        avatar: v.viewer.avatar,
      } : null,
    }));

    res.json({ views: result });
  } catch (err) { next(err); }
}
