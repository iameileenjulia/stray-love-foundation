const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  authorName: {
    type: String,
    required: true,
  },
  authorEmail: {
    type: String,
    required: true,
  },
  petName: {
    type: String,
  },
  caption: {
    type: String,
    required: true,
  },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public',
  },
  adminStatus: {
    type: String,
    enum: ['approved', 'hidden'],
    default: 'approved',
  },
  imageData: {
    type: String,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comment: String,
    createdAt: { type: Date, default: Date.now },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Post', postSchema);