import { supabaseAdmin } from '../config/supabase.js';
import { getIo } from '../services/socket.service.js';

// ── Get all team conversations for the current user ──────────────────────────
// ── Optimized: Get all team conversations with ZERO N+1 query overhead ────────
export async function getTeamConversations(req, res, next) {
  try {
    const myId = req.user.id;

    // 1. Fetch user's team memberships
    const { data: memberships, error: memErr } = await supabaseAdmin
      .from('team_members')
      .select('team_id, role')
      .eq('user_id', myId);

    if (memErr) throw memErr;
    if (!memberships || memberships.length === 0) return res.json({ teams: [] });

    const teamIds = memberships.map((m) => m.team_id);

    // 2. Fetch team details in a single query
    const { data: teams, error: teamErr } = await supabaseAdmin
      .from('teams')
      .select('id, name, description, category')
      .in('id', teamIds);

    if (teamErr) throw teamErr;

    // 3. Batch fetch all members for these teams (single query instead of N queries)
    const { data: allMembers, error: membersErr } = await supabaseAdmin
      .from('team_members')
      .select('team_id')
      .in('team_id', teamIds);

    if (membersErr) throw membersErr;

    // Build member count lookup map
    const memberCountMap = (allMembers || []).reduce((acc, row) => {
      acc[row.team_id] = (acc[row.team_id] || 0) + 1;
      return acc;
    }, {});

    // 4. Batch fetch latest messages for these teams using room_id lookup
    const { data: recentMessages, error: msgErr } = await supabaseAdmin
      .from('messages')
      .select('room_id, content, created_at, sender:sender_id(first_name)')
      .in('room_id', teamIds)
      .order('created_at', { ascending: false });

    if (msgErr) throw msgErr;

    // Extract newest message per team
    const lastMessageMap = {};
    for (const msg of recentMessages || []) {
      if (!lastMessageMap[msg.room_id]) {
        lastMessageMap[msg.room_id] = {
          content: msg.content,
          senderName: msg.sender?.first_name || 'Someone',
          createdAt: msg.created_at,
        };
      }
    }

    // 5. Assemble final response without serial await delays
    const result = (teams || []).map((team) => {
      const membership = memberships.find((m) => m.team_id === team.id);
      return {
        _id: team.id,
        type: 'team',
        name: team.name,
        description: team.description,
        category: team.category,
        memberCount: memberCountMap[team.id] || 0,
        role: membership?.role || 'member',
        lastMessage: lastMessageMap[team.id] || null,
      };
    });

    // Sort by last active message
    result.sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    return res.json({ teams: result });
  } catch (err) {
    next(err);
  }
}

export async function getTeamMessages(req, res, next) {
  try {
    const { teamId } = req.params;
    const { skip = 0, limit = 50, roomId } = req.query;
    const userId = req.user.id;

    // Verify membership
    const { data: mem } = await supabaseAdmin.from('team_members').select('id').eq('team_id', teamId).eq('user_id', userId).maybeSingle();
    if (!mem) return res.status(403).json({ error: 'Not a member of this team' });

    const targetRoomId = roomId || teamId;

    const { data: messages, error, count } = await supabaseAdmin
      .from('messages')
      .select(`*, sender:sender_id(id, first_name, last_name, avatar, avatar_color)`, { count: 'exact' })
      .eq('room_id', targetRoomId)
      .range(parseInt(skip), parseInt(skip) + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      messages: (messages || []).reverse(),
      pagination: {
        total: count || 0,
        skip: parseInt(skip),
        limit: parseInt(limit),
        hasMore: parseInt(skip) + parseInt(limit) < (count || 0),
      },
      ok: true,
    });
  } catch (err) { next(err); }
}

export async function saveMessage(req, res, next) {
  try {
    const { roomId, content, type, reply_to, reply_to_content, reply_to_sender } = req.body;
    const userId = req.user.id;

    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert({
        room_id: roomId,
        sender_id: userId,
        content,
        type: type || 'text',
        read_by: [userId],
        reply_to: reply_to || null,
        reply_to_content: reply_to_content || null,
        reply_to_sender: reply_to_sender || null
      })
      .select(`*, sender:sender_id(id, first_name, last_name, avatar, avatar_color)`)
      .single();

    if (error) throw error;
    res.status(201).json(message);
  } catch (err) { next(err); }
}

// ── GET DM history between current user and friendId (or by roomId) ─────────
export async function getDmHistory(req, res, next) {
  try {
    const myId = req.user.id;
    const { friendId } = req.params;
    const { skip = 0, limit = 50 } = req.query;

    // Support either room_id (uuid_uuid) or single friendId
    const roomId = friendId.includes('_') ? friendId : [myId, friendId].sort().join('_');

    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select(`*, sender:sender_id(id, first_name, last_name, avatar, avatar_color)`)
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .range(+skip, +skip + +limit - 1);

    if (error) throw error;

    // Fetch reactions separately to avoid PostgREST join issues
    const messageIds = (messages || []).map(m => m.id).filter(Boolean);
    let reactionsMap = {};
    if (messageIds.length > 0) {
      const { data: reactions } = await supabaseAdmin
        .from('message_reactions')
        .select('message_id, emoji, user_id')
        .in('message_id', messageIds);
      (reactions || []).forEach(r => {
        if (!reactionsMap[r.message_id]) reactionsMap[r.message_id] = [];
        reactionsMap[r.message_id].push(r);
      });
    }

    const messagesWithReactions = (messages || []).reverse().map(m => ({
      ...m,
      reactions: reactionsMap[m.id] || []
    }));

    res.json({ messages: messagesWithReactions, roomId });
  } catch (err) { next(err); }
}

export async function getConversations(req, res, next) {
  try {
    const myId = req.user.id;

    // 1. Fetch accepted friends
    const { data: friendsData, error: friendsError } = await supabaseAdmin
      .from('friends')
      .select('friend_id')
      .eq('user_id', myId);

    if (friendsError) throw friendsError;

    // 2. Fetch all unique direct message room partners
    const { data: msgRooms, error: msgRoomsError } = await supabaseAdmin
      .from('messages')
      .select('room_id')
      .like('room_id', `%${myId}%`);

    if (msgRoomsError) throw msgRoomsError;

    const partnerIds = new Set();
    if (friendsData) {
      friendsData.forEach((row) => {
        if (row.friend_id) partnerIds.add(row.friend_id);
      });
    }

    if (msgRooms) {
      msgRooms.forEach((m) => {
        if (m.room_id && m.room_id.includes('_')) {
          const parts = m.room_id.split('_');
          const other = parts.find((p) => p !== myId);
          if (other) partnerIds.add(other);
        }
      });
    }

    if (partnerIds.size === 0) {
      return res.json({ conversations: [] });
    }

    const partnerIdList = Array.from(partnerIds);
    const roomIds = partnerIdList.map((id) => [myId, id].sort().join('_'));

    // 3. Parallel batch fetching (Zero N+1 query overhead)
    const [partnersRes, pinsRes, recentMsgsRes] = await Promise.all([
      supabaseAdmin
        .from('users')
        .select('id, first_name, last_name, avatar, avatar_color, online_status, last_seen, university, major')
        .in('id', partnerIdList),
      supabaseAdmin
        .from('conversation_pins')
        .select('room_id, pinned_at')
        .eq('user_id', myId),
      supabaseAdmin
        .from('messages')
        .select('id, room_id, content, type, sender_id, created_at, status, media_url, voice_url, read_by')
        .in('room_id', roomIds)
        .order('created_at', { ascending: false }),
    ]);

    if (partnersRes.error) throw partnersRes.error;

    // Build pinned lookup map
    const pinnedMap = new Map();
    (pinsRes.data || []).forEach((p) => {
      pinnedMap.set(p.room_id, p.pinned_at);
    });

    // Build latest message map & unread count map in single pass
    const lastMessageMap = new Map();
    const unreadCountMap = new Map();

    (recentMsgsRes.data || []).forEach((m) => {
      // First message seen for room_id is the newest because of ORDER BY created_at DESC
      if (!lastMessageMap.has(m.room_id)) {
        lastMessageMap.set(m.room_id, {
          id: m.id,
          content: m.content,
          type: m.type,
          sender: m.sender_id,
          sender_id: m.sender_id,
          created_at: m.created_at,
          createdAt: m.created_at,
          status: m.status || 'sent',
        });
      }

      // Count unread messages from partner
      if (m.sender_id !== myId) {
        const isRead = m.read_by && Array.isArray(m.read_by) && m.read_by.includes(myId);
        if (!isRead) {
          unreadCountMap.set(m.room_id, (unreadCountMap.get(m.room_id) || 0) + 1);
        }
      }
    });

    const conversations = (partnersRes.data || []).map((friend) => {
      const roomId = [myId, friend.id].sort().join('_');
      const isPinned = pinnedMap.has(roomId);
      const pinnedAt = pinnedMap.get(roomId) || null;
      const lastMsgObj = lastMessageMap.get(roomId) || null;
      const unreadCount = unreadCountMap.get(roomId) || 0;

      const friendObj = {
        _id: friend.id,
        id: friend.id,
        first_name: friend.first_name,
        last_name: friend.last_name,
        firstName: friend.first_name,
        lastName: friend.last_name,
        name: `${friend.first_name || ''} ${friend.last_name || ''}`.trim(),
        avatar: friend.avatar,
        avatar_color: friend.avatar_color,
        avatarColor: friend.avatar_color,
        online_status: friend.online_status,
        onlineStatus: friend.online_status,
        last_seen: friend.last_seen,
        lastSeen: friend.last_seen,
        university: friend.university,
        major: friend.major,
      };

      return {
        _id: roomId,
        id: roomId,
        roomId,
        friendId: friend.id,
        friend: friendObj,
        user: friendObj,
        last_message: lastMsgObj,
        lastMessage: lastMsgObj,
        unread_count: unreadCount,
        unreadCount,
        is_pinned: isPinned,
        isPinned,
        pinnedAt,
      };
    });

    // 4. Sort: Pinned conversations first, then newest message, then alphabetized
    conversations.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (a.isPinned && b.isPinned) {
        const pinTimeA = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
        const pinTimeB = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
        if (pinTimeA !== pinTimeB) return pinTimeB - pinTimeA;
      }

      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt || a.lastMessage.created_at).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt || b.lastMessage.created_at).getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;

      const nameA = `${a.friend?.firstName || ''} ${a.friend?.lastName || ''}`.toLowerCase();
      const nameB = `${b.friend?.firstName || ''} ${b.friend?.lastName || ''}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    res.json({ conversations });
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req, res, next) {
  try {
    const myId = req.user.id;
    const { friendId, roomId: givenRoomId, messageIds } = req.body;
    const roomId = givenRoomId || (friendId ? [myId, friendId].sort().join('_') : null);
    if (!roomId) return res.status(400).json({ error: 'Missing roomId or friendId' });

    let query = supabaseAdmin
      .from('messages')
      .select('id, read_by')
      .eq('room_id', roomId)
      .neq('sender_id', myId);

    if (messageIds && Array.isArray(messageIds) && messageIds.length > 0) {
      query = query.in('id', messageIds);
    }

    const { data: msgs, error } = await query;
    if (error) throw error;

    const toUpdate = (msgs || []).filter((m) => !m.read_by || !m.read_by.includes(myId));

    if (toUpdate.length > 0) {
      // Parallel batch updates
      await Promise.all(
        toUpdate.map((m) => {
          const newReadBy = [...(m.read_by || []), myId];
          return supabaseAdmin
            .from('messages')
            .update({ read_by: newReadBy, status: 'seen' })
            .eq('id', m.id);
        })
      );
    }

    const io = getIo();
    if (io) {
      const readPayload = {
        roomId,
        readBy: myId,
        messageIds: toUpdate.map((m) => m.id),
        timestamp: new Date().toISOString(),
      };
      io.to(roomId).emit('message:read_receipt', readPayload);

      // Also notify personal channel of DM partner
      if (roomId.includes('_')) {
        const otherId = roomId.split('_').find((p) => p !== myId);
        if (otherId) {
          io.to('user_' + otherId).emit('message:read_receipt', readPayload);
        }
      }
    }

    res.json({ ok: true, readCount: toUpdate.length });
  } catch (err) {
    next(err);
  }
}

// ─── TOGGLE PIN CONVERSATION ──────────────────────────────────────────────────
export async function togglePinConversation(req, res, next) {
  try {
    const myId = req.user.id;
    const roomId = req.params.roomId || req.body.roomId;
    if (!roomId) return res.status(400).json({ error: 'Missing roomId' });

    // Check if already pinned
    const { data: existing } = await supabaseAdmin
      .from('conversation_pins')
      .select('room_id')
      .eq('user_id', myId)
      .eq('room_id', roomId)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from('conversation_pins')
        .delete()
        .eq('user_id', myId)
        .eq('room_id', roomId);

      return res.json({ ok: true, pinned: false, roomId });
    } else {
      await supabaseAdmin
        .from('conversation_pins')
        .insert({
          user_id: myId,
          room_id: roomId,
          pinned_at: new Date().toISOString(),
        });

      return res.json({ ok: true, pinned: true, roomId });
    }
  } catch (err) {
    next(err);
  }
}

// ── Send Direct Message (Facebook-style request if not friends) ───────────────
export async function sendDirectMessage(req, res, next) {
  try {
    const senderId = req.user.id;
    const { receiverId, content, roomId: givenRoomId, reply_to, reply_to_content, reply_to_sender } = req.body;
    if (!receiverId || !content?.trim()) return res.status(400).json({ error: 'Missing receiverId or content' });

    const roomId = givenRoomId || [senderId, receiverId].sort().join('_');

    // Check if friends (friends table stores mutual rows: user_id → friend_id)
    const { data: friendship } = await supabaseAdmin
      .from('friends')
      .select('id')
      .eq('user_id', senderId)
      .eq('friend_id', receiverId)
      .maybeSingle();

    const areFriends = !!friendship;

    if (!areFriends) {
      // Check if existing accepted request
      const { data: existingReq } = await supabaseAdmin
        .from('dm_requests')
        .select('id, status')
        .eq('room_id', roomId)
        .maybeSingle();

      if (!existingReq) {
        // Create a new pending request
        await supabaseAdmin.from('dm_requests').insert({
          from_user_id: senderId,
          to_user_id: receiverId,
          room_id: roomId,
          status: 'pending'
        });
      } else if (existingReq.status === 'declined') {
        return res.status(403).json({ error: 'Message request was declined' });
      }
      // If 'pending' → allow more messages (they queue up)
    }

    // Save the message
    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert({
        room_id: roomId,
        sender_id: senderId,
        content: content.trim(),
        read_by: [senderId],
        reply_to: reply_to || null,
        reply_to_content: reply_to_content || null,
        reply_to_sender: reply_to_sender || null
      })
      .select('*, sender:sender_id(id, first_name, last_name, avatar, avatar_color)')
      .single();

    if (error) throw error;
    res.status(201).json({ message, roomId, isRequest: !areFriends });
  } catch (err) { next(err); }
}

// ── Get pending message requests (I am the recipient) ─────────────────────────
export async function getMessageRequests(req, res, next) {
  try {
    const myId = req.user.id;
    const { data: requests, error } = await supabaseAdmin
      .from('dm_requests')
      .select(`
        id, room_id, status, created_at,
        sender:from_user_id(id, first_name, last_name, avatar, avatar_color, university, online_status)
      `)
      .eq('to_user_id', myId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Attach preview of first message per request
    const result = await Promise.all((requests || []).map(async r => {
      const { data: preview } = await supabaseAdmin
        .from('messages')
        .select('content, created_at')
        .eq('room_id', r.room_id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      return {
        id: r.id,
        roomId: r.room_id,
        status: r.status,
        createdAt: r.created_at,
        sender: r.sender ? {
          id: r.sender.id,
          firstName: r.sender.first_name,
          lastName: r.sender.last_name,
          avatar: r.sender.avatar,
          avatarColor: r.sender.avatar_color,
          university: r.sender.university,
          onlineStatus: r.sender.online_status,
        } : null,
        preview: preview?.content || '',
      };
    }));

    res.json({ requests: result, total: result.length });
  } catch (err) { next(err); }
}

// ── Accept a message request ──────────────────────────────────────────────────
export async function acceptMessageRequest(req, res, next) {
  try {
    const myId = req.user.id;
    const { id } = req.params;

    const { data: req_ } = await supabaseAdmin.from('dm_requests').select('*').eq('id', id).single();
    if (!req_) return res.status(404).json({ error: 'Request not found' });
    if (req_.to_user_id !== myId) return res.status(403).json({ error: 'Not authorized' });

    await supabaseAdmin.from('dm_requests').update({ status: 'accepted' }).eq('id', id);
    res.json({ ok: true, roomId: req_.room_id, senderId: req_.from_user_id });
  } catch (err) { next(err); }
}

// ── Decline a message request ─────────────────────────────────────────────────
export async function declineMessageRequest(req, res, next) {
  try {
    const myId = req.user.id;
    const { id } = req.params;

    const { data: req_ } = await supabaseAdmin.from('dm_requests').select('*').eq('id', id).single();
    if (!req_) return res.status(404).json({ error: 'Request not found' });
    if (req_.to_user_id !== myId) return res.status(403).json({ error: 'Not authorized' });

    await supabaseAdmin.from('dm_requests').update({ status: 'declined' }).eq('id', id);
    // Delete all messages from this room
    await supabaseAdmin.from('messages').delete().eq('room_id', req_.room_id);
    res.json({ ok: true });
  } catch (err) { next(err); }
}


export async function deleteMessage(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { data: msg } = await supabaseAdmin.from('messages').select('sender_id, room_id').eq('id', id).maybeSingle();
    if (!msg) return res.status(404).json({ error: 'Not found' });
    if (msg.sender_id !== userId) return res.status(403).json({ error: 'Unauthorized' });

    // Delete reactions first to avoid foreign key violations
    await supabaseAdmin.from('message_reactions').delete().eq('message_id', id);

    await supabaseAdmin.from('messages').delete().eq('id', id);

    const io = getIo();
    if (io) {
      io.to(msg.room_id).emit('message:deleted', { messageId: id, roomId: msg.room_id });
    }

    res.json({ ok: true, roomId: msg.room_id });
  } catch (err) { next(err); }
}

export async function deleteConversation(req, res, next) {
  try {
    const { friendId } = req.params;
    const myId = req.user.id;
    const ids = [myId, friendId].sort();
    const roomId1 = `${ids[0]}_${ids[1]}`;
    const roomId2 = `${ids[1]}_${ids[0]}`;
    await supabaseAdmin.from('messages').delete().or(`room_id.eq.${roomId1},room_id.eq.${roomId2}`);
    res.json({ ok: true });
  } catch (err) { next(err); }
}

export async function reactToMessage(req, res, next) {
  try {
    const { id: messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    if (!emoji) return res.status(400).json({ error: 'Missing emoji' });

    // Check if reaction already exists (toggle)
    const { data: existing } = await supabaseAdmin
      .from('message_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .eq('emoji', emoji)
      .maybeSingle();

    if (existing) {
      // Remove reaction (toggle off)
      await supabaseAdmin.from('message_reactions').delete().eq('id', existing.id);
      return res.json({ ok: true, action: 'removed' });
    }

    // Add reaction
    await supabaseAdmin.from('message_reactions').insert({
      message_id: messageId,
      user_id: userId,
      emoji
    });

    res.json({ ok: true, action: 'added' });
  } catch (err) { next(err); }
}

export async function updateMessage(req, res, next) {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const { data: msg } = await supabaseAdmin.from('messages').select('sender_id, room_id').eq('id', id).maybeSingle();
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    if (msg.sender_id !== userId) return res.status(403).json({ error: 'Unauthorized to edit this message' });

    // Try updating content with is_edited: true
    const { data: updatedMsg, error } = await supabaseAdmin
      .from('messages')
      .update({ content, is_edited: true })
      .eq('id', id)
      .select(`*, sender:sender_id(id, first_name, last_name, avatar, avatar_color)`)
      .maybeSingle();

    let finalMsg = updatedMsg;
    if (error) {
      // Fallback: update content only
      const { data: fallbackMsg, error: err2 } = await supabaseAdmin
        .from('messages')
        .update({ content })
        .eq('id', id)
        .select(`*, sender:sender_id(id, first_name, last_name, avatar, avatar_color)`)
        .maybeSingle();
      if (err2) throw err2;
      finalMsg = fallbackMsg;
    }

    const io = getIo();
    if (io && finalMsg) {
      io.to(msg.room_id).emit('message:updated', { messageId: id, roomId: msg.room_id, content: finalMsg.content });
    }

    res.json({ ok: true, message: finalMsg });
  } catch (err) { next(err); }
}
