import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  // Content
  title: { type: String, required: true },
  description: { type: String, required: true },
  techStack: [{ type: String }],
  demoURL: { type: String, default: null },
  githubURL: { type: String, default: null },

  // Media
  coverImage: { type: String, default: null },

  // Creator
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Status
  status: { type: String, enum: ['draft', 'submitted', 'approved'], default: 'submitted' },

  // Engagement
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  saves: { type: Number, default: 0 },
  savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: { type: Number, default: 0 },

  // Timestamps
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },
});

// Index for searching and sorting
projectSchema.index({ title: 'text', description: 'text' });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ likes: -1 });

// Method to check if user likes this project
projectSchema.methods.isLikedBy = function(userId) {
  return this.likedBy.some(id => id.toString() === userId.toString());
};

// Method to check if user saved this project
projectSchema.methods.isSavedBy = function(userId) {
  return this.savedBy.some(id => id.toString() === userId.toString());
};

export default mongoose.model('Project', projectSchema);
