const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Pet name is required'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['Dog', 'Cat'],
    required: true,
  },
  sex: {
    type: String,
    enum: ['Male', 'Female'],
    required: true,
  },
  age: {
    type: String,
    enum: ['Baby', 'Young', 'Adult', 'Senior'],
    required: true,
  },
  breed: {
    type: String,
    default: 'Mixed',
  },
  status: {
    type: String,
    enum: ['Available', 'Adopted', 'Pending', 'On Hold'],
    default: 'Available',
  },
  rescueStatus: {
    type: String,
    enum: ['Rescued', 'Stray', 'Surrendered'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  vaccinationHistory: {
    type: String,
  },
  medicalNotes: {
    type: String,
  },
  imageData: {
    type: String,
  },
  adoptionFee: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

petSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Pet', petSchema);