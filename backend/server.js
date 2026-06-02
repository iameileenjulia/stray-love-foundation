const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory storage
let users = [];
let pets = [
  { _id: '1', name: 'Luna', type: 'Dog', sex: 'Female', age: 'Young', status: 'Available', description: 'Sweet and gentle', adoptionFee: 500 },
  { _id: '2', name: 'Charlie', type: 'Dog', sex: 'Male', age: 'Adult', status: 'Available', description: 'Energetic buddy', adoptionFee: 300 },
  { _id: '3', name: 'Daisy', type: 'Cat', sex: 'Female', age: 'Baby', status: 'Available', description: 'Tiny fluffy kitten', adoptionFee: 400 }
];

// ============== TEST ENDPOINTS ==============
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ============== PET ROUTES ==============
app.get('/api/pets', (req, res) => {
  res.json(pets);
});

app.get('/api/pets/:id', (req, res) => {
  const pet = pets.find(p => p._id === req.params.id);
  if (!pet) return res.status(404).json({ message: 'Pet not found' });
  res.json(pet);
});

app.post('/api/pets', (req, res) => {
  const newPet = { ...req.body, _id: Date.now().toString() };
  pets.push(newPet);
  res.status(201).json(newPet);
});

app.put('/api/pets/:id', (req, res) => {
  const index = pets.findIndex(p => p._id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Pet not found' });
  pets[index] = { ...pets[index], ...req.body };
  res.json(pets[index]);
});

app.delete('/api/pets/:id', (req, res) => {
  const index = pets.findIndex(p => p._id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Pet not found' });
  pets.splice(index, 1);
  res.json({ message: 'Pet deleted' });
});

// ============== AUTH ROUTES ==============
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, contact, password, idImageData, idFileName } = req.body;
    
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now().toString(),
      fullName,
      email,
      contact,
      password: hashedPassword,
      idImageData,
      idFileName,
      role: 'user',
      isVerified: false,
      emailVerified: true,
      verificationStatus: 'pending',
      isSuspended: false,
      createdAt: new Date()
    };
    
    users.push(newUser);
    console.log('✅ User registered:', email);
    
    res.json({ message: 'Registration successful! Please wait for admin verification (up to 72 hours).' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    console.log('Login attempt:', identifier);
    
    const user = users.find(u => u.email === identifier || u.contact === identifier);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    if (user.verificationStatus !== 'approved' && user.role !== 'admin') {
      return res.status(401).json({ message: 'Account pending admin approval' });
    }
    
    const token = jwt.sign({ id: user.id, role: user.role }, 'secret_key', { expiresIn: '30d' });
    
    res.json({
      _id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      verificationStatus: user.verificationStatus,
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token' });
  }
  
  try {
    const decoded = jwt.verify(token, 'secret_key');
    const user = users.find(u => u.id === decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    res.json({ ...user, password: undefined });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// ============== ADMIN ROUTES ==============
app.get('/api/admin/users', (req, res) => {
  res.json(users.map(u => ({ ...u, password: undefined })));
});

app.put('/api/admin/users/:id/verify', (req, res) => {
  const { verificationStatus, verificationNotes } = req.body;
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  
  user.verificationStatus = verificationStatus;
  user.isVerified = verificationStatus === 'approved';
  user.verificationNotes = verificationNotes;
  user.verificationApprovedAt = new Date();
  
  console.log(`✅ User ${user.fullName} ${verificationStatus}`);
  res.json({ ...user, password: undefined });
});

app.put('/api/admin/users/:id/suspend', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  
  user.isSuspended = !user.isSuspended;
  res.json({ ...user, password: undefined });
});

app.get('/api/admin/stats', (req, res) => {
  res.json({
    totalUsers: users.length,
    pendingVerifications: users.filter(u => u.verificationStatus === 'pending' && u.role !== 'admin').length,
    totalPets: pets.length,
    availablePets: pets.filter(p => p.status === 'Available').length,
    pendingRequests: 0,
    completedAdoptions: 0
  });
});

app.get('/api/admin/activities', (req, res) => {
  res.json([
    { icon: 'fa-user-plus', text: 'Admin logged in' },
    { icon: 'fa-paw', text: 'Admin dashboard loaded' }
  ]);
});

// ============== CREATE ADMIN USER ON STARTUP ==============
async function createAdminUser() {
  const adminExists = users.find(u => u.email === 'admin@strayloveph.org');
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    users.push({
      id: 'admin',
      fullName: 'System Administrator',
      email: 'admin@strayloveph.org',
      contact: '+639123456789',
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
      verificationStatus: 'approved',
      createdAt: new Date()
    });
    console.log('✅ Admin user created');
  }
}

createAdminUser();

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`📍 Test: http://localhost:${PORT}/api/test`);
  console.log(`📊 Users registered: ${users.length}`);
  console.log(`🐾 Pets available: ${pets.filter(p => p.status === 'Available').length}`);
});
