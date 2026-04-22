// backend/routes/principal.js
// All API endpoints accessible by the Principal role
// Mount at: app.use('/api/principal', principalRoutes)

import express from 'express';
import auth from '../middleware/authMiddleware.js';

// Import all your existing models using ES syntax
import {
  Student, Teacher, Class, Attendance, Exam, Result,
  Fee, Announcement, Leave, Timetable, TalentTest, ActivityLog, User
} from '../models/index.js';

const router = express.Router();

// ── helpers ──────────────────────────────────────────────────────
const ok  = (res, data, msg='Success') => res.json({ success: true, message: msg, data });
const err = (res, msg='Server error', code=500) => res.status(code).json({ success: false, message: msg });

// Middleware: Only Principal (or Admin) can access these routes
export const principalOnly = [auth, (req, res, next) => {
  if (req.user && (req.user.role === 'Principal' || req.user.role === 'Admin')) {
    next();
  } else {
    err(res, 'Access denied. Principal or Admin only.', 403);
  }
}];

// Apply the principalOnly middleware to all routes in this file
router.use(principalOnly);

// ════════════════════════════════════════════════════════════════
// 1. DASHBOARD OVERVIEW STATS
// ════════════════════════════════════════════════════════════════

router.get('/dashboard/stats', async (req, res) => {
  try {
    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      pendingLeaves,
      feeData,
      todayAttendance,
      upcomingExams,
    ] = await Promise.all([
      Student.countDocuments({ isActive: true }),
      Teacher.countDocuments({ isActive: true }),
      Class.countDocuments(),
      Leave.countDocuments({ status: 'Pending' }),
      Fee.aggregate([
        { $group: {
          _id: '$status',
          total: { $sum: '$amount' },
          paid: { $sum: { $cond: [{ $eq: ['$status','Paid'] }, '$paidAmount', 0] } },
          count: { $sum: 1 },
        }},
      ]),
      // Today's overall attendance %
      (async () => {
        const today = new Date(); today.setHours(0,0,0,0);
        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
        const [present, total] = await Promise.all([
          Attendance.countDocuments({ date: { $gte: today, $lt: tomorrow }, status: 'Present' }),
          Attendance.countDocuments({ date: { $gte: today, $lt: tomorrow } }),
        ]);
        return total > 0 ? Math.round((present/total)*100) : null;
      })(),
      Exam.countDocuments({ date: { $gte: new Date() } }),
    ]);

    const feeByStatus = feeData.reduce((acc, f) => ({ ...acc, [f._id]: f }), {});
    const totalFeeCollected = feeData.reduce((s,f) => s + (f._id === 'Paid' ? f.total : 0), 0);

    ok(res, {
      totalStudents,
      totalTeachers,
      totalClasses,
      pendingLeaves,
      todayAttendancePct: todayAttendance,
      upcomingExams,
      feeCollected: totalFeeCollected,
      feeByStatus,
    });
  } catch(e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// 2. STUDENTS (view only)
// ════════════════════════════════════════════════════════════════

router.get('/students', async (req, res) => {
  try {
    const { search, standard, section, house, page=1, limit=20 } = req.query;
    const filter = { isActive: true };
    if (search)   filter.name = { $regex: search, $options: 'i' };
    if (standard) filter.standard = standard;
    if (section)  filter.section = section;
    if (house)    filter.house = house;

    const [students, total] = await Promise.all([
      Student.find(filter)
        .populate('classId', 'name')
        .sort({ standard: 1, section: 1, rollNo: 1 })
        .skip((page-1)*limit).limit(+limit),
      Student.countDocuments(filter),
    ]);
    ok(res, { students, total, page: +page, pages: Math.ceil(total/limit) });
  } catch(e) { err(res, e.message); }
});

router.get('/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('classId');
    if (!student) return err(res, 'Student not found', 404);
    ok(res, student);
  } catch(e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// 3. TEACHERS (view only)
// ════════════════════════════════════════════════════════════════

router.get('/teachers', async (req, res) => {
  try {
    const { search, department, designation, page=1, limit=20 } = req.query;
    const filter = { isActive: true };
    if (search)      filter.name = { $regex: search, $options: 'i' };
    if (department)  filter.department = department;
    if (designation) filter.designation = designation;

    const [teachers, total] = await Promise.all([
      Teacher.find(filter)
        .populate('classes', 'name')
        .sort({ name: 1 })
        .skip((page-1)*limit).limit(+limit),
      Teacher.countDocuments(filter),
    ]);
    ok(res, { teachers, total });
  } catch(e) { err(res, e.message); }
});

router.get('/teachers/:id', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate('classes');
    if (!teacher) return err(res, 'Teacher not found', 404);
    ok(res, teacher);
  } catch(e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// 4. ATTENDANCE REPORTS
// ════════════════════════════════════════════════════════════════

router.get('/attendance', async (req, res) => {
  try {
    const { classId, from, to } = req.query;
    const filter = {};
    if (classId) filter.classId = classId;
    if (from || to) filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to)   filter.date.$lte = new Date(to);

    const records = await Attendance.find(filter)
      .populate('student', 'name rollNo standard section')
      .populate('classId', 'name')
      .sort({ date: -1 })
      .limit(500);

    ok(res, records);
  } catch(e) { err(res, e.message); }
});

router.get('/attendance/summary', async (req, res) => {
  try {
    const { months = 3 } = req.query;
    const from = new Date();
    from.setMonth(from.getMonth() - months);

    const summary = await Attendance.aggregate([
      { $match: { date: { $gte: from } } },
      { $group: {
        _id: {
          month: { $dateToString: { format: '%Y-%m', date: '$date' } },
          status: '$status',
        },
        count: { $sum: 1 },
      }},
      { $group: {
        _id: '$_id.month',
        statuses: { $push: { status: '$_id.status', count: '$count' } },
        total: { $sum: '$count' },
      }},
      { $sort: { _id: 1 } },
    ]);

    const formatted = summary.map(m => {
      const present = m.statuses.find(s => s.status === 'Present')?.count || 0;
      return {
        month: m._id,
        present,
        total: m.total,
        pct: m.total > 0 ? Math.round((present/m.total)*100) : 0,
        statuses: m.statuses,
      };
    });

    ok(res, formatted);
  } catch(e) { err(res, e.message); }
});

router.get('/attendance/class-wise', async (req, res) => {
  try {
    const classes = await Class.find().lean();
    const today = new Date(); today.setHours(0,0,0,0);
    const monthAgo = new Date(today); monthAgo.setDate(monthAgo.getDate()-30);

    const data = await Promise.all(classes.map(async cls => {
      const [present, total] = await Promise.all([
        Attendance.countDocuments({ classId: cls._id, date: { $gte: monthAgo }, status: 'Present' }),
        Attendance.countDocuments({ classId: cls._id, date: { $gte: monthAgo } }),
      ]);
      return {
        classId: cls._id,
        className: cls.name,
        standard: cls.standard,
        section: cls.section,
        studentCount: cls.students?.length || 0,
        present, total,
        pct: total > 0 ? Math.round((present/total)*100) : 0,
      };
    }));

    ok(res, data.sort((a,b) => b.pct - a.pct));
  } catch(e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// 5. ACADEMIC PERFORMANCE
// ════════════════════════════════════════════════════════════════

router.get('/performance/overview', async (req, res) => {
  try {
    const [gradeDist, topStudents, classPerformance] = await Promise.all([
      Result.aggregate([
        { $group: { _id: '$grade', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Result.aggregate([
        { $group: {
          _id: '$student',
          avgScore: { $avg: { $multiply: [{ $divide: ['$marksObtained','$totalMarks'] }, 100] } },
          examsCount: { $sum: 1 },
        }},
        { $sort: { avgScore: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'students', localField: '_id', foreignField: '_id', as: 'student' } },
        { $unwind: '$student' },
        { $project: {
          name: '$student.name',
          rollNo: '$student.rollNo',
          standard: '$student.standard',
          section: '$student.section',
          avgScore: { $round: ['$avgScore', 1] },
          examsCount: 1,
        }},
      ]),
      Result.aggregate([
        { $lookup: { from: 'students', localField: 'student', foreignField: '_id', as: 's' } },
        { $unwind: '$s' },
        { $group: {
          _id: '$s.standard',
          avgScore: { $avg: { $multiply: [{ $divide: ['$marksObtained','$totalMarks'] }, 100] } },
          count: { $sum: 1 },
        }},
        { $sort: { _id: 1 } },
      ]),
    ]);

    ok(res, { gradeDist, topStudents, classPerformance });
  } catch(e) { err(res, e.message); }
});

router.get('/performance/results', async (req, res) => {
  try {
    const { examId, standard } = req.query;
    const filter = {};
    if (examId) filter.exam = examId;

    let results = await Result.find(filter)
      .populate('student', 'name rollNo standard section house')
      .populate('exam', 'name type subject date totalMarks')
      .sort({ marksObtained: -1 });

    if (standard) results = results.filter(r => r.student?.standard === standard);

    ok(res, results);
  } catch(e) { err(res, e.message); }
});

router.get('/performance/subject-wise', async (req, res) => {
  try {
    const data = await Result.aggregate([
      { $lookup: { from: 'exams', localField: 'exam', foreignField: '_id', as: 'exam' } },
      { $unwind: '$exam' },
      { $group: {
        _id: '$exam.subject',
        avgScore: { $avg: { $multiply: [{ $divide: ['$marksObtained','$totalMarks'] }, 100] } },
        passCount: { $sum: { $cond: [{ $gte: ['$marksObtained', { $multiply: ['$totalMarks', 0.35] }] }, 1, 0] } },
        totalCount: { $sum: 1 },
      }},
      { $project: {
        subject: '$_id',
        avgScore: { $round: ['$avgScore', 1] },
        passRate: { $round: [{ $multiply: [{ $divide: ['$passCount','$totalCount'] }, 100] }, 1] },
        totalCount: 1,
      }},
      { $sort: { avgScore: -1 } },
    ]);
    ok(res, data);
  } catch(e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// 6. EXAM RESULTS (view)
// ════════════════════════════════════════════════════════════════

router.get('/exams', async (req, res) => {
  try {
    const { standard, type, upcoming } = req.query;
    const filter = {};
    if (standard) filter.standard = standard;
    if (type)     filter.type = type;
    if (upcoming) filter.date = { $gte: new Date() };

    const exams = await Exam.find(filter)
      .populate('createdBy', 'name')
      .sort({ date: -1 });
    ok(res, exams);
  } catch(e) { err(res, e.message); }
});

router.get('/exams/:id/results', async (req, res) => {
  try {
    const results = await Result.find({ exam: req.params.id })
      .populate('student', 'name rollNo standard section house profilePhotoUrl')
      .sort({ marksObtained: -1 });

    const exam = await Exam.findById(req.params.id);
    const stats = {
      total: results.length,
      pass: results.filter(r => r.marksObtained >= exam?.totalMarks * 0.35).length,
      highest: results[0]?.marksObtained || 0,
      avg: results.length
        ? Math.round(results.reduce((s,r) => s+r.marksObtained, 0) / results.length)
        : 0,
    };

    ok(res, { exam, results, stats });
  } catch(e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// 7. FEE REPORTS
// ════════════════════════════════════════════════════════════════

router.get('/fees/report', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const [fees, summary, monthlyTrend] = await Promise.all([
      Fee.find(filter)
        .populate('student', 'name rollNo standard section')
        .sort({ dueDate: 1 })
        .limit(100),
      Fee.aggregate([
        { $group: {
          _id: '$status',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          paid: { $sum: { $cond: [{ $eq: ['$status','Paid'] }, '$paidAmount', 0] } },
        }},
      ]),
      Fee.aggregate([
        { $match: { status: 'Paid', paidDate: { $ne: null } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$paidDate' } },
          collected: { $sum: '$paidAmount' },
          count: { $sum: 1 },
        }},
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]),
    ]);

    ok(res, { fees, summary, monthlyTrend });
  } catch(e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// 8. TIMETABLE (view)
// ════════════════════════════════════════════════════════════════

router.get('/timetable', async (req, res) => {
  try {
    const { classId } = req.query;
    if (!classId) return err(res, 'classId required', 400);

    const tt = await Timetable.find({ classId })
      .populate({ path: 'periods.teacher', select: 'name teacherId' });
    const cls = await Class.findById(classId).populate('classTeacher', 'name');

    ok(res, { timetable: tt, class: cls });
  } catch(e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// 9. ANNOUNCEMENTS (post + view)
// ════════════════════════════════════════════════════════════════

router.get('/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('postedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(50);
    ok(res, announcements);
  } catch(e) { err(res, e.message); }
});

router.post('/announcements', async (req, res) => {
  try {
    const { title, content, audience = ['All'], priority = 'Normal', expiresAt } = req.body;
    if (!title || !content)
      return err(res, 'Title and content required', 400);

    const ann = await Announcement.create({
      title, content, audience, priority, expiresAt,
      postedBy: req.user._id, // Use _id for MongoDB references!
    });
    await ann.populate('postedBy', 'name role');

    ActivityLog.create({ user: req.user._id, action: 'Posted Announcement', module: 'Announcements', details: title }).catch(()=>{});

    ok(res, ann);
  } catch(e) { err(res, e.message); }
});

router.delete('/announcements/:id', async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    ok(res, null, 'Announcement deleted');
  } catch(e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// 10. TALENT TESTS (view + create)
// ════════════════════════════════════════════════════════════════

router.get('/talent', async (req, res) => {
  try {
    const { standard } = req.query;
    const filter = {};
    if (standard) filter.standard = standard;
    const tests = await TalentTest.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    ok(res, tests);
  } catch(e) { err(res, e.message); }
});

router.post('/talent', async (req, res) => {
  try {
    const { title, standard, subject, questions, duration, date } = req.body;
    if (!title) return err(res, 'Title required', 400);

    const test = await TalentTest.create({
      title, standard, subject, questions, duration, date,
      createdBy: req.user._id,
    });
    ok(res, test);
  } catch(e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// 11. REPORTS & ANALYTICS
// ════════════════════════════════════════════════════════════════

router.get('/reports/overview', async (req, res) => {
  try {
    const [
      classStrength,
      gradeDist,
      feeTrend,
      attendanceTrend,
      subjectPerformance,
    ] = await Promise.all([
      Class.aggregate([
        { $project: { name: 1, standard: 1, section: 1, count: { $size: { $ifNull: ['$students', []] } } } },
        { $sort: { standard: 1, section: 1 } },
      ]),
      Result.aggregate([
        { $group: { _id: '$grade', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Fee.aggregate([
        { $match: { status: 'Paid' } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$paidDate' } },
          collected: { $sum: '$paidAmount' },
        }},
        { $sort: { _id: 1 } },
        { $limit: 6 },
      ]),
      Attendance.aggregate([
        {
          $match: {
            date: { $gte: new Date(new Date().setMonth(new Date().getMonth()-6)) }
          }
        },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          present: { $sum: { $cond: [{ $eq: ['$status','Present'] }, 1, 0] } },
          total: { $sum: 1 },
        }},
        { $project: {
          month: '$_id',
          pct: { $round: [{ $multiply: [{ $divide: ['$present','$total'] }, 100] }, 1] },
        }},
        { $sort: { _id: 1 } },
      ]),
      Result.aggregate([
        { $lookup: { from: 'exams', localField: 'exam', foreignField: '_id', as: 'exam' } },
        { $unwind: '$exam' },
        { $group: {
          _id: '$exam.subject',
          avg: { $avg: { $multiply: [{ $divide: ['$marksObtained','$totalMarks'] }, 100] } },
          count: { $sum: 1 },
        }},
        { $project: { subject: '$_id', avg: { $round: ['$avg',1] }, count: 1 } },
        { $sort: { avg: -1 } },
        { $limit: 10 },
      ]),
    ]);

    ok(res, { classStrength, gradeDist, feeTrend, attendanceTrend, subjectPerformance });
  } catch(e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// CLASSES
// ════════════════════════════════════════════════════════════════

router.get('/classes', async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('classTeacher', 'name teacherId')
      .populate('students', 'name rollNo')
      .sort({ standard: 1, section: 1 });
    ok(res, classes);
  } catch(e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// LEAVES (view + approve/reject)
// ════════════════════════════════════════════════════════════════

router.get('/leaves', async (req, res) => {
  try {
    const { status, role: leaveRole } = req.query;
    const filter = {};
    if (status)    filter.status = status;
    if (leaveRole) filter.role = leaveRole;

    const leaves = await Leave.find(filter)
      .populate('applicant', 'name email role profilePhotoUrl')
      .sort({ createdAt: -1 });
    ok(res, leaves);
  } catch(e) { err(res, e.message); }
});

router.put('/leaves/:id', async (req, res) => {
  try {
    const { status, reviewNote } = req.body;
    if (!['Approved','Rejected'].includes(status))
      return err(res, 'Invalid status', 400);

    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status, reviewNote, reviewedBy: req.user._id },
      { new: true }
    ).populate('applicant', 'name');

    ActivityLog.create({
      user: req.user._id,
      action: `Leave ${status}`,
      module: 'Leave',
      details: `${leave?.applicant?.name}'s leave ${status.toLowerCase()}`,
    }).catch(()=>{});

    ok(res, leave);
  } catch(e) { err(res, e.message); }
});

export default router;