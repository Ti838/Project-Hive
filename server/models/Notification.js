import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  // Type
  type: { type: String, enum: ['join_request', 'message', 'mention', 'team_update'], default: 'message' },

  // Reference
  relatedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  relatedTeamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  relatedMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },

  // Status
  read: { type: Boolean, default: false },
  readAt: { type: Date, default: null },

  // Recipient
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // Content
  title: { type: String, required: true },
  message: { type: String, required: true },

  // Timestamps
  createdAt: { type: Date, default: Date.now, index: true },
});

// Index for finding unread notifications
notificationSchema.index({ recipient: 1, read: 1 });

// TTL index to auto-delete old notifications after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model('Notification', notificationSchema);
