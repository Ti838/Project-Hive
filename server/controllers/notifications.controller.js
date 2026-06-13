import { supabaseAdmin } from '../config/supabase.js';

export async function getNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const { skip = 0, limit = 20, unreadOnly = false } = req.query;

    let q = supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (unreadOnly === 'true') q = q.eq('is_read', false);

    q = q.range(parseInt(skip), parseInt(skip) + parseInt(limit) - 1).order('created_at', { ascending: false });

    const { data: notifications, error, count } = await q;
    if (error) throw error;

    // Unread count
    const { count: unreadCount } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    res.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
      pagination: {
        total: count || 0,
        skip: parseInt(skip),
        limit: parseInt(limit),
        hasMore: parseInt(skip) + parseInt(limit) < (count || 0),
      },
    });
  } catch (err) { next(err); }
}

export async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ error: 'Notification not found' });
    res.json({ message: 'Marked as read', notification: data });
  } catch (err) { next(err); }
}

export async function markAllAsRead(req, res, next) {
  try {
    await supabaseAdmin.from('notifications').update({ is_read: true }).eq('user_id', req.user.id).eq('is_read', false);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) { next(err); }
}

export async function deleteNotification(req, res, next) {
  try {
    const { id } = req.params;
    await supabaseAdmin.from('notifications').delete().eq('id', id).eq('user_id', req.user.id);
    res.json({ message: 'Notification deleted' });
  } catch (err) { next(err); }
}
