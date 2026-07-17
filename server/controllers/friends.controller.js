import { supabaseAdmin } from '../config/supabase.js';
import { broadcastNotification, getIo } from '../services/socket.service.js';

// Helper: Compute the precise relationship state between two users
export async function computeRelationshipState(userId, targetId) {
  if (userId === targetId) return 'SELF';

  // 1. Check Blocks
  try {
    const { data: block } = await supabaseAdmin
      .from('blocks')
      .select('blocker_id, blocked_id')
      .or(`and(blocker_id.eq.${userId},blocked_id.eq.${targetId}),and(blocker_id.eq.${targetId},blocked_id.eq.${userId})`)
      .maybeSingle();

    if (block) {
      return block.blocker_id === userId ? 'BLOCKED' : 'BLOCKED_BY_OTHER';
    }
  } catch (e) {
    // Graceful fallback if table is not yet created
  }

  // 2. Check Friendship
  const { data: friend } = await supabaseAdmin
    .from('friends')
    .select('id')
    .eq('user_id', userId)
    .eq('friend_id', targetId)
    .maybeSingle();

  if (friend) return 'FRIEND';

  // 3. Check Friend Requests
  const { data: request } = await supabaseAdmin
    .from('friend_requests')
    .select('from_user_id, to_user_id, status')
    .or(`and(from_user_id.eq.${userId},to_user_id.eq.${targetId}),and(from_user_id.eq.${targetId},to_user_id.eq.${userId})`)
    .eq('status', 'pending')
    .maybeSingle();

  if (request) {
    return request.from_user_id === userId ? 'REQUEST_SENT' : 'REQUEST_RECEIVED';
  }

  // 4. Check Follows
  try {
    const { data: follow } = await supabaseAdmin
      .from('follows')
      .select('follower_id, following_id')
      .or(`and(follower_id.eq.${userId},following_id.eq.${targetId}),and(follower_id.eq.${targetId},following_id.eq.${userId})`)
      .limit(2);

    if (follow && follow.length > 0) {
      const isFollowing = follow.some(f => f.follower_id === userId && f.following_id === targetId);
      const isFollower = follow.some(f => f.follower_id === targetId && f.following_id === userId);
      if (isFollowing) return 'FOLLOWING';
      if (isFollower) return 'FOLLOWER';
    }
  } catch (e) {
    // Graceful fallback if table is not yet created
  }

  return 'NOT_FRIEND';
}

// ─── GET RELATIONSHIP STATUS ────────────────────────────────────────────────
export async function getRelationshipStatus(req, res, next) {
  try {
    const userId = req.user.id;
    const targetId = req.params.userId;
    const status = await computeRelationshipState(userId, targetId);
    res.json({ relationship: status });
  } catch (err) { next(err); }
}

// ─── SEND FRIEND REQUEST ─────────────────────────────────────────────────────
export async function sendFriendRequest(req, res, next) {
  try {
    const senderId = req.user.id;
    const receiverId = req.params.userId;
    if (senderId === receiverId) return res.status(400).json({ error: 'Cannot send request to yourself' });

    // Verify relationship state allows sending request
    const rel = await computeRelationshipState(senderId, receiverId);
    if (rel === 'BLOCKED') return res.status(400).json({ error: 'You have blocked this user' });
    if (rel === 'BLOCKED_BY_OTHER') return res.status(400).json({ error: 'This user has blocked you' });
    if (rel === 'FRIEND') return res.status(400).json({ error: 'Already friends' });
    if (rel === 'REQUEST_SENT' || rel === 'REQUEST_RECEIVED') return res.status(400).json({ error: 'Friend request already pending' });

    const { data: request, error } = await supabaseAdmin.from('friend_requests')
      .insert({ from_user_id: senderId, to_user_id: receiverId })
      .select()
      .single();
    if (error) throw error;

    // Send Notification
    const { data: sender } = await supabaseAdmin.from('users').select('first_name, last_name').eq('id', senderId).single();
    const title = 'New Friend Request';
    const message = `${sender?.first_name} ${sender?.last_name} sent you a friend request`;

    await supabaseAdmin.from('notifications').insert({
      user_id: receiverId,
      type: 'friend_request',
      title,
      message,
      link: '/people',
      is_read: false
    });

    // Realtime notification broadcast
    broadcastNotification(getIo(), receiverId, {
      id: request.id,
      type: 'friend',
      title,
      message,
      is_read: false,
      created_at: new Date().toISOString(),
      metadata: { senderId, requestId: request.id },
    });

    // Broadcast social updates
    const io = getIo();
    if (io) {
      io.to(senderId).to(receiverId).emit('social:relationship-update', {
        senderId,
        receiverId,
        relationship: 'REQUEST_SENT',
        reverseRelationship: 'REQUEST_RECEIVED'
      });
    }

    res.status(201).json({ message: 'Friend request sent', request });
  } catch (err) { next(err); }
}

// ─── CANCEL FRIEND REQUEST ───────────────────────────────────────────────────
export async function cancelFriendRequest(req, res, next) {
  try {
    const myId = req.user.id;
    const targetId = req.params.userId;

    const { data: deletedReq } = await supabaseAdmin
      .from('friend_requests')
      .delete()
      .eq('from_user_id', myId)
      .eq('to_user_id', targetId)
      .select()
      .maybeSingle();

    if (!deletedReq) return res.status(404).json({ error: 'Request not found' });

    // Clean up notifications
    await supabaseAdmin.from('notifications')
      .delete()
      .eq('user_id', targetId)
      .eq('type', 'friend_request');

    // Broadcast update
    const io = getIo();
    if (io) {
      io.to(myId).to(targetId).emit('social:relationship-update', {
        senderId: myId,
        receiverId: targetId,
        relationship: 'NOT_FRIEND',
        reverseRelationship: 'NOT_FRIEND'
      });
    }

    res.json({ ok: true, message: 'Request cancelled successfully' });
  } catch (err) { next(err); }
}

// ─── ACCEPT FRIEND REQUEST ───────────────────────────────────────────────────
export async function acceptFriendRequest(req, res, next) {
  try {
    const userId = req.user.id;
    const requestId = req.params.requestId;

    let request = null;
    // Try by request ID
    if (requestId.length === 36) {
      const { data } = await supabaseAdmin.from('friend_requests').select('*').eq('id', requestId).maybeSingle();
      request = data;
    }
    // Try by from_user_id (sender ID)
    if (!request) {
      const { data } = await supabaseAdmin.from('friend_requests')
        .select('*')
        .eq('from_user_id', requestId)
        .eq('to_user_id', userId)
        .eq('status', 'pending')
        .maybeSingle();
      request = data;
    }

    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.to_user_id !== userId) return res.status(403).json({ error: 'Not authorized' });

    // Delete request after acceptance (SaaS standard rules)
    await supabaseAdmin.from('friend_requests').delete().eq('id', request.id);

    // Add mutual friendship records
    await supabaseAdmin.from('friends').insert([
      { user_id: request.from_user_id, friend_id: request.to_user_id },
      { user_id: request.to_user_id, friend_id: request.from_user_id },
    ]);

    // Send notification to sender
    const { data: accepter } = await supabaseAdmin.from('users').select('first_name, last_name').eq('id', userId).single();
    const title = 'Friend Request Accepted';
    const message = `${accepter?.first_name} ${accepter?.last_name} accepted your friend request`;

    await supabaseAdmin.from('notifications').insert({
      user_id: request.from_user_id,
      type: 'friend_accepted',
      title,
      message,
      link: `/profile/view?id=${userId}`,
      is_read: false
    });

    broadcastNotification(getIo(), request.from_user_id, {
      id: `friend_accepted_${request.id}_${Date.now()}`,
      type: 'friend',
      title,
      message,
      is_read: false,
      created_at: new Date().toISOString(),
      metadata: { accepterId: userId },
    });

    // Broadcast instant socket updates to both tabs
    const io = getIo();
    if (io) {
      io.to(request.from_user_id).to(request.to_user_id).emit('social:relationship-update', {
        senderId: request.from_user_id,
        receiverId: request.to_user_id,
        relationship: 'FRIEND',
        reverseRelationship: 'FRIEND'
      });
    }

    res.json({ message: 'Friend request accepted' });
  } catch (err) { next(err); }
}

// ─── REJECT FRIEND REQUEST ───────────────────────────────────────────────────
export async function rejectFriendRequest(req, res, next) {
  try {
    const userId = req.user.id;
    const requestId = req.params.requestId;

    let request = null;
    // Try by request ID
    if (requestId.length === 36) {
      const { data } = await supabaseAdmin.from('friend_requests').select('*').eq('id', requestId).maybeSingle();
      request = data;
    }
    // Try by from_user_id (sender ID)
    if (!request) {
      const { data } = await supabaseAdmin.from('friend_requests')
        .select('*')
        .eq('from_user_id', requestId)
        .eq('to_user_id', userId)
        .eq('status', 'pending')
        .maybeSingle();
      request = data;
    }

    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.to_user_id !== userId) return res.status(403).json({ error: 'Not authorized' });

    // Clean delete friend request (instead of pending rejected)
    await supabaseAdmin.from('friend_requests').delete().eq('id', request.id);

    // Broadcast update
    const io = getIo();
    if (io) {
      io.to(request.from_user_id).to(request.to_user_id).emit('social:relationship-update', {
        senderId: request.from_user_id,
        receiverId: request.to_user_id,
        relationship: 'NOT_FRIEND',
        reverseRelationship: 'NOT_FRIEND'
      });
    }

    res.json({ message: 'Friend request rejected' });
  } catch (err) { next(err); }
}

// ─── UNFRIEND USER ───────────────────────────────────────────────────────────
export async function unfriendUser(req, res, next) {
  try {
    const myId = req.user.id;
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    // Remove both directions
    await Promise.all([
      supabaseAdmin.from('friends').delete().eq('user_id', myId).eq('friend_id', userId),
      supabaseAdmin.from('friends').delete().eq('user_id', userId).eq('friend_id', myId),
    ]);

    // Broadcast update
    const io = getIo();
    if (io) {
      io.to(myId).to(userId).emit('social:relationship-update', {
        senderId: myId,
        receiverId: userId,
        relationship: 'NOT_FRIEND',
        reverseRelationship: 'NOT_FRIEND'
      });
    }

    res.json({ ok: true, message: 'Unfriended successfully' });
  } catch (err) { next(err); }
}

// ─── FOLLOW USER ─────────────────────────────────────────────────────────────
export async function followUser(req, res, next) {
  try {
    const myId = req.user.id;
    const targetId = req.params.userId;
    if (myId === targetId) return res.status(400).json({ error: 'Cannot follow yourself' });

    // Verify relationship
    const rel = await computeRelationshipState(myId, targetId);
    if (rel === 'BLOCKED' || rel === 'BLOCKED_BY_OTHER') {
      return res.status(400).json({ error: 'Cannot interact with blocked user' });
    }

    const { error } = await supabaseAdmin.from('follows')
      .insert({ follower_id: myId, following_id: targetId });
    
    if (error && error.code !== '23505') throw error; // ignore duplicate follows

    // Send notification
    const { data: follower } = await supabaseAdmin.from('users').select('first_name, last_name').eq('id', myId).single();
    await supabaseAdmin.from('notifications').insert({
      user_id: targetId,
      type: 'follow',
      title: 'New Follower',
      message: `${follower?.first_name} ${follower?.last_name} started following you`,
      link: `/profile/view?id=${myId}`
    });

    broadcastNotification(getIo(), targetId, {
      id: `follow_${myId}_${Date.now()}`,
      type: 'follow',
      title: 'New Follower',
      message: `${follower?.first_name} ${follower?.last_name} started following you`,
      metadata: { followerId: myId }
    });

    const io = getIo();
    if (io) {
      io.to(myId).to(targetId).emit('social:relationship-update', {
        senderId: myId,
        receiverId: targetId,
        relationship: 'FOLLOWING',
        reverseRelationship: 'FOLLOWER'
      });
    }

    res.json({ ok: true, message: 'Followed successfully' });
  } catch (err) { next(err); }
}

// ─── UNFOLLOW USER ───────────────────────────────────────────────────────────
export async function unfollowUser(req, res, next) {
  try {
    const myId = req.user.id;
    const targetId = req.params.userId;

    await supabaseAdmin.from('follows')
      .delete()
      .eq('follower_id', myId)
      .eq('following_id', targetId);

    const io = getIo();
    if (io) {
      io.to(myId).to(targetId).emit('social:relationship-update', {
        senderId: myId,
        receiverId: targetId,
        relationship: 'NOT_FRIEND',
        reverseRelationship: 'NOT_FRIEND'
      });
    }

    res.json({ ok: true, message: 'Unfollowed successfully' });
  } catch (err) { next(err); }
}

// ─── BLOCK USER ──────────────────────────────────────────────────────────────
export async function blockUser(req, res, next) {
  try {
    const myId = req.user.id;
    const targetId = req.params.userId;
    if (myId === targetId) return res.status(400).json({ error: 'Cannot block yourself' });

    // 1. Insert Block Record
    const { error } = await supabaseAdmin.from('blocks')
      .insert({ blocker_id: myId, blocked_id: targetId });

    if (error && error.code !== '23505') throw error;

    // 2. Clean up existing friendships
    await Promise.all([
      supabaseAdmin.from('friends').delete().eq('user_id', myId).eq('friend_id', targetId),
      supabaseAdmin.from('friends').delete().eq('user_id', targetId).eq('friend_id', myId),
      supabaseAdmin.from('friend_requests').delete().or(`and(from_user_id.eq.${myId},to_user_id.eq.${targetId}),and(from_user_id.eq.${targetId},to_user_id.eq.${myId})`),
      supabaseAdmin.from('follows').delete().or(`and(follower_id.eq.${myId},following_id.eq.${targetId}),and(follower_id.eq.${targetId},following_id.eq.${myId})`)
    ]);

    const io = getIo();
    if (io) {
      io.to(myId).to(targetId).emit('social:relationship-update', {
        senderId: myId,
        receiverId: targetId,
        relationship: 'BLOCKED',
        reverseRelationship: 'BLOCKED_BY_OTHER'
      });
    }

    res.json({ ok: true, message: 'User blocked successfully' });
  } catch (err) { next(err); }
}

// ─── UNBLOCK USER ────────────────────────────────────────────────────────────
export async function unblockUser(req, res, next) {
  try {
    const myId = req.user.id;
    const targetId = req.params.userId;

    await supabaseAdmin.from('blocks')
      .delete()
      .eq('blocker_id', myId)
      .eq('blocked_id', targetId);

    const io = getIo();
    if (io) {
      io.to(myId).to(targetId).emit('social:relationship-update', {
        senderId: myId,
        receiverId: targetId,
        relationship: 'NOT_FRIEND',
        reverseRelationship: 'NOT_FRIEND'
      });
    }

    res.json({ ok: true, message: 'User unblocked successfully' });
  } catch (err) { next(err); }
}

// ─── LIST FRIENDS ────────────────────────────────────────────────────────────
export async function getFriends(req, res, next) {
  try {
    const { data: rows, error } = await supabaseAdmin
      .from('friends')
      .select('friend:friend_id(id, first_name, last_name, avatar, avatar_color, online_status, last_seen, university, major)')
      .eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ friends: (rows || []).map(r => r.friend).filter(Boolean) });
  } catch (err) { next(err); }
}

// ─── LIST PENDING INCOMING REQUESTS ──────────────────────────────────────────
export async function getPendingRequests(req, res, next) {
  try {
    const { data: requests, error } = await supabaseAdmin
      .from('friend_requests')
      .select('*, sender:from_user_id(id, first_name, last_name, avatar, avatar_color, university, major)')
      .eq('to_user_id', req.user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ requests: requests || [] });
  } catch (err) { next(err); }
}

// ─── LIST SENT PENDING REQUESTS ──────────────────────────────────────────────
export async function getSentRequests(req, res, next) {
  try {
    const { data: requests, error } = await supabaseAdmin
      .from('friend_requests')
      .select('*, receiver:to_user_id(id, first_name, last_name, avatar, avatar_color, university, major)')
      .eq('from_user_id', req.user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ requests: requests || [] });
  } catch (err) { next(err); }
}

// ─── LIST FOLLOWERS ──────────────────────────────────────────────────────────
export async function getFollowers(req, res, next) {
  try {
    const { data: rows, error } = await supabaseAdmin
      .from('follows')
      .select('follower:follower_id(id, first_name, last_name, avatar, avatar_color, university, major)')
      .eq('following_id', req.user.id);
    if (error) return res.json({ followers: [] }); // table might not exist yet
    res.json({ followers: (rows || []).map(r => r.follower).filter(Boolean) });
  } catch (err) { next(err); }
}

// ─── LIST FOLLOWING ──────────────────────────────────────────────────────────
export async function getFollowing(req, res, next) {
  try {
    const { data: rows, error } = await supabaseAdmin
      .from('follows')
      .select('following:following_id(id, first_name, last_name, avatar, avatar_color, university, major)')
      .eq('follower_id', req.user.id);
    if (error) return res.json({ following: [] }); // table might not exist yet
    res.json({ following: (rows || []).map(r => r.following).filter(Boolean) });
  } catch (err) { next(err); }
}

// ─── LIST BLOCKED USERS ──────────────────────────────────────────────────────
export async function getBlockedUsers(req, res, next) {
  try {
    const { data: rows, error } = await supabaseAdmin
      .from('blocks')
      .select('blocked:blocked_id(id, first_name, last_name, avatar, avatar_color, university, major)')
      .eq('blocker_id', req.user.id);
    if (error) return res.json({ blocked: [] }); // table might not exist yet
    res.json({ blocked: (rows || []).map(r => r.blocked).filter(Boolean) });
  } catch (err) { next(err); }
}

// ─── GET DM HISTORY ──────────────────────────────────────────────────────────
export async function getDMHistory(req, res, next) {
  try {
    const myId = req.user.id;
    const friendId = req.params.friendId;
    const { skip = 0, limit = 50 } = req.query;

    const rel = await computeRelationshipState(myId, friendId);
    if (rel === 'BLOCKED' || rel === 'BLOCKED_BY_OTHER') {
      return res.status(403).json({ error: 'Interaction blocked' });
    }

    const roomId = [myId, friendId].sort().join('_');

    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('*, sender:sender_id(id, first_name, last_name, avatar, avatar_color)')
      .eq('room_id', roomId)
      .range(parseInt(skip), parseInt(skip) + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Mark messages as read
    const toUpdate = (messages || []).filter(m => m.sender_id !== myId && (!m.read_by || !m.read_by.includes(myId)));
    for (const msg of toUpdate) {
      const newReadBy = [...(msg.read_by || []), myId];
      await supabaseAdmin.from('messages').update({ read_by: newReadBy }).eq('id', msg.id);
    }

    res.json({ messages: (messages || []).reverse(), roomId });
  } catch (err) { next(err); }
}

// ─── GET RECOMMENDED FRIENDS ─────────────────────────────────────────────────
export async function getRecommendedFriends(req, res, next) {
  try {
    const myId = req.user.id;

    // 1. Fetch current friends and blocked lists to exclude
    const [friendsRows, blockedRows] = await Promise.all([
      supabaseAdmin.from('friends').select('friend_id').eq('user_id', myId).then(r => r, () => ({ data: [] })),
      supabaseAdmin.from('blocks').select('blocked_id').eq('blocker_id', myId).then(r => r, () => ({ data: [] }))
    ]);

    const excludeIds = new Set([myId]);
    (friendsRows.data || []).forEach(r => excludeIds.add(r.friend_id));
    (blockedRows.data || []).forEach(r => excludeIds.add(r.blocked_id));

    // Also get outgoing and incoming pending request IDs to exclude
    const { data: pendingRequests } = await supabaseAdmin
      .from('friend_requests')
      .select('from_user_id, to_user_id')
      .or(`from_user_id.eq.${myId},to_user_id.eq.${myId}`)
      .eq('status', 'pending');
    
    (pendingRequests || []).forEach(r => {
      excludeIds.add(r.from_user_id);
      excludeIds.add(r.to_user_id);
    });

    // 2. Fetch friends of my friends
    const myFriendIds = (friendsRows.data || []).map(r => r.friend_id);
    
    if (myFriendIds.length === 0) {
      const { data: me } = await supabaseAdmin.from('users').select('university').eq('id', myId).single();
      const university = me?.university;

      let q = supabaseAdmin.from('users')
        .select('id, first_name, last_name, avatar, avatar_color, university, major, online_status, last_seen')
        .neq('id', myId);

      if (university) q = q.eq('university', university);

      const { data: recs } = await q.limit(15);
      const filteredRecs = (recs || []).filter(u => !excludeIds.has(u.id));

      return res.json({ recommendations: filteredRecs.map(u => ({
        id: u.id,
        firstName: u.first_name,
        lastName: u.last_name,
        avatar: u.avatar,
        avatarColor: u.avatar_color,
        university: u.university,
        major: u.major,
        mutualCount: 0,
        mutualFriends: []
      })) });
    }

    const { data: fofRows } = await supabaseAdmin
      .from('friends')
      .select('user_id, friend_id, friend:friend_id(id, first_name, last_name, avatar, avatar_color, university, major)')
      .in('user_id', myFriendIds)
      .neq('friend_id', myId);

    const fofMap = new Map();
    (fofRows || []).forEach(row => {
      const fofId = row.friend_id;
      if (excludeIds.has(fofId)) return;
      if (!row.friend) return;

      if (!fofMap.has(fofId)) {
        fofMap.set(fofId, {
          user: row.friend,
          mutualFriendIds: new Set()
        });
      }
      fofMap.get(fofId).mutualFriendIds.add(row.user_id);
    });

    const recommendations = [];
    fofMap.forEach((val, fofId) => {
      recommendations.push({
        id: val.user.id,
        firstName: val.user.first_name,
        lastName: val.user.last_name,
        avatar: val.user.avatar,
        avatarColor: val.user.avatar_color,
        university: val.user.university,
        major: val.user.major,
        mutualCount: val.mutualFriendIds.size,
      });
    });

    recommendations.sort((a, b) => b.mutualCount - a.mutualCount);
    res.json({ recommendations: recommendations.slice(0, 15) });
  } catch (err) { next(err); }
}
