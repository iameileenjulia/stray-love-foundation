const mongoose = require('mongoose');

const monitoringReportSchema = new mongoose.Schema({
  adoptionRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdoptionRequest',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  pet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: true,
  },
  month: {
    type: Number,
    required: true,
  },
  healthStatus: {
    type: String,
    required: true,
  },
  livingEnvironment: {
    type: String,
    required: true,
  },
  uploadedImages: [{
    type: String,
  }],
  status: {
    type: String,
    enum: ['pending', 'reviewed'],
    default: 'pending',
  },
  evaluationNotes: {
    type: String,
  },
  completedDate: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('MonitoringReport', monitoringReportSchema);