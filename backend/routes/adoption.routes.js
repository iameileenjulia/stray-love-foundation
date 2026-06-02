const express = require('express');
const AdoptionRequest = require('../models/AdoptionRequest.model');
const Pet = require('../models/Pet.model');
const { protect, admin } = require('../middleware/auth.middleware');

const router = express.Router();

// Create adoption request
router.post('/', protect, async (req, res) => {
  try {
    const { petId, applicationAnswers } = req.body;
    
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }
    
    if (pet.status !== 'Available') {
      return res.status(400).json({ message: 'Pet is not available for adoption' });
    }

    // Check if user already has a pending request for this pet
    const existingRequest = await AdoptionRequest.findOne({
      user: req.user._id,
      pet: petId,
      status: { $in: ['Pending', 'Approved'] },
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending request for this pet' });
    }

    const gracePeriodEnd = new Date();
    gracePeriodEnd.setHours(gracePeriodEnd.getHours() + 72);

    const request = await AdoptionRequest.create({
      user: req.user._id,
      pet: petId,
      gracePeriodEnd,
      applicationAnswers,
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's adoption requests
router.get('/my-requests', protect, async (req, res) => {
  try {
    const requests = await AdoptionRequest.find({ user: req.user._id })
      .populate('pet')
      .sort({ requestDate: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all adoption requests (admin only)
router.get('/', protect, admin, async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;
    
    const requests = await AdoptionRequest.find(query)
      .populate('user')
      .populate('pet')
      .sort({ requestDate: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update request status (admin only)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { status, adminResponse } = req.body;
    const request = await AdoptionRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = status;
    request.adminResponse = adminResponse;
    request.respondedAt = Date.now();
    await request.save();

    // If approved, update pet status
    if (status === 'Approved') {
      await Pet.findByIdAndUpdate(request.pet, { status: 'Adopted' });
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cancel request
router.delete('/:id', protect, async (req, res) => {
  try {
    const request = await AdoptionRequest.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ message: 'Cannot cancel this request' });
    }

    request.status = 'Cancelled';
    await request.save();
    res.json({ message: 'Request cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;