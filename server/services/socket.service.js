import Message from '../models/Message.js';
import User from '../models/User.js';

let _io = null;
export function setIo(io) { _io = io; }

const activeUsers = new Map(); // userId -> socket

export async function registerUserSocket(socket) {
  activeUsers.set(socket.userId, socket);
  // Mark online in DB
  await User.findByIdAndUpdate(socket.userId, { onlineStatus: 'online', lastSeen: new Date() });
  // Broadcast to everyone that this user is online
  if (_io) _io.emit('status:update', { userId: socket.userId, status: 'online' });
  console.log('[v0] User socket registered:', socket.userId);
}

export async function unregisterUserSocket(userId) {
  activeUsers.delete(userId);
  // Mark offline in DB
  await User.findByIdAndUpdate(userId, { onlineStatus: 'offline', lastSeen: new Date() });
  // Broadcast to everyone that this user is offline
  if (_io) _io.emit('status:update', { userId, status: 'offline' });
  console.log('[v0] User socket unregistered:', userId);
}

export function getUserSocket(userId) {
  return activeUsers.get(userId);
}

export function getActiveUsers() {
  return Array.from(activeUsers.keys());
}

export async function handleJoinRoom(socket, data) {
  // Accept both string and object forms: 'roomId' or { roomId: '...' }
  const roomId = typeof data === 'string' ? data : data?.roomId;
  if (!roomId) {
    return socket.emit('error', { message: 'Missing roomId' });
  }

  // Leave previous room if any
  if (socket.roomId) {
    socket.leave(socket.roomId);
    socket.to(socket.roomId).emit('user:offline', {
      userId: socket.userId,
      timestamp: new Date(),
    });
  }

  socket.join(roomId);
  socket.roomId = roomId;

  // Notify others in room
  socket.to(roomId).emit('user:online', {
    userId: socket.userId,
    timestamp: new Date(),
  });

  // Send list of currently connected users in this room
  const roomSockets = await socket.in(roomId).fetchSockets?.() || [];
  const onlineUserIds = roomSockets
    .map(s => s.userId)
    .filter(id => id && id !== socket.userId);

  socket.emit('room:joined', {
    roomId,
    onlineUsers: onlineUserIds,
  });

  console.log('[v0] User', socket.userId, 'joined room:', roomId);
}

export async function handleLeaveRoom(socket) {
  if (socket.roomId) {
    socket.leave(socket.roomId);
    socket.to(socket.roomId).emit('user:offline', {
      userId: socket.userId,
      timestamp: new Date(),
    });
    console.log('[v0] User', socket.userId, 'left room:', socket.roomId);
    socket.roomId = null;
  }
}

export async function handleSendMessage(socket, io, data) {
  try {
    // Accept both 'roomId' and 'teamId' for backwards compatibility
    const roomId = data.roomId || data.teamId;
    const { content } = data;

    if (!content || !roomId) {
      return socket.emit('error', { message: 'Missing content or roomId' });
    }

    // Save message to database
    const message = new Message({
      content,
      sender: socket.userId,
      roomId,
      readBy: [socket.userId],
    });

    await message.save();
    await message.populate('sender', 'firstName lastName avatar');

    const messagePayload = {
      _id: message._id,
      content: message.content,
      sender: {
        _id: message.sender._id,
        firstName: message.sender.firstName,
        lastName: message.sender.lastName,
        avatar: message.sender.avatar,
      },
      roomId: message.roomId,
      createdAt: message.createdAt,
    };

    // Broadcast to room (including sender — sender sees it as confirmation)
    io.to(roomId).emit('message:received', messagePayload);

    console.log('[v0] Message sent in room:', roomId);
  } catch (error) {
    console.error('[v0] Send message error:', error);
    socket.emit('error', { message: 'Failed to send message' });
  }
}

export function handleTyping(socket, io, data) {
  const roomId = data.roomId || data.teamId || socket.roomId;
  const { isTyping } = data;

  if (!roomId) return;

  if (isTyping) {
    socket.to(roomId).emit('user:typing', {
      userId: socket.userId,
    });
  } else {
    socket.to(roomId).emit('user:stop-typing', {
      userId: socket.userId,
    });
  }
}

export function broadcastNotification(io, recipientId, notification) {
  const userSocket = getUserSocket(recipientId);
  if (userSocket) {
    userSocket.emit('notification:new', notification);
    console.log('[v0] Notification sent to user:', recipientId);
  }
}

export function broadcastToRoom(io, roomId, event, data) {
  io.to(roomId).emit(event, data);
  console.log('[v0] Broadcast to room', roomId, ':', event);
}
