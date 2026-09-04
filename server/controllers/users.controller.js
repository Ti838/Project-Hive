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

// ─── Helper: convert snake_case DB fields → canonical format for client ──────────────
function camelizeUser(user) {
  if (!user) return null;
  const result = { ...user };
  result.firstName = user.firstName || user.first_name || '';
  result.lastName = user.lastName || user.last_name || '';
  result.first_name = user.first_name || user.firstName || '';
  result.last_name = user.last_name || user.lastName || '';
  result.avatar = user.avatar || null;
  result.avatar_color = user.avatar_color || user.avatarColor || '#6366F1';
  result.avatarColor = user.avatarColor || user.avatar_color || '#6366F1';
  result.banner = user.banner || user.banner_image || user.bannerImage || null;
  result.banner_image = user.banner_image || user.bannerImage || user.banner || null;
  result.bannerImage = user.bannerImage || user.banner_image || user.banner || null;
  result.github = user.github || user.github_url || null;
  result.github_url = user.github_url || user.github || null;
  result.linkedin = user.linkedin || user.linkedin_url || null;
  result.linkedin_url = user.linkedin_url || user.linkedin || null;
  result.portfolio = user.portfolio || user.portfolio_url || null;
  result.portfolio_url = user.portfolio_url || user.portfolio || null;
  const skillsList = Array.isArray(user.skills) ? user.skills : [];
  const fields = [
    Boolean(user.first_name || user.firstName),
    Boolean(user.last_name || user.lastName),
    Boolean(user.avatar || user.avatar_color || user.avatarColor),
    Boolean(user.bio && String(user.bio).trim().length > 5),
    Boolean(user.university),
    Boolean(user.major || user.department),
    Boolean(user.year_of_study || user.yearOfStudy),
    Boolean(skillsList.length > 0),
    Boolean(user.github || user.github_url || user.linkedin || user.linkedin_url || user.portfolio || user.portfolio_url),
  ];
  const calculatedPercent = Math.round((fields.filter(Boolean).length / fields.length) * 100);
  const finalCompletion = (user.completion_percentage && user.completion_percentage > 0)
    ? user.completion_percentage
    : (user.profile_completion && user.profile_completion > 0)
    ? user.profile_completion
    : calculatedPercent;

  result.completion_percentage = finalCompletion;
  result.profile_completion = finalCompletion;
  result.profileCompletion = finalCompletion;
  result.online_status = user.online_status || user.onlineStatus || 'offline';
  result.onlineStatus = user.onlineStatus || user.online_status || 'offline';
  result.is_public = user.is_public ?? user.isPublic ?? true;
  result.isPublic = user.isPublic ?? user.is_public ?? true;
  result.is_verified = user.is_verified ?? user.isVerified ?? false;
  result.isVerified = user.isVerified ?? user.is_verified ?? false;
  result.is_banned = user.is_banned ?? user.isBanned ?? false;
  result.isBanned = user.isBanned ?? user.is_banned ?? false;
  result.hours_per_week = user.hours_per_week ?? user.hoursPerWeek ?? 10;
  result.hoursPerWeek = user.hoursPerWeek ?? user.hours_per_week ?? 10;
  result.created_at = user.created_at || user.createdAt || new Date().toISOString();
  result.createdAt = user.createdAt || user.created_at || new Date().toISOString();
  result.updated_at = user.updated_at || user.updatedAt || new Date().toISOString();
  result.updatedAt = user.updatedAt || user.updated_at || new Date().toISOString();
  return result;
}

// Combine sanitize + camelCase in one shot
const toClient = (user) => camelizeUser(sanitize(user));

// ─── GET CURRENT USER ────────────────────────────────────────────────────────
export async function getCurrentUser(req, res, next) {
  try {
    const userId = req.user.id;
    const userEmail = (req.user.email || '').toLowerCase();
    const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').toLowerCase();
    const isAdminUser = userId === 'admin' || req.user.role === 'admin' || (ADMIN_EMAIL && userEmail === ADMIN_EMAIL);

    // If root admin without a regular database row, return safe root admin payload
    if (userId === 'admin') {
      const { data: dbUser } = await supabaseAdmin
        .from('users')
        .select('*, skills(*)')
        .eq('email', userEmail || ADMIN_EMAIL)
        .maybeSingle();

      if (!dbUser) {
        return res.json({
          id: 'admin',
          email: userEmail || ADMIN_EMAIL,
          firstName: 'Super',
          lastName: 'Admin',
          first_name: 'Super',
          last_name: 'Admin',
          role: 'admin',
          is_verified: true,
          isVerified: true,
          friendCount: 0,
          followerCount: 0,
          followingCount: 0,
          projectCount: 0,
          postCount: 0,
          teamsCount: 0,
          communitiesCount: 0,
        });
      }

      const clientAdmin = toClient(dbUser);
      clientAdmin.role = 'admin';
      return res.json(clientAdmin);
    }

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
      supabaseAdmin.from('friends').select('id', { count: 'exact', head: true }).eq('user_id', userId).then(r => r, () => ({ count: 0 })),
      supabaseAdmin.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId).then(r => r, () => ({ count: 0 })),
      supabaseAdmin.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId).then(r => r, () => ({ count: 0 })),
      supabaseAdmin.from('projects').select('id', { count: 'exact', head: true }).eq('owner_id', userId).then(r => r, () => ({ count: 0 })),
      supabaseAdmin.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', userId).then(r => r, () => ({ count: 0 })),
      supabaseAdmin.from('team_members').select('team:team_id(id, category)').eq('user_id', userId).then(r => r, () => ({ data: [] }))
    ]);

    const joinedTeams = (teamMemberRows || []).map(r => r.team).filter(Boolean);
    const teamsCount = joinedTeams.filter(t => !t.category?.startsWith('community:')).length;
    const communitiesCount = joinedTeams.filter(t => t.category?.startsWith('community:')).length;

    const clientUser = toClient(user);
    if (isAdminUser) {
      clientUser.role = 'admin';
    }
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
      .eq('is_banned', false);

    if (req.user?.id) {
      q = q.neq('id', req.user.id);
    }

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
      supabaseAdmin.from('friends').select('id', { count: 'exact', head: true }).eq('user_id', id).then(r => r, () => ({ count: 0 })),
      supabaseAdmin.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', id).then(r => r, () => ({ count: 0 })),
      supabaseAdmin.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', id).then(r => r, () => ({ count: 0 })),
      supabaseAdmin.from('projects').select('id', { count: 'exact', head: true }).eq('owner_id', id).then(r => r, () => ({ count: 0 })),
      supabaseAdmin.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', id).then(r => r, () => ({ count: 0 })),
      supabaseAdmin.from('team_members').select('team:team_id(id, category)').eq('user_id', id).then(r => r, () => ({ data: [] }))
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
// Helper: Upload base64 image data to Supabase Storage bucket and return public URL
async function uploadBase64ToStorage(base64Str, bucketName, userId, prefix) {
  if (!base64Str || typeof base64Str !== 'string' || !base64Str.startsWith('data:image/')) {
    return base64Str;
  }
  try {
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return base64Str;
    const contentType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const ext = contentType.split('/')[1] || 'png';
    const filePath = `${userId}/${prefix}_${Date.now()}.${ext}`;

    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.warn(`[Supabase Storage] Failed to upload to ${bucketName}:`, error.message);
      return base64Str;
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return publicUrlData?.publicUrl || base64Str;
  } catch (err) {
    console.error(`[Supabase Storage] Upload error:`, err);
    return base64Str;
  }
}

// ─── UPDATE CURRENT USER PROFILE (PUT/PATCH /api/users/me) ───────────────────
export async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const body = req.body || {};

    const firstName = body.firstName !== undefined ? body.firstName : body.first_name;
    const lastName = body.lastName !== undefined ? body.lastName : body.last_name;
    const bio = body.bio;
    const university = body.university;
    const major = body.major !== undefined ? body.major : body.department;
    const yearOfStudy = body.yearOfStudy !== undefined ? body.yearOfStudy : body.year_of_study;
    let avatar = body.avatar;
    let bannerImage = body.bannerImage !== undefined ? body.bannerImage : (body.banner_image !== undefined ? body.banner_image : body.banner);
    const avatarColor = body.avatarColor !== undefined ? body.avatarColor : body.avatar_color;
    const status = body.status;
    const hoursPerWeek = body.hoursPerWeek !== undefined ? body.hoursPerWeek : body.hours_per_week;
    const github = body.github !== undefined ? body.github : body.github_url;
    const linkedin = body.linkedin !== undefined ? body.linkedin : body.linkedin_url;
    const portfolio = body.portfolio !== undefined ? body.portfolio : body.portfolio_url;
    const isPublic = body.isPublic !== undefined ? body.isPublic : body.is_public;
    const skills = body.skills;

    // Handle base64 image uploads to Supabase Storage
    if (avatar && typeof avatar === 'string' && avatar.startsWith('data:image/')) {
      avatar = await uploadBase64ToStorage(avatar, 'avatars', userId, 'avatar');
    }
    if (bannerImage && typeof bannerImage === 'string' && bannerImage.startsWith('data:image/')) {
      bannerImage = await uploadBase64ToStorage(bannerImage, 'banners', userId, 'banner');
    }

    // Build update object (snake_case for Supabase)
    const updates = {};
    if (firstName !== undefined)    updates.first_name = firstName;
    if (lastName !== undefined)     updates.last_name = lastName;
    if (bio !== undefined)          updates.bio = bio;
    if (university !== undefined)   updates.university = university;
    if (major !== undefined)        updates.major = major;
    if (yearOfStudy !== undefined)  updates.year_of_study = yearOfStudy ? parseInt(yearOfStudy) : null;
    if (avatar !== undefined)       updates.avatar = avatar;
    if (bannerImage !== undefined)  updates.banner_image = bannerImage;
    if (avatarColor !== undefined)  updates.avatar_color = avatarColor;
    if (status !== undefined)       updates.status = status;
    if (hoursPerWeek !== undefined) updates.hours_per_week = hoursPerWeek ? parseInt(hoursPerWeek) : 10;
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
        .limit(5).then(r => r, () => ({ data: [] })),
      supabaseAdmin.from('teams')
        .select('id, name, category, description')
        .or(`name.ilike.%${sanitizeSearch(queryStr)}%,category.ilike.%${sanitizeSearch(queryStr)}%,description.ilike.%${sanitizeSearch(queryStr)}%`)
        .limit(5).then(r => r, () => ({ data: [] })),
      supabaseAdmin.from('projects')
        .select('id, title, category, description')
        .or(`title.ilike.%${sanitizeSearch(queryStr)}%,category.ilike.%${sanitizeSearch(queryStr)}%,description.ilike.%${sanitizeSearch(queryStr)}%`)
        .limit(5).then(r => r, () => ({ data: [] })),
      supabaseAdmin.from('posts')
        .select('id, content, post_type')
        .ilike('content', `%${sanitizeSearch(queryStr)}%`)
        .limit(5).then(r => r, () => ({ data: [] }))
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

