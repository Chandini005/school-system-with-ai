// backend/routes/student.js
import express from 'express';
import mongoose from 'mongoose';
import fs from 'fs';
import auth from '../middleware/authMiddleware.js';

// Import your models
import { Student, Attendance, Result, Exam, Fee, Mark } from '../models/index.js';

const router = express.Router();

// Middleware: Only Students (or Admins checking the view) can access
export const studentOnly = [auth, (req, res, next) => {
  if (req.user && (req.user.role === 'Student' || req.user.role === 'Admin')) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied. Students only.' });
  }
}];

router.use(studentOnly);

// GET /api/student/dashboard/stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    const studentId = req.user._id;

    // Fetch data relevant to THIS specific student
    const [myAttendance, myResults, myFees, upcomingExamsCount] = await Promise.all([
      Attendance.find({ student: studentId }).sort({ date: -1 }),
      Result.find({ student: studentId }).sort({ createdAt: -1 }).limit(1), // Get latest result
      Fee.find({ student: studentId, status: { $ne: 'Paid' } }), // Get unpaid fees
      Exam.countDocuments({ date: { $gte: new Date() } }) // Upcoming exams (can filter by classId if needed)
    ]);

    // Calculate attendance %
    const totalDays = myAttendance.length;
    const presentDays = myAttendance.filter(a => a.status === 'Present').length;
    const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    // Calculate pending fees
    const totalFeeDue = myFees.reduce((sum, fee) => sum + (fee.amount - (fee.paidAmount || 0)), 0);

    // Latest Result Grade
    const latestGrade = myResults.length > 0 ? myResults[0].grade : "—";

    res.json({
      success: true,
      data: {
        attendancePct: attendancePct, 
        totalDays: totalDays,
        presentDays: presentDays,
        latestResult: latestGrade,
        upcomingExams: upcomingExamsCount || 0,
        pendingHW: 0, 
        feeDue: totalFeeDue,
        attendanceHistory: myAttendance
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/student/dashboard/activity
router.get('/dashboard/activity', async (req, res) => {
  try {
    const activities = [
      { text: "Mathematics Chapter 4 Homework assigned", time: "2h ago", type: "homework" },
      { text: "Science Mid-Term results published", time: "1d ago", type: "exam" },
      { text: "Library book 'Physics Basics' is due tomorrow", time: "1d ago", type: "library" },
      { text: "School will remain closed on Friday for festival", time: "2d ago", type: "notice" }
    ];
    res.json({ success: true, data: activities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/student/my-fees - Full payment history
router.get('/my-fees', async (req, res) => {
  try {
    const studentId = req.user._id;
    const history = await Fee.find({ student: studentId }).sort({ dueDate: -1 });
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/student/my-marks - Securely fetch exam marks for the student
router.get('/my-marks', async (req, res) => {
  try {
    const studentId = req.user._id;
    // Current academic year is handled by the global middleware (academicYearInterceptor)
    const currentYear = req.academicYear || '2025-2026';

    const marks = await Mark.find({
      $or: [
        { 'records.studentId': new mongoose.Types.ObjectId(studentId) },
        { 'records.studentId': studentId.toString() }
      ],
      academicYear: currentYear
    });

    // Map the collective mark sheets into individual student results
    const results = marks.map(m => {
      const studentRecord = m.records.find(r => r.studentId?.toString() === studentId.toString());
      if (!studentRecord) return null; // Safety check
      
      const obtained = studentRecord.marksObtained || 0;
      const pct = m.maxMarks > 0 ? Math.round((obtained / m.maxMarks) * 100) : 0;
      
      return {
        _id: m._id,
        examTitle: m.examTitle,
        examType: m.examType,
        subject: m.subject,
        maxMarks: m.maxMarks,
        marksObtained: obtained,
        isAbsent: studentRecord.isAbsent || false,
        percentage: pct,
        grade: pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F'
      };
    }).filter(r => r !== null);

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;