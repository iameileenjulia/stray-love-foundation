const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

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

// ── Email transporter (created fresh per-request to pick up env vars) ─
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

// ── Time-based OTP (stateless — works on Vercel serverless) ────────
const OTP_SECRET = process.env.OTP_SECRET || 'stray_love_otp_2025';

function generateOTP(email) {
  const window = Math.floor(Date.now() / (10 * 60 * 1000));
  const hmac = crypto.createHmac('sha256', OTP_SECRET).update(`${email}:${window}`).digest('hex');
  return (parseInt(hmac.slice(0, 8), 16) % 900000 + 100000).toString();
}

function verifyOTP(email, otp) {
  const now = Math.floor(Date.now() / (10 * 60 * 1000));
  for (let w = now; w >= now - 1; w--) {
    const hmac = crypto.createHmac('sha256', OTP_SECRET).update(`${email}:${w}`).digest('hex');
    const valid = (parseInt(hmac.slice(0, 8), 16) % 900000 + 100000).toString();
    if (otp === valid) return true;
  }
  return false;
}

// ── Send OTP ────────────────────────────────────────────────────────
app.post('/api/auth/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  const existingUser = users.find(u => u.email === email);
  if (existingUser) return res.status(400).json({ message: 'Email already registered' });

  const otp = generateOTP(email);

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('EMAIL_USER / EMAIL_PASS not set — email not sent');
    console.log(`[DEV OTP for ${email}]: ${otp}`);
    return res.status(500).json({ message: 'Email service is not configured. Please contact the administrator.' });
  }

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"STRAY Love Ph Foundation" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your STRAY Love Ph Verification Code',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border-radius:12px;border:1px solid #FFE2D4;">
          <h2 style="color:#C28A7A;">🐾 STRAY Love Ph Foundation</h2>
          <p style="color:#5C4E48;">Your email verification code is:</p>
          <p style="font-size:38px;font-weight:bold;letter-spacing:10px;color:#C28A7A;margin:16px 0;">${otp}</p>
          <p style="color:#5C4E48;">This code expires in <strong>10 minutes</strong>.</p>
          <p style="color:#bbb;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
    res.json({ message: 'Verification code sent to your email' });
  } catch (error) {
    console.error('Email send error:', error.message);
    res.status(500).json({ message: 'Failed to send verification email. Check EMAIL_USER and EMAIL_PASS in Vercel environment variables.' });
  }
});

// ── Verify OTP ──────────────────────────────────────────────────────
app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and code are required' });

  if (!verifyOTP(email, otp)) {
    return res.status(400).json({ message: 'Invalid or expired verification code' });
  }

  res.json({ message: 'Email verified successfully' });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!', emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS) });
});

app.get('/api/pets', (req, res) => {
  res.json(pets);
});

app.post('/api/pets', (req, res) => {
  try {
    const { name, type, sex, age, breed, status, rescueStatus, description, vaccinationHistory, medicalNotes, adoptionFee } = req.body;
    if (!name) return res.status(400).json({ message: 'Pet name is required' });
    const newPet = {
      _id: Date.now().toString(),
      name, type: type || 'Dog', sex: sex || 'Male', age: age || 'Young',
      breed: breed || '', status: status || 'Available',
      rescueStatus: rescueStatus || 'Rescued', description: description || '',
      vaccinationHistory: vaccinationHistory || '', medicalNotes: medicalNotes || '',
      adoptionFee: Number(adoptionFee) || 0, createdAt: new Date()
    };
    pets.push(newPet);
    res.json(newPet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/pets/:id', (req, res) => {
  try {
    const index = pets.findIndex(p => p._id === req.params.id);
    if (index === -1) return res.status(404).json({ message: 'Pet not found' });
    const { name, type, sex, age, breed, status, rescueStatus, description, vaccinationHistory, medicalNotes, adoptionFee } = req.body;
    pets[index] = {
      ...pets[index],
      name: name || pets[index].name,
      type: type || pets[index].type,
      sex: sex || pets[index].sex,
      age: age || pets[index].age,
      breed: breed !== undefined ? breed : pets[index].breed,
      status: status || pets[index].status,
      rescueStatus: rescueStatus || pets[index].rescueStatus,
      description: description !== undefined ? description : pets[index].description,
      vaccinationHistory: vaccinationHistory !== undefined ? vaccinationHistory : pets[index].vaccinationHistory,
      medicalNotes: medicalNotes !== undefined ? medicalNotes : pets[index].medicalNotes,
      adoptionFee: adoptionFee !== undefined ? Number(adoptionFee) : pets[index].adoptionFee
    };
    res.json(pets[index]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/pets/:id', (req, res) => {
  try {
    const index = pets.findIndex(p => p._id === req.params.id);
    if (index === -1) return res.status(404).json({ message: 'Pet not found' });
    pets.splice(index, 1);
    res.json({ message: 'Pet deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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
