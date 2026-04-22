// backend/routes/teacher.js
import express from 'express';
import auth from '../middleware/authMiddleware.js';

// Import your models
import { Teacher, Class, Attendance, Leave, Timetable } from '../models/index.js';

const router = express.Router();

// Middleware: Only Teachers (or Admins checking the view) can access
export const teacherOnly = [auth, (req, res, next) => {
  if (req.user && (req.user.role === 'Teacher' || req.user.role === 'Admin')) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied. Teachers only.' });
  }
}];

router.use(teacherOnly);

// GET /api/teacher/dashboard/stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    const teacherId = req.user._id;

    // Fetch data relevant to THIS specific teacher
    const [myClasses, pendingLeaves, myTimetable] = await Promise.all([
      Class.countDocuments({ classTeacher: teacherId }),
      Leave.countDocuments({ applicant: teacherId, status: 'Pending' }),
      Timetable.find({ "periods.teacher": teacherId })
    ]);

    // Calculate how many classes the teacher has TODAY
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayStr = days[new Date().getDay()];
    
    let todaysClassesCount = 0;
    const todaySchedule = myTimetable.find(t => t.day === todayStr);
    if (todaySchedule) {
      todaysClassesCount = todaySchedule.periods.filter(p => p.teacher?.toString() === teacherId.toString()).length;
    }

    res.json({
      success: true,
      data: {
        totalClasses: myClasses || 3, // Fallback to 3 if no DB relation is set up yet
        todaysClasses: todaysClassesCount || 4,
        pendingEvals: 18, // Replace with your Homework model count later
        attendanceDone: 3, 
        pendingLeaves: pendingLeaves || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/teacher/dashboard/activity
router.get('/dashboard/activity', async (req, res) => {
  try {
    const activities = [
      { text: "Uploaded Homework for Class 10A Science", time: "2h ago", type: "homework" },
      { text: "Marked attendance for Class 9B", time: "4h ago", type: "attendance" },
      { text: "Leave request approved by Principal", time: "1d ago", type: "leave" },
      { text: "New Announcement: Annual Sports Day", time: "2d ago", type: "notice" }
    ];
    res.json({ success: true, data: activities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;