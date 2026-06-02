const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');

const router = express.Router();

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// SIMPLE Login route - no middleware
router.post('/login', async (req, res) => {
  console.log('=== LOGIN REQUEST RECEIVED ===');
  console.log('Request body:', req.body);
  
  try {
    const { identifier, password } = req.body;
    
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email/Contact and password are required' });
    }

    // Find user
    const user = await User.findOne({
      $or: [{ email: identifier }, { contact: identifier }]
    });

    if (!user) {
      console.log('User not found:', identifier);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('User found:', user.email);
    console.log('User role:', user.role);

    // Check password - using bcrypt directly
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isValidPassword);

    if (!isValidPassword) {
      console.log('Invalid password for user:', user.email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Send response
    const response = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      contact: user.contact,
      role: user.role,
      isVerified: user.isVerified,
      token: generateToken(user._id)
    };
    
    console.log('Login successful for:', user.email);
    res.json(response);
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Simple test route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes are working!' });
});

module.exports = router;
