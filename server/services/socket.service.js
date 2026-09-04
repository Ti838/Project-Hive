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
    const { content, type, reply_to, reply_to_content, reply_to_sender } = data;
    if (!content || !roomId) return socket.emit('error', { message: 'Missing content or roomId' });

    // Only include optional columns when they have actual values
    // Avoids "column does not exist" if DB schema hasn't been patched yet
    const insertData = {
      room_id: roomId,
      sender_id: socket.userId,
      content,
      type: type || 'text',
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
      type: message.type || 'text',
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

export async function handleMessageReact(socket, io, data) {
  try {
    const { messageId, roomId, emoji } = data;
    if (!messageId || !emoji) return;
    const userId = socket.userId;

    const { data: existing } = await supabaseAdmin
      .from('message_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .eq('emoji', emoji)
      .maybeSingle();

    let action = 'added';
    if (existing) {
      await supabaseAdmin.from('message_reactions').delete().eq('id', existing.id);
      action = 'removed';
    } else {
      await supabaseAdmin.from('message_reactions').insert({
        message_id: messageId,
        user_id: userId,
        emoji,
      });
    }

    const targetRoom = roomId || socket.roomId;
    if (targetRoom) {
      io.to(targetRoom).emit('message:reaction', {
        messageId,
        roomId: targetRoom,
        emoji,
        userId,
        action,
      });
    }
  } catch (err) {
    console.error('[ProjectHive] Reaction error:', err.message);
  }
}

export async function handleMessageRead(socket, io, data) {
  try {
    const { roomId, friendId, messageIds } = data;
    const targetRoom = roomId || (friendId ? [socket.userId, friendId].sort().join('_') : socket.roomId);
    if (!targetRoom) return;

    // Update in database
    if (friendId) {
      const { data: msgs } = await supabaseAdmin
        .from('messages')
        .select('id, read_by')
        .eq('room_id', targetRoom)
        .neq('sender_id', socket.userId);

      const toUpdate = (msgs || []).filter(m => !m.read_by || !m.read_by.includes(socket.userId));
      for (const msg of toUpdate) {
        const newReadBy = [...(msg.read_by || []), socket.userId];
        await supabaseAdmin.from('messages').update({ read_by: newReadBy }).eq('id', msg.id);
      }
    }

    io.to(targetRoom).emit('message:read_receipt', {
      roomId: targetRoom,
      readBy: socket.userId,
      messageIds: messageIds || [],
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[ProjectHive] Read receipt error:', err.message);
  }
}

export function broadcastNotification(io, recipientId, notification) {
  const userSockets = getUserSockets(recipientId);
  userSockets.forEach(socket => {
    try {
      socket.emit('notification:new', notification);
    } catch (_) {}
  });
}

export function broadcastToRoom(io, roomId, event, data) {
  if (_io) _io.to(roomId).emit(event, data);
}

export async function handleCallInitiate(socket, data) {
  const { roomId, targetId, callerName, isWebRTC, isVoiceOnly } = data;

  console.log('[Call] 📞 Call initiation request:', {
    from: socket.userId,
    to: targetId,
    roomId,
    isWebRTC,
    isVoiceOnly
  });

  if (!roomId || !targetId) {
    console.error('[Call] ❌ Missing roomId or targetId');
    return;
  }

  // Server-side friend-gating: verify friendship before allowing call
  try {
    const { data: friendship } = await supabaseAdmin
      .from('friends')
      .select('id')
      .eq('user_id', socket.userId)
      .eq('friend_id', targetId)
      .maybeSingle();

    if (!friendship) {
      console.warn('[Call] ⚠️ Not friends:', socket.userId, '->', targetId);
      socket.emit('call:error', { message: 'You must be friends to call this person' });
      return;
    }

    console.log('[Call] ✅ Friendship verified');
  } catch (e) {
    console.error('[Call] ⚠️ Friendship check error:', e.message);
    // If DB check fails, allow the call (fail-open for UX)
  }

  // Emit call:incoming to ALL sockets of the target user (mobile + PC = both ring)
  const targetSockets = getUserSockets(targetId);

  console.log('[Call] Target user sockets:', {
    targetId,
    socketCount: targetSockets.length,
    socketIds: targetSockets.map(s => s.id)
  });

  if (targetSockets.length > 0) {
    const payload = {
      roomId,
      callerName,
      callerId: socket.userId,
      isWebRTC: !!isWebRTC,
      isVoiceOnly: !!isVoiceOnly
    };

    console.log('[Call] 📤 Emitting call:incoming to', targetSockets.length, 'sockets');

    targetSockets.forEach(s => {
      s.emit('call:incoming', payload);
      console.log('[Call] 📨 Sent to socket:', s.id);
    });

    console.log('[Call] ✅ Call notification sent successfully');
  } else {
    // Target user is offline
    console.warn('[Call] ❌ Target user offline:', targetId);
    socket.emit('call:error', { message: 'User is currently offline' });
  }
}

export function handleCallAccept(socket, data) {
  const { roomId, targetId } = data;
  if (!roomId || !targetId) return;
  const targetSockets = getUserSockets(targetId);
  targetSockets.forEach(s => s.emit('call:accepted', { roomId }));
}

export function handleCallDecline(socket, data) {
  const { roomId, targetId } = data;
  if (!roomId || !targetId) return;
  const targetSockets = getUserSockets(targetId);
  targetSockets.forEach(s => s.emit('call:declined', { roomId }));
}

export function handleCallHangup(socket, data) {
  const { roomId, targetId } = data;
  if (!roomId || !targetId) return;
  const targetSockets = getUserSockets(targetId);
  targetSockets.forEach(s => s.emit('call:hungup', { roomId }));
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
