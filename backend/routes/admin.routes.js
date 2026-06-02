const express = require('express');
const User = require('../models/User.model');
const Pet = require('../models/Pet.model');
const AdoptionRequest = require('../models/AdoptionRequest.model');
const MonitoringReport = require('../models/MonitoringReport.model');
const { protect, admin } = require('../middleware/auth.middleware');

const router = express.Router();

// Dashboard stats
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const pendingVerifications = await User.countDocuments({ isVerified: false });
    const pendingRequests = await AdoptionRequest.countDocuments({ status: 'Pending' });
    const completedAdoptions = await AdoptionRequest.countDocuments({ status: 'Approved' });
    const totalPets = await Pet.countDocuments();
    const availablePets = await Pet.countDocuments({ status: 'Available' });
    const pendingMonitoring = await MonitoringReport.countDocuments({ status: 'pending' });

    res.json({
      totalUsers,
      pendingVerifications,
      pendingRequests,
      completedAdoptions,
      totalPets,
      availablePets,
      pendingMonitoring,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all users
router.get('/users', protect, admin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify user
router.put('/users/:id/verify', protect, admin, async (req, res) => {
  try {
    const { isVerified, verificationNotes } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified, verificationNotes },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle user suspension
router.put('/users/:id/suspend', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.isSuspended = !user.isSuspended;
    await user.save();
    res.json({ message: `User ${user.isSuspended ? 'suspended' : 'activated'}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;