import { supabaseAdmin } from '../config/supabase.js';
import { getIo, broadcastNotification } from '../services/socket.service.js';

// ── Helper: normalize post data ───────────────────────────────────────────────
function normPost(p) {
  if (!p) return null;

  const reactionCount = p.reactions && typeof p.reactions === 'object' && !Array.isArray(p.reactions)
    ? Object.values(p.reactions).reduce((a, b) => a + (typeof b === 'number' ? b : 1), 0)
    : (Array.isArray(p.reactions) ? p.reactions.length : (p.reaction_count || p.reactionCount || 0));

  const authorObj = p.author ? {
    id: p.author.id,
    first_name: p.author.first_name || p.author.firstName || '',
    last_name: p.author.last_name || p.author.lastName || '',
    firstName: p.author.first_name || p.author.firstName || '',
    lastName: p.author.last_name || p.author.lastName || '',
    avatar: p.author.avatar || null,
    avatar_color: p.author.avatar_color || p.author.avatarColor || '#6366F1',
    avatarColor: p.author.avatarColor || p.author.avatar_color || '#6366F1',
    university: p.author.university || '',
    role: p.author.role || 'student',
    online_status: p.author.online_status || p.author.onlineStatus || 'offline',
    onlineStatus: p.author.online_status || p.author.onlineStatus || 'offline',
    last_seen: p.author.last_seen || p.author.lastSeen || null,
    lastSeen: p.author.last_seen || p.author.lastSeen || null,
  } : null;

  const mediaUrls = Array.isArray(p.media_urls) && p.media_urls.length > 0
    ? p.media_urls
    : (Array.isArray(p.images) && p.images.length > 0
        ? p.images
        : (p.image_url ? [p.image_url] : (p.imageUrl ? [p.imageUrl] : [])));

  const pollData = p.poll_data || p.pollData || (p.link_metadata?.isPoll ? p.link_metadata : null);

  return {
    id: p.id,
    author_id: p.author_id || p.authorId || (p.author ? p.author.id : null),
    authorId: p.author_id || p.authorId || (p.author ? p.author.id : null),
    content: p.content || '',
    type: p.post_type || p.type || p.postType || 'general',
    post_type: p.post_type || p.type || p.postType || 'general',
    postType: p.post_type || p.type || p.postType || 'general',
    created_at: p.created_at || p.createdAt || new Date().toISOString(),
    createdAt: p.created_at || p.createdAt || new Date().toISOString(),
    updated_at: p.updated_at || p.updatedAt,
    updatedAt: p.updated_at || p.updatedAt,
    image_url: mediaUrls[0] || p.image_url || null,
    imageUrl: mediaUrls[0] || p.image_url || null,
    images: mediaUrls,
    media_urls: mediaUrls,
    mediaUrls: mediaUrls,
    code_snippet: p.code_snippet || p.codeSnippet || null,
    codeSnippet: p.code_snippet || p.codeSnippet || null,
    poll_data: pollData,
    pollData: pollData,
    poll_options: pollData?.options || p.poll_options || p.pollOptions || null,
    link_metadata: p.link_metadata || p.linkMetadata || null,
    linkMetadata: p.link_metadata || p.linkMetadata || null,
    author: authorObj,
    reactions: p.reactions || {},
    reaction_counts: p.reactions || {},
    reactionCounts: p.reactions || {},
    reaction_count: reactionCount,
    reactionCount: reactionCount,
    comments_count: p.comments_count || p.commentsCount || p.comment_count || 0,
    comment_count: p.comments_count || p.commentsCount || p.comment_count || 0,
    commentsCount: p.comments_count || p.commentsCount || p.comment_count || 0,
    my_reaction: p.my_reaction || p.myReaction || p.user_reaction || null,
    myReaction: p.my_reaction || p.myReaction || p.user_reaction || null,
    user_reaction: p.my_reaction || p.myReaction || p.user_reaction || null,
  };
}

// GET /api/feed — own + friends' posts (+ all users if sparse), latest first
export async function getFeed(req, res, next) {
  try {
    const userId = req.user?.id || null;
    const { page = 1, limit = 20, sortBy = 'recent' } = req.query;
    const offset = (page - 1) * limit;

    let friendIds = [];
    if (userId) {
      // Get friend IDs (friends table stores mutual rows: user_id → friend_id)
      const { data: friendships } = await supabaseAdmin
        .from('friends')
        .select('friend_id')
        .eq('user_id', userId);
      friendIds = (friendships || []).map(f => f.friend_id);
    }

    const authorIds = userId ? [userId, ...friendIds] : [];

    let posts = [];
    if (authorIds.length > 0) {
      // Fetch friend posts first
      const { data: friendPosts, error } = await supabaseAdmin
        .from('posts')
        .select(`
          id, content, post_type, created_at, updated_at, author_id, image_url, media_urls, code_snippet, poll_data, link_metadata,
          author:users!author_id(id, first_name, last_name, avatar, avatar_color, university, role, online_status, last_seen)
        `)
        .in('author_id', authorIds)
        .order('created_at', { ascending: false })
        .range(offset, offset + +limit - 1);

      if (error) throw error;
      posts = friendPosts || [];
    }

    // If fewer than 5 friend posts (or guest mode) → also fetch posts from all users (Discover mode)
    if (posts.length < 5 && offset === 0) {
      let q = supabaseAdmin
        .from('posts')
        .select(`
          id, content, post_type, created_at, updated_at, author_id, image_url, media_urls, code_snippet, poll_data, link_metadata,
          author:users!author_id(id, first_name, last_name, avatar, avatar_color, university, role, online_status, last_seen)
        `);

      if (authorIds.length > 0) {
        q = q.not('author_id', 'in', `(${authorIds.join(',')})`);
      }

      const { data: allPosts } = await q
        .order('created_at', { ascending: false })
        .limit(+limit - posts.length);

      posts = [...posts, ...(allPosts || [])].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
    }

    // Fetch reactions & comment counts for these posts
    const postIds = (posts || []).map(p => p.id);
    let reactionsMap = {}, commentsMap = {}, myReactions = {};

    if (postIds.length > 0) {
      const queries = [
        supabaseAdmin.from('post_reactions').select('post_id, type, user_id').in('post_id', postIds).then(r => r, () => ({ data: [] })),
        supabaseAdmin.from('post_comments').select('post_id').in('post_id', postIds).then(r => r, () => ({ data: [] })),
      ];

      if (userId) {
        queries.push(
          supabaseAdmin.from('post_reactions').select('post_id, type').in('post_id', postIds).eq('user_id', userId).then(r => r, () => ({ data: [] }))
        );
      }

      const [reactionsRes, commentsRes, mineRes] = await Promise.all(queries);
      const reactions = reactionsRes?.data || [];
      const comments = commentsRes?.data || [];
      const mine = mineRes?.data || [];

      // Group reactions by post + type
      reactions.forEach(r => {
        if (!reactionsMap[r.post_id]) reactionsMap[r.post_id] = {};
        reactionsMap[r.post_id][r.type] = (reactionsMap[r.post_id][r.type] || 0) + 1;
      });

      // Comment counts
      comments.forEach(c => {
        commentsMap[c.post_id] = (commentsMap[c.post_id] || 0) + 1;
      });

      // My reactions
      mine.forEach(r => { myReactions[r.post_id] = r.type; });
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

    res.json({ posts: result, page: +page, limit: +limit, total: result.length });
  } catch (err) { next(err); }
}

// POST /api/posts — create a post
export async function createPost(req, res, next) {
  try {
    const {
      content,
      postType,
      post_type,
      type,
      imageUrl,
      image_url,
      mediaUrls,
      media_urls,
      images,
      codeSnippet,
      code_snippet,
      pollData,
      poll_data,
      poll_options,
      linkMetadata,
      link_metadata,
    } = req.body;

    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

    // Normalize post type
    const rawType = postType || post_type || type || 'general';
    const typeMapping = {
      update: 'general',
      general: 'general',
      achievement: 'achievement',
      project_update: 'project_update',
      project: 'project_update',
      looking_for_team: 'looking_for_team',
      poll: 'poll',
    };
    const resolvedType = typeMapping[rawType] || 'general';

    // Normalize media URLs
    let resolvedMedia = [];
    if (Array.isArray(media_urls) && media_urls.length > 0) resolvedMedia = media_urls;
    else if (Array.isArray(mediaUrls) && mediaUrls.length > 0) resolvedMedia = mediaUrls;
    else if (Array.isArray(images) && images.length > 0) resolvedMedia = images;
    else if (imageUrl || image_url) resolvedMedia = [imageUrl || image_url];

    // Normalize code snippet
    const resolvedCode = code_snippet || codeSnippet || null;

    // Normalize poll data
    let resolvedPoll = poll_data || pollData || null;
    if (!resolvedPoll && Array.isArray(poll_options) && poll_options.length > 0) {
      resolvedPoll = {
        question: content.trim(),
        options: poll_options.map((opt, i) => ({
          id: typeof opt === 'object' && opt.id ? opt.id : `opt_${i + 1}`,
          text: typeof opt === 'object' ? opt.text : String(opt),
          votes: [],
        })),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }

    const insertData = {
      author_id: req.user.id,
      content: content.trim(),
      post_type: resolvedType,
      image_url: resolvedMedia[0] || null,
      media_urls: resolvedMedia,
      code_snippet: resolvedCode,
      poll_data: resolvedPoll,
      link_metadata: linkMetadata || link_metadata || null,
    };

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .insert(insertData)
      .select(`
        id, content, post_type, created_at, updated_at, author_id, image_url, media_urls, code_snippet, poll_data, link_metadata,
        author:users!author_id(id, first_name, last_name, avatar, avatar_color, university, role, online_status, last_seen)
      `)
      .single();

    if (error) throw error;
    const result = normPost({ ...post, reactions: {}, comments_count: 0, my_reaction: null });

    // Broadcast to all connected users so feed pages update reactively
    try {
      getIo()?.emit('post:new', { post: result, postId: result.id, authorId: req.user.id });
    } catch (_) {}

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

    // Broadcast post deletion to all clients
    try {
      getIo()?.emit('post:deleted', { postId: req.params.id });
    } catch (_) {}

    res.json({ message: 'Post deleted' });
  } catch (err) { next(err); }
}

// POST /api/posts/:id/react — toggle or switch reaction
export async function reactToPost(req, res, next) {
  try {
    const { type } = req.body;
    const validTypes = ['like', 'love', 'celebrate', 'insightful', 'fire', 'support'];
    if (!validTypes.includes(type)) return res.status(400).json({ error: 'Invalid reaction type' });

    const postId = req.params.id;
    const userId = req.user.id;

    // Check existing reaction
    const { data: existing } = await supabaseAdmin
      .from('post_reactions').select('id, type').eq('post_id', postId).eq('user_id', userId).maybeSingle();

    let action = 'added';
    let currentType = type;

    if (existing) {
      if (existing.type === type) {
        // Same react → remove (toggle off)
        await supabaseAdmin.from('post_reactions').delete().eq('id', existing.id);
        action = 'removed';
        currentType = null;
      } else {
        // Different react → switch
        await supabaseAdmin.from('post_reactions').update({ type }).eq('id', existing.id);
        action = 'switched';
        currentType = type;
      }
    } else {
      // No existing → add
      await supabaseAdmin.from('post_reactions').insert({ post_id: postId, user_id: userId, type });
      action = 'added';
      currentType = type;
    }

    // Query aggregated reaction counts
    const { data: allReactions } = await supabaseAdmin
      .from('post_reactions')
      .select('type')
      .eq('post_id', postId);

    const reactionCounts = {
      like: 0,
      love: 0,
      celebrate: 0,
      insightful: 0,
      fire: 0,
      support: 0,
      total: 0,
    };
    (allReactions || []).forEach((r) => {
      if (reactionCounts[r.type] !== undefined) {
        reactionCounts[r.type]++;
      }
      reactionCounts.total++;
    });

    // Broadcast to all connected clients via Socket.IO
    try {
      getIo()?.emit('post:reacted', {
        postId,
        type: currentType,
        action,
        userId,
        reactionCounts,
      });
    } catch (_) {}

    // Notify post author (if different from reactor and action is not 'removed')
    if (action !== 'removed') {
      try {
        const { data: post } = await supabaseAdmin.from('posts').select('author_id, content').eq('id', postId).single();
        if (post && post.author_id !== userId) {
          const { data: reactor } = await supabaseAdmin.from('users').select('first_name, last_name').eq('id', userId).single();
          const reactorName = reactor ? `${reactor.first_name} ${reactor.last_name}`.trim() : 'Someone';
          const reactionEmojis = { like: '👍', love: '❤️', celebrate: '🎉', insightful: '💡', fire: '🔥', support: '🤝' };
          const notifMsg = `${reactorName} reacted ${reactionEmojis[type] || ''} to your post`;
          broadcastNotification(getIo(), post.author_id, {
            type: 'friend',
            title: 'New Reaction',
            message: notifMsg,
            metadata: { postId },
          });
        }
      } catch (_) {}
    }

    res.json({ action, type: currentType, reaction: currentType, reactionCounts });
  } catch (err) { next(err); }
}

// GET /api/posts/:id/comments — hierarchical 2-tier tree
export async function getComments(req, res, next) {
  try {
    const { data: comments, error } = await supabaseAdmin
      .from('post_comments')
      .select(`
        id, content, created_at, updated_at, parent_comment_id,
        author:users!author_id(id, first_name, last_name, avatar, avatar_color, university, role, online_status)
      `)
      .eq('post_id', req.params.id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const commentMap = new Map();
    const topLevelComments = [];

    (comments || []).forEach(c => {
      const formatted = {
        id: c.id,
        content: c.content,
        createdAt: c.created_at,
        created_at: c.created_at,
        updatedAt: c.updated_at,
        updated_at: c.updated_at,
        parent_comment_id: c.parent_comment_id || null,
        parentCommentId: c.parent_comment_id || null,
        author: c.author ? {
          id: c.author.id,
          firstName: c.author.first_name,
          lastName: c.author.last_name,
          first_name: c.author.first_name,
          last_name: c.author.last_name,
          avatar: c.author.avatar,
          avatarColor: c.author.avatar_color,
          avatar_color: c.author.avatar_color,
          university: c.author.university,
          role: c.author.role,
          onlineStatus: c.author.online_status,
        } : null,
        replies: [],
      };
      commentMap.set(c.id, formatted);
    });

    // Build 2-tier hierarchy
    commentMap.forEach(comment => {
      if (comment.parent_comment_id && commentMap.has(comment.parent_comment_id)) {
        commentMap.get(comment.parent_comment_id).replies.push(comment);
      } else {
        topLevelComments.push(comment);
      }
    });

    res.json({ comments: topLevelComments, total: (comments || []).length });
  } catch (err) { next(err); }
}

// POST /api/posts/:id/comments — add a comment or nested reply
export async function addComment(req, res, next) {
  try {
    const { content, parentCommentId, parent_comment_id } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

    const parentId = parentCommentId || parent_comment_id || null;

    const { data: comment, error } = await supabaseAdmin
      .from('post_comments')
      .insert({
        post_id: req.params.id,
        author_id: req.user.id,
        content: content.trim(),
        parent_comment_id: parentId,
      })
      .select(`
        id, content, created_at, updated_at, parent_comment_id,
        author:users!author_id(id, first_name, last_name, avatar, avatar_color, university, role, online_status)
      `)
      .single();

    if (error) throw error;
    const result = {
      id: comment.id,
      content: comment.content,
      createdAt: comment.created_at,
      created_at: comment.created_at,
      updatedAt: comment.updated_at,
      updated_at: comment.updated_at,
      parent_comment_id: comment.parent_comment_id,
      parentCommentId: comment.parent_comment_id,
      author: {
        id: comment.author.id,
        firstName: comment.author.first_name,
        lastName: comment.author.last_name,
        first_name: comment.author.first_name,
        last_name: comment.author.last_name,
        avatar: comment.author.avatar,
        avatarColor: comment.author.avatar_color,
        avatar_color: comment.author.avatar_color,
        university: comment.author.university,
        role: comment.author.role,
        onlineStatus: comment.author.online_status,
      },
      replies: [],
    };

    // Broadcast comment to all connected clients (real-time feed update)
    try {
      getIo()?.emit('post:comment', {
        postId: req.params.id,
        comment: result,
        parentCommentId: result.parent_comment_id,
        authorId: req.user.id,
      });
    } catch (_) {}

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
    } catch (_) {}

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
    } catch (_) {}

    res.json({ message: 'Comment deleted' });
  } catch (err) { next(err); }
}

// GET /api/posts/:id — get a single post
export async function getPostById(req, res, next) {
  try {
    const postId = req.params.id;
    const userId = req.user?.id || null;

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .select(`
        id, content, post_type, created_at, updated_at, author_id, image_url, media_urls, code_snippet, poll_data, link_metadata,
        author:users!author_id(id, first_name, last_name, avatar, avatar_color, university, role, online_status, last_seen)
      `)
      .eq('id', postId)
      .maybeSingle();

    if (error || !post) return res.status(404).json({ error: 'Post not found' });

    // Fetch reactions & comments count & my reaction
    const [{ data: reactions }, { data: comments }, { data: mine }] = await Promise.all([
      supabaseAdmin.from('post_reactions').select('type').eq('post_id', postId).then(r => r, () => ({ data: [] })),
      supabaseAdmin.from('post_comments').select('id').eq('post_id', postId).then(r => r, () => ({ data: [] })),
      userId ? supabaseAdmin.from('post_reactions').select('type').eq('post_id', postId).eq('user_id', userId).then(r => r, () => ({ data: [] })) : Promise.resolve({ data: [] }),
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

    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    try {
      const parsed = new URL(targetUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return res.status(400).json({ error: 'Only HTTP/HTTPS URLs are allowed' });
      }
      const hostname = parsed.hostname.toLowerCase();
      const blockedPatterns = [
        /^localhost$/i,
        /^127\.\d+\.\d+\.\d+$/,
        /^10\.\d+\.\d+\.\d+$/,
        /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
        /^192\.168\.\d+\.\d+$/,
        /^0\.0\.0\.0$/,
        /^169\.254\.\d+\.\d+$/,
        /^\[?::1\]?$/,
        /^\[?fe80:/i,
        /^\[?fc00:/i,
        /^\[?fd/i,
        /\.local$/i,
        /\.internal$/i,
        /\.onrender\.com$/i,
      ];
      if (blockedPatterns.some(p => p.test(hostname))) {
        return res.status(400).json({ error: 'Cannot scrape internal or private URLs' });
      }
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

    const getMetaTagContent = (htmlStr, propertyOrName) => {
      const regex = new RegExp(`<meta[^>]*(?:property|name)=["']${propertyOrName}["'][^>]*content=["']([^"']*)["']`, 'i');
      const match = htmlStr.match(regex);
      if (match) return match[1];

      const altRegex = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${propertyOrName}["']`, 'i');
      const altMatch = htmlStr.match(altRegex);
      return altMatch ? altMatch[1] : null;
    };

    let title = getMetaTagContent(html, 'og:title') || getMetaTagContent(html, 'twitter:title');
    if (!title) {
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      title = titleMatch ? titleMatch[1] : '';
    }

    let description = getMetaTagContent(html, 'og:description') || getMetaTagContent(html, 'description') || getMetaTagContent(html, 'twitter:description') || '';
    let image = getMetaTagContent(html, 'og:image') || getMetaTagContent(html, 'twitter:image') || '';

    if (image && !/^https?:\/\//i.test(image)) {
      try {
        const base = new URL(targetUrl);
        image = new URL(image, base.origin).href;
      } catch (e) {}
    }

    let domain = '';
    try {
      domain = new URL(targetUrl).hostname;
    } catch (e) {}

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

// GET /api/posts/user/:userId — get public posts by a specific user
export async function getUserPosts(req, res, next) {
  try {
    const { userId } = req.params;
    const { limit = 6 } = req.query;

    const { data: posts, error } = await supabaseAdmin
      .from('posts')
      .select(`
        id, content, post_type, created_at, updated_at, author_id, image_url, media_urls, code_snippet, poll_data, link_metadata,
        author:users!author_id(id, first_name, last_name, avatar, avatar_color, university, role, online_status)
      `)
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(+limit);

    if (error) throw error;

    const postIds = (posts || []).map(p => p.id);
    let reactionsMap = {}, commentsMap = {};

    if (postIds.length > 0) {
      const [{ data: reactions }, { data: comments }] = await Promise.all([
        supabaseAdmin.from('post_reactions').select('post_id, type').in('post_id', postIds).then(r => r, () => ({ data: [] })),
        supabaseAdmin.from('post_comments').select('post_id').in('post_id', postIds).then(r => r, () => ({ data: [] })),
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
    const { content, codeSnippet, code_snippet } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

    const { data: post } = await supabaseAdmin.from('posts').select('author_id').eq('id', req.params.id).single();
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.author_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const updatePayload = { content: content.trim() };
    if (code_snippet !== undefined || codeSnippet !== undefined) {
      updatePayload.code_snippet = code_snippet || codeSnippet || null;
    }

    const { data: updated, error } = await supabaseAdmin
      .from('posts')
      .update(updatePayload)
      .eq('id', req.params.id)
      .select(`
        id, content, post_type, created_at, updated_at, author_id, image_url, media_urls, code_snippet, poll_data, link_metadata,
        author:users!author_id(id, first_name, last_name, avatar, avatar_color, university, role, online_status, last_seen)
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
      .update({ content: content.trim(), updated_at: new Date().toISOString() })
      .eq('id', req.params.cid)
      .select(`
        id, content, created_at, updated_at, parent_comment_id,
        author:users!author_id(id, first_name, last_name, avatar, avatar_color, university, role, online_status)
      `)
      .single();

    if (error) throw error;
    res.json({
      comment: {
        id: updated.id,
        content: updated.content,
        createdAt: updated.created_at,
        created_at: updated.created_at,
        updatedAt: updated.updated_at,
        updated_at: updated.updated_at,
        parent_comment_id: updated.parent_comment_id,
        parentCommentId: updated.parent_comment_id,
        author: updated.author ? {
          id: updated.author.id,
          firstName: updated.author.first_name,
          lastName: updated.author.last_name,
          first_name: updated.author.first_name,
          last_name: updated.author.last_name,
          avatar: updated.author.avatar,
          avatarColor: updated.author.avatar_color,
          avatar_color: updated.author.avatar_color,
          university: updated.author.university,
          role: updated.author.role,
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
          id, content, post_type, created_at, updated_at, image_url, media_urls, code_snippet, poll_data, link_metadata,
          author:users!author_id(id, first_name, last_name, avatar, avatar_color, university, role, online_status, last_seen)
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
        supabaseAdmin.from('post_reactions').select('post_id, type, user_id').in('post_id', postIds).then(r => r, () => ({ data: [] })),
        supabaseAdmin.from('post_comments').select('post_id').in('post_id', postIds).then(r => r, () => ({ data: [] })),
        supabaseAdmin.from('post_reactions').select('post_id, type').in('post_id', postIds).eq('user_id', userId).then(r => r, () => ({ data: [] })),
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

// POST /api/posts/:id/poll/vote (and /api/posts/:id/vote) — vote in a poll
export async function votePoll(req, res, next) {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const { optionId, optionText } = req.body;

    if (!optionId && !optionText) {
      return res.status(400).json({ error: 'Option ID or Option Text is required' });
    }

    const { data: post, error: fetchErr } = await supabaseAdmin
      .from('posts')
      .select('id, poll_data, link_metadata, author_id, content, post_type, created_at, image_url, media_urls, code_snippet')
      .eq('id', postId)
      .single();

    if (fetchErr || !post) return res.status(404).json({ error: 'Post not found' });

    let poll = post.poll_data;
    let isLegacyMetadata = false;

    if (!poll && post.link_metadata?.isPoll) {
      poll = post.link_metadata;
      isLegacyMetadata = true;
    }

    if (!poll || !Array.isArray(poll.options)) {
      return res.status(400).json({ error: 'Post does not contain an active poll' });
    }

    // Check expiration if present
    if (poll.expiresAt && new Date(poll.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({ error: 'This poll has ended' });
    }

    // Atomically toggle or switch vote
    poll.options.forEach(opt => {
      if (!Array.isArray(opt.votes)) opt.votes = [];
      const userIdx = opt.votes.indexOf(userId);
      const isTarget = (optionId && opt.id === optionId) || (optionText && opt.text === optionText) || opt.text === optionId;

      if (isTarget) {
        if (userIdx === -1) {
          opt.votes.push(userId);
        } else {
          opt.votes.splice(userIdx, 1); // Toggle off if already voted
        }
      } else {
        if (userIdx !== -1) {
          opt.votes.splice(userIdx, 1); // Remove previous vote from other options
        }
      }
    });

    const updatePayload = isLegacyMetadata ? { link_metadata: poll } : { poll_data: poll };

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('posts')
      .update(updatePayload)
      .eq('id', postId)
      .select(`
        id, content, post_type, created_at, updated_at, author_id, image_url, media_urls, code_snippet, poll_data, link_metadata,
        author:users!author_id(id, first_name, last_name, avatar, avatar_color, university, role, online_status, last_seen)
      `)
      .single();

    if (updateErr) throw updateErr;

    // Broadcast poll update to all connected clients
    try {
      getIo()?.emit('post:poll-voted', { postId, pollData: poll });
    } catch (_) {}

    res.json({ post: normPost({ ...updated, reactions: {}, comments_count: 0, my_reaction: null }), pollData: poll });
  } catch (err) { next(err); }
}
