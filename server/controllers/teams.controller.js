import Team from '../models/Team.js';
import JoinRequest from '../models/JoinRequest.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

export async function createTeam(req, res, next) {
  try {
    const userId = req.user.id;
    const { name, description, requiredSkills, maxMembers, projectType, university, tags } = req.body;

    const team = new Team({
      name,
      description,
      requiredSkills: requiredSkills || [],
      maxMembers: maxMembers || 5,
      projectType: projectType || '',
      university,
      tags: tags || [],
      creator: userId,
      members: [{ user: userId, role: 'lead' }],
    });

    await team.save();
    await team.populate('members.user', '-passwordHash -refreshTokens');

    // Update user stats
    await User.findByIdAndUpdate(userId, { $inc: { teamsCreated: 1 } });

    console.log('[v0] Team created:', team.name);

    res.status(201).json({
      message: 'Team created successfully',
      team,
    });
  } catch (error) {
    console.error('[v0] Create team error:', error);
    next(error);
  }
}

export async function getTeams(req, res, next) {
  try {
    const { university, status, skip = 0, limit = 20, search } = req.query;

    let query = {};

    if (university) {
      query.university = university;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const teams = await Team.find(query)
      .populate('creator', 'firstName lastName avatar')
      .populate('members.user', 'firstName lastName avatar')
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Team.countDocuments(query);

    res.json({
      teams,
      pagination: {
        total,
        skip: parseInt(skip),
        limit: parseInt(limit),
        hasMore: parseInt(skip) + parseInt(limit) < total,
      },
    });
  } catch (error) {
    console.error('[v0] Get teams error:', error);
    next(error);
  }
}

export async function getTeamDetail(req, res, next) {
  try {
    const { id } = req.params;

    const team = await Team.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate('creator', 'firstName lastName avatar university')
     .populate('members.user', 'firstName lastName avatar skills');

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json(team);
  } catch (error) {
    console.error('[v0] Get team detail error:', error);
    next(error);
  }
}

export async function updateTeam(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user is team lead
    const team = await Team.findById(id);
    if (!team.isLead(userId)) {
      return res.status(403).json({ error: 'Only team lead can update team' });
    }

    const updates = req.body;
    delete updates.members;
    delete updates.creator;
    delete updates.chatRoomId;

    const updatedTeam = await Team.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate('members.user', 'firstName lastName avatar')
     .populate('creator', 'firstName lastName avatar');

    console.log('[v0] Team updated:', updatedTeam.name);

    res.json({
      message: 'Team updated successfully',
      team: updatedTeam,
    });
  } catch (error) {
    console.error('[v0] Update team error:', error);
    next(error);
  }
}

export async function postJoinRequest(req, res, next) {
  try {
    const userId = req.user.id;
    const { teamId } = req.params;
    const { message = '' } = req.body;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Check if already member
    if (team.isMember(userId)) {
      return res.status(400).json({ error: 'Already a member of this team' });
    }

    // Check if pending request exists
    const existingRequest = await JoinRequest.findOne({
      user: userId,
      team: teamId,
      status: 'pending',
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'Join request already pending' });
    }

    const joinRequest = new JoinRequest({
      user: userId,
      team: teamId,
      message,
    });

    await joinRequest.save();
    await team.updateOne({ $inc: { requestCount: 1 } });

    // Create notification for team lead
    const teamLead = team.members.find(m => m.role === 'lead');
    const user = await User.findById(userId);

    await Notification.create({
      type: 'join_request',
      title: `New join request from ${user.firstName} ${user.lastName}`,
      message: `${user.firstName} ${user.lastName} requested to join ${team.name}`,
      recipient: teamLead.user,
      relatedUserId: userId,
      relatedTeamId: teamId,
    });

    console.log('[v0] Join request created:', teamId);

    res.status(201).json({
      message: 'Join request submitted',
      joinRequest,
    });
  } catch (error) {
    console.error('[v0] Post join request error:', error);
    next(error);
  }
}

export async function acceptJoinRequest(req, res, next) {
  try {
    const { teamId, requestId } = req.params;
    const userId = req.user.id;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Check if user is team lead
    if (!team.isLead(userId)) {
      return res.status(403).json({ error: 'Only team lead can accept requests' });
    }

    const joinRequest = await JoinRequest.findById(requestId);
    if (!joinRequest) {
      return res.status(404).json({ error: 'Join request not found' });
    }

    // Add user to team
    team.members.push({ user: joinRequest.user, role: 'member' });
    await team.save();

    // Update join request
    joinRequest.status = 'accepted';
    joinRequest.respondedAt = new Date();
    await joinRequest.save();

    // Create notification for applicant
    await Notification.create({
      type: 'team_update',
      title: `Accepted to ${team.name}`,
      message: `You were accepted to join ${team.name}!`,
      recipient: joinRequest.user,
      relatedTeamId: teamId,
    });

    // Update user stats
    await User.findByIdAndUpdate(joinRequest.user, { $inc: { teamsJoined: 1 } });

    console.log('[v0] Join request accepted:', requestId);

    res.json({
      message: 'Join request accepted',
      joinRequest,
    });
  } catch (error) {
    console.error('[v0] Accept join request error:', error);
    next(error);
  }
}

export async function rejectJoinRequest(req, res, next) {
  try {
    const { teamId, requestId } = req.params;
    const userId = req.user.id;

    const team = await Team.findById(teamId);
    if (!team || !team.isLead(userId)) {
      return res.status(403).json({ error: 'Only team lead can reject requests' });
    }

    const joinRequest = await JoinRequest.findByIdAndUpdate(
      requestId,
      {
        status: 'rejected',
        respondedAt: new Date(),
      },
      { new: true }
    );

    if (!joinRequest) {
      return res.status(404).json({ error: 'Join request not found' });
    }

    console.log('[v0] Join request rejected:', requestId);

    res.json({
      message: 'Join request rejected',
      joinRequest,
    });
  } catch (error) {
    console.error('[v0] Reject join request error:', error);
    next(error);
  }
}

export async function getTeamRequests(req, res, next) {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;

    const team = await Team.findById(teamId);
    if (!team || !team.isLead(userId)) {
      return res.status(403).json({ error: 'Only team lead can view requests' });
    }

    const requests = await JoinRequest.find({ team: teamId })
      .populate('user', 'firstName lastName avatar skills university')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('[v0] Get team requests error:', error);
    next(error);
  }
}
