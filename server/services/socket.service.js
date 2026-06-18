import { supabaseAdmin } from '../config/supabase.js';

let _io = null;
export function setIo(io) { _io = io; }

const activeUsers = new Map(); // userId -> socket

export async function registerUserSocket(socket) {
  activeUsers.set(socket.userId, socket);
  try {
    await supabaseAdmin.from('users').update({ online_status: 'online', last_seen: new Date().toISOString() }).eq('id', socket.userId);
  } catch (_) { /* non-fatal */ }
  if (_io) _io.emit('status:update', { userId: socket.userId, status: 'online' });
}

export async function unregisterUserSocket(userId) {
  activeUsers.delete(userId);
  try {
    await supabaseAdmin.from('users').update({ online_status: 'offline', last_seen: new Date().toISOString() }).eq('id', userId);
  } catch (_) { /* non-fatal */ }
  if (_io) _io.emit('status:update', { userId, status: 'offline' });
}

export function getUserSocket(userId) { return activeUsers.get(userId); }
export function getActiveUsers() { return Array.from(activeUsers.keys()); }

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
    const { content } = data;
    if (!content || !roomId) return socket.emit('error', { message: 'Missing content or roomId' });

    // Save to Supabase
    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert({ room_id: roomId, sender_id: socket.userId, content, read_by: [socket.userId] })
      .select('*, sender:sender_id(id, first_name, last_name, avatar, avatar_color)')
      .single();

    if (error) throw error;

    const payload = {
      id: message.id,
      content: message.content,
      sender: message.sender,
      roomId: message.room_id,
      createdAt: message.created_at,
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

export function handleCallInitiate(socket, data) {
  const { roomId, targetId, callerName } = data;
  if (!roomId || !targetId) return;
  const targetSocket = getUserSocket(targetId);
  if (targetSocket) {
    targetSocket.emit('call:incoming', { roomId, callerName, callerId: socket.userId });
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
