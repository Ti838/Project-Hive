import { supabaseAdmin } from '../config/supabase.js';

function sanitizeSearch(input) {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/[%_(),.;'"\\=<>!#|&\-\[\]{}^~`]/g, '').replace(/\s+/g, ' ').trim().substring(0, 100);
}

export async function submitProject(req, res, next) {
  try {
    const userId = req.user.id;
    const { title, description, techStack, demoURL, githubURL, category, tags, thumbnail, looking_for_members } = req.body;

    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .insert({
        title,
        description: description || '',
        tech_stack: techStack || [],
        demo_url: demoURL || null,
        github_url: githubURL || null,
        category: category || '',
        tags: tags || [],
        thumbnail: thumbnail || null,
        owner_id: userId,
        status: 'active',
        looking_for_members: looking_for_members || false,
      })
      .select('*, owner:owner_id(id, first_name, last_name, avatar, avatar_color)')
      .single();

    if (error) throw error;

    // Update stats
    const { data: u } = await supabaseAdmin.from('users').select('projects_posted').eq('id', userId).single();
    await supabaseAdmin.from('users').update({ projects_posted: (u?.projects_posted || 0) + 1 }).eq('id', userId);

    res.status(201).json({ message: 'Project submitted successfully', project });
  } catch (err) { next(err); }
}

export async function getProjects(req, res, next) {
  try {
    const { skip = 0, limit = 20, search, sortBy = 'newest', category } = req.query;

    let q = supabaseAdmin
      .from('projects')
      .select('*, owner:owner_id(id, first_name, last_name, avatar, avatar_color, university)', { count: 'exact' })
      .eq('status', 'active');

    if (search) { const s = sanitizeSearch(search); if (s) q = q.or(`title.ilike.%${s}%,description.ilike.%${s}%`); }
    if (category) q = q.eq('category', category);

    if (sortBy === 'popular') q = q.order('likes', { ascending: false });
    else q = q.order('created_at', { ascending: false });

    q = q.range(parseInt(skip), parseInt(skip) + parseInt(limit) - 1);

    const { data: projects, error, count } = await q;
    if (error) throw error;

    // Attach isLiked field if user is logged in
    let likedProjectIds = new Set();
    if (req.user && req.user.id && projects && projects.length) {
      const pids = projects.map(p => p.id);
      const { data: likes } = await supabaseAdmin
        .from('project_likes')
        .select('project_id')
        .eq('user_id', req.user.id)
        .in('project_id', pids);
      if (likes) {
        likes.forEach(lk => likedProjectIds.add(lk.project_id));
      }
    }

    const projectsWithLike = (projects || []).map(p => ({
      ...p,
      isLiked: likedProjectIds.has(p.id)
    }));

    res.json({
      projects: projectsWithLike,
      pagination: { total: count || 0, skip: parseInt(skip), limit: parseInt(limit), hasMore: parseInt(skip) + parseInt(limit) < (count || 0) },
    });
  } catch (err) { next(err); }
}

export async function getProjectDetail(req, res, next) {
  try {
    const { id } = req.params;
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select('*, owner:owner_id(id, first_name, last_name, avatar, avatar_color, university, github, linkedin, portfolio)')
      .eq('id', id)
      .single();

    if (error || !project) return res.status(404).json({ error: 'Project not found' });

    // Increment views
    await supabaseAdmin.from('projects').update({ views: (project.views || 0) + 1 }).eq('id', id);

    let isLiked = false;
    if (req.user && req.user.id) {
      const { data: like } = await supabaseAdmin
        .from('project_likes')
        .select('id')
        .eq('project_id', id)
        .eq('user_id', req.user.id)
        .maybeSingle();
      if (like) isLiked = true;
    }

    res.json({ ...project, isLiked });
  } catch (err) { next(err); }
}

export async function updateProject(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: proj } = await supabaseAdmin.from('projects').select('owner_id').eq('id', id).single();
    if (!proj) return res.status(404).json({ error: 'Project not found' });
    if (proj.owner_id !== userId) return res.status(403).json({ error: 'Only creator can update' });

    const { title, description, techStack, demoURL, githubURL, category, tags, thumbnail, status } = req.body;
    const updates = {};
    if (title !== undefined)       updates.title = title;
    if (description !== undefined) updates.description = description;
    if (techStack !== undefined)   updates.tech_stack = techStack;
    if (demoURL !== undefined)     updates.demo_url = demoURL;
    if (githubURL !== undefined)   updates.github_url = githubURL;
    if (category !== undefined)    updates.category = category;
    if (tags !== undefined)        updates.tags = tags;
    if (thumbnail !== undefined)   updates.thumbnail = thumbnail;
    if (status !== undefined)      updates.status = status;

    const { data: project, error } = await supabaseAdmin.from('projects').update(updates).eq('id', id).select('*, owner:owner_id(id, first_name, last_name, avatar, avatar_color)').single();
    if (error) throw error;
    res.json({ message: 'Project updated', project });
  } catch (err) { next(err); }
}

export async function deleteProject(req, res, next) {
  try {
    const { id } = req.params;
    const { data: proj } = await supabaseAdmin.from('projects').select('owner_id').eq('id', id).single();
    if (!proj) return res.status(404).json({ error: 'Project not found' });
    if (proj.owner_id !== req.user.id) return res.status(403).json({ error: 'Only creator can delete' });
    await supabaseAdmin.from('projects').delete().eq('id', id);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) { next(err); }
}

export async function likeProject(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: existing } = await supabaseAdmin.from('project_likes').select('id').eq('project_id', id).eq('user_id', userId).single();

    if (existing) {
      await supabaseAdmin.from('project_likes').delete().eq('id', existing.id);
      const { data: p } = await supabaseAdmin.from('projects').select('likes').eq('id', id).single();
      await supabaseAdmin.from('projects').update({ likes: Math.max(0, (p?.likes || 0) - 1) }).eq('id', id);
      return res.json({ message: 'Project unliked', isLiked: false });
    }

    await supabaseAdmin.from('project_likes').insert({ project_id: id, user_id: userId });
    const { data: p } = await supabaseAdmin.from('projects').select('likes').eq('id', id).single();
    await supabaseAdmin.from('projects').update({ likes: (p?.likes || 0) + 1 }).eq('id', id);
    res.json({ message: 'Project liked', isLiked: true });
  } catch (err) { next(err); }
}

export async function saveProject(req, res, next) {
  try {
    const { id: projectId } = req.params;
    const userId = req.user.id;

    // Verify project exists
    const { data: proj } = await supabaseAdmin.from('projects').select('id').eq('id', projectId).maybeSingle();
    if (!proj) return res.status(404).json({ error: 'Project not found' });

    // Toggle save
    const { data: existing } = await supabaseAdmin
      .from('saved_projects').select('id').eq('project_id', projectId).eq('user_id', userId).maybeSingle();

    if (existing) {
      await supabaseAdmin.from('saved_projects').delete().eq('id', existing.id);
      return res.json({ saved: false, message: 'Project unsaved' });
    }

    await supabaseAdmin.from('saved_projects').insert({ project_id: projectId, user_id: userId });
    res.json({ saved: true, message: 'Project saved' });
  } catch (err) { next(err); }
}

// GET /api/projects/saved — get all saved projects for the current user
export async function getSavedProjects(req, res, next) {
  try {
    const userId = req.user.id;
    const { skip = 0, limit = 20 } = req.query;

    const { data: savedRows, error, count } = await supabaseAdmin
      .from('saved_projects')
      .select(`
        project:project_id(
          *, owner:owner_id(id, first_name, last_name, avatar, avatar_color, university)
        )
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(+skip, +skip + +limit - 1);

    if (error) throw error;

    const projects = (savedRows || []).map(r => r.project).filter(Boolean);
    res.json({
      projects,
      pagination: { total: count || 0, skip: +skip, limit: +limit, hasMore: +skip + +limit < (count || 0) },
    });
  } catch (err) { next(err); }
}
