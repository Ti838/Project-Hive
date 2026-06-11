import User from '../models/User.js';

export async function getCurrentUser(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash -refreshTokens');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('[v0] Get current user error:', error);
    next(error);
  }
}

export async function getUserProfile(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-passwordHash -refreshTokens');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('[v0] Get user profile error:', error);
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Prevent updating sensitive fields
    delete updates.passwordHash;
    delete updates.email;
    delete updates.refreshTokens;
    delete updates.role;

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select('-passwordHash -refreshTokens');

    // Recalculate completion percentage
    user.calculateCompletionPercentage();
    await user.save();

    console.log('[v0] User profile updated:', user.email);

    res.json({
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    console.error('[v0] Update profile error:', error);
    next(error);
  }
}

export async function searchUsers(req, res, next) {
  try {
    const { query, skip = 0, limit = 20, university, skills, yearOfStudy } = req.query;

    let searchQuery = { isPublic: true };

    if (query) {
      searchQuery.$text = { $search: query };
    }

    if (university) {
      searchQuery.university = university;
    }

    if (yearOfStudy) {
      searchQuery.yearOfStudy = parseInt(yearOfStudy);
    }

    if (skills) {
      const skillArray = Array.isArray(skills) ? skills : [skills];
      searchQuery['skills.name'] = { $in: skillArray };
    }

    const users = await User.find(searchQuery)
      .select('-passwordHash -refreshTokens -lastSeen')
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(searchQuery);

    res.json({
      users,
      pagination: {
        total,
        skip: parseInt(skip),
        limit: parseInt(limit),
        hasMore: parseInt(skip) + parseInt(limit) < total,
      },
    });
  } catch (error) {
    console.error('[v0] Search users error:', error);
    next(error);
  }
}

export async function updateSkills(req, res, next) {
  try {
    const userId = req.user.id;
    const { skills } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { skills },
      { new: true, runValidators: true }
    ).select('-passwordHash -refreshTokens');

    user.calculateCompletionPercentage();
    await user.save();

    console.log('[v0] Skills updated for user:', user.email);

    res.json({
      message: 'Skills updated',
      user,
    });
  } catch (error) {
    console.error('[v0] Update skills error:', error);
    next(error);
  }
}

export async function addSkill(req, res, next) {
  try {
    const userId = req.user.id;
    const { name, level = 'intermediate' } = req.body;

    const user = await User.findById(userId);
    
    // Check if skill already exists
    const existingSkill = user.skills.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (existingSkill) {
      return res.status(400).json({ error: 'Skill already added' });
    }

    user.skills.push({ name, level });
    user.calculateCompletionPercentage();
    await user.save();

    res.json({
      message: 'Skill added',
      user: user.toObject({ versionKey: false }),
    });
  } catch (error) {
    console.error('[v0] Add skill error:', error);
    next(error);
  }
}

export async function removeSkill(req, res, next) {
  try {
    const userId = req.user.id;
    const { skillName } = req.body;

    const user = await User.findById(userId);
    user.skills = user.skills.filter(s => s.name !== skillName);
    user.calculateCompletionPercentage();
    await user.save();

    res.json({
      message: 'Skill removed',
      user,
    });
  } catch (error) {
    console.error('[v0] Remove skill error:', error);
    next(error);
  }
}
