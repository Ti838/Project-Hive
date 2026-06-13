import { supabaseAdmin } from '../config/supabase.js';

// ─── CREATE TEAM ──────────────────────────────────────────────────────────────
export async function createTeam(req, res, next) {
  try {
    const userId = req.user.id;
    const { name, description, maxMembers, category, tags } = req.body;

    const { data: team, error } = await supabaseAdmin
      .from('teams')
      .insert({
        name,
        description: description || '',
        max_size: maxMembers || 5,
        category: category || '',
        tags: tags || [],
        leader_id: userId,
        is_open: true,
      })
      .select()
      .single();

    if (error) throw error;

    // Add creator as leader member
    await supabaseAdmin.from('team_members').insert({ team_id: team.id, user_id: userId, role: 'leader' });

    // Update user stat
    await supabaseAdmin.from('users')
      .update({ teams_created: supabaseAdmin.rpc ? undefined : undefined })
      .eq('id', userId);

    // Simpler increment
    const { data: u } = await supabaseAdmin.from('users').select('teams_created').eq('id', userId).single();
    await supabaseAdmin.from('users').update({ teams_created: (u?.teams_created || 0) + 1 }).eq('id', userId);

    console.log('[ProjectHive] Team created:', team.name);
    res.status(201).json({ message: 'Team created successfully', team });
  } catch (err) {
    console.error('[ProjectHive] Create team error:', err);
    next(err);
  }
}

// ─── GET TEAMS ────────────────────────────────────────────────────────────────
export async function getTeams(req, res, next) {
  try {
    const { skip = 0, limit = 20, search, category } = req.query;

    let q = supabaseAdmin
      .from('teams')
      .select(`
        *,
        leader:leader_id(id, first_name, last_name, avatar, avatar_color),
        team_members(user_id, role, users(id, first_name, last_name, avatar, avatar_color))
      `, { count: 'exact' })
      .eq('is_open', true);

    if (search) q = q.ilike('name', `%${search}%`);
    if (category) q = q.eq('category', category);

    q = q.range(parseInt(skip), parseInt(skip) + parseInt(limit) - 1).order('created_at', { ascending: false });

    const { data: teams, error, count } = await q;
    if (error) throw error;

    res.json({
      teams: teams || [],
      pagination: { total: count || 0, skip: parseInt(skip), limit: parseInt(limit), hasMore: parseInt(skip) + parseInt(limit) < (count || 0) },
    });
  } catch (err) { next(err); }
}

// ─── GET TEAM DETAIL ──────────────────────────────────────────────────────────
export async function getTeamDetail(req, res, next) {
  try {
    const { id } = req.params;
    const { data: team, error } = await supabaseAdmin
      .from('teams')
      .select(`
        *,
        leader:leader_id(id, first_name, last_name, avatar, avatar_color, university),
        team_members(user_id, role, joined_at, users(id, first_name, last_name, avatar, avatar_color, skills(*)))
      `)
      .eq('id', id)
      .single();

    if (error || !team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (err) { next(err); }
}

// ─── UPDATE TEAM ──────────────────────────────────────────────────────────────
export async function updateTeam(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check leadership
    const { data: mem } = await supabaseAdmin.from('team_members').select('role').eq('team_id', id).eq('user_id', userId).single();
    if (!mem || mem.role !== 'leader') return res.status(403).json({ error: 'Only team leader can update' });

    const { name, description, maxMembers, category, tags, isOpen } = req.body;
    const updates = {};
    if (name !== undefined)       updates.name = name;
    if (description !== undefined) updates.description = description;
    if (maxMembers !== undefined)  updates.max_size = maxMembers;
    if (category !== undefined)    updates.category = category;
    if (tags !== undefined)        updates.tags = tags;
    if (isOpen !== undefined)      updates.is_open = isOpen;

    const { data: team, error } = await supabaseAdmin.from('teams').update(updates).eq('id', id).select().single();
    if (error) throw error;
    res.json({ message: 'Team updated successfully', team });
  } catch (err) { next(err); }
}

// ─── POST JOIN REQUEST ────────────────────────────────────────────────────────
export async function postJoinRequest(req, res, next) {
  try {
    const userId = req.user.id;
    const { teamId } = req.params;
    const { message = '' } = req.body;

    const { data: team } = await supabaseAdmin.from('teams').select('id, name, leader_id').eq('id', teamId).single();
    if (!team) return res.status(404).json({ error: 'Team not found' });

    // Check already member
    const { data: mem } = await supabaseAdmin.from('team_members').select('id').eq('team_id', teamId).eq('user_id', userId).single();
    if (mem) return res.status(400).json({ error: 'Already a member of this team' });

    // Check pending request
    const { data: existing } = await supabaseAdmin.from('join_requests').select('id').eq('team_id', teamId).eq('user_id', userId).eq('status', 'pending').single();
    if (existing) return res.status(400).json({ error: 'Join request already pending' });

    const { data: jr, error } = await supabaseAdmin.from('join_requests').insert({ team_id: teamId, user_id: userId, message }).select().single();
    if (error) throw error;

    // Notify team leader
    const { data: applicant } = await supabaseAdmin.from('users').select('first_name, last_name').eq('id', userId).single();
    await supabaseAdmin.from('notifications').insert({
      user_id: team.leader_id,
      type: 'join_request',
      title: `New join request`,
      message: `${applicant?.first_name} ${applicant?.last_name} requested to join ${team.name}`,
      data: { teamId, userId },
    });

    res.status(201).json({ message: 'Join request submitted', joinRequest: jr });
  } catch (err) { next(err); }
}

// ─── ACCEPT JOIN REQUEST ──────────────────────────────────────────────────────
export async function acceptJoinRequest(req, res, next) {
  try {
    const { teamId, requestId } = req.params;
    const userId = req.user.id;

    const { data: mem } = await supabaseAdmin.from('team_members').select('role').eq('team_id', teamId).eq('user_id', userId).single();
    if (!mem || mem.role !== 'leader') return res.status(403).json({ error: 'Only team leader can accept' });

    const { data: jr } = await supabaseAdmin.from('join_requests').select('*').eq('id', requestId).single();
    if (!jr) return res.status(404).json({ error: 'Join request not found' });

    // Add to team
    await supabaseAdmin.from('team_members').insert({ team_id: teamId, user_id: jr.user_id, role: 'member' });
    await supabaseAdmin.from('join_requests').update({ status: 'accepted' }).eq('id', requestId);

    // Notify applicant
    const { data: team } = await supabaseAdmin.from('teams').select('name').eq('id', teamId).single();
    await supabaseAdmin.from('notifications').insert({
      user_id: jr.user_id,
      type: 'team_update',
      title: 'Join Request Accepted!',
      message: `You were accepted to join ${team?.name}`,
      data: { teamId },
    });

    // Update stats
    const { data: u } = await supabaseAdmin.from('users').select('teams_joined').eq('id', jr.user_id).single();
    await supabaseAdmin.from('users').update({ teams_joined: (u?.teams_joined || 0) + 1 }).eq('id', jr.user_id);

    res.json({ message: 'Join request accepted' });
  } catch (err) { next(err); }
}

// ─── REJECT JOIN REQUEST ──────────────────────────────────────────────────────
export async function rejectJoinRequest(req, res, next) {
  try {
    const { teamId, requestId } = req.params;
    const userId = req.user.id;

    const { data: mem } = await supabaseAdmin.from('team_members').select('role').eq('team_id', teamId).eq('user_id', userId).single();
    if (!mem || mem.role !== 'leader') return res.status(403).json({ error: 'Only team leader can reject' });

    await supabaseAdmin.from('join_requests').update({ status: 'rejected' }).eq('id', requestId);
    res.json({ message: 'Join request rejected' });
  } catch (err) { next(err); }
}

// ─── GET TEAM REQUESTS ────────────────────────────────────────────────────────
export async function getTeamRequests(req, res, next) {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;

    const { data: mem } = await supabaseAdmin.from('team_members').select('role').eq('team_id', teamId).eq('user_id', userId).single();
    if (!mem || mem.role !== 'leader') return res.status(403).json({ error: 'Only team leader can view requests' });

    const { data: requests, error } = await supabaseAdmin
      .from('join_requests')
      .select('*, users(id, first_name, last_name, avatar, avatar_color, university, skills(*))')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(requests || []);
  } catch (err) { next(err); }
}
