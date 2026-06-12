import mongoose from 'mongoose';

const friendRequestSchema = new mongoose.Schema({
  sender:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Prevent duplicate requests between same two users
friendRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });

export default mongoose.model('FriendRequest', friendRequestSchema);
