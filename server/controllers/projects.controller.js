import Project from '../models/Project.js';
import User from '../models/User.js';

export async function submitProject(req, res, next) {
  try {
    const userId = req.user.id;
    const { title, description, techStack, demoURL, githubURL } = req.body;

    const project = new Project({
      title,
      description,
      techStack: techStack || [],
      demoURL: demoURL || null,
      githubURL: githubURL || null,
      creator: userId,
      status: 'submitted',
    });

    await project.save();
    await project.populate('creator', 'firstName lastName avatar');

    // Update user stats
    await User.findByIdAndUpdate(userId, { $inc: { projectsPosted: 1 } });

    console.log('[v0] Project submitted:', project.title);

    res.status(201).json({
      message: 'Project submitted successfully',
      project,
    });
  } catch (error) {
    console.error('[v0] Submit project error:', error);
    next(error);
  }
}

export async function getProjects(req, res, next) {
  try {
    const { skip = 0, limit = 20, search, techStack, sortBy = 'newest' } = req.query;

    let query = { status: 'approved' };

    if (search) {
      query.$text = { $search: search };
    }

    if (techStack) {
      const techArray = Array.isArray(techStack) ? techStack : [techStack];
      query.techStack = { $in: techArray };
    }

    let sort = { createdAt: -1 };
    if (sortBy === 'popular') {
      sort = { likes: -1 };
    } else if (sortBy === 'trending') {
      sort = { createdAt: -1, likes: -1 };
    }

    const projects = await Project.find(query)
      .populate('creator', 'firstName lastName avatar university')
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .sort(sort);

    const total = await Project.countDocuments(query);

    res.json({
      projects,
      pagination: {
        total,
        skip: parseInt(skip),
        limit: parseInt(limit),
        hasMore: parseInt(skip) + parseInt(limit) < total,
      },
    });
  } catch (error) {
    console.error('[v0] Get projects error:', error);
    next(error);
  }
}

export async function getProjectDetail(req, res, next) {
  try {
    const { id } = req.params;

    const project = await Project.findById(id)
      .populate('creator', 'firstName lastName avatar university github linkedin portfolio')
      .populate('likedBy', 'firstName lastName avatar');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('[v0] Get project detail error:', error);
    next(error);
  }
}

export async function updateProject(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user is creator
    if (project.creator.toString() !== userId) {
      return res.status(403).json({ error: 'Only creator can update project' });
    }

    const updates = req.body;
    delete updates.creator;
    delete updates.likes;
    delete updates.likedBy;
    delete updates.saves;
    delete updates.savedBy;

    const updatedProject = await Project.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate('creator', 'firstName lastName avatar');

    console.log('[v0] Project updated:', updatedProject.title);

    res.json({
      message: 'Project updated successfully',
      project: updatedProject,
    });
  } catch (error) {
    console.error('[v0] Update project error:', error);
    next(error);
  }
}

export async function deleteProject(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.creator.toString() !== userId) {
      return res.status(403).json({ error: 'Only creator can delete project' });
    }

    await Project.findByIdAndDelete(id);

    console.log('[v0] Project deleted:', id);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('[v0] Delete project error:', error);
    next(error);
  }
}

export async function likeProject(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isLiked = project.isLikedBy(userId);

    if (isLiked) {
      // Unlike
      project.likedBy = project.likedBy.filter(id => id.toString() !== userId);
      project.likes = Math.max(0, project.likes - 1);
    } else {
      // Like
      project.likedBy.push(userId);
      project.likes += 1;
    }

    await project.save();

    res.json({
      message: isLiked ? 'Project unliked' : 'Project liked',
      project: {
        id: project._id,
        likes: project.likes,
        isLiked: !isLiked,
      },
    });
  } catch (error) {
    console.error('[v0] Like project error:', error);
    next(error);
  }
}

export async function saveProject(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isSaved = project.isSavedBy(userId);

    if (isSaved) {
      // Unsave
      project.savedBy = project.savedBy.filter(id => id.toString() !== userId);
      project.saves = Math.max(0, project.saves - 1);
    } else {
      // Save
      project.savedBy.push(userId);
      project.saves += 1;
    }

    await project.save();

    res.json({
      message: isSaved ? 'Project unsaved' : 'Project saved',
      project: {
        id: project._id,
        saves: project.saves,
        isSaved: !isSaved,
      },
    });
  } catch (error) {
    console.error('[v0] Save project error:', error);
    next(error);
  }
}
