import mongoose from 'mongoose';

const joinRequestSchema = new mongoose.Schema({
  // Parties
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },

  // Status
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },

  // Message
  message: { type: String, default: '' },

  // Timestamps
  createdAt: { type: Date, default: Date.now, index: true },
  respondedAt: { type: Date, default: null },
});

// Ensure one pending request per user per team
joinRequestSchema.index({ user: 1, team: 1, status: 1 }, { unique: true });

export default mongoose.model('JoinRequest', joinRequestSchema);
