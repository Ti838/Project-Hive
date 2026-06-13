import { supabaseAdmin } from '../config/supabase.js';
import { broadcastNotification } from '../services/socket.service.js';

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
    broadcastNotification(null, receiverId, {
      type: 'friend_request',
      message: `${sender?.first_name} ${sender?.last_name} sent you a friend request`,
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
    broadcastNotification(null, request.from_user_id, {
      type: 'friend_accepted',
      message: `${accepter?.first_name} ${accepter?.last_name} accepted your friend request`,
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
    res.json({ messages: (messages || []).reverse(), roomId });
  } catch (err) { next(err); }
}
