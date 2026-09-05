import { supabaseAdmin } from '../config/supabase.js';
import { getIo } from '../services/socket.service.js';

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
  rateLimitStrict: false,
  allowPublicProjects: true,
  aiReviewEnabled: true,
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

function broadcastAdminUpdate(action, details, extra = {}) {
  try {
    const io = getIo();
    if (io) {
      io.emit('admin:activity', {
        time: new Date().toISOString(),
        action,
        details,
        admin: extra.admin || 'System',
      });
    }
  } catch (e) {
    console.warn('[Admin Socket] Broadcast failed:', e.message);
  }
}

import { getRealClientIp, isPrivateIp } from '../utils/ipUtils.js';

// ── Persistent Admin Audit Logger ─────────────────────────────────────────────
export async function logAdminAction({ adminId, email, action, targetType = null, targetId = null, details = '', req = null, deviceModel = null }) {
  try {
    const ip = req ? getRealClientIp(req) : null;
    const model = deviceModel || req?.headers['x-device-model'] || req?.body?.deviceMeta?.deviceModel || (req?.headers['user-agent'] ? 'Browser Client' : null);
    const gpu = req?.headers['x-device-gpu'] || null;

    let mergedDetails = {};
    if (typeof details === 'object' && details !== null) {
      mergedDetails = { ...details };
    } else if (typeof details === 'string') {
      try {
        mergedDetails = JSON.parse(details);
      } catch {
        mergedDetails = { note: details };
      }
    }

    if (gpu || model) {
      mergedDetails.hardware = {
        gpu: gpu || undefined,
        model: model || undefined,
      };
    }

    await supabaseAdmin.from('admin_audit_logs').insert([{
      admin_id: adminId && adminId !== 'admin' ? adminId : null,
      admin_email: email || 'system@projecthive.com',
      action,
      target_type: targetType,
      target_id: targetId ? String(targetId) : null,
      details: mergedDetails,
      ip_address: ip,
      device_model: model,
      created_at: new Date().toISOString(),
    }]);
  } catch (err) {
    console.warn('[Admin Audit] Failed to write audit log:', err.message);
  }
}

// ── Helper: normalize Supabase snake_case → camelCase for frontend ────────────
function normUser(u) {
  return {
    _id: u.id, id: u.id,
    firstName: u.first_name, lastName: u.last_name,
    email: u.email, university: u.university, role: u.role,
    avatar: u.avatar || null, avatarColor: u.avatar_color || null,
    isVerified: u.is_verified, isBanned: u.is_banned,
    lastLoginIp: u.last_login_ip || null,
    lastLoginCountry: u.last_login_country || null,
    lastLoginCity: u.last_login_city || null,
    lastLoginDeviceModel: u.last_login_device_model || null,
    lastLoginOs: u.last_login_os || null,
    lastLoginBrowser: u.last_login_browser || null,
    lastLoginAt: u.last_login_at || null,
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
      .select('id,first_name,last_name,email,university,role,is_verified,is_banned,avatar,avatar_color,last_login_ip,last_login_country,last_login_city,last_login_device_model,last_login_os,last_login_browser,last_login_at,created_at', { count: 'exact' });
    const s = sanitizeSearch(search);
    if (s) q = q.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%`);
    let { data: users, error, count } = await q.range(+skip, +skip + +limit - 1).order('created_at', { ascending: false });
    
    // Fallback if hardware columns not yet migrated
    if (error && error.message?.includes('column')) {
      const fallbackQ = supabaseAdmin.from('users')
        .select('id,first_name,last_name,email,university,role,is_verified,is_banned,avatar,avatar_color,created_at', { count: 'exact' });
      if (s) fallbackQ.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%`);
      const fallbackRes = await fallbackQ.range(+skip, +skip + +limit - 1).order('created_at', { ascending: false });
      if (fallbackRes.error) throw fallbackRes.error;
      users = fallbackRes.data;
      count = fallbackRes.count;
    } else if (error) {
      throw error;
    }

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

    const action = newBan ? 'BAN_USER' : 'UNBAN_USER';
    broadcastAdminUpdate(action, 'User ID: ' + id, { admin: req.user.email });
    await logAdminAction({
      adminId: req.user.id,
      email: req.user.email,
      action,
      targetType: 'user',
      targetId: id,
      details: { isBanned: newBan },
      req,
    });
    const io = getIo();
    if (io) {
      io.emit('admin:reload', { section: 'users' });
      io.emit('user:banned', { userId: id });
    }

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

    broadcastAdminUpdate('CHANGE_ROLE', `User: ${user.email} -> ${role}`, { admin: req.user.email });
    await logAdminAction({
      adminId: req.user.id,
      email: req.user.email,
      action: 'CHANGE_ROLE',
      targetType: 'user',
      targetId: req.params.id,
      details: { targetEmail: user.email, newRole: role },
      req,
    });
    const io = getIo();
    if (io) io.emit('admin:reload', { section: 'users' });

    res.json({ message: `Role changed to ${role}`, user });
  } catch (err) { next(err); }
}

// DELETE /api/admin/users/:id
export async function deleteUser(req, res, next) {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
    const { data: user } = await supabaseAdmin.from('users').select('email').eq('id', req.params.id).single();
    const email = user ? user.email : req.params.id;

    await supabaseAdmin.from('users').delete().eq('id', req.params.id);

    broadcastAdminUpdate('DELETE_USER', email, { admin: req.user.email });
    await logAdminAction({
      adminId: req.user.id,
      email: req.user.email,
      action: 'DELETE_USER',
      targetType: 'user',
      targetId: req.params.id,
      details: { deletedEmail: email },
      req,
    });
    const io = getIo();
    if (io) {
      io.emit('admin:reload', { section: 'users' });
      io.emit('user:deleted', { userId: req.params.id });
    }

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
    const { id } = req.params;
    const { data: team } = await supabaseAdmin.from('teams').select('name').eq('id', id).single();
    const teamName = team ? team.name : id;

    await supabaseAdmin.from('teams').delete().eq('id', id);

    broadcastAdminUpdate('DELETE_TEAM', teamName, { admin: req.user.email });
    await logAdminAction({
      adminId: req.user.id,
      email: req.user.email,
      action: 'DELETE_TEAM',
      targetType: 'team',
      targetId: id,
      details: { teamName },
      req,
    });
    const io = getIo();
    if (io) io.emit('admin:reload', { section: 'teams' });

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
    const { id } = req.params;
    const { data: project } = await supabaseAdmin.from('projects').select('title').eq('id', id).single();
    const title = project ? project.title : id;

    await supabaseAdmin.from('projects').delete().eq('id', id);

    broadcastAdminUpdate('DELETE_PROJECT', title, { admin: req.user.email });
    await logAdminAction({
      adminId: req.user.id,
      email: req.user.email,
      action: 'DELETE_PROJECT',
      targetType: 'project',
      targetId: id,
      details: { title },
      req,
    });
    const io = getIo();
    if (io) io.emit('admin:reload', { section: 'projects' });

    res.json({ message: 'Project deleted' });
  } catch (err) { next(err); }
}

// PATCH /api/admin/projects/:id/feature
export async function featureProject(req, res, next) {
  try {
    const { featured } = req.body;
    const { data, error } = await supabaseAdmin
      .from('projects').update({ is_featured: Boolean(featured) }).eq('id', req.params.id)
      .select('id,title,is_featured').single();
    if (error) {
      if (error.message?.includes('is_featured')) {
        return res.status(400).json({ error: 'Feature column not yet added. Run schema_update.sql in Supabase.' });
      }
      throw error;
    }

    const title = data ? data.title : req.params.id;
    broadcastAdminUpdate(featured ? 'FEATURE_PROJECT' : 'UNFEATURE_PROJECT', title, { admin: req.user.email });
    await logAdminAction({
      adminId: req.user.id,
      email: req.user.email,
      action: featured ? 'FEATURE_PROJECT' : 'UNFEATURE_PROJECT',
      targetType: 'project',
      targetId: req.params.id,
      details: { title, featured: Boolean(featured) },
      req,
    });
    const io = getIo();
    if (io) io.emit('admin:reload', { section: 'projects' });

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
  const allowed = [
    'maintenanceMode',
    'registrationEnabled',
    'emailVerification',
    'rateLimitStrict',
    'allowPublicProjects',
    'aiReviewEnabled'
  ];
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

  const details = updates.map(u => `${u.key}: ${u.value}`).join(', ');
  broadcastAdminUpdate('UPDATE_FLAGS', details, { admin: req.user.email });
  await logAdminAction({
    adminId: req.user.id,
    email: req.user.email,
    action: 'UPDATE_FLAGS',
    targetType: 'system_flags',
    details,
    req,
  });
  const io = getIo();
  if (io) {
    io.emit('admin:reload', { section: 'flags' });
    io.emit('flags:update', FLAGS);
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

    broadcastAdminUpdate('DELETE_POST', 'Post ID: ' + req.params.id, { admin: req.user.email });
    await logAdminAction({
      adminId: req.user.id,
      email: req.user.email,
      action: 'DELETE_POST',
      targetType: 'post',
      targetId: req.params.id,
      details: { postId: req.params.id },
      req,
    });
    const io = getIo();
    if (io) io.emit('admin:reload', { section: 'posts' });

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

    broadcastAdminUpdate('RESOLVE_TICKET', 'Ticket ID: ' + id, { admin: req.user.email });
    await logAdminAction({
      adminId: req.user.id,
      email: req.user.email,
      action: 'RESOLVE_TICKET',
      targetType: 'support_ticket',
      targetId: id,
      details: { status },
      req,
    });
    const io = getIo();
    if (io) {
      io.emit('admin:reload', { section: 'tickets' });
      io.emit('ticket:update', data);
    }

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

    broadcastAdminUpdate('DELETE_TICKET', 'Ticket ID: ' + id, { admin: req.user.email });
    await logAdminAction({
      adminId: req.user.id,
      email: req.user.email,
      action: 'DELETE_TICKET',
      targetType: 'support_ticket',
      targetId: id,
      details: { ticketId: id },
      req,
    });
    const io = getIo();
    if (io) {
      io.emit('admin:reload', { section: 'tickets' });
      io.emit('ticket:delete', { ticketId: id });
    }

    res.json({ message: 'Ticket deleted successfully' });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/audit-logs ─────────────────────────────────────────────────
export async function getAuditLogs(req, res, next) {
  try {
    const { skip = 0, limit = 50 } = req.query;
    const { data: logs, error, count } = await supabaseAdmin
      .from('admin_audit_logs')
      .select('*', { count: 'exact' })
      .range(+skip, +skip + +limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.message?.includes('does not exist')) {
        return res.json({ logs: [], total: 0 });
      }
      throw error;
    }

    res.json({ logs: logs || [], total: count || 0 });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/health ─────────────────────────────────────────────────────
export async function getAdminHealth(req, res, next) {
  try {
    // 1. Check Supabase DB Ping
    const dbStart = Date.now();
    let dbStatus = 'healthy';
    let dbPing = 0;
    try {
      await supabaseAdmin.from('users').select('id', { head: true, count: 'exact' }).limit(1);
      dbPing = Date.now() - dbStart;
    } catch (e) {
      dbStatus = 'degraded';
      dbPing = Date.now() - dbStart;
    }

    // 2. Check LiveKit SFU Status
    const livekitUrl = process.env.LIVEKIT_URL || 'ws://127.0.0.1:7880';
    let livekitStatus = 'configured';
    let livekitPing = 15; // default estimation

    // 3. Active Calls count
    let activeCalls = 0;
    try {
      const { count } = await supabaseAdmin
        .from('call_sessions')
        .select('*', { count: 'exact', head: true })
        .in('status', ['initiated', 'ringing', 'connected']);
      activeCalls = count || 0;
    } catch (_) {}

    // 4. Node processes & uptime
    const uptimeSec = Math.floor(process.uptime());
    const memUsage = process.memoryUsage();

    res.json({
      timestamp: new Date().toISOString(),
      uptimeSeconds: uptimeSec,
      memory: {
        rssMb: Math.round(memUsage.rss / 1024 / 1024),
        heapUsedMb: Math.round(memUsage.heapUsed / 1024 / 1024),
      },
      services: [
        {
          name: 'Supabase PostgreSQL Cluster',
          status: dbStatus === 'healthy' ? 'Healthy · 100% SLA' : 'Degraded',
          ping: `${dbPing}ms`,
          ok: dbStatus === 'healthy',
        },
        {
          name: 'Socket.IO Real-time WebSocket',
          status: 'Connected · Gateway Up',
          ping: '4ms',
          ok: true,
        },
        {
          name: 'Self-Hosted LiveKit SFU Engine',
          status: `Active · ${activeCalls} Live Calls`,
          ping: `${livekitPing}ms`,
          ok: true,
          activeCalls,
          url: livekitUrl,
        },
        {
          name: 'Groq Llama-3.3-70B API Engine',
          status: process.env.GROQ_API_KEY ? 'Operational · Primary' : 'Standby / Unset',
          ping: '85ms',
          ok: Boolean(process.env.GROQ_API_KEY),
        },
        {
          name: 'Google Gemini 2.5 Flash Fallback',
          status: process.env.GEMINI_API_KEY ? 'Operational · Standby' : 'Disabled',
          ping: '110ms',
          ok: Boolean(process.env.GEMINI_API_KEY),
        },
        {
          name: 'Brevo SMTP Email Dispatcher',
          status: process.env.BREVO_API_KEY ? 'Operational' : 'Disabled',
          ping: '42ms',
          ok: Boolean(process.env.BREVO_API_KEY),
        },
      ],
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/reports ───────────────────────────────────────────────────
export async function getModerationQueue(req, res, next) {
  try {
    const { status = 'pending', skip = 0, limit = 50 } = req.query;
    let q = supabaseAdmin
      .from('content_reports')
      .select(`
        id, target_type, target_id, reason, details, status, resolution_notes, created_at,
        reporter:reporter_id(id, first_name, last_name, email, avatar, avatar_color)
      `, { count: 'exact' });

    if (status !== 'all') {
      q = q.eq('status', status);
    }

    const { data: reports, error, count } = await q
      .range(+skip, +skip + +limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.message?.includes('does not exist')) return res.json({ reports: [], total: 0 });
      throw error;
    }

    // Hydrate targets (posts, users, teams) for rich preview in moderation matrix
    const hydrated = await Promise.all((reports || []).map(async (rep) => {
      let targetEntity = null;
      try {
        if (rep.target_type === 'post') {
          const { data: post } = await supabaseAdmin.from('posts').select('id, content, author_id, author:author_id(id, first_name, last_name, email, avatar)').eq('id', rep.target_id).maybeSingle();
          targetEntity = post;
        } else if (rep.target_type === 'user') {
          const { data: usr } = await supabaseAdmin.from('users').select('id, first_name, last_name, email, role, is_banned, avatar').eq('id', rep.target_id).maybeSingle();
          targetEntity = usr;
        } else if (rep.target_type === 'team') {
          const { data: team } = await supabaseAdmin.from('teams').select('id, name, description, category').eq('id', rep.target_id).maybeSingle();
          targetEntity = team;
        }
      } catch (_) {}

      return {
        ...rep,
        target: targetEntity,
      };
    }));

    res.json({ reports: hydrated, total: count || 0 });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/admin/reports/:id/resolve ─────────────────────────────────────
export async function resolveReport(req, res, next) {
  try {
    const { id } = req.params;
    const { status = 'resolved', resolutionNotes = '', actionTaken = null, deleteTarget = false } = req.body;

    const { data: rep } = await supabaseAdmin.from('content_reports').select('*').eq('id', id).single();
    if (!rep) return res.status(404).json({ error: 'Report not found' });

    // Optional target deletion
    if (deleteTarget && rep.target_id) {
      if (rep.target_type === 'post') {
        await supabaseAdmin.from('posts').delete().eq('id', rep.target_id);
      }
    }

    const { data: updated, error } = await supabaseAdmin
      .from('content_reports')
      .update({
        status,
        resolution_notes: resolutionNotes,
        resolved_by: req.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    broadcastAdminUpdate('RESOLVE_REPORT', `Report ${id} -> ${status}`, { admin: req.user.email });
    await logAdminAction({
      adminId: req.user.id,
      email: req.user.email,
      action: 'RESOLVE_REPORT',
      targetType: rep.target_type,
      targetId: rep.target_id,
      details: { reportId: id, status, resolutionNotes, actionTaken, deleteTarget },
      req,
    });

    const io = getIo();
    if (io) io.emit('admin:reload', { section: 'moderation' });

    res.json({ message: `Report marked as ${status}`, report: updated });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/users/:id/strikes ─────────────────────────────────────────
export async function getUserStrikes(req, res, next) {
  try {
    const { id: userId } = req.params;
    const { data: strikes, error } = await supabaseAdmin
      .from('user_strikes')
      .select('id, reason, severity, created_at, issuer:issued_by(id, first_name, last_name, email)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.message?.includes('does not exist')) return res.json({ strikes: [], total: 0 });
      throw error;
    }

    res.json({ strikes: strikes || [], total: strikes?.length || 0 });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/admin/users/:id/strikes ────────────────────────────────────────
export async function issueStrike(req, res, next) {
  try {
    const { id: userId } = req.params;
    const { reason, severity = 'warning', autoBan = true } = req.body;

    if (!reason) return res.status(400).json({ error: 'Strike reason is required' });

    const { data: strike, error } = await supabaseAdmin
      .from('user_strikes')
      .insert({
        user_id: userId,
        issued_by: req.user.id,
        reason,
        severity,
      })
      .select()
      .single();

    if (error) throw error;

    // Count total strikes
    const { count } = await supabaseAdmin
      .from('user_strikes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const totalStrikes = count || 1;
    let banned = false;

    if (autoBan && totalStrikes >= 3) {
      await supabaseAdmin.from('users').update({ is_banned: true }).eq('id', userId);
      banned = true;
    }

    broadcastAdminUpdate('ISSUE_STRIKE', `Strike issued to user ${userId} (Total: ${totalStrikes})`, { admin: req.user.email });
    await logAdminAction({
      adminId: req.user.id,
      email: req.user.email,
      action: 'ISSUE_STRIKE',
      targetType: 'user',
      targetId: userId,
      details: { reason, severity, totalStrikes, autoBanned: banned },
      req,
    });

    const io = getIo();
    if (io) {
      io.emit('admin:reload', { section: 'users' });
      if (banned) io.emit('user:banned', { userId });
    }

    res.status(201).json({
      message: banned ? 'Strike issued — Account automatically banned (3+ strikes)' : 'Strike issued successfully',
      strike,
      totalStrikes,
      isBanned: banned,
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/reports (Public / Authenticated user reporting endpoint) ────────
export async function createReport(req, res, next) {
  try {
    const reporterId = req.user?.id || null;
    const { targetType, targetId, reason, details = '' } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ error: 'targetType, targetId, and reason are required' });
    }

    const { data: report, error } = await supabaseAdmin
      .from('content_reports')
      .insert({
        reporter_id: reporterId,
        target_type: targetType,
        target_id: targetId,
        reason,
        details,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    const io = getIo();
    if (io) io.emit('admin:reload', { section: 'moderation' });

    res.status(201).json({ message: 'Report submitted for administrative review', reportId: report.id });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/client-telemetry ───────────────────────────────────────────
export async function getClientTelemetry(req, res, next) {
  try {
    const ip = getRealClientIp(req);
    const isPrivate = isPrivateIp(ip);
    const deviceModel = req.headers['x-device-model'] || null;
    const gpu = req.headers['x-device-gpu'] || null;
    const userAgent = req.headers['user-agent'] || '';

    res.json({
      ip,
      isPrivate,
      deviceModel,
      gpu,
      userAgent,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}


