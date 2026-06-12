import User from '../models/User.js';
import Team from '../models/Team.js';
import Project from '../models/Project.js';
import Message from '../models/Message.js';
import FriendRequest from '../models/FriendRequest.js';

// GET /api/admin/stats — Platform overview
export async function getStats(req, res, next) {
  try {
    const [users, teams, projects, messages, friendRequests] = await Promise.all([
      User.countDocuments(),
      Team.countDocuments(),
      Project.countDocuments(),
      Message.countDocuments(),
      FriendRequest.countDocuments({ status: 'accepted' }),
    ]);

    const onlineUsers = await User.countDocuments({ onlineStatus: 'online' });

    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    });

    res.json({ users, teams, projects, messages, friends: friendRequests, onlineUsers, newUsersToday });
  } catch (error) {
    next(error);
  }
}

// GET /api/admin/users?skip=0&limit=20&search=
export async function getUsers(req, res, next) {
  try {
    const { skip = 0, limit = 20, search = '' } = req.query;
    const query = search
      ? { $or: [{ firstName: new RegExp(search, 'i') }, { lastName: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }] }
      : {};

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-passwordHash -refreshTokens')
        .sort({ createdAt: -1 })
        .skip(+skip)
        .limit(+limit),
      User.countDocuments(query),
    ]);

    res.json({ users, total, skip: +skip, limit: +limit });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/admin/users/:id/ban — Toggle user ban
export async function banUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user._id.toString() === req.user.id) return res.status(400).json({ error: 'Cannot ban yourself' });

    const { ban } = req.body;
    user.isBanned = ban !== undefined ? ban : !user.isBanned;
    user.isPublic = !user.isBanned;
    await user.save();
    res.json({ message: user.isBanned ? 'User banned' : 'User unbanned', isBanned: user.isBanned });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/admin/users/:id/role — Change role
export async function changeRole(req, res, next) {
  try {
    const { role } = req.body;
    if (!['user', 'student', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-passwordHash -refreshTokens');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: `Role changed to ${role}`, user });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/admin/users/:id — Delete user
export async function deleteUser(req, res, next) {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    next(error);
  }
}

// GET /api/admin/teams
export async function getTeams(req, res, next) {
  try {
    const { skip = 0, limit = 20 } = req.query;
    const [teams, total] = await Promise.all([
      Team.find().populate('owner', 'firstName lastName email').sort({ createdAt: -1 }).skip(+skip).limit(+limit),
      Team.countDocuments(),
    ]);
    res.json({ teams, total });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/admin/teams/:id
export async function deleteTeam(req, res, next) {
  try {
    await Team.findByIdAndDelete(req.params.id);
    res.json({ message: 'Team deleted' });
  } catch (error) {
    next(error);
  }
}
