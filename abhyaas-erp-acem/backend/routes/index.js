// routes/index.js — All API routes for Abhyaas School ERP
import express from 'express';
import mongoose from 'mongoose';
import auth from '../middleware/authMiddleware.js';
import bcrypt from 'bcryptjs';
// Import all models using ES Module syntax
import {
  User, Student, Teacher, Class, Subject,
  Attendance, Exam, Result, Timetable,
  Fee, Homework, LibraryBook, LibraryIssue,
  Announcement, TransportRoute, TransportAssignment,
  Leave, Payroll, ActivityLog, TalentTest,
  PendingRegistration, CentralAuth, Mark,
  FeePayment, FeeStructure, Registration
} from '../models/index.js';
import { sendAbsentNotification } from '../utils/whatsapp.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { TimetableGenerator } from '../utils/timetableGenerator.js';

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });


const router = express.Router();

// ── helpers ──────────────────────────────────────────────────────
const ok = (res, data, msg = 'Success') => res.json({ success: true, message: msg, data });
const err = (res, msg = 'Server error', code = 500) => res.status(code).json({ success: false, message: msg });
const adminOnly = [auth, (req, res, next) => req.user.role === 'Admin' ? next() : err(res, 'Admin only', 403)];

const generateSequentialId = async (Model, prefix, fieldName) => {
  const lastDoc = await Model.findOne({}, { [fieldName]: 1 }).sort({ _id: -1 });
  if (!lastDoc || !lastDoc[fieldName]) return `${prefix}-1001`;
  const match = lastDoc[fieldName].match(/\d+$/);
  if (match) {
    return `${prefix}-${parseInt(match[0], 10) + 1}`;
  }
  return `${prefix}-1001`;
};


router.post("/set-password", auth, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(req.user.id, {
      password: hashedPassword,
      isFirstLogin: false
    });

    res.json({ success: true, message: "Password updated successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🔒 LOGGED-IN PASSWORD CHANGE
router.post("/auth/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const authRecord = await CentralAuth.findOne({ userRef: req.user._id });
    if (!authRecord) return err(res, "Auth record not found", 404);

    const isMatch = await bcrypt.compare(currentPassword, authRecord.password);
    if (!isMatch) return err(res, "Incorrect current password", 400);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    authRecord.password = hashedPassword;
    await authRecord.save();

    ok(res, null, "Password changed successfully!");
  } catch (e) {
    err(res, e.message);
  }
});
// ════════════════════════════════════════════════════════════════
// DASHBOARD STATS
// ════════════════════════════════════════════════════════════════
router.get('/dashboard/stats', auth, async (req, res) => {
  try {
    const [totalStudents, totalTeachers, totalClasses,
      pendingFees, pendingLeaves, upcomingExams,
      pendingRegs, totalAnnouncements] = await Promise.all([
        Student.countDocuments({ isActive: true }),
        Teacher.countDocuments({ isActive: true }),
        Class.countDocuments(),
        Fee.countDocuments({ status: { $in: ['Pending', 'Overdue'] } }),
        Leave.countDocuments({ status: 'Pending' }),
        Exam.countDocuments({ date: { $gte: new Date() } }),
        PendingRegistration.countDocuments({ status: 'Pending' }),
        Announcement.countDocuments(),
      ]);

    // Fee collection total
    const feeAgg = await Fee.aggregate([
      { $match: { status: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } },
    ]);
    const feeCollected = feeAgg[0]?.total || 0;

    // Attendance % today
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const attAgg = await Attendance.aggregate([
      { $match: { date: { $gte: today } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } }
        }
      },
    ]);
    const attPct = attAgg[0] ? Math.round((attAgg[0].present / attAgg[0].total) * 100) : 0;

    ok(res, {
      totalStudents, totalTeachers, totalClasses,
      pendingFees, pendingLeaves, upcomingExams,
      pendingRegs, feeCollected, attendancePct: attPct,
      totalAnnouncements,
    });
  } catch (e) { err(res, e.message); }
});

// Recent activity for dashboard
router.get('/dashboard/activity', auth, async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 }).limit(10)
      .populate('user', 'name role');
    ok(res, logs);
  } catch (e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// REGISTRATIONS (existing)
// ════════════════════════════════════════════════════════════════
// router.get('/admin/registrations', adminOnly, async (req, res) => {
//   try {
//     const regs = await PendingRegistration.find({ status:'Pending' }).sort({ createdAt:-1 });
//     ok(res, regs);
//   } catch(e) { err(res, e.message); }
// });

// router.put('/admin/registrations/:id', adminOnly, async (req, res) => {
//   try {
//     const { status } = req.body;
//     const reg = await PendingRegistration.findByIdAndUpdate(req.params.id, { status }, { new:true });
//     if (!reg) return err(res,'Registration not found',404);
//     if (status === 'Approved') {
//       await ActivityLog.create({ user:req.user._id, action:'User Approved', module:'Registrations', details:`Approved ${reg.role}: ${reg.name}` });
//     }
//     ok(res, reg, `Registration ${status}`);
//   } catch(e) { err(res, e.message); }
// });

// ════════════════════════════════════════════════════════════════
// REGISTRATIONS (Permanent Approval Logic)
// ════════════════════════════════════════════════════════════════
// const bcrypt = require('bcryptjs'); // Ensure bcrypt is available for password hashing

router.get('/admin/registrations', adminOnly, async (req, res) => {
  try {
    const { status } = req.query;
    const q = status ? { status } : {};
    const regs = await PendingRegistration.find(q).sort({ createdAt: -1 });
    res.json({ success: true, data: regs });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put('/admin/registrations/:id/:action', adminOnly, async (req, res) => {
  try {
    const { id, action } = req.params;
    const reg = await PendingRegistration.findById(id);

    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });
    if (reg.status === 'Approved') return res.status(400).json({ success: false, message: 'Already approved!' });

    // IF REJECTED
    if (action === 'reject') {
      reg.status = 'Rejected';
      await reg.save();
      return res.json({ success: true, message: 'Registration rejected.' });
    }

    //     // IF APPROVED
    //     if (action === 'approve') {
    //       // 1. Create the permanent User for login
    //       const salt = await bcrypt.genSalt(10);
    //       const hashedPassword = await bcrypt.hash("Welcome@123", salt);

    //       const authUser = await User.create({
    //         name: reg.name,
    //         email: reg.email,
    //         password: hashedPassword,
    //         role: reg.role,
    //         isFirstLogin: true
    //       });

    //       // 2. Move data to Students or Teachers collection permanently
    //       if (reg.role === 'Student') {
    //         await Student.create({
    //           name: reg.name,
    //           email: reg.email,
    //           user: authUser._id,
    //           rollNo: reg.rollNo || `S-${Date.now().toString().slice(-6)}`,
    //           standard: reg.className || reg.standard,
    //           section: reg.section,
    //           gender: reg.gender,
    //           fatherName: reg.fatherName,
    //           motherName: reg.motherName,
    //           house: reg.house,
    //           address: reg.address,
    //           phone: reg.mobile || reg.phone,
    //           profilePhotoUrl: reg.profilePhotoUrl,
    //           isActive: true
    //         });
    //       } else if (reg.role === 'Teacher') {
    //         await Teacher.create({
    //           name: reg.name,
    //           email: reg.email,
    //           user: authUser._id,
    //           teacherId: reg.teacherId || `T-${Date.now().toString().slice(-6)}`,
    //           department: reg.department,
    //           qualification: reg.qualification,
    //           experience: reg.experience,
    //           salary: reg.salary,
    //           phone: reg.mobile || reg.phone,
    //           address: reg.address,
    //           profilePhotoUrl: reg.profilePhotoUrl,
    //           isActive: true
    //         });
    //       }

    //       // 3. Mark as approved in the pending list
    //       reg.status = 'Approved';
    //       await reg.save();

    //       // Log the activity
    //       await ActivityLog.create({ user: req.user._id, action: 'User Approved', module: 'Registrations', details: `Approved ${reg.role}: ${reg.name}` });

    //       return res.json({ success: true, message: `${reg.role} permanently added to the system!` });
    //     }
    // IF APPROVED
    if (action === 'approve') {
      // 🕵️‍♂️ SPY LOG: See exactly what the DB is holding
      console.log("Found Registration Data:", reg);

      // 1. Create the permanent User for login
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("Welcome@123", salt);

      // Use || to handle different possible naming conventions (e.g., mobile vs phone)
      const userData = {
        name: reg.name || reg.fullName,
        email: reg.email,
        password: hashedPassword,
        role: reg.role,
        isFirstLogin: true
      };

      console.log("Attempting to create User with:", userData);
      const authUser = await User.create(userData);

      // 2. Move data to Students or Teachers collection permanently
      let finalProfileId = null;
      let finalLoginId = null;

      if (reg.role === 'Student') {
        const generatedRollNo = await generateSequentialId(Student, 'S', 'rollNo');
        const studentProfile = await Student.create({
          name: userData.name,
          email: userData.email,
          user: authUser._id,
          rollNo: reg.rollNo || reg.studentId || generatedRollNo,
          loginId: reg.studentId || generatedRollNo, // Use same ID for loginId
          standard: reg.className || reg.standard,
          section: reg.section || 'A',
          classId: (reg.classId && mongoose.Types.ObjectId.isValid(reg.classId)) ? reg.classId : null,
          gender: reg.gender,
          fatherName: reg.fatherName,
          motherName: reg.motherName,
          house: reg.house,
          address: reg.address,
          phone: reg.mobile || reg.phone,
          profilePhotoUrl: reg.profilePhotoUrl,
          isActive: true,
          academicHistory: [{
            academicYear: req.academicYear || '2025-2026',
            classId: (reg.classId && mongoose.Types.ObjectId.isValid(reg.classId)) ? reg.classId : null,
            standard: reg.className || reg.standard,
            section: reg.section || 'A',
            status: 'Active'
          }]
        });

        finalProfileId = studentProfile._id;
        finalLoginId = studentProfile.rollNo || studentProfile.loginId;

        // 🟢 SYNC WITH CLASS
        const finalClassId = reg.classId || null;
        if (finalClassId && mongoose.Types.ObjectId.isValid(finalClassId)) {
          await Class.findByIdAndUpdate(finalClassId, { $addToSet: { students: studentProfile._id } });
        } else if (reg.standard) {
          const targetClass = await Class.findOne({ standard: reg.standard, section: reg.section || 'A' });
          if (targetClass) {
            await Student.findByIdAndUpdate(studentProfile._id, { classId: targetClass._id });
            await Class.findByIdAndUpdate(targetClass._id, { $addToSet: { students: studentProfile._id } });
          }
        }
      } else if (reg.role === 'Teacher') {
        const generatedTeacherId = await generateSequentialId(Teacher, 'T', 'teacherId');
        const teacherProfile = await Teacher.create({
          name: userData.name,
          email: userData.email,
          user: authUser._id,
          teacherId: reg.teacherId || generatedTeacherId,
          department: reg.department,
          qualification: reg.qualification,
          experience: reg.experience,
          salary: reg.salary,
          phone: reg.mobile || reg.phone,
          address: reg.address,
          profilePhotoUrl: reg.profilePhotoUrl,
          isActive: true
        });

        finalProfileId = teacherProfile._id;
        finalLoginId = teacherProfile.teacherId;
      }

      // 3. CREATE CENTRAL AUTH RECORD
      if (finalLoginId && finalProfileId) {
        await CentralAuth.create({
          loginId: finalLoginId,
          password: hashedPassword,
          tenantId: 'abhyaas',
          role: reg.role,
          userRef: finalProfileId
        });
      }

      // 4. Mark as approved
      reg.status = 'Approved';
      await reg.save();

      await ActivityLog.create({ user: req.user._id, action: 'User Approved', module: 'Registrations', details: `Approved ${reg.role}: ${userData.name}` });

      return res.json({ success: true, message: `${reg.role} permanently added to the system!` });
    }

  } catch (e) {
    console.error("Approval Error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});
// ════════════════════════════════════════════════════════════════
// ACADEMIC YEARS
// ════════════════════════════════════════════════════════════════
router.get('/academic-years', auth, async (req, res) => {
  try {
    const years = await AcademicYear.find().sort({ name: -1 });
    ok(res, years);
  } catch (e) { err(res, e.message); }
});

router.post('/academic-years', adminOnly, async (req, res) => {
  try {
    const { name, startDate, endDate, isActive } = req.body;
    if (isActive) await AcademicYear.updateMany({}, { isActive: false });
    const year = await AcademicYear.create({ name, startDate, endDate, isActive });
    ok(res, year, 'Academic year created successfully.');
  } catch (e) { err(res, e.message); }
});

// 🚀 ONE-TIME MIGRATION: Move legacy students to the 2025-2026 timeline
router.post('/students/migrate-legacy', adminOnly, async (req, res) => {
  try {
    const students = await Student.find({
      $or: [
        { academicHistory: { $exists: false } },
        { academicHistory: { $size: 0 } }
      ]
    });
    let count = 0;
    for (const student of students) {
      student.academicHistory = [{
        academicYear: '2025-2026',
        classId: student.classId,
        standard: student.standard,
        section: student.section,
        status: 'Active'
      }];
      await student.save();
      count++;
    }
    ok(res, { migrated: count }, `Successfully migrated ${count} students to 2025-2026 timeline.`);
  } catch (e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// STUDENTS
// ════════════════════════════════════════════════════════════════
router.get('/students', auth, async (req, res) => {
  try {
    const { standard, section, search, page = 1, limit = 20 } = req.query;

    // 🛡️ STRICT FILTER: Only show students active in the selected academic year
    const q = {
      isActive: true,
      academicHistory: {
        $elemMatch: {
          academicYear: req.academicYear,
          status: 'Active'
        }
      }
    };

    if (standard) {
      // If we filter by standard, we need to match it either on root (legacy) 
      // OR in the academicHistory's classId (complex)
      // For now, if Admin provides standard, they expect students currently in that standard.
      q.$or = [{ standard: standard }, { "academicHistory.standard": standard }];
    }
    if (section) q.section = section;
    if (search) q.name = { $regex: search, $options: 'i' };

    const [students, total] = await Promise.all([
      Student.find(q)
        .populate('academicHistory.classId', 'name standard section')
        .sort({ rollNo: 1 })
        .skip((page - 1) * limit).limit(+limit),
      Student.countDocuments(q),
    ]);

    // Attach Login IDs from CentralAuth
    const studentIds = students.map(s => s._id);
    const authRecords = await CentralAuth.find({
      userRef: { $in: studentIds },
      role: 'Student'
    }).select('loginId userRef');

    const authMap = authRecords.reduce((acc, curr) => {
      acc[curr.userRef.toString()] = curr.loginId;
      return acc;
    }, {});

    const studentsWithLogin = students.map(s => ({
      ...s.toObject(),
      loginId: authMap[s._id.toString()] || 'N/A'
    }));

    ok(res, { students: studentsWithLogin, total, page: +page, pages: Math.ceil(total / limit) });
  } catch (e) { err(res, e.message); }
});

router.post('/students/promote', adminOnly, async (req, res) => {
  try {
    const { studentIds, nextYear, nextClassId, nextStandard, nextSection } = req.body;

    // Update multiple students at once
    const result = await Student.updateMany(
      { _id: { $in: studentIds } },
      {
        $push: {
          academicHistory: {
            academicYear: nextYear,
            classId: nextClassId,
            status: 'Active'
          }
        },
        // Also sync root fields for legacy compatibility and reliable filtering
        standard: nextStandard,
        section: nextSection,
        academicYear: nextYear
      }
    );

    await ActivityLog.create({
      user: req.user._id,
      action: 'Students Promoted',
      module: 'Students',
      details: `Promoted ${result.modifiedCount} students to ${nextYear}`
    });

    ok(res, { count: result.modifiedCount }, `Successfully promoted ${result.modifiedCount} students to ${nextYear}`);
  } catch (e) { err(res, e.message); }
});

router.get('/students/:id', auth, async (req, res) => {
  try {
    const s = await Student.findById(req.params.id).populate('classId', 'name standard section');
    if (!s) return err(res, 'Student not found', 404);
    ok(res, s);
  } catch (e) { err(res, e.message); }
});

// router.post('/students', adminOnly, async (req, res) => {
//   try {
//     const studentData = { ...req.body };

//     // 🛡️ BULLETPROOF FIX: Force a brand new, unique Roll Number every single time.
//     studentData.rollNo = `S-${Date.now().toString().slice(-6)}`;

//     const s = await Student.create(studentData);

//     if (studentData.classId) {
//       await Class.findByIdAndUpdate(studentData.classId, { $push:{ students: s._id } });
//     }

//     await ActivityLog.create({ user:req.user._id, action:'Student Added', module:'Students', details:`Added ${s.name}` });

//     ok(res, s, `Student created successfully with Roll No: ${studentData.rollNo}`);

//   } catch(e) { 
//     // Catch duplicate errors gracefully
//     if (e.code === 11000) {
//       return res.status(400).json({ success: false, message: "A student with this Email or Roll Number already exists!" });
//     }
//     err(res, e.message); 
//   }
// });

router.post('/students', adminOnly, upload.single('profilePhoto'), async (req, res) => {
  console.log("🚀 [DEBUG] Incoming Student Creation req.body:", req.body);
  try {
    const {
      name, email, phone, classId, standard, section, house, gender, bloodGroup,
      parentName, fatherName, motherName, parentPhone, parentEmail, address
    } = req.body;

    // 1. Photo Handling
    let profilePhotoUrl = "";
    const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
    if (req.file) {
      profilePhotoUrl = `${BASE_URL}/uploads/${req.file.filename}`;
    }

    // 2. Security: Force default password for admin-created student
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("Welcome@123", salt);

    // 3. ID Generation (Roll No & Login ID)
    const rollNo = await generateSequentialId(Student, 'S', 'rollNo');
    const loginId = await generateSequentialId(CentralAuth, 'AB-STD', 'loginId');

    // 🚀 4. COMPLETE STUDENT PROFILE CREATION (Explicit Data Mapping)
    const s = await Student.create({
      name,
      email,
      phone,
      house,
      gender,
      bloodGroup,
      address,
      parentName: parentName || fatherName,
      fatherName: fatherName || parentName,
      motherName,
      parentPhone,
      parentEmail,
      profilePhotoUrl,
      rollNo,
      loginId, // Explicitly saved in student record
      password: hashedPassword,
      isFirstLogin: true,
      isActive: true,
      // Ledger initialization (Never Overwrite rule)
      academicHistory: [{
        academicYear: req.academicYear,
        classId: classId,
        standard: standard,
        section: section,
        status: 'Active'
      }]
    });

    // 🔐 5. CENTRAL AUTH DIRECTORY LINKAGE
    await CentralAuth.create({
      loginId,
      userRef: s._id,
      role: 'Student',
      password: hashedPassword,
      tenantId: 'abhyaas' // Multi-tenancy support
    });

    // 6. Update Class Roster
    if (classId) {
      await Class.findByIdAndUpdate(classId, { $push: { students: s._id } });
    }

    // 7. Audit Log
    await ActivityLog.create({
      user: req.user._id,
      action: 'Student Added',
      module: 'Students',
      details: `Added ${s.name} (Login ID: ${loginId})`
    });

    ok(res, { ...s.toObject(), loginId }, `Student created! Login ID is: ${loginId}`);

  } catch (e) {
    console.error("❌ Student Creation Error:", e);
    if (e.code === 11000) return res.status(400).json({ success: false, message: "Email or Roll Number already exists!" });
    err(res, e.message);
  }
});

router.put('/students/:id', adminOnly, upload.single('profilePhoto'), async (req, res) => {
  try {
    const {
      name, email, phone, classId, standard, section, house, gender, bloodGroup,
      parentName, fatherName, motherName, parentPhone, parentEmail, address
    } = req.body;

    // 1. Find Student
    const student = await Student.findById(req.params.id);
    if (!student) return err(res, 'Student not found', 404);

    const oldEmail = student.email;

    // 2. Update Root Profile Fields (Explicit Mapping)
    student.name = name || student.name;
    student.email = email ? email.toLowerCase() : student.email;
    student.phone = phone || student.phone;
    student.house = house || student.house;
    student.gender = gender || student.gender;
    student.bloodGroup = bloodGroup || student.bloodGroup;
    student.address = address || student.address;
    student.parentName = parentName || fatherName || student.parentName;
    student.fatherName = fatherName || parentName || student.fatherName;
    student.motherName = motherName || student.motherName;
    student.parentPhone = parentPhone || student.parentPhone;
    student.parentEmail = parentEmail || student.parentEmail;

    if (req.file) {
    const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
    student.profilePhotoUrl = `${BASE_URL}/uploads/${req.file.filename}`;
    }

    // 🚀 3. LEDGER UPDATE: Target specific academic year entry
    const currentYear = req.academicYear;
    let historyEntry = student.academicHistory.find(h => h.academicYear === currentYear);

    if (historyEntry) {
      // Update existing entry for this year
      if (classId) historyEntry.classId = classId;
      if (standard) historyEntry.standard = standard;
      if (section) historyEntry.section = section;
    } else {
      // Safety: Create entry if missing for current session
      student.academicHistory.push({
        academicYear: currentYear,
        classId,
        standard,
        section,
        status: 'Active'
      });
    }

    // 4. Save and return
    await student.save();

    // 5. Legacy Sync: Synchronize abhyaas_users email if changed
    if (oldEmail && student.email && oldEmail.toLowerCase() !== student.email.toLowerCase()) {
      const db = mongoose.connection.db;
      await db.collection('abhyaas_users').updateOne(
        { email: oldEmail.toLowerCase() },
        { $set: { email: student.email.toLowerCase() } }
      );
    }

    ok(res, student, 'Student updated successfully in current session');

  } catch (e) {
    console.error("❌ Student Update Error:", e);
    err(res, e.message);
  }
});

router.delete('/students/:id', adminOnly, async (req, res) => {
  try {
    await Student.findByIdAndUpdate(req.params.id, { isActive: false });
    ok(res, null, 'Student deactivated');
  } catch (e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// TEACHERS
// ════════════════════════════════════════════════════════════════
router.get('/teachers', auth, async (req, res) => {
  try {
    const { department, search, page = 1, limit = 20 } = req.query;
    const q = { isActive: true };
    if (department) q.department = department;
    if (search) q.name = { $regex: search, $options: 'i' };
    const [teachers, total] = await Promise.all([
      Teacher.find(q).populate('classes', 'name').sort({ name: 1 })
        .skip((page - 1) * limit).limit(+limit),
      Teacher.countDocuments(q),
    ]);

    // Attach Login IDs from CentralAuth
    const teacherIds = teachers.map(t => t._id);
    const authRecords = await CentralAuth.find({
      userRef: { $in: teacherIds },
      role: 'Teacher'
    }).select('loginId userRef');

    const authMap = authRecords.reduce((acc, curr) => {
      acc[curr.userRef.toString()] = curr.loginId;
      return acc;
    }, {});

    const teachersWithLogin = teachers.map(t => ({
      ...t.toObject(),
      loginId: authMap[t._id.toString()] || 'N/A'
    }));

    ok(res, { teachers: teachersWithLogin, total, pages: Math.ceil(total / limit) });
  } catch (e) { err(res, e.message); }
});

router.get('/teachers/:id', auth, async (req, res) => {
  try {
    const t = await Teacher.findById(req.params.id).populate('classes', 'name');
    if (!t) return err(res, 'Teacher not found', 404);
    ok(res, t);
  } catch (e) { err(res, e.message); }
});

// router.post('/teachers', adminOnly, async (req, res) => {
//   try {
//     const t = await Teacher.create(req.body);
//     await ActivityLog.create({ user:req.user._id, action:'Teacher Added', module:'Teachers', details:`Added ${t.name}` });
//     ok(res, t, 'Teacher created');
//   } catch(e) { err(res, e.message); }
// });

router.post('/teachers', adminOnly, upload.single('profilePhoto'), async (req, res) => {
  try {
    const teacherData = { ...req.body };
    if (req.file) {
    const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
    teacherData.profilePhotoUrl = `${BASE_URL}/uploads/${req.file.filename}`;
    }
    // Handle array-based fields like subjects if sent as string from FormData
    if (typeof teacherData.subjects === 'string') {
      try { teacherData.subjects = JSON.parse(teacherData.subjects); } catch (e) { }
    }

    // 1. Force the default password
    const salt = await bcrypt.genSalt(10);
    teacherData.password = await bcrypt.hash("Welcome@123", salt);

    // 2. Force them to change it on first login
    teacherData.isFirstLogin = true;

    // Assign sequential Teacher ID if not provided
    teacherData.teacherId = teacherData.teacherId || await generateSequentialId(Teacher, 'T', 'teacherId');

    const t = await Teacher.create(teacherData);
    await ActivityLog.create({ user: req.user._id, action: 'Teacher Added', module: 'Teachers', details: `Added ${t.name}` });

    ok(res, t, 'Teacher created! Default Password is: Welcome@123');
  } catch (e) { err(res, e.message); }
});

router.put('/teachers/:id', adminOnly, upload.single('profilePhoto'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
    const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
    updateData.profilePhotoUrl = `${BASE_URL}/uploads/${req.file.filename}`;
    }
    if (typeof updateData.subjects === 'string') {
      try { updateData.subjects = JSON.parse(updateData.subjects); } catch (e) { }
    }
    const oldT = await Teacher.findById(req.params.id);
    const t = await Teacher.findByIdAndUpdate(req.params.id, updateData, { new: true });

    // Legacy Sync: Keep the old abhyaas_users email identical so the Login ID dragnet doesn't break!
    if (oldT && oldT.email && t.email && oldT.email.toLowerCase() !== t.email.toLowerCase()) {
      const db = mongoose.connection.db;
      await db.collection('abhyaas_users').updateOne(
        { email: oldT.email.toLowerCase() },
        { $set: { email: t.email.toLowerCase() } }
      );
    }
    ok(res, t, 'Teacher updated');
  } catch (e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// CLASSES
// ════════════════════════════════════════════════════════════════
// router.get('/classes', auth, async (req, res) => {
//   try {
//     const classes = await Class.find()
//       .populate('classTeacher', 'name')
//       .populate('students', 'name rollNo')
//       .sort({ standard: 1, section: 1 });
//     ok(res, classes);
//   } catch (e) { err(res, e.message); }
// });

// router.get('/classes/:id', auth, async (req, res) => {
//   try {
//     const c = await Class.findById(req.params.id)
//       .populate('classTeacher', 'name email')
//       .populate('students', 'name rollNo feeStatus');
//     ok(res, c);
//   } catch (e) { err(res, e.message); }
// });
// ════════════════════════════════════════════════════════════════
// CLASSES
// ════════════════════════════════════════════════════════════════
router.get('/classes', auth, async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('classTeacher', 'name')
      .sort({ standard: 1, section: 1 })
      .lean(); // .lean() lets us safely modify the object

    const currentYear = req.academicYear || '2025-2026';

    // 🟢 BULLETPROOF SYNC: Dynamically fetch students for the ACTIVE YEAR only!
    for (let c of classes) {
      const students = await Student.find({
        academicHistory: {
          $elemMatch: {
            academicYear: currentYear,
            classId: c._id,
            status: 'Active'
          }
        },
        isActive: true
      }).select('name rollNo');

      c.students = students;
    }

    ok(res, classes);
  } catch (e) { err(res, e.message); }
});

router.get('/classes/:id', auth, async (req, res) => {
  try {
    const c = await Class.findById(req.params.id)
      .populate('classTeacher', 'name email')
      .lean();

    if (!c) return err(res, 'Class not found', 404);

    // 🟢 BULLETPROOF SYNC: Find every single active student matching this class
    const students = await Student.find({
      $or: [
        { classId: c._id },
        { standard: c.standard, section: c.section }
      ],
      isActive: true
    }).select('name rollNo feeStatus');

    c.students = students;
    ok(res, c);
  } catch (e) { err(res, e.message); }
});

// ... Leave your router.post('/classes') and router.put('/classes/:id') as they are!
router.post('/classes', adminOnly, async (req, res) => {
  try {
    const { standard, section } = req.body;

    // Check if class with the same standard and section already exists
    const existingClass = await Class.findOne({ standard, section: section || 'A' });
    if (existingClass) {
      return res.status(400).json({ success: false, message: `Class ${standard} - Section ${section || 'A'} already exists!` });
    }

    const c = await Class.create(req.body);

    const suffix = () => Math.random().toString(36).substring(2, 6).toUpperCase();

    // 🚀 AUTO-SUBJECT CREATION (Unassigned by default)
    const defaultSubjects = [
      { name: 'Mathematics', code: `MATH-${standard}${section || 'A'}-${suffix()}` },
      { name: 'Science', code: `SCI-${standard}${section || 'A'}-${suffix()}` },
      { name: 'English', code: `ENG-${standard}${section || 'A'}-${suffix()}` },
      { name: 'Social Studies', code: `SOC-${standard}${section || 'A'}-${suffix()}` },
      { name: 'Computer Science', code: `COMP-${standard}${section || 'A'}-${suffix()}` }
    ];

    try {
      await Subject.insertMany(defaultSubjects.map(s => ({
        ...s,
        standard: standard,
        type: 'Theory',
        teacher: null
      })));

      // Link these subjects to the class record
      c.subjects = defaultSubjects.map(s => s.name);
      await c.save();
    } catch (subjErr) {
      console.error("Auto-subject creation failed:", subjErr);
    }

    ok(res, c, 'Class created with default subjects');
  } catch (e) { err(res, e.message); }
});

router.put('/classes/:id', adminOnly, async (req, res) => {
  try {
    const c = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true });
    ok(res, c, 'Class updated');
  } catch (e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// HOUSES
// ════════════════════════════════════════════════════════════════
router.get('/houses', auth, async (req, res) => {
  try {
    const houses = await House.find().sort({ name: 1 });
    ok(res, houses);
  } catch (e) { err(res, e.message); }
});

router.post('/houses', adminOnly, async (req, res) => {
  try {
    const { name, color, emoji } = req.body;

    // Check for duplicate house name
    const existingHouse = await House.findOne({ name });
    if (existingHouse) {
      return res.status(400).json({ success: false, message: `House '${name}' already exists!` });
    }

    const h = await House.create({ name, color, emoji });
    ok(res, h, 'House created');
  } catch (e) { err(res, e.message); }
});

router.delete('/houses/:id', adminOnly, async (req, res) => {
  try {
    await House.findByIdAndDelete(req.params.id);
    ok(res, null, 'House deleted');
  } catch (e) { err(res, e.message); }
});

// Subjects
router.get('/subjects', auth, async (req, res) => {
  try {
    const subjects = await Subject.find().populate('teacher', 'name');
    ok(res, subjects);
  } catch (e) { err(res, e.message); }
});

router.post('/subjects', adminOnly, async (req, res) => {
  try {
    const s = await Subject.create(req.body);
    ok(res, s, 'Subject created');
  } catch (e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// ATTENDANCE
// ════════════════════════════════════════════════════════════════
router.get('/attendance', auth, async (req, res) => {
  try {
    const { classId, date, studentId, from, to, page = 1, limit = 50 } = req.query;
    const q = {};
    if (classId) q.classId = classId;
    if (studentId) q.student = studentId;
    if (date) q.date = { $gte: new Date(date), $lt: new Date(new Date(date).getTime() + 86400000) };
    if (from && to) q.date = { $gte: new Date(from), $lte: new Date(to) };
    const att = await Attendance.find(q)
      .populate('student', 'name rollNo')
      .populate('classId', 'name')
      .populate('markedBy', 'name')
      .sort({ date: -1 })
      .skip((page - 1) * limit).limit(+limit);
    const total = await Attendance.countDocuments(q);
    ok(res, { attendance: att, total });
  } catch (e) { err(res, e.message); }
});

// Attendance summary/stats for a class
router.get('/attendance/summary/:classId', auth, async (req, res) => {
  try {
    const { month } = req.query;
    const start = month ? new Date(`${month}-01`) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    const agg = await Attendance.aggregate([
      { $match: { classId: new mongoose.Types.ObjectId(req.params.classId), date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$student',
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
        }
      },
      { $lookup: { from: 'students', localField: '_id', foreignField: '_id', as: 'student' } },
      { $unwind: '$student' },
    ]);
    ok(res, agg);
  } catch (e) { err(res, e.message); }
});

router.post('/attendance/report/dynamic', auth, async (req, res) => {
  try {
    const { from, to, classId, status, columns, format } = req.body;

    let q = {};
    if (from && to) {
      q.date = {
        $gte: new Date(new Date(from).setHours(0, 0, 0, 0)),
        $lte: new Date(new Date(to).setHours(23, 59, 59, 999))
      };
    }
    if (classId) q.classId = classId;
    if (status && status !== 'All') q.status = status;

    const att = await Attendance.find(q)
      .populate('student', 'name rollNo standard section')
      .populate('classId', 'name')
      .populate('markedBy', 'name')
      .sort({ date: 1 });

    const data = att.map(a => {
      let row = {};
      if (columns.includes('Date')) row['Date'] = new Date(a.date).toLocaleDateString('en-IN');
      if (columns.includes('Student Name')) row['Student Name'] = a.student?.name || 'N/A';
      if (columns.includes('Roll Number')) row['Roll Number'] = a.student?.rollNo || 'N/A';
      if (columns.includes('Class')) row['Class'] = a.classId?.name || 'N/A';
      if (columns.includes('Status')) row['Status'] = a.status;
      if (columns.includes('Remarks')) row['Remarks'] = a.remarks || '';
      if (columns.includes('Marked By')) row['Marked By'] = a.markedBy?.name || 'N/A';
      return row;
    });

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Attendance Report');

      worksheet.columns = columns.map(col => ({ header: col, key: col, width: col === 'Remarks' ? 30 : 20 }));

      worksheet.addRows(data);

      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }; // Blue header
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=Attendance_Report.xlsx');
      await workbook.xlsx.write(res);
      return res.end();
    } else if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=Attendance_Report.pdf');
      doc.pipe(res);

      doc.fontSize(20).font('Helvetica-Bold').text('Attendance Report', { align: 'center' });
      doc.fontSize(10).font('Helvetica').text(`Period: ${from} to ${to}`, { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(2);

      // PDF Table logic
      const tableTop = 160;
      const pageWidth = 535;
      const columnWidth = pageWidth / columns.length;

      // Draw Header
      doc.fontSize(10).font('Helvetica-Bold');
      doc.rect(30, tableTop - 5, pageWidth, 20).fill('#f3f4f6').stroke('#f3f4f6');
      doc.fillColor('#000000');

      columns.forEach((col, i) => {
        doc.text(col, 35 + (i * columnWidth), tableTop);
      });

      doc.moveTo(30, tableTop + 15).lineTo(30 + pageWidth, tableTop + 15).stroke('#e5e7eb');

      let y = tableTop + 25;
      doc.font('Helvetica').fontSize(9);

      data.forEach((row) => {
        if (y > 750) { doc.addPage(); y = 50; }
        columns.forEach((col, i) => {
          doc.text(String(row[col] || ''), 35 + (i * columnWidth), y, { width: columnWidth - 5 });
        });
        y += 20;
        doc.moveTo(30, y - 5).lineTo(30 + pageWidth, y - 5).stroke('#f9fafb');
      });

      doc.end();
    } else {
      ok(res, data);
    }
  } catch (e) { err(res, e.message); }
});


// Mark attendance (bulk) + WhatsApp notifications for absent students
router.post('/attendance', auth, async (req, res) => {
  try {
    const { classId, date, records } = req.body;
    // records: [{ studentId, status }]

    // 0. Fetch existing attendance to prevent duplicate WhatsApp messages
    const existingRecords = await Attendance.find({ classId, date: new Date(date) });
    const existingStatusMap = {};
    existingRecords.forEach(r => {
      existingStatusMap[r.student.toString()] = r.status;
    });

    // 1. Save attendance records (upsert)
    const ops = records.map(r => ({
      updateOne: {
        filter: { student: r.studentId, classId, date: new Date(date) },
        update: { $set: { student: r.studentId, classId, date: new Date(date), status: r.status, markedBy: req.user._id } },
        upsert: true,
      },
    }));
    await Attendance.bulkWrite(ops);
    await ActivityLog.create({ user: req.user._id, action: 'Attendance Marked', module: 'Attendance', details: `Class attendance for ${date}` });

    // 2. Send WhatsApp to parents of NEWLY ABSENT students (fire-and-forget, non-blocking)
    // We only notify if their incoming status is 'Absent' AND their previous DB status was NOT 'Absent'
    const newlyAbsentIds = records
      .filter(r => r.status === 'Absent' && existingStatusMap[r.studentId] !== 'Absent')
      .map(r => r.studentId);

    let whatsappStats = { notified: 0, failed: 0, noPhone: 0 };

    if (newlyAbsentIds.length > 0) {
      // Format date nicely: e.g. "17 Mar 2026"
      const dateObj = date ? new Date(date) : new Date();
      const dateStr = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

      const absentStudents = await Student.find(
        { _id: { $in: newlyAbsentIds } },
        { name: 1, parentPhone: 1 }
      );

      const notifyResults = await Promise.all(
        absentStudents.map(async (student) => {
          if (!student.parentPhone) {
            whatsappStats.noPhone++;
            return;
          }
          const result = await sendAbsentNotification({
            parentPhone: student.parentPhone,
            studentName: student.name,
            dateStr,
          });
          if (result.success) whatsappStats.notified++;
          else whatsappStats.failed++;
        })
      );
    }

    ok(res, { whatsapp: whatsappStats }, 'Attendance saved');
  } catch (e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// EXAMINATIONS & RESULTS
// ════════════════════════════════════════════════════════════════
// router.get('/exams', auth, async (req, res) => {
//   try {
//     const { standard, type, upcoming } = req.query;
//     const q = {};
//     if (standard) q.standard = standard;
//     if (type) q.type = type;
//     if (upcoming) q.date = { $gte: new Date() };
//     const exams = await Exam.find(q).populate('createdBy', 'name').sort({ date: -1 });
//     ok(res, exams);
//   } catch (e) { err(res, e.message); }
// });

// router.post('/exams', auth, async (req, res) => {
//   try {
//     const exam = await Exam.create({ ...req.body, createdBy: req.user._id });
//     ok(res, exam, 'Exam created');
//   } catch (e) { err(res, e.message); }
// });

// router.put('/exams/:id', auth, async (req, res) => {
//   try {
//     const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     ok(res, exam, 'Exam updated');
//   } catch (e) { err(res, e.message); }
// });

// router.delete('/exams/:id', adminOnly, async (req, res) => {
//   try {
//     await Exam.findByIdAndDelete(req.params.id);
//     ok(res, null, 'Exam deleted');
//   } catch (e) { err(res, e.message); }
// });

// // Results
// router.get('/results', auth, async (req, res) => {
//   try {
//     const { examId, studentId, standard } = req.query;
//     const q = {};
//     if (examId) q.exam = examId;
//     if (studentId) q.student = studentId;
//     const results = await Result.find(q)
//       .populate('student', 'name rollNo standard section')
//       .populate('exam', 'name subject totalMarks date type')
//       .sort({ createdAt: -1 });
//     ok(res, results);
//   } catch (e) { err(res, e.message); }
// });

// router.post('/results', auth, async (req, res) => {
//   try {
//     // bulk enter results: body.results = [{ student, exam, marksObtained, totalMarks }]
//     const { results } = req.body;
//     const graded = results.map(r => {
//       const pct = (r.marksObtained / r.totalMarks) * 100;
//       return {
//         ...r, enteredBy: req.user._id,
//         grade: pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : 'F',
//       };
//     });
//     const ops = graded.map(r => ({
//       updateOne: {
//         filter: { student: r.student, exam: r.exam },
//         update: { $set: r },
//         upsert: true,
//       },
//     }));
//     await Result.bulkWrite(ops);
//     await ActivityLog.create({ user: req.user._id, action: 'Results Entered', module: 'Exams', details: `Results entered for ${results.length} students` });
//     ok(res, null, 'Results saved');
//   } catch (e) { err(res, e.message); }
// });
// ════════════════════════════════════════════════════════════════
// EXAMINATIONS, RESULTS & MARKS (Bulletproof Sync)
// ════════════════════════════════════════════════════════════════
router.get('/exams', auth, async (req, res) => {
  try {
    const { standard, type, upcoming } = req.query;
    const q = {};

    // 🟢 FIX 1: Flexible matching so "Class 10" and "10" always match perfectly!
    if (standard) {
      const baseStd = standard.replace('Class ', '').trim();
      q.$or = [
        { standard: baseStd },
        { standard: `Class ${baseStd}` },
        { standard: standard }
      ];
    }

    if (type) q.type = type;
    if (upcoming) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      q.date = { $gte: yesterday }; // Keeps today's exams visible all day!
    }

    const exams = await Exam.find(q).populate('createdBy', 'name').sort({ date: -1 });
    res.json({ success: true, data: exams });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/exams', auth, async (req, res) => {
  try {
    const exam = await Exam.create({ ...req.body, createdBy: req.user._id });
    res.json({ success: true, data: exam, message: 'Exam created' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/exams/:id', auth, async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: exam, message: 'Exam updated' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/exams/:id', adminOnly, async (req, res) => {
  try {
    await Exam.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: null, message: 'Exam deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// 🟢 FIX 2: BRAND NEW MARKS ENTRY SYNC
router.get('/marks', auth, async (req, res) => {
  try {
    const { examTitle, subject } = req.query;
    const exam = await Exam.findOne({ name: examTitle, subject });
    if (!exam) return res.json({ success: true, data: { records: [] } });

    const results = await Result.find({ exam: exam._id });
    const records = results.map(r => ({ studentId: r.student, marksObtained: r.marksObtained }));
    res.json({ success: true, data: { records } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/marks', adminOnly, async (req, res) => {
  try {
    const { examType, examTitle, standard, subject, maxMarks, records } = req.body;

    // Find or Create the Exam to ensure the student has a parent record to view
    let exam = await Exam.findOne({ name: examTitle, subject: subject });
    if (!exam) {
      exam = await Exam.create({
        name: examTitle, type: examType || 'Formative', standard: standard,
        subject: subject, totalMarks: maxMarks || 100, date: new Date(), createdBy: req.user._id
      });
    } else {
      exam.totalMarks = maxMarks || 100;
      await exam.save();
    }

    // Upsert the results exactly where the Student Dashboard looks for them
    const ops = records.map(r => {
      let marks = Number(r.marksObtained) || 0;
      let total = Number(maxMarks) || 100;
      let pct = (marks / total) * 100;
      let grade = r.isAbsent ? 'Abs' : (pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : 'F');

      return {
        updateOne: {
          filter: { student: r.studentId, exam: exam._id },
          update: {
            $set: { student: r.studentId, exam: exam._id, marksObtained: marks, totalMarks: total, grade, enteredBy: req.user._id }
          },
          upsert: true
        }
      };
    });

    if (ops.length > 0) await Result.bulkWrite(ops);
    await ActivityLog.create({ user: req.user._id, action: 'Marks Entered', module: 'Exams', details: `Entered marks for ${examTitle} (${subject})` });

    res.json({ success: true, message: 'Marks successfully translated to Student Results!' });
  } catch (e) {
    console.error("Marks Save Error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// Results (Legacy Fallback)
router.get('/results', auth, async (req, res) => {
  try {
    const { examId, studentId } = req.query;
    const q = {};
    if (examId) q.exam = examId;
    if (studentId) q.student = studentId;
    const results = await Result.find(q).populate('student', 'name rollNo standard section').populate('exam', 'name subject totalMarks date type').sort({ createdAt: -1 });
    res.json({ success: true, data: results });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
// Performance summary
router.get('/results/performance/:studentId', auth, async (req, res) => {
  try {
    const results = await Result.find({ student: req.params.studentId })
      .populate('exam', 'name subject date type');
    const avg = results.length ? Math.round(results.reduce((sum, r) => sum + (r.marksObtained / r.totalMarks * 100), 0) / results.length) : 0;
    ok(res, { results, average: avg, total: results.length });
  } catch (e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// TIMETABLE
// ════════════════════════════════════════════════════════════════
router.get('/timetable', auth, async (req, res) => {
  try {
    const { classId } = req.query;
    const q = classId ? { classId } : {};
    const tt = await Timetable.find(q)
      .populate('classId', 'name standard section')
      .populate('periods.teacher', 'name');
    ok(res, tt);
  } catch (e) { err(res, e.message); }
});

// 🔒 AUTO-GENERATE PREVIEW
router.post('/timetable/auto-generate', adminOnly, async (req, res) => {
  try {
    const { mode, classId } = req.body; // mode: 'full', 'partial', 'incremental'
    const generator = new TimetableGenerator();
    const result = await generator.generate({ mode, classId });

    if (result.status === 'success') {
      ok(res, result.data, "Preview generated successfully. Review and Save.");
    } else {
      res.status(400).json({ success: false, ...result });
    }
  } catch (e) { err(res, e.message); }
});

// 💾 SAVE ALL (Transactional-ish)
router.post('/timetable/save-all', adminOnly, async (req, res) => {
  try {
    const { timetableData } = req.body; // Map of { classId: { Day: [periods] } }

    const operations = [];
    Object.entries(timetableData).forEach(([classId, days]) => {
      Object.entries(days).forEach(([day, periods]) => {
        operations.push(
          Timetable.findOneAndUpdate(
            { classId, day },
            { classId, day, periods },
            { upsert: true, new: true }
          )
        );
      });
    });

    await Promise.all(operations);
    ok(res, null, "Timetable saved successfully for all classes!");
  } catch (e) { err(res, e.message); }
});

// 🔄 RESTORE SNAPSHOT
router.post('/timetable/restore', adminOnly, async (req, res) => {
  try {
    const { snapshot } = req.body; // Array of Timetable objects
    if (!snapshot || !Array.isArray(snapshot)) return err(res, "Invalid snapshot data", 400);

    const operations = snapshot.map(entry =>
      Timetable.findOneAndUpdate(
        { classId: entry.classId, day: entry.day },
        { periods: entry.periods },
        { upsert: true }
      )
    );

    await Promise.all(operations);
    ok(res, null, "Timetable restored to previous state.");
  } catch (e) { err(res, e.message); }
});

router.post('/timetable', adminOnly, async (req, res) => {
  try {
    const { classId, day, periods } = req.body;
    const tt = await Timetable.findOneAndUpdate(
      { classId, day }, { classId, day, periods }, { upsert: true, new: true }
    );
    ok(res, tt, 'Timetable saved');
  } catch (e) { err(res, e.message); }
});

// Teacher timetable
router.get('/timetable/teacher/:teacherId', auth, async (req, res) => {
  try {
    const tt = await Timetable.find({ 'periods.teacher': req.params.teacherId })
      .populate('classId', 'name');
    ok(res, tt);
  } catch (e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// FEES
// ════════════════════════════════════════════════════════════════
router.get('/fees', auth, async (req, res) => {
  try {
    const { studentId, status, feeType, page = 1, limit = 20 } = req.query;
    const q = {};
    if (studentId) q.student = studentId;
    if (status) q.status = status;
    if (feeType) q.feeType = feeType;
    const [fees, total] = await Promise.all([
      Fee.find(q).populate('student', 'name rollNo standard section')
        .sort({ dueDate: -1 }).skip((page - 1) * limit).limit(+limit),
      Fee.countDocuments(q),
    ]);
    ok(res, { fees, total, pages: Math.ceil(total / limit) });
  } catch (e) { err(res, e.message); }
});

router.get('/fees/summary', auth, async (req, res) => {
  try {
    const agg = await Fee.aggregate([
      {
        $group: {
          _id: '$status',
          total: { $sum: '$amount' },
          paid: { $sum: '$paidAmount' },
          count: { $sum: 1 },
        }
      },
    ]);
    const monthly = await Fee.aggregate([
      { $match: { status: 'Paid', paidDate: { $ne: null } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$paidDate' } }, collected: { $sum: '$paidAmount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }, { $limit: 6 },
    ]);
    ok(res, { byStatus: agg, monthly });
  } catch (e) { err(res, e.message); }
});

router.post('/fees', adminOnly, async (req, res) => {
  try {
    const fee = await Fee.create({ ...req.body, collectedBy: req.user._id });
    ok(res, fee, 'Fee record created');
  } catch (e) { err(res, e.message); }
});

router.put('/fees/:id', adminOnly, async (req, res) => {
  try {
    const fee = await Fee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (req.body.status === 'Paid') {
      await ActivityLog.create({ user: req.user._id, action: 'Fee Collected', module: 'Fees', details: `Fee marked paid: ₹${fee.paidAmount}` });
    }
    ok(res, fee, 'Fee updated');
  } catch (e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// HOMEWORK
// ════════════════════════════════════════════════════════════════
router.get('/homework', auth, async (req, res) => {
  try {
    const { classId, subject, teacherId } = req.query;
    const q = {};
    if (classId) q.classId = classId;
    if (subject) q.subject = { $regex: subject, $options: 'i' };
    if (teacherId) q.assignedBy = teacherId;
    const hw = await Homework.find(q)
      .populate('classId', 'name')
      .populate('assignedBy', 'name')
      .sort({ dueDate: 1 });
    ok(res, hw);
  } catch (e) { err(res, e.message); }
});

router.post('/homework', auth, async (req, res) => {
  try {
    const hw = await Homework.create({ ...req.body, assignedBy: req.user._id });
    ok(res, hw, 'Homework assigned');
  } catch (e) { err(res, e.message); }
});

// Submit homework (student)
router.post('/homework/:id/submit', auth, async (req, res) => {
  try {
    const { studentId, fileUrl, remarks } = req.body;
    await Homework.findByIdAndUpdate(req.params.id, {
      $push: { submissions: { student: studentId, submittedAt: new Date(), fileUrl, remarks, status: 'Submitted' } },
    });
    ok(res, null, 'Homework submitted');
  } catch (e) { err(res, e.message); }
});

// Grade submission
router.put('/homework/:id/grade/:studentId', auth, async (req, res) => {
  try {
    const { grade, remarks } = req.body;
    await Homework.updateOne(
      { _id: req.params.id, 'submissions.student': req.params.studentId },
      { $set: { 'submissions.$.grade': grade, 'submissions.$.remarks': remarks, 'submissions.$.status': 'Graded' } }
    );
    ok(res, null, 'Submission graded');
  } catch (e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// LIBRARY
// ════════════════════════════════════════════════════════════════
router.get('/library/books', auth, async (req, res) => {
  try {
    const { search, category, available } = req.query;
    const q = {};
    if (search) q.$or = [{ title: { $regex: search, $options: 'i' } }, { author: { $regex: search, $options: 'i' } }];
    if (category) q.category = category;
    if (available) q.available = { $gt: 0 };
    const books = await LibraryBook.find(q).sort({ title: 1 });
    ok(res, books);
  } catch (e) { err(res, e.message); }
});

router.post('/library/books', adminOnly, async (req, res) => {
  try {
    const book = await LibraryBook.create(req.body);
    ok(res, book, 'Book added');
  } catch (e) { err(res, e.message); }
});

router.get('/library/issues', auth, async (req, res) => {
  try {
    const { status, studentId } = req.query;
    const q = {};
    if (status) q.status = status;
    if (studentId) q.student = studentId;
    const issues = await LibraryIssue.find(q)
      .populate('book', 'title author isbn')
      .populate('student', 'name rollNo')
      .sort({ issuedDate: -1 });
    ok(res, issues);
  } catch (e) { err(res, e.message); }
});

router.post('/library/issue', adminOnly, async (req, res) => {
  try {
    const { bookId, studentId, dueDate } = req.body;
    const book = await LibraryBook.findById(bookId);
    if (!book || book.available < 1) return err(res, 'Book not available', 400);
    const issue = await LibraryIssue.create({
      book: bookId, student: studentId,
      dueDate: new Date(dueDate),
      issuedBy: req.user._id,
    });
    await LibraryBook.findByIdAndUpdate(bookId, { $inc: { available: -1 } });
    ok(res, issue, 'Book issued');
  } catch (e) { err(res, e.message); }
});

router.put('/library/return/:id', adminOnly, async (req, res) => {
  try {
    const issue = await LibraryIssue.findById(req.params.id);
    if (!issue) return err(res, 'Issue not found', 404);
    const fine = issue.dueDate < new Date() ? Math.floor((new Date() - issue.dueDate) / 86400000) * 5 : 0;
    issue.returnDate = new Date();
    issue.status = 'Returned';
    issue.fine = fine;
    await issue.save();
    await LibraryBook.findByIdAndUpdate(issue.book, { $inc: { available: 1 } });
    ok(res, issue, `Book returned. Fine: ₹${fine}`);
  } catch (e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// ANNOUNCEMENTS
// ════════════════════════════════════════════════════════════════
router.get('/announcements', auth, async (req, res) => {
  try {
    const role = req.user.role;
    const q = { $or: [{ audience: 'All' }, { audience: role }] };
    const announcements = await Announcement.find(q)
      .populate('postedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(50);
    ok(res, announcements);
  } catch (e) { err(res, e.message); }
});

router.post('/announcements', auth, async (req, res) => {
  try {
    const ann = await Announcement.create({ ...req.body, postedBy: req.user._id });
    await ActivityLog.create({ user: req.user._id, action: 'Announcement Posted', module: 'Announcements', details: ann.title });
    ok(res, ann, 'Announcement posted');
  } catch (e) { err(res, e.message); }
});

router.delete('/announcements/:id', auth, async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    ok(res, null, 'Announcement deleted');
  } catch (e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// TRANSPORT
// ════════════════════════════════════════════════════════════════
router.get('/transport/routes', auth, async (req, res) => {
  try {
    const routes = await TransportRoute.find({ isActive: true }).sort({ routeNo: 1 });
    ok(res, routes);
  } catch (e) { err(res, e.message); }
});

router.post('/transport/routes', adminOnly, async (req, res) => {
  try {
    const route = await TransportRoute.create(req.body);
    ok(res, route, 'Route created');
  } catch (e) { err(res, e.message); }
});

router.put('/transport/routes/:id', adminOnly, async (req, res) => {
  try {
    const route = await TransportRoute.findByIdAndUpdate(req.params.id, req.body, { new: true });
    ok(res, route, 'Route updated');
  } catch (e) { err(res, e.message); }
});

router.get('/transport/assignments', auth, async (req, res) => {
  try {
    const assignments = await TransportAssignment.find()
      .populate('student', 'name rollNo standard section')
      .populate('route', 'routeNo name');
    ok(res, assignments);
  } catch (e) { err(res, e.message); }
});

router.post('/transport/assign', adminOnly, async (req, res) => {
  try {
    const a = await TransportAssignment.findOneAndUpdate(
      { student: req.body.studentId },
      { student: req.body.studentId, route: req.body.routeId, stop: req.body.stop, fare: req.body.fare },
      { upsert: true, new: true }
    );
    ok(res, a, 'Student assigned to route');
  } catch (e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// LEAVE MANAGEMENT
// ════════════════════════════════════════════════════════════════
router.get('/leaves', auth, async (req, res) => {
  try {
    const { status, role } = req.query;
    const q = {};
    if (status) q.status = status;
    if (role) q.role = role;
    // teachers can only see own leaves
    if (req.user.role === 'Teacher') q.applicant = req.user._id;
    const leaves = await Leave.find(q)
      .populate('applicant', 'name role')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });
    ok(res, leaves);
  } catch (e) { err(res, e.message); }
});

router.post('/leaves', auth, async (req, res) => {
  try {
    const from = new Date(req.body.from);
    const to = new Date(req.body.to);
    const days = Math.ceil((to - from) / 86400000) + 1;
    const leave = await Leave.create({ ...req.body, applicant: req.user._id, role: req.user.role, days });
    ok(res, leave, 'Leave application submitted');
  } catch (e) { err(res, e.message); }
});

router.put('/leaves/:id', auth, async (req, res) => {
  try {
    const { status, reviewNote } = req.body;
    const leave = await Leave.findByIdAndUpdate(req.params.id,
      { status, reviewNote, reviewedBy: req.user._id }, { new: true }
    );
    await ActivityLog.create({ user: req.user._id, action: `Leave ${status}`, module: 'Leave', details: `Leave for ${leave.days} days` });
    ok(res, leave, `Leave ${status}`);
  } catch (e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// PAYROLL
// ════════════════════════════════════════════════════════════════
router.get('/payroll', adminOnly, async (req, res) => {
  try {
    const { month, teacherId } = req.query;
    const q = {};
    if (month) q.month = month;
    if (teacherId) q.teacher = teacherId;
    const records = await Payroll.find(q)
      .populate('teacher', 'name teacherId department designation')
      .sort({ month: -1, createdAt: -1 });
    ok(res, records);
  } catch (e) { err(res, e.message); }
});

router.post('/payroll/generate', adminOnly, async (req, res) => {
  try {
    const { month } = req.body;
    const teachers = await Teacher.find({ isActive: true });
    const ops = teachers.map(t => ({
      updateOne: {
        filter: { teacher: t._id, month },
        update: {
          $setOnInsert: {
            teacher: t._id, month,
            basicSalary: t.salary || 40000,
            allowances: 5000, deductions: 2000,
            netSalary: (t.salary || 40000) + 5000 - 2000,
            status: 'Pending',
          }
        },
        upsert: true,
      },
    }));
    await Payroll.bulkWrite(ops);
    ok(res, null, `Payroll generated for ${month}`);
  } catch (e) { err(res, e.message); }
});

router.put('/payroll/:id/pay', adminOnly, async (req, res) => {
  try {
    const p = await Payroll.findByIdAndUpdate(req.params.id,
      { status: 'Paid', paidDate: new Date() }, { new: true }
    );
    await ActivityLog.create({ user: req.user._id, action: 'Salary Paid', module: 'Payroll', details: `Payroll ID ${p._id}` });
    ok(res, p, 'Salary marked as paid');
  } catch (e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// ACTIVITY LOGS
// ════════════════════════════════════════════════════════════════
router.get('/logs', adminOnly, async (req, res) => {
  try {
    const { module, page = 1, limit = 30 } = req.query;
    const q = module ? { module } : {};
    const [logs, total] = await Promise.all([
      ActivityLog.find(q).populate('user', 'name role')
        .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(+limit),
      ActivityLog.countDocuments(q),
    ]);
    ok(res, { logs, total, pages: Math.ceil(total / limit) });
  } catch (e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// TALENT TESTS
// ════════════════════════════════════════════════════════════════
router.get('/talent', auth, async (req, res) => {
  try {
    const { standard } = req.query;
    const q = standard ? { standard } : {};
    const tests = await TalentTest.find(q).populate('createdBy', 'name').sort({ date: 1 });
    ok(res, tests);
  } catch (e) { err(res, e.message); }
});

router.post('/talent', auth, async (req, res) => {
  try {
    const test = await TalentTest.create({ ...req.body, createdBy: req.user._id });
    ok(res, test, 'Talent test created');
  } catch (e) { err(res, e.message); }
});

router.get('/talent/:id', auth, async (req, res) => {
  try {
    // For students — send without answers
    const test = await TalentTest.findById(req.params.id).populate('createdBy', 'name');
    if (!test) return err(res, 'Test not found', 404);
    if (req.user.role === 'Student') {
      const sanitized = test.toObject();
      sanitized.questions = sanitized.questions.map(q => ({ ...q, answer: undefined }));
      return ok(res, sanitized);
    }
    ok(res, test);
  } catch (e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// REPORTS & ANALYTICS
// ════════════════════════════════════════════════════════════════
router.get('/reports/overview', auth, async (req, res) => {
  try {
    // Monthly attendance trend
    const attTrend = await Attendance.aggregate([
      {
        $group: {
          _id: { month: { $dateToString: { format: '%Y-%m', date: '$date' } }, status: '$status' },
          count: { $sum: 1 },
        }
      },
      { $sort: { '_id.month': 1 } }, { $limit: 24 },
    ]);

    // Fee collection trend
    const feeTrend = await Fee.aggregate([
      { $match: { status: 'Paid', paidDate: { $ne: null } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$paidDate' } }, total: { $sum: '$paidAmount' } } },
      { $sort: { _id: 1 } }, { $limit: 6 },
    ]);

    // Grade distribution
    const gradeDist = await Result.aggregate([
      { $group: { _id: '$grade', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Students per class
    const classStrength = await Class.aggregate([
      { $project: { name: 1, count: { $size: '$students' } } },
      { $sort: { name: 1 } },
    ]);

    ok(res, { attTrend, feeTrend, gradeDist, classStrength });
  } catch (e) { err(res, e.message); }
});


// ════════════════════════════════════════════════════════════════
// PRINCIPAL DASHBOARD API
// ════════════════════════════════════════════════════════════════
router.get('/dashboard/principal', auth, async (req, res) => {
  try {
    // 1. Security Check: Only Admin and Principal can access this
    if (req.user.role !== 'Principal' && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Management only.' });
    }

    // 2. Fetch basic counts and recent announcements simultaneously
    const [totalStudents, totalTeachers, totalClasses, recentAnnouncements] = await Promise.all([
      Student.countDocuments({ isActive: true }),
      Teacher.countDocuments({ isActive: true }),
      Class.countDocuments(),
      Announcement.find().sort({ createdAt: -1 }).limit(5) // Get latest 5 notices
    ]);

    // 3. Calculate Overall Attendance Percentage for Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const attAgg = await Attendance.aggregate([
      { $match: { date: { $gte: today } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } }
        }
      }
    ]);
    const attendancePct = attAgg[0] ? Math.round((attAgg[0].present / attAgg[0].total) * 100) : 0;

    // 4. Calculate Total Fees Collected
    const feeAgg = await Fee.aggregate([
      { $match: { status: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } },
    ]);
    const feeCollected = feeAgg[0]?.total || 0;

    // 5. Send it all back to the frontend
    ok(res, {
      totalStudents,
      totalTeachers,
      totalClasses,
      attendancePct,
      feeCollected,
      recentAnnouncements
    });

  } catch (e) {
    err(res, e.message);
  }
});
// ════════════════════════════════════════════════════════════════
// ADMIN DIRECT USER CREATION (Instant Reflection)
// ════════════════════════════════════════════════════════════════
router.post('/auth/register', adminOnly, upload.single('profilePhoto'), async (req, res) => {
  console.log("🚀 [DEBUG] Incoming Register req.body:", req.body);
  try {
    const {
      role, name, email, mobile, address, classId, standard, section,
      fatherName, motherName, gender, house, dob, parentPhone, parentEmail
    } = req.body;

    // 1. Photo Handling
    let profilePhotoUrl = "";
    const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
    if (req.file) {
      profilePhotoUrl = `${BASE_URL}/uploads/${req.file.filename}`;
    }

    // 2. Check if user already exists
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'User already exists' });

    // 3. Password Setup
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("Welcome@123", salt);

    // 4. Create Base User record (Reflective of the Login account)
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      isFirstLogin: true,
      isActive: true
    });

    // 5. Create Profile (Student or Teacher)
    let loginId = 'N/A';
    if (role === 'Student') {
      const generatedRollNo = await generateSequentialId(Student, 'S', 'rollNo');
      loginId = await generateSequentialId(CentralAuth, 'AB-STD', 'loginId');

      const newStudent = await Student.create({
        name,
        email,
        user: newUser._id,
        rollNo: req.body.rollNo || generatedRollNo,
        loginId,
        classId,
        standard,
        section,
        fatherName: fatherName || req.body.parentName,
        motherName,
        gender,
        house,
        dob,
        phone: mobile,
        address,
        parentPhone: parentPhone || mobile,
        parentEmail: parentEmail || email,
        profilePhotoUrl,
        isActive: true,
        // Ledger initialization
        academicHistory: [{
          academicYear: req.academicYear,
          classId: classId,
          standard: standard,
          section: section,
          status: 'Active'
        }]
      });

      // Link to Central Auth Directory
      await CentralAuth.create({
        loginId,
        userRef: newStudent._id,
        role: 'Student',
        password: hashedPassword,
        tenantId: 'abhyaas'
      });

      if (classId) {
        await Class.findByIdAndUpdate(classId, { $push: { students: newStudent._id } });
      }
    }
    else if (role === 'Teacher') {
      const generatedTeacherId = await generateSequentialId(Teacher, 'T', 'teacherId');
      loginId = await generateSequentialId(CentralAuth, 'AB-TEA', 'loginId');

      const newTeacher = await Teacher.create({
        name,
        email,
        user: newUser._id,
        teacherId: req.body.teacherId || generatedTeacherId,
        loginId,
        department: req.body.department,
        qualification: req.body.qualification,
        experience: req.body.experience,
        salary: req.body.salary,
        phone: mobile,
        address,
        profilePhotoUrl,
        isActive: true
      });

      // Link to Central Auth Directory
      await CentralAuth.create({
        loginId,
        userRef: newTeacher._id,
        role: 'Teacher',
        password: hashedPassword,
        tenantId: 'abhyaas'
      });
    }

    // 6. Audit Logging
    await ActivityLog.create({
      user: req.user._id,
      action: `Created ${role}`,
      module: 'Auth',
      details: `Admin created ${role}: ${name} (Login ID: ${loginId})`
    });

    res.json({ success: true, message: `${role} created! Login ID: ${loginId}` });

  } catch (e) {
    console.error("❌ Register Error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ════════════════════════════════════════════════════════════════
// 🎓 STUDENT PORTAL ROUTES
// ════════════════════════════════════════════════════════════════

// 🟢 SUPER-FINDER: Guarantees we find the Student Profile
const getStudent = async (req) => {
  const userId = req.user.id || req.user._id;

  let student = await Student.findOne({ user: userId }).populate('classId', 'name standard section');
  if (student) return student;

  student = await Student.findById(userId).populate('classId', 'name standard section');
  if (student) return student;

  const userAccount = await User.findById(userId);
  if (userAccount && userAccount.email) {
    student = await Student.findOne({ email: userAccount.email }).populate('classId', 'name standard section');
    if (student) return student;
  }
  return null;
};

// 1. GET PROFILE
router.get('/student/profile', auth, async (req, res) => {
  try {
    const student = await getStudent(req);
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });
    res.json({ success: true, data: student });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// 2. GET DASHBOARD STATS
router.get('/student/dashboard/stats', auth, async (req, res) => {
  try {
    const student = await getStudent(req);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const totalAtt = await Attendance.countDocuments({ student: student._id });
    const presentAtt = await Attendance.countDocuments({ student: student._id, status: 'Present' });
    const attendancePct = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;
    const attendanceHistory = await Attendance.find({ student: student._id }).sort({ date: -1 }).limit(15);
    const latestResult = await Result.findOne({ student: student._id }).sort({ createdAt: -1 });
    const upcomingExams = await Exam.countDocuments({ standard: student.standard, date: { $gte: new Date() } });

    let pendingHW = 0;
    if (student.classId) {
      const totalHW = await Homework.countDocuments({ classId: student.classId });
      const submittedHW = await Homework.countDocuments({ classId: student.classId, 'submissions.student': student._id });
      pendingHW = Math.max(0, totalHW - submittedHW);
    }

    // 🟢 BULLETPROOF FEE CALCULATION (Checks both old and new fee systems)
    let feeDue = 0;

    // Check old Fee model
    try {
      const oldFees = await Fee.find({ student: student._id, status: { $in: ['Pending', 'Overdue', 'Partial'] } });
      feeDue += oldFees.reduce((sum, f) => sum + ((Number(f.amount) || 0) - (Number(f.paidAmount) || 0)), 0);
    } catch (e) { }

    // Check new FeeStructure & FeePayment model
    try {
      const FeeStructure = mongoose.model('FeeStructure');
      const FeePayment = mongoose.model('FeePayment');
      const structures = await FeeStructure.find({ standard: student.standard });
      const payments = await FeePayment.find({ studentId: student._id });

      structures.forEach(s => {
        const paid = payments
          .filter(p => p.feeStructureId.toString() === s._id.toString())
          .reduce((sum, p) => sum + p.amountPaid + (p.discount || 0), 0);
        if (s.amount - paid > 0) feeDue += (s.amount - paid);
      });
    } catch (e) { }

    res.json({
      success: true,
      data: { totalDays: totalAtt, presentDays: presentAtt, attendancePct, attendanceHistory, latestResult: latestResult ? latestResult.grade : 'N/A', upcomingExams, pendingHW, feeDue }
    });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.get('/student/dashboard/activity', auth, async (req, res) => {
  try {
    const student = await getStudent(req);
    if (!student) return res.json({ success: true, data: [] });

    const notices = await Announcement.find({ audience: { $in: ['All', 'Student'] } }).sort({ createdAt: -1 }).limit(3);
    const results = await Result.find({ student: student._id }).populate('exam', 'name').sort({ createdAt: -1 }).limit(2);

    const activities = [
      ...notices.map(n => ({ type: 'notice', text: `New Notice: ${n.title}`, time: new Date(n.createdAt).toLocaleDateString() })),
      ...results.map(r => ({ type: 'exam', text: `Result Published: ${r.exam?.name} (${r.grade})`, time: new Date(r.createdAt).toLocaleDateString() }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

    res.json({ success: true, data: activities });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});
// 4. GET MY FEES
router.get('/student/my-fees', auth, async (req, res) => {
  try {
    const student = await getStudent(req);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    let feesList = [];

    // 🟢 BULLETPROOF FETCH 1: New FeeStructure System
    try {
      const FeeStructure = mongoose.model('FeeStructure');
      const FeePayment = mongoose.model('FeePayment');
      const structures = await FeeStructure.find({ standard: student.standard }).sort({ dueDate: -1 });
      const payments = await FeePayment.find({ studentId: student._id });

      if (structures.length > 0) {
        const newSystemFees = structures.map(s => {
          const paid = payments
            .filter(p => p.feeStructureId.toString() === s._id.toString())
            .reduce((sum, p) => sum + p.amountPaid + (p.discount || 0), 0);

          const balance = s.amount - paid;
          let status = 'Pending';
          if (balance <= 0) status = 'Paid';
          else if (paid > 0) status = 'Partial';
          else if (new Date(s.dueDate) < new Date()) status = 'Overdue';

          return {
            _id: s._id,
            feeType: s.title || s.feeType || 'Class Fee',
            amount: s.amount,
            dueDate: s.dueDate,
            paidAmount: paid,
            balance: balance,
            status: status
          };
        });
        feesList = [...feesList, ...newSystemFees];
      }
    } catch (e) { console.log("FeeStructure check skipped"); }

    // 🟢 BULLETPROOF FETCH 2: Old Manual Fee System
    try {
      const oldFees = await Fee.find({ student: student._id }).sort({ dueDate: -1 });
      if (oldFees.length > 0) {
        const manualFees = oldFees.map(f => {
          const amount = Number(f.amount) || 0;
          const paid = Number(f.paidAmount) || 0;
          return {
            _id: f._id,
            feeType: f.feeType || 'Manual Fee',
            amount: amount,
            dueDate: f.dueDate,
            paidAmount: paid,
            balance: amount - paid,
            status: f.status
          };
        });
        feesList = [...feesList, ...manualFees];
      }
    } catch (e) { console.log("Old Fee check skipped"); }

    res.json({ success: true, data: feesList });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});
// 3. GET RECENT ACTIVITY



// 5. GET MY RESULTS
router.get('/student/my-results', auth, async (req, res) => {
  try {
    const student = await getStudent(req);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    const results = await Result.find({ student: student._id }).populate('exam', 'name subject totalMarks').sort({ createdAt: -1 });
    res.json({ success: true, data: results });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// Make sure this is still at the very bottom!
// export default router;
router.get('/students', async (req, res) => {
  // 1. Get the year from the frontend (or default to current year)
  const targetYear = req.query.year || '2025-2026';

  // 2. Ask MongoDB: "Find students who have '2025-2026' inside their academicHistory array"
  const students = await Student.find({
    'academicHistory.academicYear': targetYear
  });

  res.json({ success: true, data: students });
});
export default router;