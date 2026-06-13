import { supabaseAdmin } from '../config/supabase.js';

// GET /api/admin/stats — Platform overview
export async function getStats(req, res, next) {
  try {
    const [
      { count: users },
      { count: teams },
      { count: projects },
      { count: messages },
      { count: friends },
      { count: onlineUsers },
    ] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('teams').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('projects').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('messages').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('friends').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('online_status', 'online'),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: newUsersToday } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    res.json({ users, teams, projects, messages, friends, onlineUsers, newUsersToday });
  } catch (err) { next(err); }
}

// GET /api/admin/users
export async function getUsers(req, res, next) {
  try {
    const { skip = 0, limit = 20, search = '' } = req.query;

    let q = supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, email, university, role, is_verified, is_banned, is_public, online_status, created_at, completion_percentage', { count: 'exact' });

    if (search) {
      q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, error, count } = await q
      .range(+skip, +skip + +limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ users: users || [], total: count || 0, skip: +skip, limit: +limit });
  } catch (err) { next(err); }
}

// PATCH /api/admin/users/:id/ban
export async function banUser(req, res, next) {
  try {
    const { id } = req.params;
    if (id === req.user.id) return res.status(400).json({ error: 'Cannot ban yourself' });

    const { data: user } = await supabaseAdmin.from('users').select('is_banned').eq('id', id).single();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { ban } = req.body;
    const newBan = ban !== undefined ? ban : !user.is_banned;
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
      .select('id, first_name, last_name, email, role').single();
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
    const { skip = 0, limit = 20 } = req.query;
    const { data: teams, error, count } = await supabaseAdmin
      .from('teams')
      .select('*, leader:leader_id(id, first_name, last_name, email)', { count: 'exact' })
      .range(+skip, +skip + +limit - 1)
      .order('created_at', { ascending: false });
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
