import { supabaseAdmin } from '../config/supabase.js';

// ── Get all team conversations for the current user ──────────────────────────
export async function getTeamConversations(req, res, next) {
  try {
    const myId = req.user.id;

    // Get teams user is a member of
    const { data: memberships, error: memErr } = await supabaseAdmin
      .from('team_members')
      .select('team_id, role')
      .eq('user_id', myId);

    if (memErr) throw memErr;
    if (!memberships || memberships.length === 0) return res.json({ teams: [] });

    const teamIds = memberships.map(m => m.team_id);

    // Get team details
    const { data: teams, error: teamErr } = await supabaseAdmin
      .from('teams')
      .select('id, name, description, category')
      .in('id', teamIds);

    if (teamErr) throw teamErr;

    // For each team, get last message and member count
    const result = await Promise.all((teams || []).map(async team => {
      const { data: lastMsg } = await supabaseAdmin
        .from('messages')
        .select('content, sender_id, created_at, sender:sender_id(first_name)')
        .eq('room_id', team.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { count: memberCount } = await supabaseAdmin
        .from('team_members')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', team.id);

      return {
        _id: team.id,
        type: 'team',
        name: team.name,
        description: team.description,
        category: team.category,
        memberCount: memberCount || 0,
        role: memberships.find(m => m.team_id === team.id)?.role || 'member',
        lastMessage: lastMsg ? {
          content: lastMsg.content,
          senderName: lastMsg.sender?.first_name || 'Someone',
          createdAt: lastMsg.created_at
        } : null
      };
    }));

    // Sort by last message time
    result.sort((a, b) => {
      const tA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const tB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return tB - tA;
    });

    res.json({ teams: result });
  } catch (err) { next(err); }
}

export async function getTeamMessages(req, res, next) {
  try {
    const { teamId } = req.params;
    const { skip = 0, limit = 50 } = req.query;
    const userId = req.user.id;

    // Verify membership
    const { data: mem } = await supabaseAdmin.from('team_members').select('id').eq('team_id', teamId).eq('user_id', userId).single();
    if (!mem) return res.status(403).json({ error: 'Not a member of this team' });

    const { data: messages, error, count } = await supabaseAdmin
      .from('messages')
      .select(`*, sender:sender_id(id, first_name, last_name, avatar, avatar_color)`, { count: 'exact' })
      .eq('room_id', teamId)
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
    const { roomId, content, reply_to, reply_to_content, reply_to_sender } = req.body;
    const userId = req.user.id;

    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert({ 
        room_id: roomId, 
        sender_id: userId, 
        content, 
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

// ── GET DM history between current user and friendId ─────────────────────────
export async function getDmHistory(req, res, next) {
  try {
    const myId = req.user.id;
    const { friendId } = req.params;
    const { skip = 0, limit = 50 } = req.query;
    const roomId = [myId, friendId].sort().join('_');

    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select(`
        *,
        sender:sender_id(id, first_name, last_name, avatar, avatar_color),
        reactions:message_reactions(id, emoji, user_id)
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .range(+skip, +skip + +limit - 1);

    if (error) throw error;
    res.json({ messages: (messages || []).reverse(), roomId });
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
      friendsData.forEach(row => {
        if (row.friend_id) partnerIds.add(row.friend_id);
      });
    }

    if (msgRooms) {
      msgRooms.forEach(m => {
        if (m.room_id && m.room_id.includes('_')) {
          const parts = m.room_id.split('_');
          const other = parts.find(p => p !== myId);
          if (other) partnerIds.add(other);
        }
      });
    }

    const conversations = [];

    if (partnerIds.size > 0) {
      // Fetch details of all conversation partners
      const { data: partners, error: partnersError } = await supabaseAdmin
        .from('users')
        .select('id, first_name, last_name, avatar, avatar_color, online_status, last_seen, university, major')
        .in('id', Array.from(partnerIds));

      if (partnersError) throw partnersError;

      for (const friend of (partners || [])) {
        const roomId = [myId, friend.id].sort().join('_');

        // Fetch last message
        const { data: lastMsg } = await supabaseAdmin
          .from('messages')
          .select('*')
          .eq('room_id', roomId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Fetch unread count
        const { data: msgs } = await supabaseAdmin
          .from('messages')
          .select('id, sender_id, read_by')
          .eq('room_id', roomId)
          .neq('sender_id', myId);

        const unreadCount = (msgs || []).filter(m => !m.read_by || !m.read_by.includes(myId)).length;

        conversations.push({
          _id: roomId,
          friendId: friend.id,
          friend: {
            _id: friend.id,
            id: friend.id,
            firstName: friend.first_name,
            lastName: friend.last_name,
            avatar: friend.avatar,
            avatarColor: friend.avatar_color,
            onlineStatus: friend.online_status,
            lastSeen: friend.last_seen,
            university: friend.university,
            major: friend.major
          },

          lastMessage: lastMsg ? {
            content: lastMsg.content,
            sender: lastMsg.sender_id,
            createdAt: lastMsg.created_at
          } : null,
          unreadCount
        });
      }
    }

    // Sort by last message time (recent first), then by name
    conversations.sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;
      const nameA = `${a.friend?.firstName || ''} ${a.friend?.lastName || ''}`.toLowerCase();
      const nameB = `${b.friend?.firstName || ''} ${b.friend?.lastName || ''}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    res.json({ conversations });
  } catch (err) { next(err); }
}

export async function markAsRead(req, res, next) {
  try {
    const myId = req.user.id;
    const { friendId } = req.body;
    if (!friendId) return res.status(400).json({ error: 'Missing friendId' });

    const roomId = [myId, friendId].sort().join('_');

    const { data: msgs } = await supabaseAdmin
      .from('messages')
      .select('id, read_by')
      .eq('room_id', roomId)
      .neq('sender_id', myId);

    const toUpdate = (msgs || []).filter(m => !m.read_by || !m.read_by.includes(myId));
    for (const msg of toUpdate) {
      const newReadBy = [...(msg.read_by || []), myId];
      await supabaseAdmin.from('messages').update({ read_by: newReadBy }).eq('id', msg.id);
    }

    res.json({ ok: true });
  } catch (err) { next(err); }
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
    const { data: msg } = await supabaseAdmin.from('messages').select('sender_id, room_id').eq('id', id).single();
    if (!msg) return res.status(404).json({ error: 'Not found' });
    if (msg.sender_id !== userId) return res.status(403).json({ error: 'Unauthorized' });
    await supabaseAdmin.from('messages').delete().eq('id', id);
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
