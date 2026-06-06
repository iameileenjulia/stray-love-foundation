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
let monitoringReports = [];
let adoptionRequests = [];
let posts = [];
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
      _id: Date.now().toString(),
      fullName,
      email,
      contact,
      password: hashedPassword,
      role: 'user',
      isVerified: false,
      verificationStatus: 'pending',
      isSuspended: false,
      createdAt: new Date()
    };

    users.push(newUser);
    console.log('User registered:', email);

    res.json({ message: 'Registration successful! Please wait for admin verification before logging in.' });
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

    // Block non-admin users who haven't been approved yet
    if (user.role !== 'admin' && user.verificationStatus !== 'approved') {
      return res.status(403).json({ message: 'Your account is pending admin approval. Please wait for verification.' });
    }

    // Block suspended users
    if (user.isSuspended) {
      return res.status(403).json({ message: 'Your account has been suspended. Please contact support.' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, 'secret_key', { expiresIn: '30d' });

    res.json({
      _id: user._id,
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
    const user = users.find(u => u._id === decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found' });
    res.json({ ...user, password: undefined });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

app.get('/api/admin/users', (req, res) => {
  res.json(users.map(u => ({ ...u, password: undefined })));
});

// ── Approve or reject a user's verification ──────────────────────────
app.put('/api/admin/users/:id/verify', (req, res) => {
  const user = users.find(u => u._id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const { isVerified, verificationStatus, verificationNotes } = req.body;
  user.isVerified = isVerified;
  user.verificationStatus = verificationStatus || (isVerified ? 'approved' : 'rejected');
  if (verificationNotes) user.verificationNotes = verificationNotes;

  res.json({ ...user, password: undefined });
});

// ── Toggle user suspension ────────────────────────────────────────────
app.put('/api/admin/users/:id/suspend', (req, res) => {
  const user = users.find(u => u._id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.isSuspended = !user.isSuspended;
  res.json({ ...user, password: undefined });
});

// ── User: create a post ───────────────────────────────────────────────
app.post('/api/posts', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    let authorData = { fullName: 'Unknown', email: '', _id: '' };
    if (token) {
      try {
        const decoded = require('jsonwebtoken').verify(token, 'secret_key');
        const u = users.find(x => x._id === decoded.id);
        if (u) authorData = { _id: u._id, fullName: u.fullName, email: u.email };
      } catch {}
    }
    const { petName, caption, visibility } = req.body;
    const post = {
      _id: Date.now().toString(),
      authorId: authorData._id,
      authorName: authorData.fullName,
      authorEmail: authorData.email,
      petName: petName || '',
      caption: caption || '',
      visibility: visibility || 'public',
      adminStatus: 'approved',
      createdAt: new Date()
    };
    posts.push(post);
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── Public: get visible posts ─────────────────────────────────────────
app.get('/api/posts', (req, res) => {
  res.json(
    posts
      .filter(p => p.visibility === 'public' && p.adminStatus !== 'hidden')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  );
});

// ── Admin: get all posts ──────────────────────────────────────────────
app.get('/api/admin/posts', (req, res) => {
  res.json([...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// ── Admin: toggle post visibility ─────────────────────────────────────
app.put('/api/admin/posts/:id/visibility', (req, res) => {
  const post = posts.find(p => p._id === req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  post.adminStatus = req.body.adminStatus || 'approved';
  res.json(post);
});

// ── Admin: delete post ────────────────────────────────────────────────
app.delete('/api/admin/posts/:id', (req, res) => {
  const index = posts.findIndex(p => p._id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Post not found' });
  posts.splice(index, 1);
  res.json({ message: 'Post deleted successfully' });
});

// ── Admin: update own profile ─────────────────────────────────────────
app.put('/api/admin/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });
    const decoded = require('jsonwebtoken').verify(token, 'secret_key');
    const admin = users.find(u => u._id === decoded.id && u.role === 'admin');
    if (!admin) return res.status(403).json({ message: 'Not authorized' });

    const { fullName, email, currentPassword, password } = req.body;
    if (password) {
      if (!currentPassword) return res.status(400).json({ message: 'Current password is required to change password' });
      const valid = await bcrypt.compare(currentPassword, admin.password);
      if (!valid) return res.status(400).json({ message: 'Current password is incorrect' });
      admin.password = await bcrypt.hash(password, 10);
    }
    if (fullName) admin.fullName = fullName;
    if (email) admin.email = email;
    res.json({ message: 'Profile updated successfully', fullName: admin.fullName, email: admin.email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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

// ── User: submit adoption request ────────────────────────────────────
app.post('/api/adoptions', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    let userData = { fullName: 'Unknown', email: '', contact: '', _id: '', isVerified: false };
    if (token) {
      try {
        const decoded = require('jsonwebtoken').verify(token, 'secret_key');
        const u = users.find(x => x._id === decoded.id);
        if (u) {
          userData = {
            _id: u._id, fullName: u.fullName, email: u.email,
            contact: u.contact || '', isVerified: u.verificationStatus === 'approved'
          };
        }
      } catch {}
    }
    const { petId, applicationAnswers } = req.body;
    const pet = pets.find(p => p._id === petId);
    const now = new Date();
    const gracePeriodEnd = new Date(now.getTime() + 72 * 60 * 60 * 1000);
    const request = {
      _id: Date.now().toString(),
      user: userData,
      pet: pet ? { _id: pet._id, name: pet.name, type: pet.type, sex: pet.sex, age: pet.age, breed: pet.breed || 'Mixed' } : { name: 'Unknown' },
      applicationAnswers: applicationAnswers || {},
      status: 'Pending',
      adminResponse: '',
      requestDate: now,
      gracePeriodEnd
    };
    adoptionRequests.push(request);
    res.json({ message: 'Adoption request submitted! 72-hour reflection period started.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── User: get my adoption requests ───────────────────────────────────
app.get('/api/adoptions/my-requests', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.json([]);
    const decoded = require('jsonwebtoken').verify(token, 'secret_key');
    const userId = decoded.id;
    const myRequests = adoptionRequests.filter(r => r.user._id === userId);
    res.json([...myRequests].sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate)));
  } catch { res.json([]); }
});

// ── User: cancel an adoption request ─────────────────────────────────
app.delete('/api/adoptions/:id', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const decoded = require('jsonwebtoken').verify(token, 'secret_key');
    const userId = decoded.id;
    const idx = adoptionRequests.findIndex(r => r._id === req.params.id && r.user._id === userId);
    if (idx === -1) return res.status(404).json({ message: 'Request not found' });
    if (adoptionRequests[idx].status !== 'Pending') {
      return res.status(400).json({ message: 'Only pending requests can be cancelled' });
    }
    adoptionRequests[idx].status = 'Cancelled';
    res.json({ message: 'Request cancelled successfully' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// ── Admin: get all adoption requests ─────────────────────────────────
app.get('/api/admin/requests', (req, res) => {
  res.json([...adoptionRequests].sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate)));
});

// ── Admin: approve or reject an adoption request ──────────────────────
app.put('/api/admin/requests/:id', (req, res) => {
  const request = adoptionRequests.find(r => r._id === req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found' });
  const { status, adminResponse } = req.body;
  request.status = status || request.status;
  if (adminResponse !== undefined) request.adminResponse = adminResponse;
  request.reviewedAt = new Date();
  res.json(request);
});

// ── User: get adopted pets ────────────────────────────────────────────
app.get('/api/users/adopted-pets', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.json([]);
    const decoded = require('jsonwebtoken').verify(token, 'secret_key');
    const userId = decoded.id;
    const approved = adoptionRequests.filter(r => r.user._id === userId && r.status === 'Approved');
    res.json(approved.map(r => ({
      _id: r.pet._id,
      name: r.pet.name,
      type: r.pet.type,
      sex: r.pet.sex,
      age: r.pet.age,
      breed: r.pet.breed,
      adoptedDate: r.reviewedAt || r.requestDate,
      requestId: r._id
    })));
  } catch { res.json([]); }
});

// ── User: get my monitoring reports ──────────────────────────────────
app.get('/api/monitoring/my-reports', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.json([]);
    const decoded = require('jsonwebtoken').verify(token, 'secret_key');
    const userId = decoded.id;
    const reports = monitoringReports.filter(r => r.authorId === userId);
    res.json([...reports].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)));
  } catch { res.json([]); }
});

// ── User: get dashboard stats ─────────────────────────────────────────
app.get('/api/users/stats', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    let userId = null;
    if (token) {
      try {
        const decoded = require('jsonwebtoken').verify(token, 'secret_key');
        userId = decoded.id;
      } catch {}
    }
    const userRequests = adoptionRequests.filter(r => r.user?._id === userId);
    res.json({
      adoptionRequests: userRequests.length,
      approvedPets: userRequests.filter(r => r.status === 'Approved').length,
      pendingMonitoring: monitoringReports.filter(r => r.authorId === userId && r.status === 'pending').length
    });
  } catch (error) {
    res.json({ adoptionRequests: 0, approvedPets: 0, pendingMonitoring: 0 });
  }
});

// ── User: get recent activity ─────────────────────────────────────────
app.get('/api/users/activity', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    let userId = null;
    if (token) {
      try {
        const decoded = require('jsonwebtoken').verify(token, 'secret_key');
        userId = decoded.id;
      } catch {}
    }
    const activity = [];
    adoptionRequests
      .filter(r => r.user?._id === userId)
      .slice(0, 3)
      .forEach(r => {
        activity.push({
          icon: 'fa-paper-plane',
          text: `Adoption Request Submitted — ${r.pet?.name || 'a pet'}`,
          timestamp: r.requestDate
        });
        if (r.status === 'Approved') {
          activity.push({ icon: 'fa-check-circle', text: `Adoption Approved — ${r.pet?.name}`, timestamp: r.reviewedAt });
        }
      });
    monitoringReports
      .filter(r => r.authorId === userId)
      .slice(0, 2)
      .forEach(r => {
        activity.push({ icon: 'fa-clipboard-list', text: `Monitoring Report Submitted — ${r.petName}`, timestamp: r.submittedAt });
      });
    activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(activity.slice(0, 5));
  } catch (error) {
    res.json([]);
  }
});

// ── User: submit monitoring report ───────────────────────────────────
app.post('/api/monitoring/reports', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    let userName = 'Unknown', userEmail = '', authorId = '';
    if (token) {
      try {
        const decoded = require('jsonwebtoken').verify(token, 'secret_key');
        const u = users.find(x => x._id === decoded.id);
        if (u) { userName = u.fullName; userEmail = u.email; authorId = u._id; }
      } catch {}
    }
    const { petId, healthStatus, livingEnvironment, additionalNotes, month } = req.body;
    const pet = pets.find(p => p._id === petId);
    const report = {
      _id: Date.now().toString(),
      petId, petName: pet?.name || 'Unknown Pet',
      authorId, userName, userEmail,
      healthStatus: healthStatus || '',
      livingEnvironment: livingEnvironment || '',
      additionalNotes: additionalNotes || '',
      month: month || 1,
      status: 'pending',
      evaluationNotes: '',
      submittedAt: new Date()
    };
    monitoringReports.push(report);
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── Admin: get all monitoring reports ────────────────────────────────
app.get('/api/admin/monitoring', (req, res) => {
  res.json(monitoringReports);
});

// ── Admin: review a monitoring report ────────────────────────────────
app.put('/api/admin/monitoring/:id', (req, res) => {
  const report = monitoringReports.find(r => r._id === req.params.id);
  if (!report) return res.status(404).json({ message: 'Report not found' });
  report.status = req.body.status || 'reviewed';
  if (req.body.evaluationNotes !== undefined) report.evaluationNotes = req.body.evaluationNotes;
  report.reviewedAt = new Date();
  res.json(report);
});

async function createAdminUser() {
  const adminExists = users.find(u => u.email === 'admin@strayloveph.org');
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    users.push({
      _id: 'admin',
      fullName: 'System Administrator',
      email: 'admin@strayloveph.org',
      contact: '+639123456789',
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
      verificationStatus: 'approved',
      isSuspended: false,
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
