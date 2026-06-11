import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  // Content
  content: { type: String, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Context
  roomId: { type: String, required: true }, // team ID or 'direct:<userId1>:<userId2>'
  type: { type: String, enum: ['text', 'system'], default: 'text' },

  // Status
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Timestamps
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },
});

// Index for efficient message retrieval
messageSchema.index({ roomId: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
