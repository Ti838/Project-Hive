import FriendRequest from '../models/FriendRequest.js';
import User from '../models/User.js';
import { broadcastNotification } from '../services/socket.service.js';

// POST /api/friends/request/:userId  — Send a friend request
export async function sendFriendRequest(req, res, next) {
  try {
    const senderId   = req.user.id;
    const receiverId = req.params.userId;

    if (senderId === receiverId) {
      return res.status(400).json({ error: 'Cannot send request to yourself' });
    }

    // Check receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ error: 'User not found' });

    // Already friends?
    const sender = await User.findById(senderId);
    if (sender.friends.includes(receiverId)) {
      return res.status(400).json({ error: 'Already friends' });
    }

    // Already pending?
    const existing = await FriendRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
      status: 'pending',
    });
    if (existing) return res.status(400).json({ error: 'Request already pending' });

    const request = await FriendRequest.create({ sender: senderId, receiver: receiverId });
    await request.populate('sender', 'firstName lastName avatar');

    // Real-time notification to receiver
    broadcastNotification(null, receiverId, {
      type: 'friend_request',
      message: `${request.sender.firstName} ${request.sender.lastName} sent you a friend request`,
      requestId: request._id,
      sender: request.sender,
    });

    res.status(201).json({ message: 'Friend request sent', request });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Request already sent' });
    }
    next(error);
  }
}

// POST /api/friends/accept/:requestId  — Accept a friend request
export async function acceptFriendRequest(req, res, next) {
  try {
    const userId    = req.user.id;
    const requestId = req.params.requestId;

    const request = await FriendRequest.findById(requestId).populate('sender receiver', 'firstName lastName avatar');
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.receiver._id.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request already handled' });
    }

    request.status    = 'accepted';
    request.updatedAt = new Date();
    await request.save();

    // Add each other as friends
    await User.findByIdAndUpdate(request.sender._id,   { $addToSet: { friends: request.receiver._id } });
    await User.findByIdAndUpdate(request.receiver._id, { $addToSet: { friends: request.sender._id } });

    // Notify sender
    broadcastNotification(null, request.sender._id.toString(), {
      type: 'friend_accepted',
      message: `${request.receiver.firstName} ${request.receiver.lastName} accepted your friend request`,
      friend: request.receiver,
    });

    res.json({ message: 'Friend request accepted', request });
  } catch (error) {
    next(error);
  }
}

// POST /api/friends/reject/:requestId  — Reject a request
export async function rejectFriendRequest(req, res, next) {
  try {
    const userId    = req.user.id;
    const requestId = req.params.requestId;

    const request = await FriendRequest.findById(requestId);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.receiver.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    request.status    = 'rejected';
    request.updatedAt = new Date();
    await request.save();

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    next(error);
  }
}

// GET /api/friends  — Get my friends list (with online status)
export async function getFriends(req, res, next) {
  try {
    const user = await User.findById(req.user.id)
      .populate('friends', 'firstName lastName avatar onlineStatus lastSeen university major');
    res.json({ friends: user.friends });
  } catch (error) {
    next(error);
  }
}

// GET /api/friends/requests  — Get pending incoming requests
export async function getPendingRequests(req, res, next) {
  try {
    const requests = await FriendRequest.find({ receiver: req.user.id, status: 'pending' })
      .populate('sender', 'firstName lastName avatar university major')
      .sort({ createdAt: -1 });
    res.json({ requests });
  } catch (error) {
    next(error);
  }
}

// GET /api/friends/dm-history/:friendId  — Get DM messages with a friend
export async function getDMHistory(req, res, next) {
  try {
    const { Message } = await import('../models/Message.js');
    const myId       = req.user.id;
    const friendId   = req.params.friendId;
    const { skip = 0, limit = 50 } = req.query;

    // Verify friendship
    const me = await User.findById(myId);
    if (!me.friends.includes(friendId)) {
      return res.status(403).json({ error: 'Not friends' });
    }

    const roomId   = [myId, friendId].sort().join('_');
    const messages = await (await import('../models/Message.js')).default
      .find({ roomId })
      .populate('sender', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .lean();

    res.json({ messages: messages.reverse(), roomId });
  } catch (error) {
    next(error);
  }
}
