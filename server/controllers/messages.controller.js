import Message from '../models/Message.js';
import Team from '../models/Team.js';

export async function getTeamMessages(req, res, next) {
  try {
    const { teamId } = req.params;
    const { skip = 0, limit = 50 } = req.query;
    const userId = req.user.id;

    // Verify user is team member
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    if (!team.isMember(userId)) {
      return res.status(403).json({ error: 'Not a member of this team' });
    }

    const messages = await Message.find({ roomId: teamId })
      .populate('sender', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .lean();

    const total = await Message.countDocuments({ roomId: teamId });

    res.json({
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        total,
        skip: parseInt(skip),
        limit: parseInt(limit),
        hasMore: parseInt(skip) + parseInt(limit) < total,
      },
      ok: true,
    });
  } catch (error) {
    console.error('[v0] Get team messages error:', error);
    next(error);
  }
}

export async function saveMessage(req, res, next) {
  try {
    const { roomId, content } = req.body;
    const userId = req.user.id;

    const message = new Message({
      content,
      sender: userId,
      roomId,
      readBy: [userId],
    });

    await message.save();
    await message.populate('sender', 'firstName lastName avatar');

    res.status(201).json(message);
  } catch (error) {
    console.error('[v0] Save message error:', error);
    next(error);
  }
}
