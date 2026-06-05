const express = require('express');
const Pet = require('../models/Pet.model');
const { protect, admin } = require('../middleware/auth.middleware');

const router = express.Router();

// Get all pets (public)
router.get('/', async (req, res) => {
  try {
    const { type, sex, age, status, rescueStatus, search } = req.query;
    let query = {};

    if (type) query.type = type;
    if (sex) query.sex = sex;
    if (age) query.age = age;
    if (status) query.status = status;
    if (rescueStatus) query.rescueStatus = rescueStatus;
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const pets = await Pet.find(query).sort({ createdAt: -1 });
    res.json(pets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single pet
router.get('/:id', async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }
    res.json(pet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create pet (admin only)
router.post('/', protect, admin, async (req, res) => {
  try {
    const pet = await Pet.create(req.body);
    res.status(201).json(pet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update pet (admin only)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const pet = await Pet.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }
    res.json(pet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete pet (admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const pet = await Pet.findByIdAndDelete(req.params.id);
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }
    res.json({ message: 'Pet deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;