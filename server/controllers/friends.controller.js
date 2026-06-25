import { supabaseAdmin } from '../config/supabase.js';
import { broadcastNotification, getIo } from '../services/socket.service.js';

export async function sendFriendRequest(req, res, next) {
  try {
    const senderId   = req.user.id;
    const receiverId = req.params.userId;
    if (senderId === receiverId) return res.status(400).json({ error: 'Cannot send request to yourself' });

    // Check receiver exists
    const { data: receiver } = await supabaseAdmin.from('users').select('id, first_name, last_name').eq('id', receiverId).single();
    if (!receiver) return res.status(404).json({ error: 'User not found' });

    // Already friends?
    const { data: fr } = await supabaseAdmin.from('friends').select('id').eq('user_id', senderId).eq('friend_id', receiverId).single();
    if (fr) return res.status(400).json({ error: 'Already friends' });

    // Already pending?
    const { data: ex } = await supabaseAdmin.from('friend_requests')
      .select('id')
      .or(`and(from_user_id.eq.${senderId},to_user_id.eq.${receiverId}),and(from_user_id.eq.${receiverId},to_user_id.eq.${senderId})`)
      .eq('status', 'pending')
      .single();
    if (ex) return res.status(400).json({ error: 'Request already pending' });

    const { data: request, error } = await supabaseAdmin.from('friend_requests')
      .insert({ from_user_id: senderId, to_user_id: receiverId })
      .select()
      .single();
    if (error) throw error;

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

    broadcastNotification(getIo(), receiverId, {
      type: 'friend_request',
      title,
      message,
      requestId: request.id,
    });

    res.status(201).json({ message: 'Friend request sent', request });
  } catch (err) { next(err); }
}

export async function acceptFriendRequest(req, res, next) {
  try {
    const userId    = req.user.id;
    const requestId = req.params.requestId;

    const { data: request } = await supabaseAdmin.from('friend_requests').select('*').eq('id', requestId).single();
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.to_user_id !== userId) return res.status(403).json({ error: 'Not authorized' });
    if (request.status !== 'pending') return res.status(400).json({ error: 'Request already handled' });

    await supabaseAdmin.from('friend_requests').update({ status: 'accepted' }).eq('id', requestId);

    // Add mutual friendship
    await supabaseAdmin.from('friends').insert([
      { user_id: request.from_user_id, friend_id: request.to_user_id },
      { user_id: request.to_user_id, friend_id: request.from_user_id },
    ]);

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
      type: 'friend_accepted',
      title,
      message,
    });

    res.json({ message: 'Friend request accepted' });
  } catch (err) { next(err); }
}

export async function rejectFriendRequest(req, res, next) {
  try {
    const { requestId } = req.params;
    await supabaseAdmin.from('friend_requests').update({ status: 'rejected' }).eq('id', requestId).eq('to_user_id', req.user.id);
    res.json({ message: 'Friend request rejected' });
  } catch (err) { next(err); }
}

export async function getFriends(req, res, next) {
  try {
    const { data: rows, error } = await supabaseAdmin
      .from('friends')
      .select('friend:friend_id(id, first_name, last_name, avatar, avatar_color, online_status, last_seen, university, major)')
      .eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ friends: (rows || []).map(r => r.friend) });
  } catch (err) { next(err); }
}

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

export async function getDMHistory(req, res, next) {
  try {
    const myId     = req.user.id;
    const friendId = req.params.friendId;
    const { skip = 0, limit = 50 } = req.query;

    const { data: fr } = await supabaseAdmin.from('friends').select('id').eq('user_id', myId).eq('friend_id', friendId).single();
    if (!fr) return res.status(403).json({ error: 'Not friends' });

    const roomId = [myId, friendId].sort().join('_');

    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('*, sender:sender_id(id, first_name, last_name, avatar, avatar_color)')
      .eq('room_id', roomId)
      .range(parseInt(skip), parseInt(skip) + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Mark messages sent by the friend as read
    const toUpdate = (messages || []).filter(m => m.sender_id !== myId && (!m.read_by || !m.read_by.includes(myId)));
    for (const msg of toUpdate) {
      const newReadBy = [...(msg.read_by || []), myId];
      await supabaseAdmin.from('messages').update({ read_by: newReadBy }).eq('id', msg.id);
    }

    res.json({ messages: (messages || []).reverse(), roomId });
  } catch (err) { next(err); }
}

export async function getRecommendedFriends(req, res, next) {
  try {
    const myId = req.user.id;

    // 1. Fetch all friends of current user
    const { data: myFriendsRows } = await supabaseAdmin
      .from('friends')
      .select('friend_id')
      .eq('user_id', myId);
    
    const myFriendIds = new Set((myFriendsRows || []).map(r => r.friend_id));

    if (myFriendIds.size === 0) {
      // Fallback cold start: recommend users from the same university, otherwise any user
      const { data: me } = await supabaseAdmin.from('users').select('university').eq('id', myId).single();
      const university = me?.university;

      if (university) {
        const { data: recs } = await supabaseAdmin.from('users')
          .select('id, first_name, last_name, avatar, avatar_color, university, major, online_status, last_seen')
          .neq('id', myId)
          .eq('university', university)
          .limit(15);
        
        if (recs && recs.length > 0) {
          return res.json({ recommendations: recs.map(u => ({
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
      }
      const { data: recs } = await supabaseAdmin.from('users')
        .select('id, first_name, last_name, avatar, avatar_color, university, major, online_status, last_seen')
        .neq('id', myId)
        .limit(15);

      return res.json({ recommendations: (recs || []).map(u => ({
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

    // 2. Fetch friends of my friends (friend-of-a-friend traversal)
    const { data: fofRows } = await supabaseAdmin
      .from('friends')
      .select('user_id, friend_id, friend:friend_id(id, first_name, last_name, avatar, avatar_color, university, major)')
      .in('user_id', Array.from(myFriendIds))
      .neq('friend_id', myId);

    // 3. Fetch names of my friends to build mutual friend labels
    const { data: myFriendsDetails } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name')
      .in('id', Array.from(myFriendIds));
    const friendNamesMap = new Map((myFriendsDetails || []).map(u => [u.id, `${u.first_name} ${u.last_name}`]));

    // 4. Count mutual friends
    const fofMap = new Map();
    
    (fofRows || []).forEach(row => {
      const fofId = row.friend_id;
      // Skip if already friends
      if (myFriendIds.has(fofId)) return;
      if (!row.friend) return; // safety check

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
      const mutualFriends = Array.from(val.mutualFriendIds).map(id => ({
        id,
        name: friendNamesMap.get(id) || 'Teammate'
      }));
      recommendations.push({
        id: val.user.id,
        firstName: val.user.first_name,
        lastName: val.user.last_name,
        avatar: val.user.avatar,
        avatarColor: val.user.avatar_color,
        university: val.user.university,
        major: val.user.major,
        mutualCount: mutualFriends.length,
        mutualFriends
      });
    });

    recommendations.sort((a, b) => b.mutualCount - a.mutualCount);

    res.json({ recommendations: recommendations.slice(0, 15) });
  } catch (err) { next(err); }
}

// DELETE /api/friends/:userId — remove friend (both directions)
export async function unfriendUser(req, res, next) {
  try {
    const myId = req.user.id;
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    // Remove both sides of the mutual friendship in parallel
    await Promise.all([
      supabaseAdmin.from('friends').delete().eq('user_id', myId).eq('friend_id', userId),
      supabaseAdmin.from('friends').delete().eq('user_id', userId).eq('friend_id', myId),
    ]);

    res.json({ ok: true, message: 'Unfriended successfully' });
  } catch (err) { next(err); }
}
