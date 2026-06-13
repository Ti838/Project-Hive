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
