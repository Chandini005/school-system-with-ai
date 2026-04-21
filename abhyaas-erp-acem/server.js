// import express from 'express';
// import mongoose from 'mongoose';
// import cors from 'cors';
// import dotenv from 'dotenv';

// // Initialize dotenv to read your .env file
// dotenv.config();

// // Import the routes
// import authRoutes from './routes/authRoutes.js';
// import schoolRoutes from './routes/schoolRoutes.js';
// import adminRoutes from './routes/adminRoutes.js';

// const app = express();

// // Middleware to allow frontend to talk to backend
// app.use(cors());
// app.use(express.json());

// // Connect to MongoDB (Removed the semicolon so the .then chain works!)
// mongoose.connect('mongodb+srv://chandini:MyPasword123@edumanagercluster.weofmss.mongodb.net/school_management_db?appName=EduManagerCluster')
//     .then(() => console.log('🟢 MongoDB Successfully Connected!'))
//     .catch(err => console.log('🔴 MongoDB Connection Error:', err));

// // Mount the Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/schools', schoolRoutes);
// app.use('/api/admin', adminRoutes);

// // Start the Server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`🚀 Backend Server running on port ${PORT}`));
// server.js — Abhyaas School ERP Backend
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, PendingRegistration, ActivityLog } = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'abhyaas_erp_secret_2024';
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://chandini:TestDb321@edumanagercluster.weofmss.mongodb.net/school_management_db?appName=EduManagerCluster';

// ── Middleware ────────────────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'], credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Request logger
app.use((req, _, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ── Connect DB ────────────────────────────────────────────────────
mongoose.set('strictQuery', false);

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => console.log('✓ MongoDB Cluster connected Efficiently'))
  .catch(err => { console.error('✗ MongoDB error:', err); process.exit(1); });

mongoose.connection.on('error', err => {
  console.error('MongoDB runtime error:', err);
});

// ════════════════════════════════════════════════════════════════
// AUTH ROUTES
// ════════════════════════════════════════════════════════════════
const { getTenantModel } = require('./utils/tenant.js');

app.post('/api/auth/login', async (req, res) => {
  try {
    const { loginId, password } = req.body;
    if (!loginId || !password)
      return res.status(400).json({ success: false, message: 'Login ID and password required' });

    const { CentralAuth } = require('./models');
    const authRecord = await CentralAuth.findOne({ loginId });
    if (!authRecord)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, authRecord.password);
    if (!match)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    // Dynamic model for tenant profile
    const TenantUser = getTenantModel(authRecord.tenantId, 'User', User.schema);
    const user = await TenantUser.findById(authRecord.userRef);

    if (!user)
      return res.status(404).json({ success: false, message: 'User profile not found' });

    const token = jwt.sign(
      { _id: user._id, tenantId: authRecord.tenantId, role: authRecord.role, name: user.name, email: user.email },
      JWT_SECRET, { expiresIn: '7d' }
    );

    await ActivityLog.create({ user: user._id, action: 'Login', module: 'Auth', details: `${authRecord.role} logged in` });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: authRecord.role, tenantId: authRecord.tenantId, profilePhotoUrl: user.profilePhotoUrl },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const existing = await User.findOne({ email: req.body.email?.toLowerCase() });
    if (existing)
      return res.status(400).json({ success: false, message: 'Email already registered' });

    const hashed = await bcrypt.hash(req.body.password, 10);
    const pending = await PendingRegistration.create({ ...req.body, password: hashed, status: 'Pending' });
    res.json({ success: true, message: 'Registration submitted. Awaiting admin approval.', data: pending });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── All ERP routes ────────────────────────────────────────────────
app.use('/api', require('./routes'));

// ── Health check ──────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ── 404 handler ───────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.path} not found` }));

// ── Error handler ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: err.message });
});

app.listen(PORT, () => console.log(`✓ Server running on http://localhost:${PORT}`));