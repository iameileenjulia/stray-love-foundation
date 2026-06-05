const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  contact: String,
  password: String,
  role: { type: String, default: 'user' },
  isVerified: { type: Boolean, default: false },
  verificationStatus: { type: String, default: 'pending' },
  verificationRequestedAt: Date,
  verificationApprovedAt: Date,
  isSuspended: { type: Boolean, default: false },
  idImageData: String,
  idFileName: String,
  emailVerified: { type: Boolean, default: false },
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
