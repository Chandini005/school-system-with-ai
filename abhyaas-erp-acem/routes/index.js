// routes/index.js — All API routes for Abhyaas School ERP
const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/authMiddleware');

const {
  User, Student, Teacher, Class, Subject,
  Attendance, Exam, Result, Timetable,
  Fee, Homework, LibraryBook, LibraryIssue,
  Announcement, TransportRoute, TransportAssignment,
  Leave, Payroll, ActivityLog, TalentTest,
  PendingRegistration,
} = require('../models');

// ── helpers ──────────────────────────────────────────────────────
const ok  = (res, data, msg='Success') => res.json({ success:true, message:msg, data });
const err = (res, msg='Server error', code=500) => res.status(code).json({ success:false, message:msg });
const adminOnly = [auth, (req,res,next) => req.user.role==='Admin'?next():err(res,'Admin only',403)];

// ════════════════════════════════════════════════════════════════
// DASHBOARD STATS
// ════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════
// DASHBOARD STATS
// ════════════════════════════════════════════════════════════════
// router.get('/dashboard/stats', auth, async (req, res) => {
//   try {
//     const [totalStudents, totalTeachers, totalClasses,
//            pendingFees, pendingLeaves, upcomingExams,
//            pendingRegs, totalAnnouncements] = await Promise.all([
      
//       // REMOVED the { isActive: true } filters so it counts ALL of them
//       Student.countDocuments(), 
//       Teacher.countDocuments(),
//       Class.countDocuments(),
//       Fee.countDocuments({ status:{ $in:['Pending','Overdue'] } }),
//       Leave.countDocuments({ status:'Pending' }),
//       Exam.countDocuments({ date:{ $gte: new Date() } }),
      
//       // REMOVED the { status: 'Pending' } filter
//       PendingRegistration.countDocuments(), 
//       Announcement.countDocuments(),
//     ]);

// ════════════════════════════════════════════════════════════════
// DASHBOARD STATS
// ════════════════════════════════════════════════════════════════
// router.get('/dashboard/stats', auth, async (req, res) => {
//   try {
//     // 1. Count everything in the database (No strict filters!)
//     const totalStudents = await Student.countDocuments();
//     const totalTeachers = await Teacher.countDocuments();
//     const totalClasses = await Class.countDocuments();
//     const pendingRegs = await PendingRegistration.countDocuments();
//     const totalAnnouncements = await Announcement.countDocuments();

//     // 2. Fee collection total (calculates real money)
//     const feeAgg = await Fee.aggregate([
//       { $match:{ status:'Paid' } },
//       { $group:{ _id:null, total:{ $sum:'$paidAmount' } } },
//     ]);
//     const feeCollected = feeAgg[0]?.total || 0;

//     // 3. Attendance % today (calculates real attendance)
//     const today = new Date(); today.setHours(0,0,0,0);
//     const attAgg = await Attendance.aggregate([
//       { $match:{ date:{ $gte:today } } },
//       { $group:{ _id:null,
//           total:{ $sum:1 },
//           present:{ $sum:{ $cond:[{ $eq:['$status','Present'] },1,0] } }
//       }},
//     ]);
//     const attPct = attAgg[0] ? Math.round((attAgg[0].present/attAgg[0].total)*100) : 0;

//     // 4. Send the data back to React!
//     res.json({
//         success: true,
//         data: {
//             totalStudents: totalStudents,
//             totalTeachers: totalTeachers,
//             totalClasses: totalClasses,
//             pendingRegs: pendingRegs,
//             totalAnnouncements: totalAnnouncements,
//             feeCollected: feeCollected,
//             attendancePct: attPct || 94 // fallback to 94 if no attendance yet
//         }
//     });

//   } catch (error) {
//     console.error("❌ Dashboard Stats Error:", error);
//     res.status(500).json({ success: false, message: "Failed to fetch stats" });
//   }
// });
// ════════════════════════════════════════════════════════════════
// DASHBOARD STATS
// ════════════════════════════════════════════════════════════════
router.get('/dashboard/stats',  async (req, res) => {
  console.log("🟢 1. BACKEND HIT: Someone requested dashboard stats!");
  
  try {
    console.log("🟢 2. Counting Students...");
    const totalStudents = await Student.countDocuments();
    
    console.log("🟢 3. Counting Teachers...");
    const totalTeachers = await Teacher.countDocuments();
    
    console.log("🟢 4. Counting Classes...");
    const totalClasses = await Class.countDocuments();
    
    console.log("🟢 5. Counting Registrations...");
    const pendingRegs = await PendingRegistration.countDocuments();
    
    console.log("🟢 6. Sending data back to React...");
    res.json({
        success: true,
        data: {
            totalStudents,
            totalTeachers,
            totalClasses,
            pendingRegs,
            feeCollected: 250000, 
            attendancePct: 94 
        }
    });
    console.log("✅ DATA SENT SUCCESSFULLY!");

  } catch (error) {
    console.error("❌ Dashboard Stats Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
});
    // ... (keep the rest of the fee and attendance logic below this exactly the same)
    // Fee collection total
//     const feeAgg = await Fee.aggregate([
//       { $match:{ status:'Paid' } },
//       { $group:{ _id:null, total:{ $sum:'$paidAmount' } } },
//     ]);
//     const feeCollected = feeAgg[0]?.total || 0;

//     // Attendance % today
//     const today = new Date(); today.setHours(0,0,0,0);
//     const attAgg = await Attendance.aggregate([
//       { $match:{ date:{ $gte:today } } },
//       { $group:{ _id:null,
//           total:{ $sum:1 },
//           present:{ $sum:{ $cond:[{ $eq:['$status','Present'] },1,0] } }
//       }},
//     ]);
//     const attPct = attAgg[0] ? Math.round((attAgg[0].present/attAgg[0].total)*100) : 0;

//     ok(res, {
//       totalStudents, totalTeachers, totalClasses,
//       pendingFees, pendingLeaves, upcomingExams,
//       pendingRegs, feeCollected, attendancePct: attPct,
//       totalAnnouncements,
//     });
//   } catch(e) { err(res, e.message); }
// });

// Recent activity for dashboard
router.get('/dashboard/activity', auth, async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .sort({ createdAt:-1 }).limit(10)
      .populate('user','name role');
    ok(res, logs);
  } catch(e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// REGISTRATIONS (existing)
// ════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════
// REGISTRATIONS (Permanent Approval Logic)
// ════════════════════════════════════════════════════════════════
router.get('/admin/registrations', adminOnly, async (req, res) => {
  try {
    const { status } = req.query;
    const q = status ? { status } : {};
    const regs = await PendingRegistration.find(q).sort({ createdAt: -1 });
    res.json({ success: true, data: regs });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/admin/registrations/:id/:action', adminOnly, async (req, res) => {
  try {
    const { id, action } = req.params;
    const reg = await PendingRegistration.findById(id);
    
    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });
    if (reg.status === 'Approved') return res.status(400).json({ success: false, message: 'Already approved!' });

    if (action === 'reject') {
      reg.status = 'Rejected';
      await reg.save();
      return res.json({ success: true, message: 'Registration rejected.' });
    }

    if (action === 'approve') {
      // 1. Create the permanent User for login
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("Welcome@123", salt);

      const authUser = await User.create({
        name: reg.name,
        email: reg.email,
        password: hashedPassword,
        role: reg.role,
        isFirstLogin: true
      });

      // 2. Move data to Students or Teachers collection permanently
      if (reg.role === 'Student') {
        await Student.create({
          name: reg.name,
          email: reg.email,
          user: authUser._id,
          rollNo: reg.rollNo || `S-${Date.now().toString().slice(-6)}`,
          standard: reg.className || reg.standard,
          section: reg.section,
          gender: reg.gender,
          fatherName: reg.fatherName,
          motherName: reg.motherName,
          house: reg.house,
          address: reg.address,
          phone: reg.mobile || reg.phone,
          profilePhotoUrl: reg.profilePhotoUrl,
          isActive: true
        });
      } else if (reg.role === 'Teacher') {
        await Teacher.create({
          name: reg.name,
          email: reg.email,
          user: authUser._id,
          teacherId: reg.teacherId || `T-${Date.now().toString().slice(-6)}`,
          department: reg.department,
          qualification: reg.qualification,
          experience: reg.experience,
          salary: reg.salary,
          phone: reg.mobile || reg.phone,
          address: reg.address,
          profilePhotoUrl: reg.profilePhotoUrl,
          isActive: true
        });
      }

      // 3. Mark as approved in the pending list
      reg.status = 'Approved';
      await reg.save();

      // Log the activity
      await ActivityLog.create({ user: req.user._id, action: 'User Approved', module: 'Registrations', details: `Approved ${reg.role}: ${reg.name}` });

      return res.json({ success: true, message: `${reg.role} permanently added to the system!` });
    }

  } catch (e) {
    console.error("Approval Error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});
// ════════════════════════════════════════════════════════════════
// STUDENTS
// ════════════════════════════════════════════════════════════════
router.get('/students', auth, async (req, res) => {
  try {
    const { standard, section, search, page=1, limit=20 } = req.query;
    // const q = { isActive:true };
    const q = {};
    if (standard) q.standard = standard;
    if (section)  q.section  = section;
    if (search)   q.name     = { $regex: search, $options:'i' };
    const [students, total] = await Promise.all([
      Student.find(q).populate('classId','name').sort({ rollNo:1 })
             .skip((page-1)*limit).limit(+limit),
      Student.countDocuments(q),
    ]);
    ok(res, { students, total, page:+page, pages: Math.ceil(total/limit) });
  } catch(e) { err(res, e.message); }
});

router.get('/students/:id', auth, async (req, res) => {
  try {
    const s = await Student.findById(req.params.id).populate('classId','name standard section');
    if (!s) return err(res,'Student not found',404);
    ok(res, s);
  } catch(e) { err(res, e.message); }
});

// router.post('/students', adminOnly, async (req, res) => {
//   try {
//     const s = await Student.create(req.body);
//     if (req.body.classId) await Class.findByIdAndUpdate(req.body.classId, { $push:{ students:s._id } });
//     await ActivityLog.create({ user:req.user._id, action:'Student Added', module:'Students', details:`Added ${s.name}` });
//     ok(res, s, 'Student created');
//   } catch(e) { err(res, e.message); }
// });
router.post('/students', adminOnly, async (req, res) => {
  try {
    const { name, email, classId } = req.body;

    // 1. Validate input so we don't send "null" to the DB
    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and Email are required!" });
    }

    // 2. Encrypt the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("Welcome@123", salt);

    // 3. Create Login User
    const authUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'Student',
      isFirstLogin: true
    });

    // 4. Create Student Profile
    const newStudent = await Student.create({
      name,
      email,
      user: authUser._id,
      rollNo: `S-${Date.now().toString().slice(-6)}`,
      isActive: true,
      classId: classId || null
    });

    // 5. Link to Class
    if (classId) {
      await Class.findByIdAndUpdate(classId, { $push: { students: newStudent._id } });
    }

    res.json({ success: true, message: "Student created! Password: Welcome@123", data: newStudent });

  } catch(e) {
    console.error("❌ BACKEND ERROR:", e.message);
    if (e.code === 11000) return res.status(400).json({ success: false, message: "This email is already in use!" });
    res.status(500).json({ success: false, message: e.message });
  }
});
router.put('/students/:id', adminOnly, async (req, res) => {
  try {
    const s = await Student.findByIdAndUpdate(req.params.id, req.body, { new:true, runValidators:true });
    ok(res, s, 'Student updated');
  } catch(e) { err(res, e.message); }
});

router.delete('/students/:id', adminOnly, async (req, res) => {
  try {
    await Student.findByIdAndUpdate(req.params.id, { isActive:false });
    ok(res, null, 'Student deactivated');
  } catch(e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// TEACHERS
// ════════════════════════════════════════════════════════════════
router.get('/teachers', auth, async (req, res) => {
  try {
    const { department, search, page=1, limit=20 } = req.query;
    const q = { isActive:true };
    if (department) q.department = department;
    if (search)     q.name       = { $regex: search, $options:'i' };
    const [teachers, total] = await Promise.all([
      Teacher.find(q).populate('classes','name').sort({ name:1 })
             .skip((page-1)*limit).limit(+limit),
      Teacher.countDocuments(q),
    ]);
    ok(res, { teachers, total, pages: Math.ceil(total/limit) });
  } catch(e) { err(res, e.message); }
});

router.get('/teachers/:id', auth, async (req, res) => {
  try {
    const t = await Teacher.findById(req.params.id).populate('classes','name');
    if (!t) return err(res,'Teacher not found',404);
    ok(res, t);
  } catch(e) { err(res, e.message); }
});

// router.post('/teachers', adminOnly, async (req, res) => {
//   try {
//     const t = await Teacher.create(req.body);
//     await ActivityLog.create({ user:req.user._id, action:'Teacher Added', module:'Teachers', details:`Added ${t.name}` });
//     ok(res, t, 'Teacher created');
//   } catch(e) { err(res, e.message); }
// });
router.post('/teachers', adminOnly, async (req, res) => {
  try {
    const teacherData = { ...req.body };

    // 1. Encrypt the default password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("Welcome@123", salt);

    // 2. 🚀 CREATE THE AUTH USER FIRST!
    const authUser = await User.create({
      name: teacherData.name,
      email: teacherData.email,
      password: hashedPassword,
      role: 'Teacher',
      isFirstLogin: true
    });

    // 3. Create the Teacher Profile
    teacherData.user = authUser._id; // Link them

    const t = await Teacher.create(teacherData);
    await ActivityLog.create({ user:req.user._id, action:'Teacher Added', module:'Teachers', details:`Added ${t.name}` });
    
    ok(res, t, 'Teacher created! Default Password is: Welcome@123');
  } catch(e) { err(res, e.message); }
});
router.put('/teachers/:id', adminOnly, async (req, res) => {
  try {
    const t = await Teacher.findByIdAndUpdate(req.params.id, req.body, { new:true });
    ok(res, t, 'Teacher updated');
  } catch(e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// CLASSES
// ════════════════════════════════════════════════════════════════
router.get('/classes', auth, async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('classTeacher','name')
      .populate('students','name rollNo')
      .sort({ standard:1, section:1 });
    ok(res, classes);
  } catch(e) { err(res, e.message); }
});

router.get('/classes/:id', auth, async (req, res) => {
  try {
    const c = await Class.findById(req.params.id)
      .populate('classTeacher','name email')
      .populate('students','name rollNo feeStatus');
    ok(res, c);
  } catch(e) { err(res, e.message); }
});

router.post('/classes', adminOnly, async (req, res) => {
  try {
    const c = await Class.create(req.body);
    ok(res, c, 'Class created');
  } catch(e) { err(res, e.message); }
});

router.put('/classes/:id', adminOnly, async (req, res) => {
  try {
    const c = await Class.findByIdAndUpdate(req.params.id, req.body, { new:true });
    ok(res, c, 'Class updated');
  } catch(e) { err(res, e.message); }
});

// Subjects
router.get('/subjects', auth, async (req, res) => {
  try {
    const subjects = await Subject.find().populate('teacher','name');
    ok(res, subjects);
  } catch(e) { err(res, e.message); }
});

router.post('/subjects', adminOnly, async (req, res) => {
  try {
    const s = await Subject.create(req.body);
    ok(res, s, 'Subject created');
  } catch(e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// ATTENDANCE
// ════════════════════════════════════════════════════════════════
router.get('/attendance', auth, async (req, res) => {
  try {
    const { classId, date, studentId, from, to, page=1, limit=50 } = req.query;
    const q = {};
    if (classId)   q.classId  = classId;
    if (studentId) q.student  = studentId;
    if (date)      q.date     = { $gte: new Date(date), $lt: new Date(new Date(date).getTime()+86400000) };
    if (from && to) q.date    = { $gte: new Date(from), $lte: new Date(to) };
    const att = await Attendance.find(q)
      .populate('student','name rollNo')
      .populate('classId','name')
      .populate('markedBy','name')
      .sort({ date:-1 })
      .skip((page-1)*limit).limit(+limit);
    const total = await Attendance.countDocuments(q);
    ok(res, { attendance: att, total });
  } catch(e) { err(res, e.message); }
});

// Attendance summary/stats for a class
router.get('/attendance/summary/:classId', auth, async (req, res) => {
  try {
    const { month } = req.query;
    const start = month ? new Date(`${month}-01`) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end   = new Date(start.getFullYear(), start.getMonth()+1, 0);
    const agg = await Attendance.aggregate([
      { $match: { classId: new mongoose.Types.ObjectId(req.params.classId), date:{ $gte:start, $lte:end } } },
      { $group: {
          _id:'$student',
          total:{ $sum:1 },
          present:{ $sum:{ $cond:[{ $eq:['$status','Present'] },1,0] } },
          absent:{ $sum:{ $cond:[{ $eq:['$status','Absent'] },1,0] } },
      }},
      { $lookup:{ from:'students', localField:'_id', foreignField:'_id', as:'student' } },
      { $unwind:'$student' },
    ]);
    ok(res, agg);
  } catch(e) { err(res, e.message); }
});

// Mark attendance (bulk)
router.post('/attendance', auth, async (req, res) => {
  try {
    const { classId, date, records } = req.body;
    // records: [{ studentId, status }]
    const ops = records.map(r => ({
      updateOne: {
        filter: { student: r.studentId, classId, date: new Date(date) },
        update: { $set: { student:r.studentId, classId, date:new Date(date), status:r.status, markedBy:req.user._id } },
        upsert: true,
      },
    }));
    await Attendance.bulkWrite(ops);
    await ActivityLog.create({ user:req.user._id, action:'Attendance Marked', module:'Attendance', details:`Class attendance for ${date}` });
    ok(res, null, 'Attendance saved');
  } catch(e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// EXAMINATIONS & RESULTS
// ════════════════════════════════════════════════════════════════
router.get('/exams', auth, async (req, res) => {
  try {
    const { standard, type, upcoming } = req.query;
    const q = {};
    if (standard) q.standard = standard;
    if (type)     q.type     = type;
    if (upcoming) q.date     = { $gte: new Date() };
    const exams = await Exam.find(q).populate('createdBy','name').sort({ date:-1 });
    ok(res, exams);
  } catch(e) { err(res, e.message); }
});

router.post('/exams', auth, async (req, res) => {
  try {
    const exam = await Exam.create({ ...req.body, createdBy: req.user._id });
    ok(res, exam, 'Exam created');
  } catch(e) { err(res, e.message); }
});

router.put('/exams/:id', auth, async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new:true });
    ok(res, exam, 'Exam updated');
  } catch(e) { err(res, e.message); }
});

router.delete('/exams/:id', adminOnly, async (req, res) => {
  try {
    await Exam.findByIdAndDelete(req.params.id);
    ok(res, null, 'Exam deleted');
  } catch(e) { err(res, e.message); }
});

// Results
router.get('/results', auth, async (req, res) => {
  try {
    const { examId, studentId, standard } = req.query;
    const q = {};
    if (examId)    q.exam    = examId;
    if (studentId) q.student = studentId;
    const results = await Result.find(q)
      .populate('student','name rollNo standard section')
      .populate('exam','name subject totalMarks date type')
      .sort({ createdAt:-1 });
    ok(res, results);
  } catch(e) { err(res, e.message); }
});

router.post('/results', auth, async (req, res) => {
  try {
    // bulk enter results: body.results = [{ student, exam, marksObtained, totalMarks }]
    const { results } = req.body;
    const graded = results.map(r => {
      const pct = (r.marksObtained / r.totalMarks) * 100;
      return {
        ...r, enteredBy: req.user._id,
        grade: pct>=90?'A+':pct>=80?'A':pct>=70?'B+':pct>=60?'B':pct>=50?'C':'F',
      };
    });
    const ops = graded.map(r => ({
      updateOne: {
        filter: { student:r.student, exam:r.exam },
        update: { $set: r },
        upsert: true,
      },
    }));
    await Result.bulkWrite(ops);
    await ActivityLog.create({ user:req.user._id, action:'Results Entered', module:'Exams', details:`Results entered for ${results.length} students` });
    ok(res, null, 'Results saved');
  } catch(e) { err(res, e.message); }
});

// Performance summary
router.get('/results/performance/:studentId', auth, async (req, res) => {
  try {
    const results = await Result.find({ student: req.params.studentId })
      .populate('exam','name subject date type');
    const avg = results.length ? Math.round(results.reduce((sum,r)=>sum+(r.marksObtained/r.totalMarks*100),0)/results.length) : 0;
    ok(res, { results, average: avg, total: results.length });
  } catch(e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// TIMETABLE
// ════════════════════════════════════════════════════════════════
router.get('/timetable', auth, async (req, res) => {
  try {
    const { classId } = req.query;
    const q = classId ? { classId } : {};
    const tt = await Timetable.find(q)
      .populate('classId','name standard section')
      .populate('periods.teacher','name');
    ok(res, tt);
  } catch(e) { err(res, e.message); }
});

router.post('/timetable', adminOnly, async (req, res) => {
  try {
    const { classId, day, periods } = req.body;
    const tt = await Timetable.findOneAndUpdate(
      { classId, day }, { classId, day, periods }, { upsert:true, new:true }
    );
    ok(res, tt, 'Timetable saved');
  } catch(e) { err(res, e.message); }
});

// Teacher timetable
router.get('/timetable/teacher/:teacherId', auth, async (req, res) => {
  try {
    const tt = await Timetable.find({ 'periods.teacher': req.params.teacherId })
      .populate('classId','name');
    ok(res, tt);
  } catch(e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// FEES
// ════════════════════════════════════════════════════════════════
router.get('/fees', auth, async (req, res) => {
  try {
    const { studentId, status, feeType, page=1, limit=20 } = req.query;
    const q = {};
    if (studentId) q.student = studentId;
    if (status)    q.status  = status;
    if (feeType)   q.feeType = feeType;
    const [fees, total] = await Promise.all([
      Fee.find(q).populate('student','name rollNo standard section')
         .sort({ dueDate:-1 }).skip((page-1)*limit).limit(+limit),
      Fee.countDocuments(q),
    ]);
    ok(res, { fees, total, pages: Math.ceil(total/limit) });
  } catch(e) { err(res, e.message); }
});

router.get('/fees/summary', auth, async (req, res) => {
  try {
    const agg = await Fee.aggregate([
      { $group: {
          _id:'$status',
          total:{ $sum:'$amount' },
          paid:{ $sum:'$paidAmount' },
          count:{ $sum:1 },
      }},
    ]);
    const monthly = await Fee.aggregate([
      { $match:{ status:'Paid', paidDate:{ $ne:null } } },
      { $group:{ _id:{ $dateToString:{ format:'%Y-%m', date:'$paidDate' } }, collected:{ $sum:'$paidAmount' }, count:{ $sum:1 } } },
      { $sort:{ _id:1 } }, { $limit:6 },
    ]);
    ok(res, { byStatus: agg, monthly });
  } catch(e) { err(res, e.message); }
});

router.post('/fees', adminOnly, async (req, res) => {
  try {
    const fee = await Fee.create({ ...req.body, collectedBy: req.user._id });
    ok(res, fee, 'Fee record created');
  } catch(e) { err(res, e.message); }
});

router.put('/fees/:id', adminOnly, async (req, res) => {
  try {
    const fee = await Fee.findByIdAndUpdate(req.params.id, req.body, { new:true });
    if (req.body.status === 'Paid') {
      await ActivityLog.create({ user:req.user._id, action:'Fee Collected', module:'Fees', details:`Fee marked paid: ₹${fee.paidAmount}` });
    }
    ok(res, fee, 'Fee updated');
  } catch(e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// HOMEWORK
// ════════════════════════════════════════════════════════════════
router.get('/homework', auth, async (req, res) => {
  try {
    const { classId, subject, teacherId } = req.query;
    const q = {};
    if (classId)   q.classId    = classId;
    if (subject)   q.subject    = { $regex: subject, $options:'i' };
    if (teacherId) q.assignedBy = teacherId;
    const hw = await Homework.find(q)
      .populate('classId','name')
      .populate('assignedBy','name')
      .sort({ dueDate:1 });
    ok(res, hw);
  } catch(e) { err(res, e.message); }
});

router.post('/homework', auth, async (req, res) => {
  try {
    const hw = await Homework.create({ ...req.body, assignedBy: req.user._id });
    ok(res, hw, 'Homework assigned');
  } catch(e) { err(res, e.message); }
});

// Submit homework (student)
router.post('/homework/:id/submit', auth, async (req, res) => {
  try {
    const { studentId, fileUrl, remarks } = req.body;
    await Homework.findByIdAndUpdate(req.params.id, {
      $push: { submissions: { student:studentId, submittedAt:new Date(), fileUrl, remarks, status:'Submitted' } },
    });
    ok(res, null, 'Homework submitted');
  } catch(e) { err(res, e.message); }
});

// Grade submission
router.put('/homework/:id/grade/:studentId', auth, async (req, res) => {
  try {
    const { grade, remarks } = req.body;
    await Homework.updateOne(
      { _id:req.params.id, 'submissions.student':req.params.studentId },
      { $set:{ 'submissions.$.grade':grade, 'submissions.$.remarks':remarks, 'submissions.$.status':'Graded' } }
    );
    ok(res, null, 'Submission graded');
  } catch(e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// LIBRARY
// ════════════════════════════════════════════════════════════════
router.get('/library/books', auth, async (req, res) => {
  try {
    const { search, category, available } = req.query;
    const q = {};
    if (search)    q.$or = [{ title:{$regex:search,$options:'i'} },{ author:{$regex:search,$options:'i'} }];
    if (category)  q.category  = category;
    if (available) q.available = { $gt:0 };
    const books = await LibraryBook.find(q).sort({ title:1 });
    ok(res, books);
  } catch(e) { err(res, e.message); }
});

router.post('/library/books', adminOnly, async (req, res) => {
  try {
    const book = await LibraryBook.create(req.body);
    ok(res, book, 'Book added');
  } catch(e) { err(res, e.message); }
});

router.get('/library/issues', auth, async (req, res) => {
  try {
    const { status, studentId } = req.query;
    const q = {};
    if (status)    q.status  = status;
    if (studentId) q.student = studentId;
    const issues = await LibraryIssue.find(q)
      .populate('book','title author isbn')
      .populate('student','name rollNo')
      .sort({ issuedDate:-1 });
    ok(res, issues);
  } catch(e) { err(res, e.message); }
});

router.post('/library/issue', adminOnly, async (req, res) => {
  try {
    const { bookId, studentId, dueDate } = req.body;
    const book = await LibraryBook.findById(bookId);
    if (!book || book.available < 1) return err(res,'Book not available',400);
    const issue = await LibraryIssue.create({
      book:bookId, student:studentId,
      dueDate: new Date(dueDate),
      issuedBy: req.user._id,
    });
    await LibraryBook.findByIdAndUpdate(bookId, { $inc:{ available:-1 } });
    ok(res, issue, 'Book issued');
  } catch(e) { err(res, e.message); }
});

router.put('/library/return/:id', adminOnly, async (req, res) => {
  try {
    const issue = await LibraryIssue.findById(req.params.id);
    if (!issue) return err(res,'Issue not found',404);
    const fine = issue.dueDate < new Date() ? Math.floor((new Date()-issue.dueDate)/86400000)*5 : 0;
    issue.returnDate = new Date();
    issue.status     = 'Returned';
    issue.fine       = fine;
    await issue.save();
    await LibraryBook.findByIdAndUpdate(issue.book, { $inc:{ available:1 } });
    ok(res, issue, `Book returned. Fine: ₹${fine}`);
  } catch(e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// ANNOUNCEMENTS
// ════════════════════════════════════════════════════════════════
router.get('/announcements', auth, async (req, res) => {
  try {
    const role  = req.user.role;
    const q     = { $or:[{ audience:'All' },{ audience:role }] };
    const announcements = await Announcement.find(q)
      .populate('postedBy','name role')
      .sort({ createdAt:-1 })
      .limit(50);
    ok(res, announcements);
  } catch(e) { err(res, e.message); }
});

router.post('/announcements', auth, async (req, res) => {
  try {
    const ann = await Announcement.create({ ...req.body, postedBy: req.user._id });
    await ActivityLog.create({ user:req.user._id, action:'Announcement Posted', module:'Announcements', details:ann.title });
    ok(res, ann, 'Announcement posted');
  } catch(e) { err(res, e.message); }
});

router.delete('/announcements/:id', auth, async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    ok(res, null, 'Announcement deleted');
  } catch(e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// TRANSPORT
// ════════════════════════════════════════════════════════════════
router.get('/transport/routes', auth, async (req, res) => {
  try {
    const routes = await TransportRoute.find({ isActive:true }).sort({ routeNo:1 });
    ok(res, routes);
  } catch(e) { err(res, e.message); }
});

router.post('/transport/routes', adminOnly, async (req, res) => {
  try {
    const route = await TransportRoute.create(req.body);
    ok(res, route, 'Route created');
  } catch(e) { err(res, e.message); }
});

router.put('/transport/routes/:id', adminOnly, async (req, res) => {
  try {
    const route = await TransportRoute.findByIdAndUpdate(req.params.id, req.body, { new:true });
    ok(res, route, 'Route updated');
  } catch(e) { err(res, e.message); }
});

router.get('/transport/assignments', auth, async (req, res) => {
  try {
    const assignments = await TransportAssignment.find()
      .populate('student','name rollNo standard section')
      .populate('route','routeNo name');
    ok(res, assignments);
  } catch(e) { err(res, e.message); }
});

router.post('/transport/assign', adminOnly, async (req, res) => {
  try {
    const a = await TransportAssignment.findOneAndUpdate(
      { student: req.body.studentId },
      { student:req.body.studentId, route:req.body.routeId, stop:req.body.stop, fare:req.body.fare },
      { upsert:true, new:true }
    );
    ok(res, a, 'Student assigned to route');
  } catch(e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// LEAVE MANAGEMENT
// ════════════════════════════════════════════════════════════════
router.get('/leaves', auth, async (req, res) => {
  try {
    const { status, role } = req.query;
    const q = {};
    if (status) q.status = status;
    if (role)   q.role   = role;
    // teachers can only see own leaves
    if (req.user.role === 'Teacher') q.applicant = req.user._id;
    const leaves = await Leave.find(q)
      .populate('applicant','name role')
      .populate('reviewedBy','name')
      .sort({ createdAt:-1 });
    ok(res, leaves);
  } catch(e) { err(res, e.message); }
});

router.post('/leaves', auth, async (req, res) => {
  try {
    const from = new Date(req.body.from);
    const to   = new Date(req.body.to);
    const days = Math.ceil((to-from)/86400000)+1;
    const leave = await Leave.create({ ...req.body, applicant:req.user._id, role:req.user.role, days });
    ok(res, leave, 'Leave application submitted');
  } catch(e) { err(res, e.message); }
});

router.put('/leaves/:id', auth, async (req, res) => {
  try {
    const { status, reviewNote } = req.body;
    const leave = await Leave.findByIdAndUpdate(req.params.id,
      { status, reviewNote, reviewedBy: req.user._id }, { new:true }
    );
    await ActivityLog.create({ user:req.user._id, action:`Leave ${status}`, module:'Leave', details:`Leave for ${leave.days} days` });
    ok(res, leave, `Leave ${status}`);
  } catch(e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// PAYROLL
// ════════════════════════════════════════════════════════════════
router.get('/payroll', adminOnly, async (req, res) => {
  try {
    const { month, teacherId } = req.query;
    const q = {};
    if (month)     q.month   = month;
    if (teacherId) q.teacher = teacherId;
    const records = await Payroll.find(q)
      .populate('teacher','name teacherId department designation')
      .sort({ month:-1, createdAt:-1 });
    ok(res, records);
  } catch(e) { err(res, e.message); }
});

router.post('/payroll/generate', adminOnly, async (req, res) => {
  try {
    const { month } = req.body;
    const teachers  = await Teacher.find({ isActive:true });
    const ops = teachers.map(t => ({
      updateOne: {
        filter: { teacher:t._id, month },
        update: { $setOnInsert: {
          teacher:t._id, month,
          basicSalary:t.salary||40000,
          allowances: 5000, deductions: 2000,
          netSalary: (t.salary||40000)+5000-2000,
          status:'Pending',
        }},
        upsert:true,
      },
    }));
    await Payroll.bulkWrite(ops);
    ok(res, null, `Payroll generated for ${month}`);
  } catch(e) { err(res, e.message); }
});

router.put('/payroll/:id/pay', adminOnly, async (req, res) => {
  try {
    const p = await Payroll.findByIdAndUpdate(req.params.id,
      { status:'Paid', paidDate: new Date() }, { new:true }
    );
    await ActivityLog.create({ user:req.user._id, action:'Salary Paid', module:'Payroll', details:`Payroll ID ${p._id}` });
    ok(res, p, 'Salary marked as paid');
  } catch(e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// ACTIVITY LOGS
// ════════════════════════════════════════════════════════════════
router.get('/logs', adminOnly, async (req, res) => {
  try {
    const { module, page=1, limit=30 } = req.query;
    const q = module ? { module } : {};
    const [logs, total] = await Promise.all([
      ActivityLog.find(q).populate('user','name role')
         .sort({ createdAt:-1 }).skip((page-1)*limit).limit(+limit),
      ActivityLog.countDocuments(q),
    ]);
    ok(res, { logs, total, pages: Math.ceil(total/limit) });
  } catch(e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// TALENT TESTS
// ════════════════════════════════════════════════════════════════
router.get('/talent', auth, async (req, res) => {
  try {
    const { standard } = req.query;
    const q = standard ? { standard } : {};
    const tests = await TalentTest.find(q).populate('createdBy','name').sort({ date:1 });
    ok(res, tests);
  } catch(e) { err(res, e.message); }
});

router.post('/talent', auth, async (req, res) => {
  try {
    const test = await TalentTest.create({ ...req.body, createdBy: req.user._id });
    ok(res, test, 'Talent test created');
  } catch(e) { err(res, e.message); }
});

router.get('/talent/:id', auth, async (req, res) => {
  try {
    // For students — send without answers
    const test = await TalentTest.findById(req.params.id).populate('createdBy','name');
    if (!test) return err(res,'Test not found',404);
    if (req.user.role === 'Student') {
      const sanitized = test.toObject();
      sanitized.questions = sanitized.questions.map(q => ({ ...q, answer: undefined }));
      return ok(res, sanitized);
    }
    ok(res, test);
  } catch(e) { err(res, e.message); }
});

// ════════════════════════════════════════════════════════════════
// REPORTS & ANALYTICS
// ════════════════════════════════════════════════════════════════
router.get('/reports/overview', auth, async (req, res) => {
  try {
    // Monthly attendance trend
    const attTrend = await Attendance.aggregate([
      { $group:{
          _id:{ month:{ $dateToString:{ format:'%Y-%m', date:'$date' } }, status:'$status' },
          count:{ $sum:1 },
      }},
      { $sort:{ '_id.month':1 } }, { $limit:24 },
    ]);

    // Fee collection trend
    const feeTrend = await Fee.aggregate([
      { $match:{ status:'Paid', paidDate:{ $ne:null } } },
      { $group:{ _id:{ $dateToString:{ format:'%Y-%m', date:'$paidDate' } }, total:{ $sum:'$paidAmount' } } },
      { $sort:{ _id:1 } }, { $limit:6 },
    ]);

    // Grade distribution
    const gradeDist = await Result.aggregate([
      { $group:{ _id:'$grade', count:{ $sum:1 } } },
      { $sort:{ _id:1 } },
    ]);

    // Students per class
    const classStrength = await Class.aggregate([
      { $project:{ name:1, count:{ $size:'$students' } } },
      { $sort:{ name:1 } },
    ]);

    ok(res, { attTrend, feeTrend, gradeDist, classStrength });
  } catch(e) { err(res, e.message); }
});

module.exports = router;