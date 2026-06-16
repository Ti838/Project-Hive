import { supabaseAdmin } from '../config/supabase.js';

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
    const { roomId, content } = req.body;
    const userId = req.user.id;

    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert({ room_id: roomId, sender_id: userId, content, read_by: [userId] })
      .select(`*, sender:sender_id(id, first_name, last_name, avatar, avatar_color)`)
      .single();

    if (error) throw error;
    res.status(201).json(message);
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
