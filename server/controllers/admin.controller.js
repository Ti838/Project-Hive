import { supabaseAdmin } from '../config/supabase.js';

// ── Input sanitizer for Supabase filter parameters ───────────────────────────
// Prevents injection through ilike/or filter patterns
function sanitizeSearch(input) {
  if (!input || typeof input !== 'string') return '';
  // Strip SQL/filter-dangerous chars AND patterns that trigger Cloudflare WAF
  return input.replace(/[%_(),.;'"\\=<>!#|&\-\[\]{}^~`]/g, '').replace(/\s+/g, ' ').trim().substring(0, 100);
}

// ── System Flags (DB-backed — persists across restarts) ──────────────────────
const FLAGS = {
  maintenanceMode: false,
  registrationEnabled: true,
  emailVerification: false,
};

// Load flags from DB on startup (non-blocking)
export async function loadFlagsFromDB() {
  try {
    const { data } = await supabaseAdmin.from('system_flags').select('key, value');
    if (data) {
      data.forEach(row => {
        if (row.key in FLAGS) FLAGS[row.key] = row.value;
      });
    }
  } catch (e) {
    console.warn('[Admin] Could not load system flags from DB (using defaults):', e.message);
  }
}
export function getFlags() { return FLAGS; }

// ── Helper: normalize Supabase snake_case → camelCase for frontend ────────────
function normUser(u) {
  return {
    _id: u.id, id: u.id,
    firstName: u.first_name, lastName: u.last_name,
    email: u.email, university: u.university, role: u.role,
    avatar: u.avatar || null, avatarColor: u.avatar_color || null,
    isVerified: u.is_verified, isBanned: u.is_banned,
    createdAt: u.created_at,
  };
}

// GET /api/admin/stats
export async function getStats(req, res, next) {
  try {
    const safeCount = async (table, filters = {}) => {
      try {
        let q = supabaseAdmin.from(table).select('*', { count: 'exact', head: true });
        for (const [key, val] of Object.entries(filters)) q = q.eq(key, val);
        const { count } = await q;
        return count || 0;
      } catch { return 0; }
    };

    const [users, teams, projects, messages, onlineUsers, bannedUsers, posts] = await Promise.all([
      safeCount('users'),
      safeCount('teams'),
      safeCount('projects'),
      safeCount('messages'),
      safeCount('users', { online_status: 'online' }),
      safeCount('users', { is_banned: true }),
      safeCount('posts'),
    ]);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    let newUsersToday = 0;
    try {
      const { count } = await supabaseAdmin
        .from('users').select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());
      newUsersToday = count || 0;
    } catch {}

    res.json({ users, teams, projects, totalProjects: projects, messages, onlineUsers, newUsersToday, bannedUsers, posts, flags: FLAGS });
  } catch (err) { next(err); }
}

// GET /api/admin/users
export async function getUsers(req, res, next) {
  try {
    const { skip = 0, limit = 200, search = '' } = req.query;
    let q = supabaseAdmin.from('users')
      .select('id,first_name,last_name,email,university,role,is_verified,is_banned,avatar,avatar_color,created_at', { count: 'exact' });
    const s = sanitizeSearch(search);
    if (s) q = q.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%`);
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
      .select('id, name, description, category, is_open, max_size, leader_id, created_at, team_members(user_id)', { count: 'exact' })
      .range(+skip, +skip + +limit - 1).order('created_at', { ascending: false });
    if (error) throw error;
    // Normalize for frontend
    const normalized = (teams || []).map(t => ({
      ...t,
      member_count: t.team_members?.length || 0,
      max_members: t.max_size,
      is_closed: !t.is_open,
    }));
    res.json({ teams: normalized, total: count || 0 });
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
    // Try with is_featured first, fall back without if column doesn't exist
    let result = await supabaseAdmin
      .from('projects')
      .select('id, title, description, category, status, is_featured, created_at, owner_id, author:users!owner_id(id, first_name, last_name, email)', { count: 'exact' })
      .range(+skip, +skip + +limit - 1).order('created_at', { ascending: false });
    
    if (result.error && result.error.message?.includes('is_featured')) {
      // Column doesn't exist yet — query without it
      result = await supabaseAdmin
        .from('projects')
        .select('id, title, description, category, status, created_at, owner_id, author:users!owner_id(id, first_name, last_name, email)', { count: 'exact' })
        .range(+skip, +skip + +limit - 1).order('created_at', { ascending: false });
    }
    if (result.error) throw result.error;
    res.json({ projects: result.data || [], total: result.count || 0 });
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
    if (error) {
      if (error.message?.includes('is_featured')) {
        return res.status(400).json({ error: 'Feature column not yet added. Run schema_update.sql in Supabase.' });
      }
      throw error;
    }
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
  const allowed = ['maintenanceMode', 'registrationEnabled', 'emailVerification'];
  const updates = [];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      FLAGS[key] = Boolean(req.body[key]);
      updates.push({ key, value: FLAGS[key], updated_at: new Date().toISOString() });
    }
  }
  // Persist to DB (upsert)
  if (updates.length > 0) {
    try {
      await supabaseAdmin.from('system_flags').upsert(updates, { onConflict: 'key' });
    } catch (e) {
      console.warn('[Admin] Failed to persist flags to DB:', e.message);
    }
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
    const s = sanitizeSearch(search);
    if (s) q = q.ilike('content', `%${s}%`);
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

// ── Support Tickets ──────────────────────────────────────────────────────────
export async function getTickets(req, res, next) {
  try {
    const { skip = 0, limit = 200 } = req.query;
    const { data: tickets, error, count } = await supabaseAdmin
      .from('support_tickets')
      .select('id, category, subject, message, status, created_at, user_id, author:users!user_id(id, first_name, last_name, email)', { count: 'exact' })
      .range(+skip, +skip + +limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.message?.includes('does not exist')) {
        return res.json({ tickets: [], total: 0 });
      }
      throw error;
    }

    const normalized = (tickets || []).map(t => ({
      id: t.id,
      category: t.category,
      subject: t.subject,
      message: t.message,
      status: t.status,
      createdAt: t.created_at,
      author: t.author ? {
        id: t.author.id,
        firstName: t.author.first_name,
        lastName: t.author.last_name,
        email: t.author.email
      } : null
    }));

    res.json({ tickets: normalized, total: count || 0 });
  } catch (err) {
    next(err);
  }
}

export async function resolveTicket(req, res, next) {
  try {
    const { id } = req.params;
    const { status = 'resolved' } = req.body;
    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: `Ticket status updated to ${status}`, ticket: data });
  } catch (err) {
    next(err);
  }
}

export async function deleteTicket(req, res, next) {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from('support_tickets').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Ticket deleted successfully' });
  } catch (err) {
    next(err);
  }
}


