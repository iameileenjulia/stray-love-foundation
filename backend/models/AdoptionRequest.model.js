const mongoose = require('mongoose');

const adoptionRequestSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed'],
    default: 'Pending',
  },
  requestDate: {
    type: Date,
    default: Date.now,
  },
  gracePeriodEnd: {
    type: Date,
    required: true,
  },
  applicationAnswers: {
    reason: { type: String, required: true },
    experience: { type: String, required: true },
    livingCondition: { type: String, required: true },
    hasOtherPets: { type: String },
    agreeToMonitoring: { type: Boolean, default: false },
  },
  adminResponse: {
    type: String,
  },
  respondedAt: {
    type: Date,
  },
});

module.exports = mongoose.model('AdoptionRequest', adoptionRequestSchema);