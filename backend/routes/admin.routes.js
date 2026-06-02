const express = require('express');
const User = require('../models/User.model');
const Pet = require('../models/Pet.model');

const router = express.Router();

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify user
router.put('/users/:id/verify', async (req, res) => {
  try {
    const { isVerified, verificationStatus, verificationNotes } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        isVerified, 
        verificationStatus,
        verificationNotes,
        verificationApprovedAt: verificationStatus === 'approved' ? new Date() : null
      },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Suspend/Unsuspend user
router.put('/users/:id/suspend', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    user.isSuspended = !user.isSuspended;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
