import mongoose from 'mongoose';
import crypto from 'crypto';

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['lead', 'member'], default: 'member' },
  joinedAt: { type: Date, default: Date.now },
}, { _id: false });

const teamSchema = new mongoose.Schema({
  // Basic
  name: { type: String, required: true },
  description: { type: String, required: true },
  coverImage: { type: String, default: null },

  // Members
  members: [memberSchema],

  // Requirements
  requiredSkills: [{ type: String }],

  // Configuration
  maxMembers: { type: Number, default: 5 },
  status: { type: String, enum: ['recruiting', 'active', 'completed'], default: 'recruiting' },
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },

  // Details
  projectType: { type: String, default: '' },
  university: { type: String, required: true },
  tags: [{ type: String }],

  // Socket.IO
  chatRoomId: { type: String, unique: true, default: () => crypto.randomUUID() },

  // Metrics
  viewCount: { type: Number, default: 0 },
  requestCount: { type: Number, default: 0 },

  // Creator
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Index for finding teams by university and status
teamSchema.index({ university: 1, status: 1 });
teamSchema.index({ name: 'text', description: 'text' });

// Method to check if user is member
teamSchema.methods.isMember = function(userId) {
  return this.members.some(m => m.user.toString() === userId.toString());
};

// Method to get member role
teamSchema.methods.getMemberRole = function(userId) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  return member ? member.role : null;
};

// Method to check if user is lead
teamSchema.methods.isLead = function(userId) {
  return this.getMemberRole(userId) === 'lead';
};

export default mongoose.model('Team', teamSchema);
