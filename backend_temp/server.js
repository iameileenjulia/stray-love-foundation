const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure MongoDB is connected before handling any request (serverless-safe)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connection error:', err);
    res.status(500).json({ message: 'Database connection failed' });
  }
});

// Store OTPs temporarily
const otpStore = new Map();

// Email service
const { sendVerificationEmail, sendApprovalEmail, sendRejectionEmail } = require('./services/emailService');

// User Schema
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

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Pet Schema
const petSchema = new mongoose.Schema({
  name: String,
  type: String,
  sex: String,
  age: String,
  breed: String,
  status: String,
  rescueStatus: String,
  description: String,
  vaccinationHistory: String,
  medicalNotes: String,
  adoptionFee: Number,
  imageData: String,
  createdAt: { type: Date, default: Date.now }
});

const Pet = mongoose.models.Pet || mongoose.model('Pet', petSchema);

// ============== AUTH ROUTES ==============

// Send OTP for email verification
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000
    });
    
    await sendVerificationEmail(email, otp);
    
    res.json({ message: 'Verification code sent to your email' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Failed to send verification code' });
  }
});

// Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const storedData = otpStore.get(email);
    
    if (!storedData) {
      return res.status(400).json({ message: 'No verification code found. Please request a new one.' });
    }
    
    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }
    
    if (storedData.otp !== otp) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    
    otpStore.set(email, { ...storedData, verified: true });
    
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Verification failed' });
  }
});

// Complete registration after OTP verification
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, contact, password, idImageData, idFileName } = req.body;
    
    const storedData = otpStore.get(email);
    if (!storedData || !storedData.verified) {
      return res.status(400).json({ message: 'Please verify your email first' });
    }
    
    const existing = await User.findOne({ $or: [{ email }, { contact }] });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const user = new User({ 
      fullName, 
      email, 
      contact, 
      password,
      idImageData,
      idFileName,
      emailVerified: true,
      verificationStatus: 'pending',
      verificationRequestedAt: new Date()
    });
    await user.save();
    
    otpStore.delete(email);
    
    res.json({ 
      message: 'Registration successful! Please wait for admin verification (up to 72 hours).',
      userId: user._id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Login route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const user = await User.findOne({ $or: [{ email: identifier }, { contact: identifier }] });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    
    if (user.role !== 'admin' && !user.emailVerified) {
      return res.status(401).json({ message: 'Please verify your email first' });
    }
    
    if (user.role !== 'admin' && user.verificationStatus !== 'approved') {
      return res.status(401).json({ message: `Your account is pending admin approval. Status: ${user.verificationStatus}` });
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: 'Invalid credentials' });
    
    if (user.isSuspended && user.role !== 'admin') {
      return res.status(401).json({ message: 'Your account has been suspended' });
    }
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ 
      _id: user._id, 
      fullName: user.fullName, 
      email: user.email, 
      role: user.role,
      isVerified: user.isVerified,
      verificationStatus: user.verificationStatus,
      token 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user
app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// ============== ADMIN ROUTES ==============
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/admin/users/:id/verify', async (req, res) => {
  try {
    const { isVerified, verificationStatus, verificationNotes } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified, verificationStatus, verificationNotes, verificationApprovedAt: new Date() },
      { new: true }
    ).select('-password');
    
    if (verificationStatus === 'approved') {
      await sendApprovalEmail(user.email, user.fullName);
    } else if (verificationStatus === 'rejected') {
      await sendRejectionEmail(user.email, user.fullName, verificationNotes);
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error verifying user:', error);
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/admin/users/:id/suspend', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    user.isSuspended = !user.isSuspended;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const pendingVerifications = await User.countDocuments({ verificationStatus: 'pending', role: 'user' });
    const totalPets = await Pet.countDocuments();
    const availablePets = await Pet.countDocuments({ status: 'Available' });
    res.json({ totalUsers, pendingVerifications, pendingRequests: 0, completedAdoptions: 0, totalPets, availablePets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/admin/activities', async (req, res) => {
  res.json([{ icon: 'fa-user-plus', text: 'Admin logged in' }]);
});

// ============== PET ROUTES ==============
app.get('/api/pets', async (req, res) => {
  try {
    const pets = await Pet.find().sort({ createdAt: -1 });
    res.json(pets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/pets', async (req, res) => {
  try {
    const pet = new Pet(req.body);
    await pet.save();
    res.status(201).json(pet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/pets/:id', async (req, res) => {
  try {
    const pet = await Pet.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(pet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/pets/:id', async (req, res) => {
  try {
    await Pet.findByIdAndDelete(req.params.id);
    res.json({ message: 'Pet deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// One-time data seeding (admin account + sample pets)
async function seedData() {
  const adminExists = await User.findOne({ email: 'admin@strayloveph.org' });
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    await User.create({
      fullName: 'System Administrator',
      email: 'admin@strayloveph.org',
      contact: '+639123456789',
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
      emailVerified: true,
      verificationStatus: 'approved'
    });
    console.log('✅ Admin user created');
  } else {
    await User.updateOne(
      { email: 'admin@strayloveph.org' },
      { verificationStatus: 'approved', emailVerified: true, isVerified: true }
    );
    console.log('✅ Admin user verified');
  }

  const petCount = await Pet.countDocuments();
  if (petCount === 0) {
    await Pet.create([
      { name: "Luna", type: "Dog", sex: "Female", age: "Young", breed: "Aspin", status: "Available", rescueStatus: "Rescued", description: "Sweet and gentle", adoptionFee: 500 },
      { name: "Charlie", type: "Dog", sex: "Male", age: "Adult", breed: "Mixed", status: "Available", rescueStatus: "Stray", description: "Energetic buddy", adoptionFee: 300 },
      { name: "Daisy", type: "Cat", sex: "Female", age: "Baby", breed: "Puspin", status: "Available", rescueStatus: "Surrendered", description: "Tiny fluffy kitten", adoptionFee: 400 }
    ]);
    console.log('✅ Sample pets added');
  }
}

// Cached MongoDB connection so serverless invocations reuse one connection
let cached = global._mongooseCache;
if (!cached) cached = global._mongooseCache = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not set');
    }
    cached.promise = mongoose.connect(process.env.MONGODB_URI).then(async (m) => {
      console.log('✅ MongoDB connected');
      await seedData();
      return m;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// Export the app for Vercel's serverless runtime
module.exports = app;

// Only start a long-running server when run directly (local development)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  connectDB().catch(err => console.error('MongoDB error:', err));
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Local: http://localhost:${PORT}`);
  });
}
