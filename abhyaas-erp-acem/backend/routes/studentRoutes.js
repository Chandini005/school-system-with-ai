
// export default router;

import express from 'express';
import { Student, Attendance, Fee, Exam, Result, Homework, Announcement, User } from '../models/index.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// 🟢 SUPER-FINDER: This guarantees we find the Student Profile using the Login Token
const getStudent = async (req) => {
  const userId = req.user.id || req.user._id;
  
  // 1. Try finding by the direct 'user' reference (Standard)
  let student = await Student.findOne({ user: userId }).populate('classId', 'name standard section');
  if (student) return student;

  // 2. Try finding assuming the token ID IS the student ID (Legacy)
  student = await Student.findById(userId).populate('classId', 'name standard section');
  if (student) return student;

  // 3. Ultimate Fallback: Look up their email, and find the student by email
  const userAccount = await User.findById(userId);
  if (userAccount && userAccount.email) {
    student = await Student.findOne({ email: userAccount.email }).populate('classId', 'name standard section');
    if (student) return student;
  }
  
  return null;
};

// 1. GET STUDENT PROFILE
router.get('/profile', auth, async (req, res) => {
  try {
    const student = await getStudent(req);
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found. Contact Admin.' });
    
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. GET STUDENT DASHBOARD STATS
router.get('/dashboard/stats', auth, async (req, res) => {
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

    const fees = await Fee.find({ student: student._id, status: { $in: ['Pending', 'Overdue', 'Partial'] } });
    const feeDue = fees.reduce((sum, f) => sum + ((Number(f.amount) || 0) - (Number(f.paidAmount) || 0)), 0);

    res.json({
      success: true,
      data: {
        totalDays: totalAtt,
        presentDays: presentAtt,
        attendancePct,
        attendanceHistory,
        latestResult: latestResult ? latestResult.grade : 'N/A',
        upcomingExams,
        pendingHW,
        feeDue
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. GET RECENT ACTIVITY
router.get('/dashboard/activity', auth, async (req, res) => {
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
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🟢 4. DEDICATED ROUTE: GET MY FEES
router.get('/my-fees', auth, async (req, res) => {
  try {
    const student = await getStudent(req);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    
    // Securely fetches fees using the verified Student Profile ID
    const fees = await Fee.find({ student: student._id }).sort({ dueDate: -1 });
    res.json({ success: true, data: fees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🟢 5. DEDICATED ROUTE: GET MY RESULTS
router.get('/my-results', auth, async (req, res) => {
  try {
    const student = await getStudent(req);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    
    // Securely fetches results using the verified Student Profile ID
    const results = await Result.find({ student: student._id }).populate('exam', 'name subject totalMarks').sort({ createdAt: -1 });
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;