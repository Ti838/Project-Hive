import { supabaseAdmin } from '../config/supabase.js';

let _io = null;
export function setIo(io) { _io = io; }
export function getIo() { return _io; }

const activeUsers = new Map(); // userId -> Set of sockets
const userActivity = new Map(); // userId -> { lastActivity: ISO string }

export async function registerUserSocket(socket) {
  if (!activeUsers.has(socket.userId)) {
    activeUsers.set(socket.userId, new Set());
  }
  const sockets = activeUsers.get(socket.userId);
  sockets.add(socket);

  const now = new Date().toISOString();
  userActivity.set(socket.userId, { lastActivity: now });

  if (sockets.size === 1) {
    try {
      await supabaseAdmin.from('users').update({ online_status: 'online', last_seen: now }).eq('id', socket.userId);
    } catch (_) { /* non-fatal */ }
    if (_io) _io.emit('status:update', { userId: socket.userId, status: 'online', lastSeen: now });
  }

  // Track activity on any socket event (heartbeat)
  socket.on('heartbeat', () => {
    const ts = new Date().toISOString();
    userActivity.set(socket.userId, { lastActivity: ts });
  });
}

export async function unregisterUserSocket(socket) {
  const userId = socket.userId;
  const sockets = activeUsers.get(userId);
  if (sockets) {
    sockets.delete(socket);
    if (sockets.size === 0) {
      activeUsers.delete(userId);
      const now = new Date().toISOString();
      userActivity.set(userId, { lastActivity: now });
      try {
        await supabaseAdmin.from('users').update({ online_status: 'offline', last_seen: now }).eq('id', userId);
      } catch (_) { /* non-fatal */ }
      if (_io) _io.emit('status:update', { userId, status: 'offline', lastSeen: now });
    }
  }
}

export function getUserSocket(userId) {
  const sockets = activeUsers.get(userId);
  return (sockets && sockets.size > 0) ? Array.from(sockets)[0] : null;
}
export function getUserSockets(userId) {
  const sockets = activeUsers.get(userId);
  return (sockets && sockets.size > 0) ? Array.from(sockets) : [];
}
export function getActiveUsers() { return Array.from(activeUsers.keys()); }
export function isUserOnline(userId) { return activeUsers.has(userId); }

export async function handleJoinRoom(socket, data) {
  const roomId = typeof data === 'string' ? data : data?.roomId;
  if (!roomId) return socket.emit('error', { message: 'Missing roomId' });

  if (socket.roomId) {
    socket.leave(socket.roomId);
    socket.to(socket.roomId).emit('user:offline', { userId: socket.userId, timestamp: new Date() });
  }

  socket.join(roomId);
  socket.roomId = roomId;
  socket.to(roomId).emit('user:online', { userId: socket.userId, timestamp: new Date() });

  const roomSockets = await socket.in(roomId).fetchSockets?.() || [];
  const onlineUserIds = roomSockets.map(s => s.userId).filter(id => id && id !== socket.userId);
  socket.emit('room:joined', { roomId, onlineUsers: onlineUserIds });
}

export async function handleLeaveRoom(socket) {
  if (socket.roomId) {
    socket.leave(socket.roomId);
    socket.to(socket.roomId).emit('user:offline', { userId: socket.userId, timestamp: new Date() });
    socket.roomId = null;
  }
}

export async function handleSendMessage(socket, io, data) {
  try {
    const roomId = data.roomId || data.teamId;
    const { content, reply_to, reply_to_content, reply_to_sender } = data;
    if (!content || !roomId) return socket.emit('error', { message: 'Missing content or roomId' });

    // Only include optional columns when they have actual values
    // Avoids "column does not exist" if DB schema hasn't been patched yet
    const insertData = {
      room_id: roomId,
      sender_id: socket.userId,
      content,
      read_by: [socket.userId],
    };
    if (reply_to)         insertData.reply_to         = reply_to;
    if (reply_to_content) insertData.reply_to_content = reply_to_content;
    if (reply_to_sender)  insertData.reply_to_sender  = reply_to_sender;

    // Save to Supabase
    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert(insertData)
      .select('*, sender:sender_id(id, first_name, last_name, avatar, avatar_color)')
      .single();

    if (error) {
      console.error('[ProjectHive] DB insert error:', error.message, error.details);
      return socket.emit('error', { message: 'Failed to save message: ' + error.message });
    }

    const payload = {
      id: message.id,
      content: message.content,
      sender: message.sender,
      roomId: message.room_id,
      createdAt: message.created_at,
      reply_to: message.reply_to || null,
      reply_to_content: message.reply_to_content || null,
      reply_to_sender: message.reply_to_sender || null,
    };

    io.to(roomId).emit('message:received', payload);
  } catch (err) {
    console.error('[ProjectHive] Send message error:', err);
    socket.emit('error', { message: 'Failed to send message' });
  }
}


export function handleTyping(socket, io, data) {
  const roomId = data.roomId || data.teamId || socket.roomId;
  if (!roomId) return;
  if (data.isTyping) {
    socket.to(roomId).emit('user:typing', { userId: socket.userId });
  } else {
    socket.to(roomId).emit('user:stop-typing', { userId: socket.userId });
  }
}

export function broadcastNotification(io, recipientId, notification) {
  const userSocket = getUserSocket(recipientId);
  if (userSocket) userSocket.emit('notification:new', notification);
}

export function broadcastToRoom(io, roomId, event, data) {
  if (_io) _io.to(roomId).emit(event, data);
}

export async function handleCallInitiate(socket, data) {
  const { roomId, targetId, callerName, isWebRTC, isVoiceOnly } = data;
  if (!roomId || !targetId) return;

  // Server-side friend-gating: verify friendship before allowing call
  try {
    const { data: friendship } = await supabaseAdmin
      .from('friends')
      .select('id')
      .eq('user_id', socket.userId)
      .eq('friend_id', targetId)
      .maybeSingle();

    if (!friendship) {
      socket.emit('call:error', { message: 'You must be friends to call this person' });
      return;
    }
  } catch (e) {
    // If DB check fails, allow the call (fail-open for UX)
  }

  // Emit call:incoming to ALL sockets of the target user (mobile + PC = both ring)
  const targetSockets = getUserSockets(targetId);
  if (targetSockets.length > 0) {
    const payload = {
      roomId,
      callerName,
      callerId: socket.userId,
      isWebRTC: !!isWebRTC,
      isVoiceOnly: !!isVoiceOnly
    };
    targetSockets.forEach(s => s.emit('call:incoming', payload));
  } else {
    // Target user is offline
    socket.emit('call:error', { message: 'User is currently offline' });
  }
}

export function handleCallAccept(socket, data) {
  const { roomId, targetId } = data;
  if (!roomId || !targetId) return;
  const targetSocket = getUserSocket(targetId);
  if (targetSocket) {
    targetSocket.emit('call:accepted', { roomId });
  }
}

export function handleCallDecline(socket, data) {
  const { roomId, targetId } = data;
  if (!roomId || !targetId) return;
  const targetSocket = getUserSocket(targetId);
  if (targetSocket) {
    targetSocket.emit('call:declined', { roomId });
  }
}

export function handleCallHangup(socket, data) {
  const { roomId, targetId } = data;
  if (!roomId || !targetId) return;
  const targetSocket = getUserSocket(targetId);
  if (targetSocket) {
    targetSocket.emit('call:hungup', { roomId });
  }
}

// ── Group Call: notify all team members ──────────────────────────────────────
export async function handleGroupCallInitiate(socket, data) {
  const { roomId, teamId, callerName } = data;
  if (!roomId || !teamId) return;

  try {
    // Get all team members except the caller
    const { data: members } = await supabaseAdmin
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId)
      .neq('user_id', socket.userId);

    if (!members) return;

    // Notify each online team member
    for (const member of members) {
      const memberSocket = getUserSocket(member.user_id);
      if (memberSocket) {
        memberSocket.emit('call:incoming', {
          roomId,
          callerName,
          callerId: socket.userId,
          isGroup: true,
          teamId
        });
      }
    }
  } catch (err) {
    console.error('[ProjectHive] Group call error:', err);
  }
}
