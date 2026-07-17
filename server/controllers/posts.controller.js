import { supabaseAdmin } from '../config/supabase.js';
import { getIo, broadcastNotification } from '../services/socket.service.js';

// ── Helper: normalize post data ───────────────────────────────────────────────
function normPost(p) {
  return {
    id: p.id,
    content: p.content,
    postType: p.post_type,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    imageUrl: p.image_url || null,
    linkMetadata: p.link_metadata || null,
    author: p.author ? {
      id: p.author.id,
      firstName: p.author.first_name,
      lastName: p.author.last_name,
      avatar: p.author.avatar,
      university: p.author.university,
      onlineStatus: p.author.online_status,
      lastSeen: p.author.last_seen,
    } : null,
    reactions: p.reactions || [],
    commentsCount: p.comments_count || 0,
    myReaction: p.my_reaction || null,
  };
}

// GET /api/feed — own + friends' posts (+ all users if sparse), latest first
export async function getFeed(req, res, next) {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, sortBy = 'recent' } = req.query;
    const offset = (page - 1) * limit;

    // Get friend IDs (friends table stores mutual rows: user_id → friend_id)
    const { data: friendships } = await supabaseAdmin
      .from('friends')
      .select('friend_id')
      .eq('user_id', userId);

    const friendIds = (friendships || []).map(f => f.friend_id);
    const authorIds = [userId, ...friendIds];

    // Fetch friend posts first
    let { data: posts, error } = await supabaseAdmin
      .from('posts')
      .select(`
        id, content, post_type, created_at, updated_at, author_id, image_url, link_metadata,
        author:users!author_id(id, first_name, last_name, avatar, university, online_status, last_seen)
      `)
      .in('author_id', authorIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + +limit - 1);

    if (error) throw error;

    // If fewer than 5 friend posts → also fetch posts from all users (Discover mode)
    if ((posts || []).length < 5 && offset === 0) {
      const { data: allPosts } = await supabaseAdmin
        .from('posts')
        .select(`
          id, content, post_type, created_at, updated_at, author_id, image_url, link_metadata,
          author:users!author_id(id, first_name, last_name, avatar, university, online_status, last_seen)
        `)
        .not('author_id', 'in', `(${authorIds.join(',')})`)
        .order('created_at', { ascending: false })
        .limit(+limit - (posts || []).length);

      posts = [...(posts || []), ...(allPosts || [])].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
    }

    // Fetch reactions & comment counts for these posts
    const postIds = (posts || []).map(p => p.id);
    let reactionsMap = {}, commentsMap = {}, myReactions = {};

    if (postIds.length > 0) {
      const [{ data: reactions }, { data: comments }, { data: mine }] = await Promise.all([
        supabaseAdmin.from('post_reactions').select('post_id, type, user_id').in('post_id', postIds).catch(() => ({ data: [] })),
        supabaseAdmin.from('post_comments').select('post_id').in('post_id', postIds).catch(() => ({ data: [] })),
        supabaseAdmin.from('post_reactions').select('post_id, type').in('post_id', postIds).eq('user_id', userId).catch(() => ({ data: [] })),
      ]);

      // Group reactions by post + type
      (reactions || []).forEach(r => {
        if (!reactionsMap[r.post_id]) reactionsMap[r.post_id] = {};
        reactionsMap[r.post_id][r.type] = (reactionsMap[r.post_id][r.type] || 0) + 1;
      });

      // Comment counts
      (comments || []).forEach(c => {
        commentsMap[c.post_id] = (commentsMap[c.post_id] || 0) + 1;
      });

      // My reactions
      (mine || []).forEach(r => { myReactions[r.post_id] = r.type; });
    }

    let result = (posts || []).map(p => normPost({
      ...p,
      reactions: reactionsMap[p.id] || {},
      comments_count: commentsMap[p.id] || 0,
      my_reaction: myReactions[p.id] || null,
    }));

    // Sort by popularity (total reactions) when requested
    if (sortBy === 'popular') {
      result = result.sort((a, b) => {
        const aTotal = Object.values(a.reactions || {}).reduce((s, v) => s + v, 0);
        const bTotal = Object.values(b.reactions || {}).reduce((s, v) => s + v, 0);
        return bTotal - aTotal;
      });
    }

    res.json({ posts: result, page: +page, limit: +limit });
  } catch (err) { next(err); }
}

// POST /api/posts — create a post
export async function createPost(req, res, next) {
  try {
    const { content, postType = 'general', imageUrl = null, linkMetadata = null } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

    const validTypes = ['general', 'achievement', 'project_update', 'looking_for_team', 'poll'];
    if (!validTypes.includes(postType)) return res.status(400).json({ error: 'Invalid post type' });

    const insertData = {
      author_id: req.user.id,
      content: content.trim(),
      post_type: postType
    };
    if (imageUrl) insertData.image_url = imageUrl;
    if (linkMetadata) insertData.link_metadata = linkMetadata;

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .insert(insertData)
      .select(`
        id, content, post_type, created_at, author_id, image_url, link_metadata,
        author:users!author_id(id, first_name, last_name, avatar, university, online_status, last_seen)
      `)
      .single();

    if (error) throw error;
    const result = normPost({ ...post, reactions: {}, comments_count: 0, my_reaction: null });

    // Broadcast to all connected users so feed pages show the banner
    try { getIo()?.emit('post:new', { postId: result.id, authorId: req.user.id }); } catch(_) {}

    res.status(201).json({ post: result });
  } catch (err) { next(err); }
}

// DELETE /api/posts/:id — delete own post
export async function deletePost(req, res, next) {
  try {
    const { data: post } = await supabaseAdmin.from('posts').select('author_id').eq('id', req.params.id).single();
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.author_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' });

    await supabaseAdmin.from('posts').delete().eq('id', req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (err) { next(err); }
}

// POST /api/posts/:id/react — toggle or switch reaction
export async function reactToPost(req, res, next) {
  try {
    const { type } = req.body;
    const validTypes = ['like', 'celebrate', 'insightful', 'support'];
    if (!validTypes.includes(type)) return res.status(400).json({ error: 'Invalid reaction type' });

    const postId = req.params.id;
    const userId = req.user.id;

    // Check existing reaction
    const { data: existing } = await supabaseAdmin
      .from('post_reactions').select('id, type').eq('post_id', postId).eq('user_id', userId).single();

    if (existing) {
      if (existing.type === type) {
        // Same react → remove (toggle off)
        await supabaseAdmin.from('post_reactions').delete().eq('id', existing.id);
        return res.json({ action: 'removed', type: null });
      } else {
        // Different react → switch
        await supabaseAdmin.from('post_reactions').update({ type }).eq('id', existing.id);
        return res.json({ action: 'switched', type });
      }
    }

    // No existing → add
    await supabaseAdmin.from('post_reactions').insert({ post_id: postId, user_id: userId, type });

    // Notify post author (if different from reactor)
    try {
      const { data: post } = await supabaseAdmin.from('posts').select('author_id, content').eq('id', postId).single();
      if (post && post.author_id !== userId) {
        const { data: reactor } = await supabaseAdmin.from('users').select('first_name, last_name').eq('id', userId).single();
        const reactorName = reactor ? `${reactor.first_name} ${reactor.last_name}`.trim() : 'Someone';
        const reactionEmojis = { like: '❤️', celebrate: '🎉', insightful: '💡', support: '👏' };
        const notifMsg = `${reactorName} reacted ${reactionEmojis[type] || ''} to your post`;
        broadcastNotification(getIo(), post.author_id, {
          type: 'friend',
          title: 'New Reaction',
          message: notifMsg,
          metadata: { postId },
        });
      }
    } catch(_) {}

    res.json({ action: 'added', type });
  } catch (err) { next(err); }
}

// GET /api/posts/:id/comments
export async function getComments(req, res, next) {
  try {
    const { data: comments, error } = await supabaseAdmin
      .from('post_comments')
      .select(`
        id, content, created_at,
        author:users!author_id(id, first_name, last_name, avatar, online_status)
      `)
      .eq('post_id', req.params.id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    const result = (comments || []).map(c => ({
      id: c.id,
      content: c.content,
      createdAt: c.created_at,
      author: c.author ? {
        id: c.author.id,
        firstName: c.author.first_name,
        lastName: c.author.last_name,
        avatar: c.author.avatar,
        onlineStatus: c.author.online_status,
      } : null,
    }));
    res.json({ comments: result });
  } catch (err) { next(err); }
}

// POST /api/posts/:id/comments — add a comment
export async function addComment(req, res, next) {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

    const { data: comment, error } = await supabaseAdmin
      .from('post_comments')
      .insert({ post_id: req.params.id, author_id: req.user.id, content: content.trim() })
      .select(`
        id, content, created_at,
        author:users!author_id(id, first_name, last_name, avatar, online_status)
      `)
      .single();

    if (error) throw error;
    const result = {
      id: comment.id,
      content: comment.content,
      createdAt: comment.created_at,
      author: {
        id: comment.author.id,
        firstName: comment.author.first_name,
        lastName: comment.author.last_name,
        avatar: comment.author.avatar,
        onlineStatus: comment.author.online_status,
      },
    };

    // Broadcast comment to all connected clients (real-time feed update)
    try {
      getIo()?.emit('post:comment', { postId: req.params.id, comment: result, authorId: req.user.id });
    } catch(_) {}

    // Notify post author (if different from commenter)
    try {
      const { data: post } = await supabaseAdmin.from('posts').select('author_id').eq('id', req.params.id).single();
      if (post && post.author_id !== req.user.id) {
        const commenterName = `${comment.author.first_name} ${comment.author.last_name}`.trim();
        const notifMsg = `${commenterName} commented on your post`;
        await supabaseAdmin.from('notifications').insert({
          user_id: post.author_id,
          type: 'message',
          title: 'New Comment',
          message: notifMsg,
          data: { postId: req.params.id },
          is_read: false,
        });
        broadcastNotification(getIo(), post.author_id, {
          type: 'message',
          title: 'New Comment',
          message: notifMsg,
          metadata: { postId: req.params.id },
        });
      }
    } catch(_) {}

    res.status(201).json({ comment: result });
  } catch (err) { next(err); }
}

// DELETE /api/posts/:id/comments/:cid
export async function deleteComment(req, res, next) {
  try {
    const { data: comment } = await supabaseAdmin
      .from('post_comments').select('author_id').eq('id', req.params.cid).single();
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.author_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' });

    await supabaseAdmin.from('post_comments').delete().eq('id', req.params.cid);

    try {
      getIo()?.emit('post:comment-deleted', { postId: req.params.id, commentId: req.params.cid });
    } catch(_) {}

    res.json({ message: 'Comment deleted' });
  } catch (err) { next(err); }
}

// GET /api/posts/:id — get a single post
export async function getPostById(req, res, next) {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .select(`
        id, content, post_type, created_at, updated_at, author_id, image_url, link_metadata,
        author:users!author_id(id, first_name, last_name, avatar, university, online_status, last_seen)
      `)
      .eq('id', postId)
      .maybeSingle();

    if (error || !post) return res.status(404).json({ error: 'Post not found' });

    // Fetch reactions & comments count & my reaction
    const [{ data: reactions }, { data: comments }, { data: mine }] = await Promise.all([
      supabaseAdmin.from('post_reactions').select('type').eq('post_id', postId).catch(() => ({ data: [] })),
      supabaseAdmin.from('post_comments').select('id').eq('post_id', postId).catch(() => ({ data: [] })),
      supabaseAdmin.from('post_reactions').select('type').eq('post_id', postId).eq('user_id', userId).catch(() => ({ data: [] })),
    ]);

    const reactionsMap = {};
    (reactions || []).forEach(r => {
      reactionsMap[r.type] = (reactionsMap[r.type] || 0) + 1;
    });

    const myReaction = (mine && mine.length > 0) ? mine[0].type : null;

    res.json({
      post: normPost({
        ...post,
        reactions: reactionsMap,
        comments_count: (comments || []).length,
        my_reaction: myReaction,
      })
    });
  } catch (err) { next(err); }
}

// GET /api/utils/scrape-metadata — scrape OpenGraph tags from any URL
export async function scrapeMetadata(req, res, next) {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    // Add protocol if missing
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    // SSRF Protection: block internal/private network addresses
    try {
      const parsed = new URL(targetUrl);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return res.status(400).json({ error: 'Only HTTP/HTTPS URLs are allowed' });
      }
      const hostname = parsed.hostname.toLowerCase();
      // Block internal addresses
      const blockedPatterns = [
        /^localhost$/i,
        /^127\.\d+\.\d+\.\d+$/,
        /^10\.\d+\.\d+\.\d+$/,
        /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
        /^192\.168\.\d+\.\d+$/,
        /^0\.0\.0\.0$/,
        /^169\.254\.\d+\.\d+$/,        // link-local
        /^\[?::1\]?$/,                   // IPv6 loopback
        /^\[?fe80:/i,                    // IPv6 link-local
        /^\[?fc00:/i,                    // IPv6 private
        /^\[?fd/i,                       // IPv6 private
        /\.local$/i,
        /\.internal$/i,
        /\.onrender\.com$/i,             // Block requests back to our own backend
      ];
      if (blockedPatterns.some(p => p.test(hostname))) {
        return res.status(400).json({ error: 'Cannot scrape internal or private URLs' });
      }
      // Block numeric IPs that start with 0 (octal bypass)
      if (/^0\d/.test(hostname)) {
        return res.status(400).json({ error: 'Invalid URL format' });
      }
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    const response = await fetch(targetUrl, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36' 
      },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      return res.status(422).json({ error: 'Failed to fetch the target URL' });
    }

    const html = await response.text();

    // Helper to extract meta content
    const getMetaTagContent = (htmlStr, propertyOrName) => {
      const regex = new RegExp(`<meta[^>]*(?:property|name)=["']${propertyOrName}["'][^>]*content=["']([^"']*)["']`, 'i');
      const match = htmlStr.match(regex);
      if (match) return match[1];

      const altRegex = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${propertyOrName}["']`, 'i');
      const altMatch = htmlStr.match(altRegex);
      return altMatch ? altMatch[1] : null;
    };

    // Title parsing
    let title = getMetaTagContent(html, 'og:title') || getMetaTagContent(html, 'twitter:title');
    if (!title) {
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      title = titleMatch ? titleMatch[1] : '';
    }

    // Description parsing
    let description = getMetaTagContent(html, 'og:description') || getMetaTagContent(html, 'description') || getMetaTagContent(html, 'twitter:description') || '';

    // Image parsing
    let image = getMetaTagContent(html, 'og:image') || getMetaTagContent(html, 'twitter:image') || '';

    // Resolve relative image path if needed
    if (image && !/^https?:\/\//i.test(image)) {
      try {
        const base = new URL(targetUrl);
        image = new URL(image, base.origin).href;
      } catch (e) {}
    }

    // Domain name extraction
    let domain = '';
    try {
      domain = new URL(targetUrl).hostname;
    } catch(e) {}

    res.json({
      title: title?.trim() || domain,
      description: description?.trim() || '',
      image: image || '',
      url: targetUrl,
      domain
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to scrape metadata: ' + err.message });
  }
}

// GET /api/posts/user/:userId — get public posts by a specific user (for profile activity)
export async function getUserPosts(req, res, next) {
  try {
    const { userId } = req.params;
    const { limit = 6 } = req.query;

    const { data: posts, error } = await supabaseAdmin
      .from('posts')
      .select(`
        id, content, post_type, created_at, updated_at, author_id, image_url, link_metadata,
        author:users!author_id(id, first_name, last_name, avatar, avatar_color, university)
      `)
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(+limit);

    if (error) throw error;

    const postIds = (posts || []).map(p => p.id);
    let reactionsMap = {}, commentsMap = {};

    if (postIds.length > 0) {
      const [{ data: reactions }, { data: comments }] = await Promise.all([
        supabaseAdmin.from('post_reactions').select('post_id, type').in('post_id', postIds).catch(() => ({ data: [] })),
        supabaseAdmin.from('post_comments').select('post_id').in('post_id', postIds).catch(() => ({ data: [] })),
      ]);
      (reactions || []).forEach(r => {
        if (!reactionsMap[r.post_id]) reactionsMap[r.post_id] = {};
        reactionsMap[r.post_id][r.type] = (reactionsMap[r.post_id][r.type] || 0) + 1;
      });
      (comments || []).forEach(c => {
        commentsMap[c.post_id] = (commentsMap[c.post_id] || 0) + 1;
      });
    }

    const result = (posts || []).map(p => normPost({
      ...p,
      reactions: reactionsMap[p.id] || {},
      comments_count: commentsMap[p.id] || 0,
      my_reaction: null,
    }));

    res.json({ posts: result });
  } catch (err) { next(err); }
}

// PATCH /api/posts/:id — edit own post
export async function editPost(req, res, next) {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

    const { data: post } = await supabaseAdmin.from('posts').select('author_id').eq('id', req.params.id).single();
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.author_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const { data: updated, error } = await supabaseAdmin
      .from('posts')
      .update({ content: content.trim() })
      .eq('id', req.params.id)
      .select(`
        id, content, post_type, created_at, updated_at, author_id, image_url, link_metadata,
        author:users!author_id(id, first_name, last_name, avatar, university, online_status, last_seen)
      `)
      .single();

    if (error) throw error;
    res.json({ post: normPost({ ...updated, reactions: {}, comments_count: 0, my_reaction: null }) });
  } catch (err) { next(err); }
}

// PATCH /api/posts/:id/comments/:cid — edit own comment
export async function editComment(req, res, next) {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

    const { data: comment } = await supabaseAdmin.from('post_comments').select('author_id').eq('id', req.params.cid).single();
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.author_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const { data: updated, error } = await supabaseAdmin
      .from('post_comments')
      .update({ content: content.trim() })
      .eq('id', req.params.cid)
      .select(`id, content, created_at, author:users!author_id(id, first_name, last_name, avatar, online_status)`)
      .single();

    if (error) throw error;
    res.json({
      comment: {
        id: updated.id,
        content: updated.content,
        createdAt: updated.created_at,
        author: updated.author ? {
          id: updated.author.id,
          firstName: updated.author.first_name,
          lastName: updated.author.last_name,
          avatar: updated.author.avatar,
          onlineStatus: updated.author.online_status,
        } : null,
      }
    });
  } catch (err) { next(err); }
}

// POST /api/posts/:id/save — save/unsave a post (toggle)
export async function savePost(req, res, next) {
  try {
    const { id: postId } = req.params;
    const userId = req.user.id;

    const { data: existing } = await supabaseAdmin
      .from('saved_posts').select('id').eq('post_id', postId).eq('user_id', userId).maybeSingle();

    if (existing) {
      await supabaseAdmin.from('saved_posts').delete().eq('id', existing.id);
      return res.json({ saved: false, message: 'Post unsaved' });
    }

    await supabaseAdmin.from('saved_posts').insert({ post_id: postId, user_id: userId });
    res.json({ saved: true, message: 'Post saved' });
  } catch (err) { next(err); }
}

// GET /api/posts/saved — get all saved posts for the current user
export async function getSavedPosts(req, res, next) {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (+page - 1) * +limit;

    const { data: saved, error, count } = await supabaseAdmin
      .from('saved_posts')
      .select(`
        post:post_id(
          id, content, post_type, created_at, updated_at, image_url, link_metadata,
          author:users!author_id(id, first_name, last_name, avatar, university, online_status, last_seen)
        )
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + +limit - 1);

    if (error) throw error;

    const posts = (saved || []).map(s => s.post).filter(Boolean);
    const postIds = posts.map(p => p.id);
    let reactionsMap = {}, commentsMap = {}, myReactions = {};

    if (postIds.length > 0) {
      const [{ data: reactions }, { data: comments }, { data: mine }] = await Promise.all([
        supabaseAdmin.from('post_reactions').select('post_id, type, user_id').in('post_id', postIds).catch(() => ({ data: [] })),
        supabaseAdmin.from('post_comments').select('post_id').in('post_id', postIds).catch(() => ({ data: [] })),
        supabaseAdmin.from('post_reactions').select('post_id, type').in('post_id', postIds).eq('user_id', userId).catch(() => ({ data: [] })),
      ]);
      (reactions || []).forEach(r => {
        if (!reactionsMap[r.post_id]) reactionsMap[r.post_id] = {};
        reactionsMap[r.post_id][r.type] = (reactionsMap[r.post_id][r.type] || 0) + 1;
      });
      (comments || []).forEach(c => { commentsMap[c.post_id] = (commentsMap[c.post_id] || 0) + 1; });
      (mine || []).forEach(r => { myReactions[r.post_id] = r.type; });
    }

    const result = posts.map(p => normPost({
      ...p,
      reactions: reactionsMap[p.id] || {},
      comments_count: commentsMap[p.id] || 0,
      my_reaction: myReactions[p.id] || null,
    }));

    res.json({ posts: result, total: count || 0, page: +page, limit: +limit });
  } catch (err) { next(err); }
}

// POST /api/posts/:id/vote — vote in a poll
export async function votePoll(req, res, next) {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const { optionText } = req.body;

    if (!optionText) return res.status(400).json({ error: 'Option text is required' });

    const { data: post, error: fetchErr } = await supabaseAdmin
      .from('posts')
      .select('id, link_metadata, author_id, content, post_type, created_at, image_url')
      .eq('id', postId)
      .single();

    if (fetchErr || !post) return res.status(404).json({ error: 'Post not found' });
    if (post.post_type !== 'poll') return res.status(400).json({ error: 'Post is not a poll' });

    const metadata = post.link_metadata || {};
    if (!metadata.isPoll || !Array.isArray(metadata.options)) {
      return res.status(400).json({ error: 'Invalid poll metadata' });
    }

    metadata.options.forEach(opt => {
      if (!Array.isArray(opt.votes)) opt.votes = [];
      const userIdx = opt.votes.indexOf(userId);
      if (opt.text === optionText) {
        if (userIdx === -1) {
          opt.votes.push(userId);
        } else {
          opt.votes.splice(userIdx, 1);
        }
      } else {
        if (userIdx !== -1) {
          opt.votes.splice(userIdx, 1);
        }
      }
    });

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('posts')
      .update({ link_metadata: metadata })
      .eq('id', postId)
      .select(`
        id, content, post_type, created_at, updated_at, author_id, image_url, link_metadata,
        author:users!author_id(id, first_name, last_name, avatar, university, online_status, last_seen)
      `)
      .single();

    if (updateErr) throw updateErr;

    res.json({ post: normPost({ ...updated, reactions: {}, comments_count: 0, my_reaction: null }) });
  } catch (err) { next(err); }
}


