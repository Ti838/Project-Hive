import bcryptjs from 'bcryptjs';
import { supabaseAdmin } from '../config/supabase.js';

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
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*, skills(*)')
      .eq('id', req.user.id)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });
    res.json(toClient(user));
  } catch (err) { next(err); }
}

// ─── GET USER PROFILE (by id) ────────────────────────────────────────────────
export async function getUserProfile(req, res, next) {
  try {
    const { id } = req.params;
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*, skills(*)')
      .eq('id', id)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });
    if (!user.is_public && req.user?.id !== id) {
      return res.status(403).json({ error: 'This profile is private' });
    }
    res.json(toClient(user));
  } catch (err) { next(err); }
}

// ─── UPDATE PROFILE ──────────────────────────────────────────────────────────
export async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const {
      firstName, lastName, bio, university, major, yearOfStudy,
      avatar, bannerImage, avatarColor, status, hoursPerWeek,
      github, linkedin, portfolio, isPublic,
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

    // Calculate completion %
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('*, skills(*)')
      .eq('id', userId)
      .single();

    const merged = { ...existing, ...updates };
    const fields = [
      merged.first_name && merged.last_name,
      merged.avatar || merged.avatar_color,
      merged.bio && merged.bio.length > 10,
      merged.university,
      merged.major,
      merged.year_of_study,
      existing?.skills?.length > 0,
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
    const { query, skip = 0, limit = 20, university, yearOfStudy } = req.query;

    let q = supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, email, avatar, avatar_color, bio, university, major, year_of_study, status, hours_per_week, github, linkedin, portfolio, online_status, completion_percentage, skills(*)', { count: 'exact' })
      .eq('is_public', true)
      .eq('is_banned', false);

    if (query) {
      q = q.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,university.ilike.%${query}%,major.ilike.%${query}%`);
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
        .or(`first_name.ilike.%${queryStr}%,last_name.ilike.%${queryStr}%,university.ilike.%${queryStr}%`)
        .limit(5),
      supabaseAdmin.from('teams')
        .select('id, name, category, description')
        .or(`name.ilike.%${queryStr}%,category.ilike.%${queryStr}%,description.ilike.%${queryStr}%`)
        .limit(5),
      supabaseAdmin.from('projects')
        .select('id, title, category, description')
        .or(`title.ilike.%${queryStr}%,category.ilike.%${queryStr}%,description.ilike.%${queryStr}%`)
        .limit(5),
      supabaseAdmin.from('posts')
        .select('id, content, post_type')
        .ilike('content', `%${queryStr}%`)
        .limit(5)
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
