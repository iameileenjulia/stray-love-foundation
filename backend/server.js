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

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

app.get('/api/pets', (req, res) => {
  res.json(pets);
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, contact, password } = req.body;
    
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
      role: 'user',
      verificationStatus: 'pending',
      createdAt: new Date()
    };
    
    users.push(newUser);
    console.log('User registered:', email);
    
    res.json({ message: 'Registration successful! Please wait for admin verification.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    const user = users.find(u => u.email === identifier || u.contact === identifier);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, role: user.role }, 'secret_key', { expiresIn: '30d' });
    
    res.json({
      _id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  
  try {
    const decoded = jwt.verify(token, 'secret_key');
    const user = users.find(u => u.id === decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found' });
    res.json({ ...user, password: undefined });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

app.get('/api/admin/users', (req, res) => {
  res.json(users.map(u => ({ ...u, password: undefined })));
});

app.get('/api/admin/stats', (req, res) => {
  res.json({
    totalUsers: users.length,
    pendingVerifications: users.filter(u => u.verificationStatus === 'pending').length,
    totalPets: pets.length,
    availablePets: pets.filter(p => p.status === 'Available').length
  });
});

app.get('/api/admin/activities', (req, res) => {
  res.json([{ icon: 'fa-user-plus', text: 'Admin dashboard loaded' }]);
});

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

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend running on port ${PORT}`);
  });
}
