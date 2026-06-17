import { supabaseAdmin } from '../config/supabase.js';

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
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get friend IDs
    const { data: friendships } = await supabaseAdmin
      .from('friends')
      .select('requester_id, recipient_id')
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
      .eq('status', 'accepted');

    const friendIds = (friendships || []).map(f =>
      f.requester_id === userId ? f.recipient_id : f.requester_id
    );
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
        supabaseAdmin.from('post_reactions').select('post_id, type, user_id').in('post_id', postIds),
        supabaseAdmin.from('post_comments').select('post_id').in('post_id', postIds),
        supabaseAdmin.from('post_reactions').select('post_id, type').in('post_id', postIds).eq('user_id', userId),
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

    const result = (posts || []).map(p => normPost({
      ...p,
      reactions: reactionsMap[p.id] || {},
      comments_count: commentsMap[p.id] || 0,
      my_reaction: myReactions[p.id] || null,
    }));

    res.json({ posts: result, page: +page, limit: +limit });
  } catch (err) { next(err); }
}

// POST /api/posts — create a post
export async function createPost(req, res, next) {
  try {
    const { content, postType = 'general', imageUrl = null, linkMetadata = null } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

    const validTypes = ['general', 'achievement', 'project_update', 'looking_for_team'];
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
    res.status(201).json({ post: normPost({ ...post, reactions: {}, comments_count: 0, my_reaction: null }) });
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
    res.status(201).json({
      comment: {
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
      }
    });
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
      supabaseAdmin.from('post_reactions').select('type').eq('post_id', postId),
      supabaseAdmin.from('post_comments').select('id').eq('post_id', postId),
      supabaseAdmin.from('post_reactions').select('type').eq('post_id', postId).eq('user_id', userId),
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


