import Notification from '../models/Notification.js';

export async function getNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const { skip = 0, limit = 20, unreadOnly = false } = req.query;

    let query = { recipient: userId };

    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .populate('relatedUserId', 'firstName lastName avatar')
      .populate('relatedTeamId', 'name')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false,
    });

    res.json({
      notifications,
      unreadCount,
      pagination: {
        total,
        skip: parseInt(skip),
        limit: parseInt(limit),
        hasMore: parseInt(skip) + parseInt(limit) < total,
      },
    });
  } catch (error) {
    console.error('[v0] Get notifications error:', error);
    next(error);
  }
}

export async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findByIdAndUpdate(
      id,
      {
        read: true,
        readAt: new Date(),
      },
      { new: true }
    );

    if (!notification || notification.recipient.toString() !== userId) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({
      message: 'Notification marked as read',
      notification,
    });
  } catch (error) {
    console.error('[v0] Mark notification as read error:', error);
    next(error);
  }
}

export async function markAllAsRead(req, res, next) {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      {
        recipient: userId,
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('[v0] Mark all as read error:', error);
    next(error);
  }
}

export async function deleteNotification(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findById(id);
    if (!notification || notification.recipient.toString() !== userId) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await Notification.findByIdAndDelete(id);

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('[v0] Delete notification error:', error);
    next(error);
  }
}
