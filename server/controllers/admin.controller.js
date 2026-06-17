import { supabaseAdmin } from '../config/supabase.js';

// ── System Flags (in-memory; survives per-process, reset on redeploy) ────────
const FLAGS = {
  maintenanceMode: false,
  registrationEnabled: true,
};
export function getFlags() { return FLAGS; }

// ── Helper: normalize Supabase snake_case → camelCase for frontend ────────────
function normUser(u) {
  return {
    _id: u.id, id: u.id,
    firstName: u.first_name, lastName: u.last_name,
    email: u.email, university: u.university, role: u.role,
    isVerified: u.is_verified, isBanned: u.is_banned,
    createdAt: u.created_at,
  };
}

// GET /api/admin/stats
export async function getStats(req, res, next) {
  try {
    const [
      { count: users },
      { count: teams },
      { count: projects },
      { count: messages },
      { count: onlineUsers },
    ] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('teams').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('projects').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('messages').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('online_status', 'online'),
    ]);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const { count: newUsersToday } = await supabaseAdmin
      .from('users').select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    res.json({ users, teams, projects, totalProjects: projects, messages, onlineUsers, newUsersToday, flags: FLAGS });
  } catch (err) { next(err); }
}

// GET /api/admin/users
export async function getUsers(req, res, next) {
  try {
    const { skip = 0, limit = 200, search = '' } = req.query;
    let q = supabaseAdmin.from('users')
      .select('id,first_name,last_name,email,university,role,is_verified,is_banned,created_at', { count: 'exact' });
    if (search) q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    const { data: users, error, count } = await q.range(+skip, +skip + +limit - 1).order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ users: (users || []).map(normUser), total: count || 0 });
  } catch (err) { next(err); }
}

// PATCH /api/admin/users/:id/ban
export async function banUser(req, res, next) {
  try {
    const { id } = req.params;
    if (id === req.user.id) return res.status(400).json({ error: 'Cannot ban yourself' });
    const { data: user } = await supabaseAdmin.from('users').select('is_banned').eq('id', id).single();
    if (!user) return res.status(404).json({ error: 'User not found' });
    const newBan = req.body.ban !== undefined ? req.body.ban : !user.is_banned;
    await supabaseAdmin.from('users').update({ is_banned: newBan, is_public: !newBan }).eq('id', id);
    res.json({ message: newBan ? 'User banned' : 'User unbanned', isBanned: newBan });
  } catch (err) { next(err); }
}

// PATCH /api/admin/users/:id/role
export async function changeRole(req, res, next) {
  try {
    const { role } = req.body;
    if (!['user', 'student', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    const { data: user, error } = await supabaseAdmin
      .from('users').update({ role }).eq('id', req.params.id)
      .select('id,first_name,last_name,email,role').single();
    if (error || !user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: `Role changed to ${role}`, user });
  } catch (err) { next(err); }
}

// DELETE /api/admin/users/:id
export async function deleteUser(req, res, next) {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
    await supabaseAdmin.from('users').delete().eq('id', req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) { next(err); }
}

// GET /api/admin/teams
export async function getTeams(req, res, next) {
  try {
    const { skip = 0, limit = 200 } = req.query;
    const { data: teams, error, count } = await supabaseAdmin
      .from('teams')
      .select('id,name,description,category,status,is_closed,max_members,members,created_at', { count: 'exact' })
      .range(+skip, +skip + +limit - 1).order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ teams: teams || [], total: count || 0 });
  } catch (err) { next(err); }
}

// DELETE /api/admin/teams/:id
export async function deleteTeam(req, res, next) {
  try {
    await supabaseAdmin.from('teams').delete().eq('id', req.params.id);
    res.json({ message: 'Team deleted' });
  } catch (err) { next(err); }
}

// ── Projects ──────────────────────────────────────────────────────────────────

// GET /api/admin/projects
export async function getProjects(req, res, next) {
  try {
    const { skip = 0, limit = 200 } = req.query;
    const { data: projects, error, count } = await supabaseAdmin
      .from('projects')
      .select('id,title,description,category,status,is_featured,created_at,owner_id', { count: 'exact' })
      .range(+skip, +skip + +limit - 1).order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ projects: projects || [], total: count || 0 });
  } catch (err) { next(err); }
}

// DELETE /api/admin/projects/:id
export async function deleteProject(req, res, next) {
  try {
    await supabaseAdmin.from('projects').delete().eq('id', req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (err) { next(err); }
}

// PATCH /api/admin/projects/:id/feature
export async function featureProject(req, res, next) {
  try {
    const { featured } = req.body;
    const { data, error } = await supabaseAdmin
      .from('projects').update({ is_featured: Boolean(featured) }).eq('id', req.params.id)
      .select('id,is_featured').single();
    if (error) throw error;
    res.json({ message: featured ? 'Project featured' : 'Project unfeatured', project: data });
  } catch (err) { next(err); }
}

// ── System Flags ──────────────────────────────────────────────────────────────

// GET /api/admin/flags
export async function getSystemFlags(req, res) {
  res.json(FLAGS);
}

// PATCH /api/admin/flags
export async function updateFlags(req, res) {
  const allowed = ['maintenanceMode', 'registrationEnabled'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) FLAGS[key] = Boolean(req.body[key]);
  }
  console.log('[Admin] System flags updated:', FLAGS);
  res.json({ message: 'System flags updated', flags: FLAGS });
}

// ── Posts ──────────────────────────────────────────────────────────────────────

// GET /api/admin/posts
export async function getAdminPosts(req, res, next) {
  try {
    const { skip = 0, limit = 200, search = '' } = req.query;
    let q = supabaseAdmin
      .from('posts')
      .select(`
        id, content, post_type, created_at, image_url, link_metadata,
        author:users!author_id(id, first_name, last_name, email, university)
      `, { count: 'exact' });
    if (search) q = q.ilike('content', `%${search}%`);
    const { data: posts, error, count } = await q
      .range(+skip, +skip + +limit - 1)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const result = (posts || []).map(p => ({
      id: p.id,
      content: p.content,
      postType: p.post_type,
      createdAt: p.created_at,
      imageUrl: p.image_url || null,
      linkMetadata: p.link_metadata || null,
      author: p.author ? {
        id: p.author.id,
        firstName: p.author.first_name,
        lastName: p.author.last_name,
        email: p.author.email,
        university: p.author.university,
      } : null,
    }));
    res.json({ posts: result, total: count || 0 });
  } catch (err) { next(err); }
}

// DELETE /api/admin/posts/:id
export async function deleteAdminPost(req, res, next) {
  try {
    await supabaseAdmin.from('posts').delete().eq('id', req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (err) { next(err); }
}

