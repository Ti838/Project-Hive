import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
  endorsements: { type: Number, default: 0 },
}, { _id: false });

const userSchema = new mongoose.Schema({
  // Identity
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },

  // Profile
  avatar: { type: String, default: null },
  bio: { type: String, default: '' },
  university: { type: String, required: true },
  major: { type: String, required: true },
  yearOfStudy: { type: Number, enum: [1, 2, 3, 4, 5], required: true },

  // Skills
  skills: [skillSchema],

  // Availability
  status: { type: String, enum: ['available', 'busy', 'not-looking'], default: 'available' },
  hoursPerWeek: { type: Number, default: 10 },

  // Social
  github: { type: String, default: null },
  linkedin: { type: String, default: null },
  portfolio: { type: String, default: null },

  // Platform
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: true },
  completionPercentage: { type: Number, default: 0 },
  lastSeen: { type: Date, default: Date.now },

  // Auth
  refreshTokens: [{ type: String }],

  // Stats
  teamsCreated: { type: Number, default: 0 },
  teamsJoined: { type: Number, default: 0 },
  projectsPosted: { type: Number, default: 0 },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  
  try {
    const salt = await bcryptjs.genSalt(12);
    this.passwordHash = await bcryptjs.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(plainPassword) {
  return bcryptjs.compare(plainPassword, this.passwordHash);
};

// Method to calculate completion percentage
userSchema.methods.calculateCompletionPercentage = function() {
  let completion = 0;
  const fields = [
    this.firstName && this.lastName,
    this.avatar,
    this.bio,
    this.university,
    this.major,
    this.yearOfStudy,
    this.skills && this.skills.length > 0,
    this.github || this.linkedin || this.portfolio,
  ];
  
  completion = Math.round((fields.filter(Boolean).length / fields.length) * 100);
  this.completionPercentage = completion;
  return completion;
};

export default mongoose.model('User', userSchema);
