import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';


import { upload, uploadToS3 } from './utils/s3Upload.js';

const generateSequentialId = async (Model, prefix, fieldName) => {
  const lastDoc = await Model.findOne({}, { [fieldName]: 1 }).sort({ _id: -1 });
  if (!lastDoc || !lastDoc[fieldName]) return `${prefix}-1001`;
  const match = lastDoc[fieldName].match(/\d+$/);
  if (match) return `${prefix}-${parseInt(match[0], 10) + 1}`;
  return `${prefix}-1001`;
};

import principalRoutes from './routes/principal.js';
import studentRoutes from './routes/studentRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import marksRoutes from './routes/marksRoutes.js';
import feeRoutes from './routes/feeRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import apiRoutes from './routes/index.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import studentDashboardRoutes from './routes/student.js';
import admissionRoutes from './routes/admissionRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

import { PendingRegistration, User, Student, Teacher, Class, CentralAuth, Attendance, Fee, AcademicYear, FeePayment, FeeStructure, OTP } from './models/index.js';
import academicYearInterceptor from './middleware/academicYear.js';

dotenv.config();

// ── Gmail SMTP Transporter (explicit SMTP — fixes 535 auth errors) ──
const mailer = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,          // STARTTLS on port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,   // Gmail App Password (16 chars, spaces ok)
  },
  tls: { rejectUnauthorized: false },
});

// Helper: send OTP email
const sendOtpEmail = async (toEmail, loginId, otpCode) => {
  const mailOptions = {
    from: `"Abhyaas ERP" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '🔐 Your Password Reset OTP – Abhyaas ERP',
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#0a1128;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);padding:28px 32px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:-0.5px;">Abhyaas ERP</h1>
          <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:13px;">School Management System</p>
        </div>
        <div style="padding:32px;background:#0f172a;">
          <h2 style="color:#e2e8f0;font-size:18px;margin:0 0 8px;">Password Reset Request</h2>
          <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px;">We received a request to reset the password for account <strong style="color:#60a5fa;">${loginId}</strong>. Use the OTP below — it expires in <strong style="color:#f59e0b;">10 minutes</strong>.</p>
          <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <p style="color:#64748b;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 10px;">Your One-Time Password</p>
            <span style="font-size:42px;font-weight:900;letter-spacing:0.35em;color:#60a5fa;">${otpCode}</span>
          </div>
          <p style="color:#64748b;font-size:12px;line-height:1.6;margin:0;">If you did not request this, you can safely ignore this email. Your password will not change.</p>
        </div>
        <div style="background:#0a1128;padding:16px 32px;text-align:center;border-top:1px solid #1e293b;">
          <p style="color:#334155;font-size:11px;margin:0;">© 2025 Abhyaas ERP · School Administration System</p>
        </div>
      </div>
    `,
  };
  await mailer.sendMail(mailOptions);
};

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'].filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(academicYearInterceptor); // Apply globally for all routes
app.use('/uploads', express.static('uploads'));

mongoose.set('strictQuery', false);

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 10000, // Increase to 10s for slow networks
  socketTimeoutMS: 45000,
  family: 4 // Use IPv4 for DNS stability
})
  .then(() => console.log('✓ Connected to MongoDB Cluster Efficiently'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Handle runtime connection errors
mongoose.connection.on('error', err => {
  console.error('MongoDB runtime error:', err);
});

app.get('/', (req, res) => {
  res.send('Abhyaas ERP Backend API is running!');
});

// 🔧 DEV: Quick SMTP test — visit http://localhost:5000/api/test-email
app.get('/api/test-email', async (req, res) => {
  try {
    await mailer.sendMail({
      from: `"Abhyaas ERP" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: '✅ SMTP Test — Abhyaas ERP',
      html: `<div style="font-family:sans-serif;padding:24px;background:#0f172a;color:#e2e8f0;border-radius:12px;max-width:400px">
        <h2 style="color:#60a5fa;margin:0 0 12px">✅ Email is working!</h2>
        <p style="color:#94a3b8;margin:0">Your Abhyaas ERP SMTP config is correctly set up. OTP emails will now be delivered.</p>
        <p style="color:#475569;font-size:12px;margin-top:16px">Sent at: ${new Date().toLocaleString('en-IN')}</p>
      </div>`,
    });
    console.log('✅ Test email sent to', process.env.EMAIL_USER);
    res.json({ success: true, message: `Test email sent to ${process.env.EMAIL_USER} — check your inbox!` });
  } catch (err) {
    console.error('❌ Test email failed:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/academic-years', async (req, res) => {
  try {
    const years = await AcademicYear.find().sort({ name: -1 });
    res.json({ success: true, data: years });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🟢 GLOBAL S3 UPLOAD ROUTE
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const fileUrl = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype);
    res.json({ success: true, url: fileUrl });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ success: false, message: 'File upload failed' });
  }
});

// 🟢 INTERNAL HELPERS for Attendance Marking screen
const getStudentProfileForAttendance = async (studentId) => {
  return await Student.findById(studentId).populate('classId', 'name standard section');
};

// ===================================================================
// 4. GET CLASS TREND (For the 7-day Bar Chart & Monthly Avg)
// ===================================================================
app.get('/api/attendance/trend', async (req, res) => {
  try {
    const { classId, date } = req.query;
    if (!classId) return res.status(400).json({ success: false, message: 'Class ID required' });

    const endDate = date ? new Date(date) : new Date();

    // Calculate Monthly Average (Last 30 days)
    const thirtyDaysAgo = new Date(endDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch all records for this class from the last 30 days
    const monthlyRecords = await Attendance.find({
      classId: classId,
      date: { $gte: thirtyDaysAgo, $lte: endDate },
      $or: [{ academicYear: req.academicYear }, { academicYear: { $exists: false } }]
    });

    let totalMonthlyPresent = 0;
    monthlyRecords.forEach(r => { if (r.status === 'Present') totalMonthlyPresent++; });
    const monthlyAverage = monthlyRecords.length > 0
      ? Math.round((totalMonthlyPresent / monthlyRecords.length) * 100)
      : 0;

    // Calculate 7-Day Trend
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(endDate);
      targetDate.setDate(targetDate.getDate() - i);

      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const dailyRecords = monthlyRecords.filter(r =>
        new Date(r.date) >= startOfDay && new Date(r.date) <= endOfDay
      );

      let dailyPresent = 0;
      dailyRecords.forEach(r => { if (r.status === 'Present') dailyPresent++; });

      const dailyPct = dailyRecords.length > 0
        ? Math.round((dailyPresent / dailyRecords.length) * 100)
        : 0;

      trend.push({
        date: startOfDay.toISOString().split('T')[0],
        percentage: dailyPct
      });
    }

    res.json({
      success: true,
      data: { monthlyAverage, trend }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching trend' });
  }
});

// ===================================================================
// 5. GET SINGLE STUDENT STATS (For the green bar under their name)
// ===================================================================
app.get('/api/attendance/student-stats/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    // Find all attendance records for this specific student, sorted by date DESC
    const records = await Attendance.find({
      student: studentId,
      $or: [{ academicYear: req.academicYear }, { academicYear: { $exists: false } }]
    }).sort({ date: -1 });

    if (records.length === 0) {
      return res.json({ success: true, data: { percentage: 0, totalDays: 0, presentDays: 0, attendanceHistory: [] } });
    }

    let presentCount = 0;
    records.forEach(r => { if (r.status === 'Present') presentCount++; });

    const percentage = Math.round((presentCount / records.length) * 100);

    res.json({
      success: true,
      data: {
        percentage,
        totalDays: records.length,
        presentDays: presentCount,
        attendanceHistory: records
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching student stats' });
  }
});

// ─── 1. REAL DATABASE LOGIN ROUTE (Multi-tenant) ───
app.post('/api/auth/login', async (req, res) => {
  try {
    const { loginId, password } = req.body;
    console.log(`🔍 LOGIN ATTEMPT: Trying to find ID: "${loginId}"`);
    if (!loginId || !password) {
      return res.status(400).json({ success: false, message: "Login ID and password required" });
    }

    const secretKey = process.env.JWT_SECRET || 'my_fallback_secret_key';

    // 1. Find in CentralAuth
    const authRecord = await CentralAuth.findOne({ loginId });
    if (!authRecord) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // 2. Check Password
    const isMatch = await bcrypt.compare(password, authRecord.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // 3. Search all profile collections
    const db = mongoose.connection.db;
    const refId = new mongoose.Types.ObjectId(authRecord.userRef);

    let user = await db.collection('students').findOne({ _id: refId });
    if (!user) user = await db.collection('teachers').findOne({ _id: refId });
    if (!user) user = await db.collection('abhyaas_users').findOne({ _id: refId });
    if (!user) user = await db.collection(`${authRecord.tenantId}_users`).findOne({ _id: refId });

    if (!user) {
      return res.status(404).json({ success: false, message: "User profile not found" });
    }

    // 🟢 SYNC TRIGGER: Reconcile fees on every login for students
    if (authRecord.role === 'Student') {
      await reconcileStudentFeeStatus(user._id, req.academicYear);
    }

    // 4. Generate Token
    const token = jwt.sign(
      {
        _id: user._id,
        tenantId: authRecord.tenantId,
        role: authRecord.role,
        name: user.name,
        email: user.email
      },
      secretKey,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: "Login successful!",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: authRecord.role,
        tenantId: authRecord.tenantId,
        profilePhotoUrl: user.profilePhotoUrl || ''
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ success: false, message: "Server error during login" });
  }
});
// ─── 1.5 PASSWORD RESET & OTP ROUTES ───

// A. Forgot Password - Generate OTP
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { loginId } = req.body;
    const authRecord = await CentralAuth.findOne({ loginId });
    if (!authRecord) return res.status(404).json({ success: false, message: "User not found" });

    // Get email from profile
    const refId = new mongoose.Types.ObjectId(authRecord.userRef);
    const db = mongoose.connection.db;
    let userProfile = await db.collection('students').findOne({ _id: refId });
    if (!userProfile) userProfile = await db.collection('teachers').findOne({ _id: refId });
    if (!userProfile) userProfile = await db.collection('abhyaas_users').findOne({ _id: refId });

    if (!userProfile || !userProfile.email) {
      return res.status(400).json({ success: false, message: "No email associated with this account. Contact Admin." });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Clear old OTPs and save new one
    await OTP.deleteMany({ loginId });
    await OTP.create({ loginId, email: userProfile.email, otp: otpCode });

    // Send OTP via email
    await sendOtpEmail(userProfile.email, loginId, otpCode);
    console.log(`📧 OTP email sent to ${userProfile.email} for ${loginId}`);

    res.json({ success: true, message: `OTP sent to your registered email address. Please check your inbox.` });
  } catch (err) {
    console.error('Forgot-password error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// B. Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { loginId, otp } = req.body;
    if (!loginId || !otp) return res.status(400).json({ success: false, message: "loginId and otp are required" });

    // Look up OTP by loginId (single source of truth — no email lookup needed)
    const otpDoc = await OTP.findOne({ loginId, otp });
    if (!otpDoc) return res.status(400).json({ success: false, message: "Invalid or expired OTP. Please request a new one." });

    res.json({ success: true, message: "OTP verified" });
  } catch (err) {
    console.error('Verify-OTP error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// C. Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { loginId, otp, newPassword } = req.body;
    if (!loginId || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "loginId, otp, and newPassword are required" });
    }

    // Verify OTP by loginId
    const otpDoc = await OTP.findOne({ loginId, otp });
    if (!otpDoc) return res.status(400).json({ success: false, message: "Invalid or expired OTP. Please request a new one." });

    // Find the auth record and update password
    const authRecord = await CentralAuth.findOne({ loginId });
    if (!authRecord) return res.status(404).json({ success: false, message: "User not found" });

    // Hash new password and save (replaces old password)
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    authRecord.password = hashedPassword;
    await authRecord.save();

    // Consume OTP — single-use
    await OTP.deleteMany({ loginId });

    console.log(`✅ Password reset successful for: ${loginId}`);
    res.json({ success: true, message: "Password reset successful! You can now login." });
  } catch (err) {
    console.error('Reset-password error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── 1.6 CHANGE PASSWORD (for logged-in users) ───
app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { loginId, currentPassword, newPassword } = req.body;
    if (!loginId || !currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }
    const authRecord = await CentralAuth.findOne({ loginId });
    if (!authRecord) return res.status(404).json({ success: false, message: 'Account not found.' });

    const isMatch = await bcrypt.compare(currentPassword, authRecord.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });

    authRecord.password = await bcrypt.hash(newPassword, 10);
    await authRecord.save();
    console.log(`✅ Password changed for: ${loginId}`);
    res.json({ success: true, message: 'Password changed successfully!' });
  } catch (err) {
    console.error('Change-password error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── 2. PUBLIC REGISTRATION ROUTE (Goes to Pending) ───
app.post('/api/public/register', async (req, res) => {
  try {
    const newReg = await PendingRegistration.create({
      ...req.body,
      status: 'Pending'
    });
    return res.json({ success: true, message: "Registration submitted successfully! Please wait for Admin approval." });
  } catch (error) {
    console.error("Public Registration Error:", error);
    return res.status(500).json({ success: false, message: "Failed to register. " + error.message });
  }
});

// ─── 3. ADMIN USER CREATION ROUTE (Multi-Tenant Upgraded) ───
app.post('/api/admin/users/create', upload.single('profilePhoto'), async (req, res) => {
  try {
    const { role, name, email, mobile, address, classId,
      parentName, parentPhone, gender, dob, bloodGroup, house, admissionDate,
      teacherId, qualification, department, experience, joiningDate, salary, designation, subjects
    } = req.body;

    const roleNormalized = role ? role.trim().charAt(0).toUpperCase() + role.trim().slice(1).toLowerCase() : '';
    console.log(`👤 CREATING USER: name="${name}", email="${email}", role="${role}" (normalized: "${roleNormalized}")`);

    if (!name || !email || !role || !mobile || !address) {
      console.log('❌ MISSSING FIELDS:', { name, email, role, mobile, address });
      return res.status(400).json({ success: false, message: 'All basic fields are required.' });
    }

    const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

    let prefix = 'AB-USR';
    if (roleNormalized === 'Admin') prefix = 'AB-ADM';
    else if (roleNormalized === 'Teacher') prefix = 'AB-EMP';
    else if (roleNormalized === 'Student') prefix = 'AB-STD';

    const lastAuth = await CentralAuth.findOne({ loginId: new RegExp(`^${prefix}`) }).sort({ _id: -1 });
    let seq = 1;
    if (lastAuth && lastAuth.loginId) {
      const match = lastAuth.loginId.match(/\d+$/);
      if (match) seq = parseInt(match[0], 10) + 1;
    }
    const newLoginId = `${prefix}-${seq.toString().padStart(3, '0')}`;

    const hashedPassword = await bcrypt.hash('Welcome@123', 10);
    let profile = null;

    if (roleNormalized === 'Student') {
      const rollNo = await generateSequentialId(Student, 'S', 'rollNo');

      let standard = req.body.standard || '';
      let section = req.body.section || 'A';

      if (classId) {
        const classDoc = await Class.findById(classId);
        if (classDoc) {
          standard = classDoc.standard;
          section = classDoc.section;
        }
      }

      let s3PhotoUrl = '';
      if (req.file) {
        s3PhotoUrl = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype);
      }

      profile = await Student.create({
        name, email: email.toLowerCase(), phone: mobile || '', address: address || '',
        gender: gender || 'Male', bloodGroup: bloodGroup || '', parentName: parentName || '',
        parentPhone: parentPhone || '', house: house || 'Red House',
        admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
        classId: classId || null,
        standard,
        section,
        rollNo,
        loginId: newLoginId, // Ensure loginId is saved to student profile too
        feeStatus: 'Pending',
        profilePhotoUrl: req.body.profilePhotoUrl || s3PhotoUrl || (req.file ? `${BASE_URL}/uploads/${req.file.filename}` : ''),
        isActive: true,
        academicHistory: [{
          academicYear: req.academicYear || '2025-2026',
          classId: classId || null,
          standard: standard,
          section: section,
          status: 'Active'
        }]
      });

      if (classId) {
        await Class.findByIdAndUpdate(classId, { $addToSet: { students: profile._id } });
      }

    } else if (roleNormalized === 'Teacher') {
      let s3PhotoUrl = '';
      if (req.file) {
        s3PhotoUrl = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype);
      }
      const autoTeacherId = teacherId || await generateSequentialId(Teacher, 'T', 'teacherId');
      profile = await Teacher.create({
        name, email: email.toLowerCase(), phone: mobile || '', teacherId: autoTeacherId,
        designation: designation || '', department: department || '', qualification: qualification || '',
        experience: experience ? Number(experience) : 0, salary: salary ? Number(salary) : 0,
        subjects: subjects || [],
        profilePhotoUrl: req.body.profilePhotoUrl || s3PhotoUrl || (req.file ? `${BASE_URL}/uploads/${req.file.filename}` : ''),
        isActive: true,
      });
    } else {
      console.log('⚠️ FALLING BACK TO USER MODEL for role:', roleNormalized);
      profile = await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword, // MUST INCLUDE PASSWORD
        role: roleNormalized,
        isActive: true
      });
    }

    await CentralAuth.create({
      loginId: newLoginId,
      password: hashedPassword,
      tenantId: 'abhyaas',
      role: role,
      userRef: profile._id
    });

    return res.json({
      success: true,
      message: `${role} created successfully! Login ID: ${newLoginId} | Password: Welcome@123`,
      data: { profile }
    });

  } catch (error) {
    console.error('User Creation Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ===================================================================
// 4. GET CLASS TREND (For the 7-day Bar Chart & Monthly Avg)
// ===================================================================
app.get('/api/attendance/trend', async (req, res) => {
  try {
    const { classId, date } = req.query;
    if (!classId) return res.status(400).json({ success: false, message: 'Class ID required' });

    const endDate = date ? new Date(date) : new Date();

    // Calculate Monthly Average (Last 30 days)
    const thirtyDaysAgo = new Date(endDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch all records for this class from the last 30 days
    const monthlyRecords = await Attendance.find({
      classId: classId,
      date: { $gte: thirtyDaysAgo, $lte: endDate }
    });

    let totalMonthlyPresent = 0;
    monthlyRecords.forEach(r => { if (r.status === 'Present') totalMonthlyPresent++; });
    const monthlyAverage = monthlyRecords.length > 0
      ? Math.round((totalMonthlyPresent / monthlyRecords.length) * 100)
      : 0;

    // Calculate 7-Day Trend
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(endDate);
      targetDate.setDate(targetDate.getDate() - i);

      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const dailyRecords = monthlyRecords.filter(r =>
        new Date(r.date) >= startOfDay && new Date(r.date) <= endOfDay
      );

      let dailyPresent = 0;
      dailyRecords.forEach(r => { if (r.status === 'Present') dailyPresent++; });

      const dailyPct = dailyRecords.length > 0
        ? Math.round((dailyPresent / dailyRecords.length) * 100)
        : 0;

      trend.push({
        date: startOfDay.toISOString().split('T')[0],
        percentage: dailyPct
      });
    }

    res.json({
      success: true,
      data: { monthlyAverage, trend }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching trend' });
  }
});

// ===================================================================
// 5. GET SINGLE STUDENT STATS (For the green bar under their name)
// ===================================================================
app.get('/api/attendance/student-stats/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    // Find all attendance records for this specific student, sorted by date DESC
    const records = await Attendance.find({
      student: studentId,
      $or: [{ academicYear: req.academicYear }, { academicYear: { $exists: false } }]
    }).sort({ date: -1 });

    if (records.length === 0) {
      return res.json({ success: true, data: { percentage: 0, totalDays: 0, presentDays: 0, attendanceHistory: [] } });
    }

    let presentCount = 0;
    records.forEach(r => { if (r.status === 'Present') presentCount++; });

    const percentage = Math.round((presentCount / records.length) * 100);

    res.json({
      success: true,
      data: {
        percentage,
        totalDays: records.length,
        presentDays: presentCount,
        attendanceHistory: records
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching student stats' });
  }
});

// ===================================================================
// 6. FEE RECONCILIATION HELPER
// ===================================================================
// This function ensures that student fee cards reflect actual payments
const reconcileStudentFeeStatus = async (studentId, academicYear) => {
  try {
    const student = await Student.findById(studentId);
    if (!student) return;

    const currentYear = academicYear || '2025-2026';

    // 1. Get all structures for this student's standard
    const structures = await FeeStructure.find({
      standard: student.standard,
      academicYear: currentYear
    });
    if (structures.length === 0) return;

    // 2. Get all payments recorded for this student
    const payments = await FeePayment.find({
      studentId,
      academicYear: currentYear
    });

    let totalDue = 0;
    let totalPaid = 0;

    structures.forEach(s => { totalDue += s.amount; });
    payments.forEach(p => { totalPaid += (p.amountPaid + (p.discount || 0)); });

    let newStatus = 'Pending';
    if (totalPaid >= totalDue) { newStatus = 'Paid'; }
    else if (totalPaid > 0) { newStatus = 'Partial'; }

    await Student.findByIdAndUpdate(studentId, { feeStatus: newStatus });

    // 3. Sync the legacy "Fee" model
    for (const s of structures) {
      const paidForThis = payments
        .filter(p => p.feeStructureId.toString() === s._id.toString())
        .reduce((sum, p) => sum + p.amountPaid + (p.discount || 0), 0);

      const feeRecord = await Fee.findOne({
        student: studentId,
        feeType: s.feeType,
        academicYear: currentYear
      });

      if (feeRecord) {
        feeRecord.totalAmount = s.amount;
        feeRecord.paidAmount = paidForThis;
        feeRecord.dueDate = s.dueDate;
        await feeRecord.save();
      } else {
        await Fee.create({
          student: studentId,
          feeType: s.feeType,
          totalAmount: s.amount,
          paidAmount: paidForThis,
          dueDate: s.dueDate,
          academicYear: currentYear
        });
      }
    }
  } catch (err) {
    console.error("Reconciliation error:", err);
  }
};

// Route to manually sync all students (for Admin)
app.post('/api/admin/fees/sync-all', async (req, res) => {
  try {
    const students = await Student.find({});
    for (const s of students) {
      await reconcileStudentFeeStatus(s._id, req.academicYear);
    }
    res.json({ success: true, message: "Standardized and synced fee statuses for all students." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ROUTER MOUNTS ───
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/principal', principalRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/student', studentDashboardRoutes);
app.use('/api/admissions', admissionRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', apiRoutes);

// ─── STUDENT PROMOTION (BULK LEDGER UPDATE) ─────────────────────
app.post('/api/students/promote', async (req, res) => {
  try {
    const { studentIds, nextYear, nextClassId, nextStandard, nextSection } = req.body;
    const currentYear = req.academicYear || '2025-2026';

    if (!studentIds || !nextYear) {
      return res.status(400).json({ success: false, message: 'Student IDs and Next Academic Year are required' });
    }

    // Step 1: Mark current year records as "Promoted"
    await Student.updateMany(
      {
        _id: { $in: studentIds },
        academicHistory: { $elemMatch: { academicYear: currentYear, status: 'Active' } }
      },
      { $set: { "academicHistory.$[elem].status": "Promoted" } },
      { arrayFilters: [{ "elem.status": "Active", "elem.academicYear": currentYear }] }
    );

    // Step 2: Push new records for the next year (ONLY if not already present)
    // We do this in a loop because updateMany with individual checks for array existence per-doc is tricky
    for (const id of studentIds) {
      const student = await Student.findById(id);
      if (!student) continue;

      const hasNextYear = student.academicHistory.some(h => h.academicYear === nextYear);
      if (!hasNextYear) {
        student.academicHistory.push({
          academicYear: nextYear,
          classId: nextClassId,
          standard: nextStandard,
          section: nextSection,
          status: 'Active'
        });
        // Also update top-level for legacy support
        student.classId = nextClassId;
        student.standard = nextStandard;
        student.section = nextSection;
        await student.save();
      }
    }

    res.json({ success: true, message: `Successfully processed ${studentIds.length} students for ${nextYear} 🚀` });
  } catch (error) {
    console.error('Promotion Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});