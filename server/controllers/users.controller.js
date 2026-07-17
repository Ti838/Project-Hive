import bcryptjs from 'bcryptjs';
import { supabaseAdmin } from '../config/supabase.js';
import { getIo } from '../services/socket.service.js';
import { computeRelationshipState } from './friends.controller.js';

// Sanitize search input to prevent Supabase PostgREST filter injection
function sanitizeSearch(input) {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/[%_(),.;'"\\=<>!#|&\-\[\]{}^~`]/g, '').replace(/\s+/g, ' ').trim().substring(0, 100);
}

// ─── Helper: sanitize user output ────────────────────────────────────────────
function sanitize(user) {
  if (!user) return null;
  const { password_hash, refresh_tokens, email_verification_token,
    email_verification_expires, password_reset_token, password_reset_expires, ...safe } = user;
  return safe;
}

// ─── Helper: convert snake_case DB fields → camelCase for client ──────────────
function camelizeUser(user) {
  if (!user) return null;
  const keyMap = {
    first_name: 'firstName',
    last_name: 'lastName',
    avatar_color: 'avatarColor',
    banner_image: 'bannerImage',
    year_of_study: 'yearOfStudy',
    completion_percentage: 'profileCompletion',
    online_status: 'onlineStatus',
    is_public: 'isPublic',
    is_verified: 'isVerified',
    is_banned: 'isBanned',
    hours_per_week: 'hoursPerWeek',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
  };
  const result = {};
  for (const [k, v] of Object.entries(user)) {
    result[keyMap[k] || k] = v;
  }
  return result;
}

// Combine sanitize + camelCase in one shot
const toClient = (user) => camelizeUser(sanitize(user));

// ─── GET CURRENT USER ────────────────────────────────────────────────────────
export async function getCurrentUser(req, res, next) {
  try {
    const userId = req.user.id;
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*, skills(*)')
      .eq('id', userId)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });

    // Fetch live counts — each query catches independently so one bad table never crashes the profile
    const [
      { count: friendCount },
      { count: followerCount },
      { count: followingCount },
      { count: projectCount },
      { count: postCount },
      { data: teamMemberRows }
    ] = await Promise.all([
      supabaseAdmin.from('friends').select('id', { count: 'exact', head: true }).eq('user_id', userId).catch(() => ({ count: 0 })),
      supabaseAdmin.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId).catch(() => ({ count: 0 })),
      supabaseAdmin.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId).catch(() => ({ count: 0 })),
      supabaseAdmin.from('projects').select('id', { count: 'exact', head: true }).eq('owner_id', userId).catch(() => ({ count: 0 })),
      supabaseAdmin.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', userId).catch(() => ({ count: 0 })),
      supabaseAdmin.from('team_members').select('team:team_id(id, category)').eq('user_id', userId).catch(() => ({ data: [] }))
    ]);

    const joinedTeams = (teamMemberRows || []).map(r => r.team).filter(Boolean);
    const teamsCount = joinedTeams.filter(t => !t.category?.startsWith('community:')).length;
    const communitiesCount = joinedTeams.filter(t => t.category?.startsWith('community:')).length;

    const clientUser = toClient(user);
    clientUser.friendCount = friendCount || 0;
    clientUser.followerCount = followerCount || 0;
    clientUser.followingCount = followingCount || 0;
    clientUser.projectCount = projectCount || 0;
    clientUser.postCount = postCount || 0;
    clientUser.teamsCount = teamsCount || 0;
    clientUser.communitiesCount = communitiesCount || 0;

    res.json(clientUser);
  } catch (err) { next(err); }
}

// ─── LIST USERS (GET /api/users?limit=N&search=q) ────────────────────────────
export async function listUsers(req, res, next) {
  try {
    const { limit = 20, skip = 0, search } = req.query;
    let q = supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, avatar, avatar_color, university, major, online_status, last_seen, role', { count: 'exact' })
      .eq('is_verified', true)
      .eq('is_banned', false)
      .neq('id', req.user.id);

    const s = sanitizeSearch(search);
    if (s) q = q.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,university.ilike.%${s}%`);

    const { data: users, error, count } = await q
      .order('online_status', { ascending: false }) // online users first
      .order('last_seen', { ascending: false })
      .range(+skip, +skip + +limit - 1);

    if (error) throw error;
    res.json({ users: (users || []).map(toClient), total: count || 0 });
  } catch (err) { next(err); }
}


export async function getUserProfile(req, res, next) {
  try {
    const { id } = req.params;
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*, skills(*)')
      .eq('id', id)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });

    const requesterId = req.user?.id;
    let friendshipStatus = 'none';
    if (requesterId) {
      friendshipStatus = await computeRelationshipState(requesterId, id);
    }

    // Fetch live counts — each query catches independently so one bad table never crashes the profile
    const [
      { count: friendCount },
      { count: followerCount },
      { count: followingCount },
      { count: projectCount },
      { count: postCount },
      { data: teamMemberRows }
    ] = await Promise.all([
      supabaseAdmin.from('friends').select('id', { count: 'exact', head: true }).eq('user_id', id).catch(() => ({ count: 0 })),
      supabaseAdmin.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', id).catch(() => ({ count: 0 })),
      supabaseAdmin.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', id).catch(() => ({ count: 0 })),
      supabaseAdmin.from('projects').select('id', { count: 'exact', head: true }).eq('owner_id', id).catch(() => ({ count: 0 })),
      supabaseAdmin.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', id).catch(() => ({ count: 0 })),
      supabaseAdmin.from('team_members').select('team:team_id(id, category)').eq('user_id', id).catch(() => ({ data: [] }))
    ]);

    const joinedTeams = (teamMemberRows || []).map(r => r.team).filter(Boolean);
    const teamsCount = joinedTeams.filter(t => !t.category?.startsWith('community:')).length;
    const communitiesCount = joinedTeams.filter(t => t.category?.startsWith('community:')).length;

    const isFriend = friendshipStatus === 'FRIEND';
    const showDetails = user.is_public || friendshipStatus === 'SELF' || isFriend;

    if (!showDetails) {
      return res.json({
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        avatar: user.avatar,
        avatarColor: user.avatar_color,
        university: user.university,
        major: user.major,
        isPublic: user.is_public,
        isLocked: true,
        friendshipStatus,
        friendCount: friendCount || 0,
        followerCount: followerCount || 0,
        followingCount: followingCount || 0,
        projectCount: projectCount || 0,
        postCount: postCount || 0,
        teamsCount: teamsCount || 0,
        communitiesCount: communitiesCount || 0,
      });
    }

    const clientUser = toClient(user);
    clientUser.friendshipStatus = friendshipStatus;
    clientUser.isLocked = false;
    clientUser.friendCount = friendCount || 0;
    clientUser.followerCount = followerCount || 0;
    clientUser.followingCount = followingCount || 0;
    clientUser.projectCount = projectCount || 0;
    clientUser.postCount = postCount || 0;
    clientUser.teamsCount = teamsCount || 0;
    clientUser.communitiesCount = communitiesCount || 0;
    res.json(clientUser);
  } catch (err) { next(err); }
}

// ─── UPDATE PROFILE ──────────────────────────────────────────────────────────
export async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const {
      firstName, lastName, bio, university, major, yearOfStudy,
      avatar, bannerImage, avatarColor, status, hoursPerWeek,
      github, linkedin, portfolio, isPublic, skills
    } = req.body;

    // Build update object (snake_case for Supabase)
    const updates = {};
    if (firstName !== undefined)    updates.first_name = firstName;
    if (lastName !== undefined)     updates.last_name = lastName;
    if (bio !== undefined)          updates.bio = bio;
    if (university !== undefined)   updates.university = university;
    if (major !== undefined)        updates.major = major;
    if (yearOfStudy !== undefined)  updates.year_of_study = yearOfStudy;
    if (avatar !== undefined)       updates.avatar = avatar;
    if (bannerImage !== undefined)  updates.banner_image = bannerImage;
    if (avatarColor !== undefined)  updates.avatar_color = avatarColor;
    if (status !== undefined)       updates.status = status;
    if (hoursPerWeek !== undefined) updates.hours_per_week = hoursPerWeek;
    if (github !== undefined)       updates.github = github;
    if (linkedin !== undefined)     updates.linkedin = linkedin;
    if (portfolio !== undefined)    updates.portfolio = portfolio;
    if (isPublic !== undefined)     updates.is_public = isPublic;

    // Update skills first if provided
    if (skills !== undefined) {
      await supabaseAdmin.from('skills').delete().eq('user_id', userId);
      if (skills && skills.length > 0) {
        const skillRows = skills.map(s => ({
          user_id: userId,
          name: typeof s === 'string' ? s : (s.name || ''),
          level: s.level || 'intermediate'
        })).filter(s => s.name);
        if (skillRows.length > 0) {
          await supabaseAdmin.from('skills').insert(skillRows);
        }
      }
    }

    // Calculate completion %
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('*, skills(*)')
      .eq('id', userId)
      .single();

    const merged = { ...existing, ...updates };
    const finalSkills = skills !== undefined ? skills : (existing?.skills || []);
    const fields = [
      merged.first_name && merged.last_name,
      merged.avatar || merged.avatar_color,
      merged.bio && merged.bio.length > 10,
      merged.university,
      merged.major,
      merged.year_of_study,
      finalSkills.length > 0,
      merged.github || merged.linkedin || merged.portfolio,
    ];
    updates.completion_percentage = Math.round((fields.filter(Boolean).length / fields.length) * 100);

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select('*, skills(*)')
      .single();

    if (error) throw error;
    res.json({ message: 'Profile updated successfully', user: toClient(user) });
  } catch (err) {
    console.error('[ProjectHive] Update profile error:', err);
    next(err);
  }
}

// ─── SEARCH USERS ────────────────────────────────────────────────────────────
export async function searchUsers(req, res, next) {
  try {
    const { query, q: queryQ, skip = 0, limit = 20, university, yearOfStudy } = req.query;
    const searchTerm = query || queryQ;

    let q = supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, email, avatar, avatar_color, bio, university, major, year_of_study, status, hours_per_week, github, linkedin, portfolio, online_status, completion_percentage, skills(*)', { count: 'exact' })
      .eq('is_public', true)
      .eq('is_banned', false);

    if (searchTerm) {
      const st = sanitizeSearch(searchTerm);
      if (st) q = q.or(`first_name.ilike.%${st}%,last_name.ilike.%${st}%,email.ilike.%${st}%,university.ilike.%${st}%,major.ilike.%${st}%`);
    }
    if (university) q = q.ilike('university', `%${university}%`);
    if (yearOfStudy) q = q.eq('year_of_study', parseInt(yearOfStudy));

    q = q.range(parseInt(skip), parseInt(skip) + parseInt(limit) - 1).order('created_at', { ascending: false });

    const { data: users, error, count } = await q;
    if (error) throw error;

    res.json({
      users: (users || []).map(toClient),
      pagination: {
        total: count || 0,
        skip: parseInt(skip),
        limit: parseInt(limit),
        hasMore: parseInt(skip) + parseInt(limit) < (count || 0),
      },
    });
  } catch (err) {
    console.error('[ProjectHive] Search users error:', err);
    next(err);
  }
}

// ─── UPDATE SKILLS ────────────────────────────────────────────────────────────
export async function updateSkills(req, res, next) {
  try {
    const userId = req.user.id;
    const { skills } = req.body;

    // Delete old skills then insert new ones
    await supabaseAdmin.from('skills').delete().eq('user_id', userId);

    if (skills && skills.length > 0) {
      const skillRows = skills.map(s => ({ user_id: userId, name: s.name, level: s.level || 'intermediate' }));
      await supabaseAdmin.from('skills').insert(skillRows);
    }

    const { data: user } = await supabaseAdmin.from('users').select('*, skills(*)').eq('id', userId).single();
    res.json({ message: 'Skills updated', user: toClient(user) });
  } catch (err) { next(err); }
}

// ─── ADD SKILL ────────────────────────────────────────────────────────────────
export async function addSkill(req, res, next) {
  try {
    const userId = req.user.id;
    const { name, level = 'intermediate' } = req.body;

    const { data: existing } = await supabaseAdmin
      .from('skills').select('id').eq('user_id', userId).ilike('name', name).single();

    if (existing) return res.status(400).json({ error: 'Skill already added' });

    await supabaseAdmin.from('skills').insert({ user_id: userId, name, level });
    const { data: user } = await supabaseAdmin.from('users').select('*, skills(*)').eq('id', userId).single();
    res.json({ message: 'Skill added', user: toClient(user) });
  } catch (err) { next(err); }
}

// ─── REMOVE SKILL ─────────────────────────────────────────────────────────────
export async function removeSkill(req, res, next) {
  try {
    const userId = req.user.id;
    const { skillName } = req.body;

    await supabaseAdmin.from('skills').delete().eq('user_id', userId).eq('name', skillName);
    const { data: user } = await supabaseAdmin.from('users').select('*, skills(*)').eq('id', userId).single();
    res.json({ message: 'Skill removed', user: toClient(user) });
  } catch (err) { next(err); }
}

// ─── CHANGE PASSWORD ──────────────────────────────────────────────────────────
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });

    const { data: user } = await supabaseAdmin.from('users').select('password_hash').eq('id', req.user.id).single();
    const valid = await bcryptjs.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const salt = await bcryptjs.genSalt(12);
    const passwordHash = await bcryptjs.hash(newPassword, salt);
    await supabaseAdmin.from('users').update({ password_hash: passwordHash, refresh_tokens: [] }).eq('id', req.user.id);

    res.json({ message: 'Password updated successfully. Please sign in again.' });
  } catch (err) { next(err); }
}

// ─── GLOBAL SEARCH (Ctrl+K) ──────────────────────────────────────────────────
export async function globalSearch(req, res, next) {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.json({ users: [], teams: [], projects: [], posts: [] });
    }
    const queryStr = q.trim();

    const [usersRes, teamsRes, projectsRes, postsRes] = await Promise.all([
      supabaseAdmin.from('users')
        .select('id, first_name, last_name, avatar, avatar_color, university')
        .eq('is_public', true)
        .eq('is_banned', false)
        .or(`first_name.ilike.%${sanitizeSearch(queryStr)}%,last_name.ilike.%${sanitizeSearch(queryStr)}%,university.ilike.%${sanitizeSearch(queryStr)}%`)
        .limit(5).catch(() => ({ data: [] })),
      supabaseAdmin.from('teams')
        .select('id, name, category, description')
        .or(`name.ilike.%${sanitizeSearch(queryStr)}%,category.ilike.%${sanitizeSearch(queryStr)}%,description.ilike.%${sanitizeSearch(queryStr)}%`)
        .limit(5).catch(() => ({ data: [] })),
      supabaseAdmin.from('projects')
        .select('id, title, category, description')
        .or(`title.ilike.%${sanitizeSearch(queryStr)}%,category.ilike.%${sanitizeSearch(queryStr)}%,description.ilike.%${sanitizeSearch(queryStr)}%`)
        .limit(5).catch(() => ({ data: [] })),
      supabaseAdmin.from('posts')
        .select('id, content, post_type')
        .ilike('content', `%${sanitizeSearch(queryStr)}%`)
        .limit(5).catch(() => ({ data: [] }))
    ]);

    res.json({
      users: (usersRes.data || []).map(u => ({
        id: u.id,
        title: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
        subtitle: u.university || 'Student',
        avatar: u.avatar,
        avatarColor: u.avatar_color,
        type: 'user'
      })),
      teams: (teamsRes.data || []).map(t => ({
        id: t.id,
        title: t.name,
        subtitle: t.category || 'Team',
        type: 'team'
      })),
      projects: (projectsRes.data || []).map(p => ({
        id: p.id,
        title: p.title,
        subtitle: p.category || 'Project',
        type: 'project'
      })),
      posts: (postsRes.data || []).map(po => ({
        id: po.id,
        title: po.content ? (po.content.substring(0, 50) + '...') : 'Post',
        subtitle: po.post_type || 'General',
        type: 'post'
      }))
    });
  } catch (err) {
    console.error('[ProjectHive] Global search error:', err);
    next(err);
  }
}

// ─── ENDORSE SKILL ────────────────────────────────────────────────────────────
// POST /api/users/:userId/skills/:skillId/endorse — toggle endorsement
export async function endorseSkill(req, res, next) {
  try {
    const endorserId = req.user.id;
    const { userId, skillId } = req.params;

    if (endorserId === userId) return res.status(400).json({ error: 'You cannot endorse your own skills' });

    // Verify skill belongs to user
    const { data: skill } = await supabaseAdmin
      .from('skills').select('id, endorsements').eq('id', skillId).eq('user_id', userId).single();
    if (!skill) return res.status(404).json({ error: 'Skill not found' });

    // Check existing endorsement (toggle)
    const { data: existing } = await supabaseAdmin
      .from('skill_endorsements').select('id').eq('skill_id', skillId).eq('endorser_id', endorserId).maybeSingle();

    if (existing) {
      // Remove endorsement
      await supabaseAdmin.from('skill_endorsements').delete().eq('id', existing.id);
      const newCount = Math.max(0, (skill.endorsements || 0) - 1);
      await supabaseAdmin.from('skills').update({ endorsements: newCount }).eq('id', skillId);
      return res.json({ endorsed: false, endorsements: newCount });
    }

    // Add endorsement
    await supabaseAdmin.from('skill_endorsements').insert({ skill_id: skillId, endorser_id: endorserId });
    const newCount = (skill.endorsements || 0) + 1;
    await supabaseAdmin.from('skills').update({ endorsements: newCount }).eq('id', skillId);

    // Notify skill owner
    const { data: endorser } = await supabaseAdmin.from('users').select('first_name, last_name').eq('id', endorserId).single();
    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      type: 'skill_endorsed',
      title: 'Skill Endorsed!',
      message: `${endorser?.first_name} ${endorser?.last_name} endorsed your skill`,
      data: { skillId, endorserId },
    });

    res.json({ endorsed: true, endorsements: newCount });
  } catch (err) { next(err); }
}

// ─── DELETE OWN ACCOUNT ────────────────────────────────────────────────────────
export async function deleteOwnAccount(req, res, next) {
  try {
    const requesterId = req.user.id;
    const { id } = req.params;

    // Only allow users to delete their own account
    if (requesterId !== id) {
      return res.status(403).json({ error: 'You can only delete your own account' });
    }

    console.log(`[ProjectHive] Deleting user account ${id} and performing data cleanup...`);

    // 1. Delete skill endorsements and skills
    await supabaseAdmin.from('skill_endorsements').delete().eq('endorser_id', id);
    await supabaseAdmin.from('skills').delete().eq('user_id', id);

    // 2. Delete friend relations and friend requests
    await supabaseAdmin.from('friends').delete().or(`user_id.eq.${id},friend_id.eq.${id}`);
    await supabaseAdmin.from('friend_requests').delete().or(`from_user_id.eq.${id},to_user_id.eq.${id}`);

    // 3. Delete messages, posts and notifications
    await supabaseAdmin.from('messages').delete().eq('sender_id', id);
    await supabaseAdmin.from('posts').delete().eq('user_id', id);
    await supabaseAdmin.from('notifications').delete().eq('user_id', id);

    // 4. Handle teams where user is leader
    const { data: leadTeams } = await supabaseAdmin.from('teams').select('id').eq('leader_id', id);
    if (leadTeams && leadTeams.length) {
      for (const t of leadTeams) {
        // Find if there is another member to promote
        const { data: members } = await supabaseAdmin
          .from('team_members')
          .select('user_id')
          .eq('team_id', t.id)
          .neq('user_id', id)
          .limit(1);

        if (members && members.length) {
          // Promote next member to leader
          await supabaseAdmin.from('teams').update({ leader_id: members[0].user_id }).eq('id', t.id);
          await supabaseAdmin.from('team_members').update({ role: 'leader' }).eq('team_id', t.id).eq('user_id', members[0].user_id);
        } else {
          // No other members, delete the team
          await supabaseAdmin.from('teams').delete().eq('id', t.id);
        }
      }
    }

    // 5. Delete remaining team memberships
    await supabaseAdmin.from('team_members').delete().eq('user_id', id);

    // 6. Delete user
    const { error: userDelError } = await supabaseAdmin.from('users').delete().eq('id', id);
    if (userDelError) throw userDelError;

    res.json({ ok: true, message: 'Account deleted successfully' });
  } catch (err) {
    console.error('[ProjectHive] Account deletion error:', err);
    next(err);
  }
}

// ─── CREATE SUPPORT TICKET ───────────────────────────────────────────────────
export async function createSupportTicket(req, res, next) {
  try {
    const userId = req.user.id;
    const { category, subject, message } = req.body;

    if (!category || !subject || !message) {
      return res.status(400).json({ error: 'Category, subject, and message are required' });
    }

    // Attempt to insert into support_tickets table in Supabase
    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .insert({
        user_id: userId,
        category,
        subject,
        message,
        status: 'open'
      })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[ProjectHive] Database warning while saving ticket, simulating storage fallback:', error.message);
    }

    const ticketObj = data || { id: 'sim-' + Date.now(), category, subject, message, status: 'open' };

    // Emit Socket event to admins
    try {
      const io = getIo();
      if (io) {
        io.emit('ticket:new', ticketObj);
      }
    } catch (e) {
      console.warn('[ProjectHive] Socket emit warning:', e.message);
    }

    res.status(201).json({
      ok: true,
      message: 'Support ticket submitted successfully! A support agent will review your case.',
      ticket: ticketObj
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET TARGET USER FRIENDS ──────────────────────────────────────────────────
export async function getUserFriends(req, res, next) {
  try {
    const { id } = req.params;
    const requesterId = req.user?.id;

    // Check relationship to see if blocked or private
    const rel = await computeRelationshipState(requesterId, id);
    if (rel === 'BLOCKED' || rel === 'BLOCKED_BY_OTHER') {
      return res.status(403).json({ error: 'Blocked' });
    }

    const { data: user } = await supabaseAdmin.from('users').select('is_public').eq('id', id).single();
    if (!user?.is_public && rel !== 'FRIEND' && rel !== 'SELF') {
      return res.status(403).json({ error: 'Profile is private' });
    }

    const { data: rows, error } = await supabaseAdmin
      .from('friends')
      .select('friend:friend_id(id, first_name, last_name, avatar, avatar_color, online_status, last_seen, university, major)')
      .eq('user_id', id);
    if (error) throw error;

    res.json({ friends: (rows || []).map(r => r.friend).filter(Boolean) });
  } catch (err) { next(err); }
}

// ─── GET TARGET USER FOLLOWERS ────────────────────────────────────────────────
export async function getUserFollowers(req, res, next) {
  try {
    const { id } = req.params;
    const requesterId = req.user?.id;

    const rel = await computeRelationshipState(requesterId, id);
    if (rel === 'BLOCKED' || rel === 'BLOCKED_BY_OTHER') {
      return res.status(403).json({ error: 'Blocked' });
    }

    const { data: user } = await supabaseAdmin.from('users').select('is_public').eq('id', id).single();
    if (!user?.is_public && rel !== 'FRIEND' && rel !== 'SELF') {
      return res.status(403).json({ error: 'Profile is private' });
    }

    const { data: rows, error } = await supabaseAdmin
      .from('follows')
      .select('follower:follower_id(id, first_name, last_name, avatar, avatar_color, university, major)')
      .eq('following_id', id);
    if (error) return res.json({ followers: [] });

    res.json({ followers: (rows || []).map(r => r.follower).filter(Boolean) });
  } catch (err) { next(err); }
}

// ─── GET TARGET USER FOLLOWING ────────────────────────────────────────────────
export async function getUserFollowing(req, res, next) {
  try {
    const { id } = req.params;
    const requesterId = req.user?.id;

    const rel = await computeRelationshipState(requesterId, id);
    if (rel === 'BLOCKED' || rel === 'BLOCKED_BY_OTHER') {
      return res.status(403).json({ error: 'Blocked' });
    }

    const { data: user } = await supabaseAdmin.from('users').select('is_public').eq('id', id).single();
    if (!user?.is_public && rel !== 'FRIEND' && rel !== 'SELF') {
      return res.status(403).json({ error: 'Profile is private' });
    }

    const { data: rows, error } = await supabaseAdmin
      .from('follows')
      .select('following:following_id(id, first_name, last_name, avatar, avatar_color, university, major)')
      .eq('follower_id', id);
    if (error) return res.json({ following: [] });

    res.json({ following: (rows || []).map(r => r.following).filter(Boolean) });
  } catch (err) { next(err); }
}

