import { supabaseAdmin } from '../config/supabase.js';
import { broadcastNotification, getIo } from '../services/socket.service.js';

function sanitizeSearch(input) {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/[%_(),.;'"\\=<>!#|&\-\[\]{}^~`]/g, '').replace(/\s+/g, ' ').trim().substring(0, 100);
}

function cleanDescription(desc) {
  if (!desc || typeof desc !== 'string') return desc || '';
  const trimmed = desc.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed.text || parsed.description || parsed.content || parsed.bio || trimmed;
      }
    } catch {
      // Return raw if not JSON
    }
  }
  return desc;
}

// ─── CREATE TEAM ──────────────────────────────────────────────────────────────
export async function createTeam(req, res, next) {
  try {
    const userId = req.user.id;
    const {
      name,
      description,
      maxMembers,
      category,
      tags,
      isOpen,
      avatarUrl,
      avatar_url,
      bannerUrl,
      banner_url,
      type,
      rules,
    } = req.body;

    const determinedType = type || (category?.startsWith('community:') ? 'community' : 'team');

    const { data: team, error } = await supabaseAdmin
      .from('teams')
      .insert({
        name,
        description: cleanDescription(description) || '',
        max_size: maxMembers || 5,
        category: category || '',
        tags: tags || [],
        leader_id: userId,
        is_open: isOpen !== undefined ? isOpen : true,
        avatar_url: avatarUrl || avatar_url || null,
        banner_url: bannerUrl || banner_url || null,
        type: determinedType,
        rules: rules || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Add creator as leader member
    await supabaseAdmin.from('team_members').insert({ team_id: team.id, user_id: userId, role: 'leader' });

    // Update user stat
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
    const { skip = 0, limit = 20, page, search, category, type = 'all', isOpen } = req.query;
    const currentUserId = req.user?.id;
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = page ? (Math.max(1, parseInt(page)) - 1) * limitNum : Math.max(0, parseInt(skip) || 0);

    let q = supabaseAdmin
      .from('teams')
      .select(`
        *,
        leader:leader_id(id, first_name, last_name, avatar, avatar_color),
        team_members(user_id, role, users(id, first_name, last_name, avatar, avatar_color))
      `, { count: 'exact' });

    // Filter by isOpen if explicitly specified; otherwise default to open teams
    if (isOpen !== undefined && isOpen !== 'all' && isOpen !== '') {
      const openBool = isOpen === 'true' || isOpen === true;
      q = q.eq('is_open', openBool);
    } else if (isOpen === undefined) {
      q = q.eq('is_open', true);
    }

    // Filter by type: 'team' | 'community' | 'all'
    if (type === 'community') {
      q = q.or('type.eq.community,category.ilike.community:%');
    } else if (type === 'team') {
      q = q.neq('type', 'community').not('category', 'like', 'community:%');
    }

    if (search) {
      const s = sanitizeSearch(search);
      if (s) {
        q = q.or(`name.ilike.%${s}%,description.ilike.%${s}%`);
      }
    }

    if (category) {
      q = q.eq('category', category);
    }

    q = q.range(offset, offset + limitNum - 1).order('created_at', { ascending: false });

    const { data: teams, error, count } = await q;
    if (error) throw error;

    // Hydrate join_requests status if user is authenticated
    let pendingTeamIds = new Set();
    if (currentUserId && teams && teams.length > 0) {
      const teamIds = teams.map(t => t.id);
      const { data: pendingReqs } = await supabaseAdmin
        .from('join_requests')
        .select('team_id')
        .eq('user_id', currentUserId)
        .eq('status', 'pending')
        .in('team_id', teamIds);

      if (pendingReqs) {
        pendingTeamIds = new Set(pendingReqs.map(r => r.team_id));
      }
    }

    const normalized = (teams || []).map(t => {
      const memberCount = (t.team_members || []).length;
      const maxSize = t.max_size || t.max_members || 5;
      const openRoles = Math.max(0, maxSize - memberCount);

      const isLeader = Boolean(
        currentUserId && (
          t.leader_id === currentUserId ||
          t.team_members?.some(m => m.user_id === currentUserId && m.role === 'leader')
        )
      );
      const isMember = Boolean(
        currentUserId && (
          isLeader ||
          t.team_members?.some(m => m.user_id === currentUserId)
        )
      );
      const hasPendingRequest = Boolean(currentUserId && pendingTeamIds.has(t.id));

      return {
        ...t,
        description: cleanDescription(t.description),
        max_members: maxSize,
        member_count: memberCount,
        open_roles: openRoles,
        isMember,
        is_member: isMember,
        isLeader,
        is_leader: isLeader,
        hasPendingRequest,
        has_pending_request: hasPendingRequest,
      };
    });

    res.json({
      teams: normalized,
      pagination: {
        total: count || 0,
        skip: offset,
        limit: limitNum,
        page: page ? parseInt(page) : Math.floor(offset / limitNum) + 1,
        pages: Math.ceil((count || 0) / limitNum),
        hasMore: offset + limitNum < (count || 0),
      },
    });
  } catch (err) { next(err); }
}

// ─── GET TEAM DETAIL ──────────────────────────────────────────────────────────
export async function getTeamDetail(req, res, next) {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

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
    team.description = cleanDescription(team.description);

    let hasPendingRequest = false;
    if (currentUserId) {
      const { data: jr } = await supabaseAdmin
        .from('join_requests')
        .select('id')
        .eq('team_id', id)
        .eq('user_id', currentUserId)
        .eq('status', 'pending')
        .maybeSingle();
      hasPendingRequest = Boolean(jr);
    }

    const memberCount = (team.team_members || []).length;
    const maxSize = team.max_size || team.max_members || 5;
    const openRoles = Math.max(0, maxSize - memberCount);

    const isLeader = Boolean(
      currentUserId && (
        team.leader_id === currentUserId ||
        team.team_members?.some(m => m.user_id === currentUserId && m.role === 'leader')
      )
    );
    const isMember = Boolean(
      currentUserId && (
        isLeader ||
        team.team_members?.some(m => m.user_id === currentUserId)
      )
    );

    res.json({
      ...team,
      member_count: memberCount,
      open_roles: openRoles,
      isMember,
      is_member: isMember,
      isLeader,
      is_leader: isLeader,
      hasPendingRequest,
      has_pending_request: hasPendingRequest,
    });
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

    const {
      name,
      description,
      maxMembers,
      category,
      tags,
      isOpen,
      avatarUrl,
      avatar_url,
      bannerUrl,
      banner_url,
      type,
      rules,
    } = req.body;

    const updates = {};
    if (name !== undefined)        updates.name = name;
    if (description !== undefined) updates.description = cleanDescription(description);
    if (maxMembers !== undefined)  updates.max_size = maxMembers;
    if (category !== undefined)    updates.category = category;
    if (tags !== undefined)        updates.tags = tags;
    if (isOpen !== undefined)      updates.is_open = isOpen;
    if (avatarUrl !== undefined || avatar_url !== undefined) updates.avatar_url = avatarUrl || avatar_url;
    if (bannerUrl !== undefined || banner_url !== undefined) updates.banner_url = bannerUrl || banner_url;
    if (type !== undefined)        updates.type = type;
    if (rules !== undefined)       updates.rules = rules;

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

    const { data: team } = await supabaseAdmin.from('teams').select('id, name, leader_id, is_open, category').eq('id', teamId).single();
    if (!team) return res.status(404).json({ error: 'Team not found' });

    // Check already member
    const { data: mem } = await supabaseAdmin.from('team_members').select('id').eq('team_id', teamId).eq('user_id', userId).maybeSingle();
    if (mem) return res.status(400).json({ error: 'Already a member' });

    // Instant join for public communities
    if (team.is_open && team.category?.startsWith('community:')) {
      await supabaseAdmin.from('team_members').insert({ team_id: teamId, user_id: userId, role: 'member' });
      const { data: u } = await supabaseAdmin.from('users').select('teams_joined').eq('id', userId).single();
      await supabaseAdmin.from('users').update({ teams_joined: (u?.teams_joined || 0) + 1 }).eq('id', userId);
      return res.status(201).json({ message: 'Joined community successfully', joined: true });
    }

    // Check pending request
    const { data: existing } = await supabaseAdmin.from('join_requests').select('id').eq('team_id', teamId).eq('user_id', userId).eq('status', 'pending').maybeSingle();
    if (existing) return res.status(400).json({ error: 'Join request already pending' });

    const { data: jr, error } = await supabaseAdmin.from('join_requests').insert({ team_id: teamId, user_id: userId, message }).select().single();
    if (error) throw error;

    // Notify team leader — DB + live socket
    const { data: applicant } = await supabaseAdmin.from('users').select('first_name, last_name').eq('id', userId).single();
    const notifTitle = `New join request`;
    const notifMsg = `${applicant?.first_name} ${applicant?.last_name} requested to join ${team.name}`;
    await supabaseAdmin.from('notifications').insert({
      user_id: team.leader_id,
      type: 'team',
      title: notifTitle,
      message: notifMsg,
      data: { teamId, userId },
    });
    broadcastNotification(getIo(), team.leader_id, {
      type: 'team',
      title: notifTitle,
      message: notifMsg,
      metadata: { teamId, userId },
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

    // Notify applicant — DB + live socket
    const { data: team } = await supabaseAdmin.from('teams').select('name').eq('id', teamId).single();
    const acceptTitle = 'Join Request Accepted!';
    const acceptMsg = `You were accepted to join ${team?.name}`;
    await supabaseAdmin.from('notifications').insert({
      user_id: jr.user_id,
      type: 'team',
      title: acceptTitle,
      message: acceptMsg,
      data: { teamId },
    });
    broadcastNotification(getIo(), jr.user_id, {
      type: 'team',
      title: acceptTitle,
      message: acceptMsg,
      metadata: { teamId },
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

// ─── GET MY TEAMS ─────────────────────────────────────────────────────────────
export async function getMyTeams(req, res, next) {
  try {
    const userId = req.user.id;
    const { data: memberships, error } = await supabaseAdmin
      .from('team_members')
      .select(`
        role, joined_at,
        team:teams(
          *,
          leader:leader_id(id, first_name, last_name, avatar, avatar_color),
          team_members(user_id, role, users(id, first_name, last_name, avatar, avatar_color))
        )
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (error) throw error;
    const teams = (memberships || [])
      .filter(m => m.team)
      .map(m => {
        const t = m.team;
        const memberCount = (t.team_members || []).length;
        const maxSize = t.max_size || t.max_members || 5;
        const isLeader = m.role === 'leader' || t.leader_id === userId;
        return {
          ...t,
          description: cleanDescription(t.description),
          myRole: m.role,
          joinedAt: m.joined_at,
          max_members: maxSize,
          member_count: memberCount,
          open_roles: Math.max(0, maxSize - memberCount),
          isMember: true,
          is_member: true,
          isLeader,
          is_leader: isLeader,
          hasPendingRequest: false,
          has_pending_request: false,
        };
      });
    res.json({ teams, total: teams.length });
  } catch (err) { next(err); }
}

// ─── LEAVE TEAM ───────────────────────────────────────────────────────────────
export async function leaveTeam(req, res, next) {
  try {
    const userId = req.user.id;
    const { id: teamId } = req.params;

    // Check membership
    const { data: mem } = await supabaseAdmin
      .from('team_members').select('role').eq('team_id', teamId).eq('user_id', userId).single();
    if (!mem) return res.status(404).json({ error: 'You are not a member of this team' });
    if (mem.role === 'leader') return res.status(400).json({ error: 'Team leader cannot leave. Transfer leadership or delete the team first.' });

    await supabaseAdmin.from('team_members').delete().eq('team_id', teamId).eq('user_id', userId);

    // Update user stats
    const { data: u } = await supabaseAdmin.from('users').select('teams_joined').eq('id', userId).single();
    await supabaseAdmin.from('users').update({ teams_joined: Math.max(0, (u?.teams_joined || 1) - 1) }).eq('id', userId);

    res.json({ ok: true, message: 'You have left the team' });
  } catch (err) { next(err); }
}

// ─── KICK MEMBER ──────────────────────────────────────────────────────────────
export async function kickMember(req, res, next) {
  try {
    const leaderId = req.user.id;
    const { id: teamId, memberId } = req.params;

    // Verify requester is leader
    const { data: leaderMem } = await supabaseAdmin
      .from('team_members').select('role').eq('team_id', teamId).eq('user_id', leaderId).single();
    if (!leaderMem || leaderMem.role !== 'leader') return res.status(403).json({ error: 'Only team leader can kick members' });

    if (memberId === leaderId) return res.status(400).json({ error: 'Leader cannot kick themselves' });

    // Check target is a member
    const { data: targetMem } = await supabaseAdmin
      .from('team_members').select('role').eq('team_id', teamId).eq('user_id', memberId).single();
    if (!targetMem) return res.status(404).json({ error: 'User is not a member of this team' });

    await supabaseAdmin.from('team_members').delete().eq('team_id', teamId).eq('user_id', memberId);

    // Notify kicked user — DB + live socket
    const { data: team } = await supabaseAdmin.from('teams').select('name').eq('id', teamId).single();
    const kickTitle = 'Removed from Team';
    const kickMsg = `You have been removed from ${team?.name || 'a team'}`;
    await supabaseAdmin.from('notifications').insert({
      user_id: memberId,
      type: 'team',
      title: kickTitle,
      message: kickMsg,
      data: { teamId },
    });
    broadcastNotification(getIo(), memberId, {
      type: 'team',
      title: kickTitle,
      message: kickMsg,
      metadata: { teamId },
    });

    // Update member stats
    const { data: u } = await supabaseAdmin.from('users').select('teams_joined').eq('id', memberId).single();
    await supabaseAdmin.from('users').update({ teams_joined: Math.max(0, (u?.teams_joined || 1) - 1) }).eq('id', memberId);

    res.json({ ok: true, message: 'Member removed from team' });
  } catch (err) { next(err); }
}

// ─── DELETE TEAM (by leader) ──────────────────────────────────────────────────
export async function deleteTeam(req, res, next) {
  try {
    const userId = req.user.id;
    const { id: teamId } = req.params;

    const { data: mem } = await supabaseAdmin
      .from('team_members').select('role').eq('team_id', teamId).eq('user_id', userId).single();
    if (!mem || mem.role !== 'leader') return res.status(403).json({ error: 'Only team leader can delete the team' });

    await supabaseAdmin.from('teams').delete().eq('id', teamId);
    res.json({ ok: true, message: 'Team deleted successfully' });
  } catch (err) { next(err); }
}

// ─── ADD MEMBER DIRECTLY (by leader) ──────────────────────────────────────────
export async function addMember(req, res, next) {
  try {
    const leaderId = req.user.id;
    const { id: teamId } = req.params;
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    // Verify requester is leader
    const { data: leaderMem } = await supabaseAdmin
      .from('team_members').select('role').eq('team_id', teamId).eq('user_id', leaderId).single();
    if (!leaderMem || leaderMem.role !== 'leader') {
      return res.status(403).json({ error: 'Only team leader can add members directly' });
    }

    // Check team exists and get current size/max size
    const { data: team } = await supabaseAdmin
      .from('teams')
      .select('name, max_size')
      .eq('id', teamId)
      .single();
    if (!team) return res.status(404).json({ error: 'Team not found' });

    // Check team capacity
    const { count: currentCount } = await supabaseAdmin
      .from('team_members')
      .select('user_id', { count: 'exact', head: true })
      .eq('team_id', teamId);
    if (currentCount >= (team.max_size || 5)) {
      return res.status(400).json({ error: 'Team is already at maximum capacity' });
    }

    // Check target is not already a member
    const { data: existingMem } = await supabaseAdmin
      .from('team_members').select('role').eq('team_id', teamId).eq('user_id', userId).maybeSingle();
    if (existingMem) return res.status(400).json({ error: 'User is already a member of this team' });

    // Add member
    await supabaseAdmin.from('team_members').insert({ team_id: teamId, user_id: userId, role: 'member' });

    // Delete any pending join request from this user
    await supabaseAdmin.from('join_requests').delete().eq('team_id', teamId).eq('user_id', userId);

    // Notify added user
    const addTitle = 'Added to Team';
    const addMsg = `You have been added to the team: ${team.name}`;
    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      type: 'team',
      title: addTitle,
      message: addMsg,
      data: { teamId },
    });
    broadcastNotification(getIo(), userId, {
      type: 'team',
      title: addTitle,
      message: addMsg,
      metadata: { teamId },
    });

    // Update user stats
    const { data: u } = await supabaseAdmin.from('users').select('teams_joined').eq('id', userId).single();
    await supabaseAdmin.from('users').update({ teams_joined: (u?.teams_joined || 0) + 1 }).eq('id', userId);

    res.json({ ok: true, message: 'Member added successfully' });
  } catch (err) { next(err); }
}

// ─── TRANSFER LEADERSHIP (by current leader) ──────────────────────────────────
export async function transferLeadership(req, res, next) {
  try {
    const leaderId = req.user.id;
    const { id: teamId } = req.params;
    const { newLeaderId } = req.body;

    if (!newLeaderId) return res.status(400).json({ error: 'newLeaderId is required' });
    if (newLeaderId === leaderId) return res.status(400).json({ error: 'You are already the leader' });

    // Verify current user is leader
    const { data: currentLeaderMem } = await supabaseAdmin
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', leaderId)
      .single();

    if (!currentLeaderMem || currentLeaderMem.role !== 'leader') {
      return res.status(403).json({ error: 'Only the current team leader can transfer leadership' });
    }

    // Verify target user is an existing member
    const { data: targetMem } = await supabaseAdmin
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', newLeaderId)
      .maybeSingle();

    if (!targetMem) {
      return res.status(404).json({ error: 'Target user is not a member of this team' });
    }

    // Update teams table leader_id
    const { error: teamUpdateErr } = await supabaseAdmin
      .from('teams')
      .update({ leader_id: newLeaderId })
      .eq('id', teamId);

    if (teamUpdateErr) throw teamUpdateErr;

    // Promote new leader
    await supabaseAdmin
      .from('team_members')
      .update({ role: 'leader' })
      .eq('team_id', teamId)
      .eq('user_id', newLeaderId);

    // Demote current user to member
    await supabaseAdmin
      .from('team_members')
      .update({ role: 'member' })
      .eq('team_id', teamId)
      .eq('user_id', leaderId);

    // Get team info for notification
    const { data: team } = await supabaseAdmin
      .from('teams')
      .select('name')
      .eq('id', teamId)
      .single();

    const notifTitle = 'Leadership Transferred';
    const notifMsg = `You are now the team leader of ${team?.name || 'the team'}!`;

    await supabaseAdmin.from('notifications').insert({
      user_id: newLeaderId,
      type: 'team',
      title: notifTitle,
      message: notifMsg,
      data: { teamId },
    });

    broadcastNotification(getIo(), newLeaderId, {
      type: 'team',
      title: notifTitle,
      message: notifMsg,
      metadata: { teamId },
    });

    res.json({ ok: true, message: 'Leadership transferred successfully' });
  } catch (err) { next(err); }
}

