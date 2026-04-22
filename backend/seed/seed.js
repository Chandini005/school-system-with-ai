

// // seed/seed.js — Run: npm run seed
// // Populates DB with realistic Indian school data for all modules

// import dotenv from 'dotenv';
// import mongoose from 'mongoose';
// import bcrypt from 'bcryptjs';

// // Importing models using ES Module syntax (Notice the .js extension!)
// import {
//   User, Student, Teacher, Class, Subject,
//   Attendance, Exam, Result, Timetable,
//   Fee, Homework, LibraryBook, LibraryIssue,
//   Announcement, TransportRoute, TransportAssignment,
//   Leave, Payroll, ActivityLog, TalentTest,
// } from '../models/index.js';

// dotenv.config();

// const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://chandini:TestDb321@edumanagercluster.weofmss.mongodb.net/school_management_db?appName=EduManagerCluster';

// // ── helpers ──────────────────────────────────────────────────────
// const hash = (p) => bcrypt.hashSync(p, 10);
// const rnd  = (arr) => arr[Math.floor(Math.random() * arr.length)];
// const rndInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
// const daysAgo  = (n) => new Date(Date.now() - n * 86400000);
// const daysAhead = (n) => new Date(Date.now() + n * 86400000);

// // ── raw data ─────────────────────────────────────────────────────
// const STUDENT_NAMES = [
//   'Aarav Shah','Priya Sharma','Rahul Mehta','Sneha Patel','Arjun Singh',
//   'Riya Desai','Karan Joshi','Pooja Nair','Vikram Reddy','Ananya Iyer',
//   'Rohan Verma','Kavya Kumar','Aditya Gupta','Divya Mishra','Nikhil Rao',
//   'Sanya Bose','Dhruv Khanna','Ishita Sen','Harsh Trivedi','Nisha Pandey',
//   'Yash Malhotra','Shreya Banerjee','Ayush Tiwari','Neha Chopra','Varun Kapoor',
//   'Simran Gill','Tanmay Doshi','Ruchika Agarwal','Siddharth Negi','Ankita Rawat',
//   'Parth Bhatt','Meera Pillai','Rishabh Saxena','Swati Kulkarni','Kunal Bhatia',
//   'Deepa Menon','Arnav Dubey','Shweta Jain','Gaurav Thakur','Kritika Singh',
// ];

// const TEACHER_NAMES = [
//   'Anita Desai','Ramesh Kumar','Sunita Rao','Vikram Joshi','Priya Nair',
//   'Suresh Patel','Meenakshi Iyer','Arjun Sharma','Geeta Verma','Naresh Gupta',
//   'Kavitha Menon','Rohit Pandey','Anjali Singh','Dinesh Trivedi','Rekha Bose',
// ];

// const SUBJECTS = [
//   'Mathematics','Science','English','Hindi','Social Studies',
//   'Physics','Chemistry','Biology','History','Geography',
//   'Computer Science','Physical Education','Art','Music',
// ];

// const SECTIONS = ['A','B','C'];
// const STANDARDS = ['6','7','8','9','10'];
// const BLOOD_GROUPS = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];
// const DESIGNATIONS = ['PGT','TGT','PRT','HOD','Sr. Lecturer','Lecturer'];
// const DEPARTMENTS  = ['Science','Mathematics','Humanities','Languages','Computer Science'];
// const FEE_TYPES    = ['Tuition','Transport','Library','Lab','Sports'];
// const LEAVE_TYPES  = ['Sick','Casual','Earned','Emergency'];
// const BOOK_CATEGORIES = ['Science','Mathematics','Literature','History','Computer','Reference','Fiction'];

// async function seed() {
//   await mongoose.connect(MONGO_URI);
//   console.log('✓ Connected to MongoDB');

//   // wipe existing data
//   const cols = [
//     User, Student, Teacher, Class, Subject, Attendance, Exam, Result,
//     Timetable, Fee, Homework, LibraryBook, LibraryIssue, Announcement,
//     TransportRoute, TransportAssignment, Leave, Payroll, ActivityLog, TalentTest,
//   ];
//   for (const M of cols) await M.deleteMany({});
//   console.log('✓ Cleared existing data');

//   // ── 1. Users ─────────────────────────────────────────────────
//   const adminUser = await User.create({
//     name: 'Super Admin', email: 'admin@abhyaas.in',
//     password: hash('admin123'), role: 'Admin',
//   });
//   const principalUser = await User.create({
//     name: 'Dr. K. Ramanathan', email: 'principal@abhyaas.in',
//     password: hash('principal123'), role: 'Principal',
//   });
//   console.log('✓ Admin + Principal users created');

//   // ── 2. Subjects ───────────────────────────────────────────────
//   const subjectDocs = await Subject.insertMany(
//     SUBJECTS.map((name, i) => ({
//       name, code: `SUB${String(i+1).padStart(3,'0')}`,
//       standard: rnd(STANDARDS), type: rnd(['Theory','Practical','Both']),
//     }))
//   );

//   // ── 3. Teachers ───────────────────────────────────────────────
//   const teacherUsers = [];
//   const teacherDocs  = [];
//   for (let i = 0; i < TEACHER_NAMES.length; i++) {
//     const name = TEACHER_NAMES[i];
//     const email = `teacher${i+1}@abhyaas.in`;
//     const u = await User.create({ name, email, password: hash('teacher123'), role: 'Teacher' });
//     teacherUsers.push(u);
//     const t = await Teacher.create({
//       userId: u._id, name, email, phone: `9${rndInt(100000000,999999999)}`,
//       teacherId: `T-${String(i+1).padStart(3,'0')}`,
//       designation: rnd(DESIGNATIONS), department: rnd(DEPARTMENTS),
//       subjects: [rnd(SUBJECTS), rnd(SUBJECTS)],
//       qualification: rnd(['M.Sc','B.Ed','M.Ed','M.A','M.Tech']),
//       experience: rndInt(1,20), salary: rndInt(35000,80000),
//       joinDate: daysAgo(rndInt(100,2000)),
//     });
//     teacherDocs.push(t);
//   }
//   console.log(`✓ ${teacherDocs.length} teachers created`);

//   // ── 4. Classes ────────────────────────────────────────────────
//   const classDocs = [];
//   for (const std of STANDARDS) {
//     for (const sec of SECTIONS) {
//       const c = await Class.create({
//         name: `Class ${std}${sec}`, standard: std, section: sec,
//         classTeacher: rnd(teacherDocs)._id,
//         subjects: SUBJECTS.slice(0, rndInt(6,9)),
//         room: `Room ${rndInt(101,320)}`, capacity: 40,
//       });
//       classDocs.push(c);
//       // update teacher classes
//       await Teacher.findByIdAndUpdate(rnd(teacherDocs)._id, { $push: { classes: c._id } });
//     }
//   }
//   console.log(`✓ ${classDocs.length} classes created`);

//   // ── 5. Students ───────────────────────────────────────────────
//   const studentDocs = [];
//   let rollCounter   = 1001;
//   for (let i = 0; i < STUDENT_NAMES.length; i++) {
//     const name = STUDENT_NAMES[i];
//     const cls  = classDocs[i % classDocs.length];
//     const email = `student${i+1}@abhyaas.in`;
//     const u = await User.create({ name, email, password: hash('student123'), role: 'Student' });
//     const s = await Student.create({
//       userId: u._id, rollNo: `S-${rollCounter++}`, name, email,
//       phone: `8${rndInt(100000000,999999999)}`,
//       dob: new Date(2007 - rndInt(0,5), rndInt(0,11), rndInt(1,28)),
//       gender: rnd(['Male','Female']),
//       address: `${rndInt(1,200)}, ${rnd(['MG Road','Nehru Nagar','Gandhi Colony','Patel Street'])}, Mumbai`,
//       classId: cls._id, standard: cls.standard, section: cls.section,
//       parentName: `${rnd(['Rajesh','Suresh','Mahesh','Dinesh'])} ${name.split(' ')[1]}`,
//       parentPhone: `7${rndInt(100000000,999999999)}`,
//       parentEmail: `parent${i+1}@gmail.com`,
//       feeStatus: rnd(['Paid','Pending','Partial','Paid','Paid']),
//       bloodGroup: rnd(BLOOD_GROUPS),
//     });
//     studentDocs.push(s);
//     await Class.findByIdAndUpdate(cls._id, { $push: { students: s._id } });
//   }
//   console.log(`✓ ${studentDocs.length} students created`);

//   // ── 6. Attendance (last 30 days) ──────────────────────────────
//   const attendanceDocs = [];
//   for (let d = 30; d >= 1; d--) {
//     const date = daysAgo(d);
//     const dow  = date.getDay();
//     if (dow === 0) continue; // skip Sunday
//     for (const s of studentDocs.slice(0, 20)) { // 20 students for speed
//       attendanceDocs.push({
//         student: s._id, classId: s.classId, date,
//         status: rnd(['Present','Present','Present','Present','Absent','Late']),
//         markedBy: rnd(teacherDocs)._id,
//       });
//     }
//   }
//   await Attendance.insertMany(attendanceDocs);
//   console.log(`✓ ${attendanceDocs.length} attendance records created`);

//   // ── 7. Exams ──────────────────────────────────────────────────
//   const examDocs = await Exam.insertMany([
//     { name:'Unit Test 1', type:'Unit Test', standard:'10', subject:'Mathematics', date: daysAgo(20), totalMarks:50, duration:90 },
//     { name:'Mid Term Exam', type:'Mid Term', standard:'9', subject:'Science', date: daysAgo(10), totalMarks:100, duration:180 },
//     { name:'Final Exam', type:'Final', standard:'8', subject:'English', date: daysAgo(5), totalMarks:100, duration:180 },
//     { name:'Unit Test 2', type:'Unit Test', standard:'10', subject:'Physics', date: daysAhead(5), totalMarks:50, duration:90 },
//     { name:'Science Finals', type:'Final', standard:'9', subject:'Chemistry', date: daysAhead(12), totalMarks:100, duration:180 },
//     { name:'Math Olympics', type:'Talent Test', standard:'10', subject:'Mathematics', date: daysAhead(20), totalMarks:100, duration:120 },
//   ]);

//   // ── 8. Results ────────────────────────────────────────────────
//   const resultDocs = [];
//   const pastExams  = examDocs.filter(e => e.date < new Date());
//   for (const exam of pastExams) {
//     for (const s of studentDocs.slice(0, 15)) {
//       const marks = rndInt(20, exam.totalMarks);
//       const pct   = (marks / exam.totalMarks) * 100;
//       const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : 'F';
//       resultDocs.push({ student: s._id, exam: exam._id, marksObtained: marks, totalMarks: exam.totalMarks, grade });
//     }
//   }
//   await Result.insertMany(resultDocs);
//   console.log(`✓ ${resultDocs.length} results created`);

//   // ── 9. Timetable ──────────────────────────────────────────────
//   const DAYS   = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
//   const TIMES  = [
//     { s:'08:00',e:'08:45' },{ s:'08:45',e:'09:30' },{ s:'09:30',e:'10:15' },
//     { s:'10:30',e:'11:15' },{ s:'11:15',e:'12:00' },{ s:'13:00',e:'13:45' },
//     { s:'13:45',e:'14:30' },
//   ];
//   const ttDocs = [];
//   for (const cls of classDocs.slice(0, 5)) {
//     for (const day of DAYS) {
//       ttDocs.push({
//         classId: cls._id, day,
//         periods: TIMES.map((t, i) => ({
//           periodNo: i+1,
//           subject: rnd(cls.subjects || SUBJECTS),
//           teacher: rnd(teacherDocs)._id,
//           startTime: t.s, endTime: t.e,
//           room: cls.room,
//         })),
//       });
//     }
//   }
//   await Timetable.insertMany(ttDocs);
//   console.log(`✓ Timetable created for ${classDocs.slice(0,5).length} classes`);

//   // ── 10. Fees ─────────────────────────────────────────────────
//   const feeDocs = [];
//   for (const s of studentDocs) {
//     for (const feeType of FEE_TYPES) {
//       const amount   = feeType === 'Tuition' ? rndInt(8000,15000) : rndInt(500,3000);
//       const isPaid   = rnd([true,true,true,false,false]);
//       feeDocs.push({
//         student: s._id, feeType, amount,
//         dueDate: daysAhead(rndInt(-30,30)),
//         status: isPaid ? 'Paid' : rnd(['Pending','Overdue']),
//         paidAmount: isPaid ? amount : rndInt(0, amount),
//         paidDate: isPaid ? daysAgo(rndInt(1,20)) : null,
//         receiptNo: isPaid ? `RCP${rndInt(10000,99999)}` : null,
//         method: rnd(['Cash','Online','Cheque']),
//         collectedBy: adminUser._id,
//       });
//     }
//   }
//   await Fee.insertMany(feeDocs);
//   console.log(`✓ ${feeDocs.length} fee records created`);

//   // ── 11. Homework ──────────────────────────────────────────────
//   const hwDocs = [];
//   for (let i = 0; i < 10; i++) {
//     const cls = rnd(classDocs);
//     hwDocs.push({
//       title: `${rnd(SUBJECTS)} Assignment ${i+1}`,
//       description: `Complete exercises from Chapter ${rndInt(1,10)}. Show all working.`,
//       subject: rnd(SUBJECTS),
//       classId: cls._id,
//       assignedBy: rnd(teacherDocs)._id,
//       dueDate: daysAhead(rndInt(1,10)),
//       submissions: studentDocs.slice(0,5).map(s => ({
//         student: s._id,
//         submittedAt: daysAgo(rndInt(0,3)),
//         status: rnd(['Submitted','Graded']),
//         grade: rnd(['A','B','C']),
//       })),
//     });
//   }
//   await Homework.insertMany(hwDocs);
//   console.log(`✓ ${hwDocs.length} homework records created`);

//   // ── 12. Library ───────────────────────────────────────────────
//   const BOOKS = [
//     { title:'NCERT Mathematics Class 10', author:'NCERT Board', isbn:'978-8174502087' },
//     { title:'NCERT Science Class 9', author:'NCERT Board', isbn:'978-8174504746' },
//     { title:'Wings of Fire', author:'Dr. A.P.J. Abdul Kalam', isbn:'978-8173711466' },
//     { title:'Discovery of India', author:'Jawaharlal Nehru', isbn:'978-0143031031' },
//     { title:'Introduction to Algorithms', author:'Cormen et al.', isbn:'978-0262033848' },
//     { title:'The Guide', author:'R.K. Narayan', isbn:'978-0143068426' },
//     { title:'Malgudi Days', author:'R.K. Narayan', isbn:'978-0143030195' },
//     { title:'India After Gandhi', author:'Ramachandra Guha', isbn:'978-0330396110' },
//     { title:'Five Point Someone', author:'Chetan Bhagat', isbn:'978-8129104595' },
//     { title:'The Alchemist', author:'Paulo Coelho', isbn:'978-0062315007' },
//     { title:'Physics NCERT Class 12 Part 1', author:'NCERT', isbn:'978-8174506177' },
//     { title:'Chemistry NCERT Class 11', author:'NCERT', isbn:'978-8174504630' },
//   ];
//   const bookDocs = await LibraryBook.insertMany(
//     BOOKS.map(b => ({ ...b, category: rnd(BOOK_CATEGORIES), copies: rndInt(2,8), available: rndInt(1,5), publisher: rnd(['NCERT','Penguin','HarperCollins','Oxford']), year: rndInt(2005,2022), shelfNo: `S${rndInt(1,20)}-${rndInt(1,5)}` }))
//   );
//   const issueDocs = [];
//   for (let i = 0; i < 15; i++) {
//     const issued = daysAgo(rndInt(1,20));
//     const due    = new Date(issued.getTime() + 14*86400000);
//     const isRet  = rnd([true,false]);
//     issueDocs.push({
//       book: rnd(bookDocs)._id, student: rnd(studentDocs)._id,
//       issuedDate: issued, dueDate: due,
//       returnDate: isRet ? daysAgo(rndInt(0,5)) : null,
//       status: isRet ? 'Returned' : due < new Date() ? 'Overdue' : 'Issued',
//       fine: due < new Date() && !isRet ? rndInt(5,50) : 0,
//       issuedBy: adminUser._id,
//     });
//   }
//   await LibraryIssue.insertMany(issueDocs);
//   console.log(`✓ ${bookDocs.length} books, ${issueDocs.length} issues created`);

//   // ── 13. Announcements ─────────────────────────────────────────
//   await Announcement.insertMany([
//     { title:'Annual Sports Day', content:'Annual Sports Day will be held on March 8th. All students must participate.', audience:['All'], priority:'Important', postedBy:principalUser._id, expiresAt:daysAhead(30) },
//     { title:'Fee Submission Reminder', content:'Last date for fee submission is March 15. Late fees of ₹50/day will apply.', audience:['Student','Parent'], priority:'Urgent', postedBy:adminUser._id, expiresAt:daysAhead(15) },
//     { title:'Staff Meeting', content:'Mandatory staff meeting on Saturday at 2 PM in the conference hall.', audience:['Teacher','Admin'], priority:'Important', postedBy:principalUser._id },
//     { title:'Parent-Teacher Meet', content:'Parent-Teacher meet scheduled for March 12. Attendance is compulsory.', audience:['All'], priority:'Normal', postedBy:principalUser._id, expiresAt:daysAhead(20) },
//     { title:'Holiday Notice', content:'School will remain closed on March 25 on account of Holi.', audience:['All'], priority:'Normal', postedBy:adminUser._id, expiresAt:daysAhead(25) },
//   ]);
//   console.log('✓ Announcements created');

//   // ── 14. Transport ─────────────────────────────────────────────
//   const routeDocs = await TransportRoute.insertMany([
//     { routeNo:'RT-01', name:'Andheri–Bandra Route', stops:[{stop:'Andheri Station',time:'07:00',fare:800},{stop:'Vile Parle',time:'07:15',fare:700},{stop:'Santacruz',time:'07:30',fare:600}], driver:{name:'Ramesh Yadav',phone:'9898989898',license:'MH-02-20134567'}, vehicle:{number:'MH04BT1234',model:'Tata Starbus',capacity:50} },
//     { routeNo:'RT-02', name:'Borivali–Kandivali Route', stops:[{stop:'Borivali Station',time:'07:00',fare:900},{stop:'Kandivali',time:'07:20',fare:800},{stop:'Malad',time:'07:35',fare:700}], driver:{name:'Suresh Pawar',phone:'9867452310',license:'MH-04-20189876'}, vehicle:{number:'MH04CD5678',model:'Ashok Leyland',capacity:45} },
//     { routeNo:'RT-03', name:'Thane–Mulund Route', stops:[{stop:'Thane Station',time:'06:50',fare:1100},{stop:'Mulund',time:'07:15',fare:900}], driver:{name:'Prakash Mane',phone:'9765432187',license:'MH-05-20156789'}, vehicle:{number:'MH05EF9012',model:'Eicher Bus',capacity:40} },
//   ]);
//   const transportAssignments = studentDocs.slice(0,15).map(s => ({
//     student: s._id, route: rnd(routeDocs)._id,
//     stop: rnd(['Andheri Station','Kandivali','Thane Station']),
//     fare: rndInt(600,1100),
//   }));
//   await TransportAssignment.insertMany(transportAssignments);
//   console.log(`✓ ${routeDocs.length} routes, ${transportAssignments.length} assignments created`);

//   // ── 15. Leave requests ────────────────────────────────────────
//   const teacherUserIds = teacherUsers.map(t => t._id);
//   const leaveDocs = [];
//   for (let i = 0; i < 12; i++) {
//     const from = daysAgo(rndInt(-5,20));
//     const to   = new Date(from.getTime() + rndInt(1,5)*86400000);
//     leaveDocs.push({
//       applicant: rnd(teacherUserIds), role:'Teacher',
//       type: rnd(LEAVE_TYPES),
//       from, to, days: rndInt(1,5),
//       reason: rnd(['Medical emergency','Personal work','Family function','Health issues','Travel']),
//       status: rnd(['Pending','Pending','Approved','Rejected']),
//       reviewedBy: principalUser._id,
//     });
//   }
//   await Leave.insertMany(leaveDocs);
//   console.log(`✓ ${leaveDocs.length} leave requests created`);

//   // ── 16. Payroll ───────────────────────────────────────────────
//   const months = ['2024-01','2024-02','2024-03'];
//   const payrollDocs = [];
//   for (const t of teacherDocs) {
//     for (const month of months) {
//       const basic = t.salary || 40000;
//       const allow = rndInt(3000,8000);
//       const deduct = rndInt(1000,4000);
//       payrollDocs.push({
//         teacher: t._id, month, basicSalary: basic,
//         allowances: allow, deductions: deduct,
//         netSalary: basic + allow - deduct,
//         status: month === '2024-03' ? rnd(['Pending','Paid']) : 'Paid',
//         paidDate: month !== '2024-03' ? daysAgo(rndInt(1,30)) : null,
//       });
//     }
//   }
//   await Payroll.insertMany(payrollDocs);
//   console.log(`✓ ${payrollDocs.length} payroll records created`);

//   // ── 17. Activity Logs ─────────────────────────────────────────
//   await ActivityLog.insertMany([
//     { user:adminUser._id, action:'User Approved', module:'Registrations', details:'Approved Teacher Anita Desai', createdAt:daysAgo(1) },
//     { user:adminUser._id, action:'Fee Collected', module:'Fees', details:'₹12,000 from Rahul Mehta', createdAt:daysAgo(0) },
//     { user:principalUser._id, action:'Announcement Posted', module:'Announcements', details:'Sports Day notice', createdAt:daysAgo(2) },
//     { user:rnd(teacherUserIds), action:'Attendance Marked', module:'Attendance', details:'Class 10A attendance marked', createdAt:daysAgo(0) },
//     { user:rnd(teacherUserIds), action:'Results Entered', module:'Exams', details:'Unit Test 1 results for Class 10', createdAt:daysAgo(3) },
//   ]);
//   console.log('✓ Activity logs created');

//   // ── 18. Talent Tests ──────────────────────────────────────────
//   await TalentTest.insertMany([
//     {
//       title:'Math Olympiad 2024', standard:'10', subject:'Mathematics',
//       questions:[
//         { question:'If x² + 5x + 6 = 0, find x', options:['x=-2,-3','x=2,3','x=-1,-6','x=1,6'], answer:0, marks:2 },
//         { question:'Area of circle with radius 7cm', options:['154 cm²','144 cm²','164 cm²','174 cm²'], answer:0, marks:2 },
//         { question:'LCM of 12 and 18', options:['24','36','48','72'], answer:1, marks:1 },
//       ],
//       duration:60, date:daysAhead(20), createdBy:adminUser._id,
//     },
//     {
//       title:'Science Quiz 2024', standard:'9', subject:'Science',
//       questions:[
//         { question:'Chemical formula of water', options:['H2O','CO2','NaCl','H2SO4'], answer:0, marks:1 },
//         { question:'Speed of light', options:['3×10⁸ m/s','3×10⁶ m/s','3×10¹⁰ m/s','3×10⁴ m/s'], answer:0, marks:1 },
//         { question:'Photosynthesis occurs in', options:['Mitochondria','Nucleus','Chloroplast','Ribosome'], answer:2, marks:2 },
//       ],
//       duration:45, date:daysAhead(15), createdBy:adminUser._id,
//     },
//   ]);
//   console.log('✓ Talent tests created');

//   console.log('\n🎉 SEED COMPLETE! Login credentials:');
//   console.log('  Admin:     admin@abhyaas.in     / admin123');
//   console.log('  Principal: principal@abhyaas.in / principal123');
//   console.log('  Teacher:   teacher1@abhyaas.in  / teacher123');
//   console.log('  Student:   student1@abhyaas.in  / student123');

//   await mongoose.disconnect();
// }

// seed().catch(err => { console.error(err); process.exit(1); });














// seed/seed.js — Run: npm run seed
// Populates DB with realistic Indian school data for all modules

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Import all models using modern ES Module syntax (Notice the .js extension!)
import {
  User, Student, Teacher, Class, Subject,
  Attendance, Exam, Result, Timetable,
  Fee, Homework, LibraryBook, LibraryIssue,
  Announcement, TransportRoute, TransportAssignment,
  Leave, Payroll, ActivityLog, TalentTest,
} from '../models/index.js';
import FeeStructure from '../models/FeeStructure.js';
import FeePayment from '../models/FeePayment.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://chandini:TestDb321@edumanagercluster.weofmss.mongodb.net/school_management_db?appName=EduManagerCluster';

// ── helpers ──────────────────────────────────────────────────────
const hash = (p) => bcrypt.hashSync(p, 10);
const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rndInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (n) => new Date(Date.now() - n * 86400000);
const daysAhead = (n) => new Date(Date.now() + n * 86400000);

// ── raw data ─────────────────────────────────────────────────────
const STUDENT_NAMES = [
  'Aarav Shah', 'Priya Sharma', 'Rahul Mehta', 'Sneha Patel', 'Arjun Singh',
  'Riya Desai', 'Karan Joshi', 'Pooja Nair', 'Vikram Reddy', 'Ananya Iyer',
  'Rohan Verma', 'Kavya Kumar', 'Aditya Gupta', 'Divya Mishra', 'Nikhil Rao',
  'Sanya Bose', 'Dhruv Khanna', 'Ishita Sen', 'Harsh Trivedi', 'Nisha Pandey',
  'Yash Malhotra', 'Shreya Banerjee', 'Ayush Tiwari', 'Neha Chopra', 'Varun Kapoor',
  'Simran Gill', 'Tanmay Doshi', 'Ruchika Agarwal', 'Siddharth Negi', 'Ankita Rawat',
  'Parth Bhatt', 'Meera Pillai', 'Rishabh Saxena', 'Swati Kulkarni', 'Kunal Bhatia',
  'Deepa Menon', 'Arnav Dubey', 'Shweta Jain', 'Gaurav Thakur', 'Kritika Singh',
];

const TEACHER_NAMES = [
  'Anita Desai', 'Ramesh Kumar', 'Sunita Rao', 'Vikram Joshi', 'Priya Nair',
  'Suresh Patel', 'Meenakshi Iyer', 'Arjun Sharma', 'Geeta Verma', 'Naresh Gupta',
  'Kavitha Menon', 'Rohit Pandey', 'Anjali Singh', 'Dinesh Trivedi', 'Rekha Bose',
];

const SUBJECTS = [
  'Mathematics', 'Science', 'English', 'Hindi', 'Social Studies',
  'Physics', 'Chemistry', 'Biology', 'History', 'Geography',
  'Computer Science', 'Physical Education', 'Art', 'Music',
];

const SECTIONS = ['A', 'B', 'C'];
const STANDARDS = ['KG1', 'KG2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const HOUSES = ['Red House', 'Blue House', 'Green House', 'Yellow House'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const DESIGNATIONS = ['PGT', 'TGT', 'PRT', 'HOD', 'Sr. Lecturer', 'Lecturer'];
const DEPARTMENTS = ['Science', 'Mathematics', 'Humanities', 'Languages', 'Computer Science'];
const FEE_TYPES = ['Tuition', 'Transport', 'Library', 'Lab', 'Sports'];
const LEAVE_TYPES = ['Sick', 'Casual', 'Earned', 'Emergency'];
const BOOK_CATEGORIES = ['Science', 'Mathematics', 'Literature', 'History', 'Computer', 'Reference', 'Fiction'];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected to MongoDB');

  // wipe existing data
  const cols = [
    User, Student, Teacher, Class, Subject, Attendance, Exam, Result,
    Timetable, Fee, Homework, LibraryBook, LibraryIssue, Announcement,
    TransportRoute, TransportAssignment, Leave, Payroll, ActivityLog, TalentTest,
  ];
  for (const M of cols) {
    // COMMENTED OUT TO PREVENT WIPING DATABASE: 
    // await M.deleteMany({});
  }
  console.log('✓ Cleared existing data (DISABLED)');

  // ── 1. Users ─────────────────────────────────────────────────
  const adminUser = await User.create({
    name: 'Super Admin', email: 'admin@abhyaas.in',
    password: hash('admin123'), role: 'Admin',
  });
  const principalUser = await User.create({
    name: 'Dr. K. Ramanathan', email: 'principal@abhyaas.in',
    password: hash('principal123'), role: 'Principal',
  });
  console.log('✓ Admin + Principal users created');

  // ── 2. Subjects ───────────────────────────────────────────────
  const subjectDocs = await Subject.insertMany(
    SUBJECTS.map((name, i) => ({
      name, code: `SUB${String(i + 1).padStart(3, '0')}`,
      standard: rnd(STANDARDS), type: rnd(['Theory', 'Practical', 'Both']),
    }))
  );

  // ── 3. Teachers ───────────────────────────────────────────────
  const teacherUsers = [];
  const teacherDocs = [];
  for (let i = 0; i < TEACHER_NAMES.length; i++) {
    const name = TEACHER_NAMES[i];
    const email = `teacher${i + 1}@abhyaas.in`;
    const u = await User.create({ name, email, password: hash('teacher123'), role: 'Teacher' });
    teacherUsers.push(u);
    const t = await Teacher.create({
      userId: u._id, name, email, phone: `9${rndInt(100000000, 999999999)}`,
      teacherId: `T-${String(i + 1).padStart(3, '0')}`,
      designation: rnd(DESIGNATIONS), department: rnd(DEPARTMENTS),
      subjects: [rnd(SUBJECTS), rnd(SUBJECTS)],
      qualification: rnd(['M.Sc', 'B.Ed', 'M.Ed', 'M.A', 'M.Tech']),
      experience: rndInt(1, 20), salary: rndInt(35000, 80000),
      joinDate: daysAgo(rndInt(100, 2000)),
    });
    teacherDocs.push(t);
  }
  console.log(`✓ ${teacherDocs.length} teachers created`);

  // ── 4. Classes ────────────────────────────────────────────────
  const classDocs = [];
  for (const std of STANDARDS) {
    for (const sec of SECTIONS) {
      const c = await Class.create({
        name: `Class ${std}${sec}`, standard: std, section: sec,
        classTeacher: rnd(teacherDocs)._id,
        subjects: SUBJECTS.slice(0, rndInt(6, 9)),
        room: `Room ${rndInt(101, 320)}`, capacity: 40,
      });
      classDocs.push(c);
      // update teacher classes
      await Teacher.findByIdAndUpdate(rnd(teacherDocs)._id, { $push: { classes: c._id } });
    }
  }
  console.log(`✓ ${classDocs.length} classes created`);

  // ── 5. Students ───────────────────────────────────────────────
  const studentDocs = [];
  let rollCounter = 1001;
  for (let i = 0; i < STUDENT_NAMES.length; i++) {
    const name = STUDENT_NAMES[i];
    const cls = classDocs[i % classDocs.length];
    const email = `student${i + 1}@abhyaas.in`;
    const u = await User.create({ name, email, password: hash('student123'), role: 'Student' });
    const s = await Student.create({
      userId: u._id, rollNo: `S-${rollCounter++}`, name, email,
      phone: `8${rndInt(100000000, 999999999)}`,
      dob: new Date(2007 - rndInt(0, 5), rndInt(0, 11), rndInt(1, 28)),
      gender: rnd(['Male', 'Female']),
      address: `${rndInt(1, 200)}, ${rnd(['MG Road', 'Nehru Nagar', 'Gandhi Colony', 'Patel Street'])}, Mumbai`,
      classId: cls._id, standard: cls.standard, section: cls.section,
      parentName: `${rnd(['Rajesh', 'Suresh', 'Mahesh', 'Dinesh'])} ${name.split(' ')[1]}`,
      parentPhone: `7${rndInt(100000000, 999999999)}`,
      parentEmail: `parent${i + 1}@gmail.com`,
      feeStatus: rnd(['Paid', 'Pending', 'Partial', 'Paid', 'Paid']),
      house: rnd(HOUSES),
      bloodGroup: rnd(BLOOD_GROUPS),
    });
    studentDocs.push(s);
    await Class.findByIdAndUpdate(cls._id, { $push: { students: s._id } });
  }
  console.log(`✓ ${studentDocs.length} students created`);

  // ── 6. Attendance (last 30 days) ──────────────────────────────
  const attendanceDocs = [];
  for (let d = 30; d >= 1; d--) {
    const date = daysAgo(d);
    const dow = date.getDay();
    if (dow === 0) continue; // skip Sunday
    for (const s of studentDocs.slice(0, 20)) { // 20 students for speed
      attendanceDocs.push({
        student: s._id, classId: s.classId, date,
        status: rnd(['Present', 'Present', 'Present', 'Present', 'Absent', 'Late']),
        markedBy: rnd(teacherDocs)._id,
      });
    }
  }
  await Attendance.insertMany(attendanceDocs);
  console.log(`✓ ${attendanceDocs.length} attendance records created`);

  // ── 7. Exams ──────────────────────────────────────────────────
  const examDocs = await Exam.insertMany([
    { name: 'Unit Test 1', type: 'Unit Test', standard: '10', subject: 'Mathematics', date: daysAgo(20), totalMarks: 50, duration: 90 },
    { name: 'Mid Term Exam', type: 'Mid Term', standard: '9', subject: 'Science', date: daysAgo(10), totalMarks: 100, duration: 180 },
    { name: 'Final Exam', type: 'Final', standard: '8', subject: 'English', date: daysAgo(5), totalMarks: 100, duration: 180 },
    { name: 'Unit Test 2', type: 'Unit Test', standard: '10', subject: 'Physics', date: daysAhead(5), totalMarks: 50, duration: 90 },
    { name: 'Science Finals', type: 'Final', standard: '9', subject: 'Chemistry', date: daysAhead(12), totalMarks: 100, duration: 180 },
    { name: 'Math Olympics', type: 'Talent Test', standard: '10', subject: 'Mathematics', date: daysAhead(20), totalMarks: 100, duration: 120 },
  ]);

  // ── 8. Results ────────────────────────────────────────────────
  const resultDocs = [];
  const pastExams = examDocs.filter(e => e.date < new Date());
  for (const exam of pastExams) {
    for (const s of studentDocs.slice(0, 15)) {
      const marks = rndInt(20, exam.totalMarks);
      const pct = (marks / exam.totalMarks) * 100;
      const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : 'F';
      resultDocs.push({ student: s._id, exam: exam._id, marksObtained: marks, totalMarks: exam.totalMarks, grade });
    }
  }
  await Result.insertMany(resultDocs);
  console.log(`✓ ${resultDocs.length} results created`);

  // ── 9. Timetable ──────────────────────────────────────────────
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const TIMES = [
    { s: '08:00', e: '08:45' }, { s: '08:45', e: '09:30' }, { s: '09:30', e: '10:15' },
    { s: '10:30', e: '11:15' }, { s: '11:15', e: '12:00' }, { s: '13:00', e: '13:45' },
    { s: '13:45', e: '14:30' },
  ];
  const ttDocs = [];
  for (const cls of classDocs.slice(0, 5)) {
    for (const day of DAYS) {
      ttDocs.push({
        classId: cls._id, day,
        periods: TIMES.map((t, i) => ({
          periodNo: i + 1,
          subject: rnd(cls.subjects || SUBJECTS),
          teacher: rnd(teacherDocs)._id,
          startTime: t.s, endTime: t.e,
          room: cls.room,
        })),
      });
    }
  }
  await Timetable.insertMany(ttDocs);
  console.log(`✓ Timetable created for ${classDocs.slice(0, 5).length} classes`);

  // ── 10. Fees (FeeStructure and FeePayment) ───────────────────
  // First, generate generic FeeStructures for the standards
  const uniqueStandards = [...new Set(classDocs.map(c => c.standard))];
  const feeStructures = [];
  
  for (const std of uniqueStandards) {
    for (const feeType of FEE_TYPES) {
      const amount = feeType === 'Tuition' ? rndInt(8000, 15000) : rndInt(500, 3000);
      feeStructures.push({
        standard: std, feeType, amount,
        dueDate: daysAhead(rndInt(-30, 30)),
        academicYear: "2025-2026"
      });
    }
  }
  const savedStructures = await FeeStructure.insertMany(feeStructures);
  console.log(`✓ ${savedStructures.length} fee structures created`);

  // Next, create mock payments for students
  const feeDocs = [];
  const feePaymentDocs = [];
  
  for (const s of studentDocs) {
    // Legacy Fee Docs
    for (const feeType of FEE_TYPES) {
      const amount = feeType === 'Tuition' ? rndInt(8000, 15000) : rndInt(500, 3000);
      const isPaid = rnd([true, true, true, false, false]);
      feeDocs.push({
        student: s._id, feeType, amount,
        dueDate: daysAhead(rndInt(-30, 30)),
        status: isPaid ? 'Paid' : rnd(['Pending', 'Overdue']),
        paidAmount: isPaid ? amount : rndInt(0, amount),
        paidDate: isPaid ? daysAgo(rndInt(1, 20)) : null,
        receiptNo: isPaid ? `RCP${rndInt(10000, 99999)}` : null,
        method: rnd(['Cash', 'Online', 'Cheque']),
        collectedBy: adminUser._id,
      });
    }

    // New FeePayment Docs linked to FeeStructures
    const studentStructures = savedStructures.filter(st => st.standard === s.standard);
    for (const st of studentStructures) {
      const isPaid = rnd([true, true, true, false, false]); // 60% chance of payment
      if (isPaid) {
        feePaymentDocs.push({
          studentId: s._id,
          feeStructureId: st._id,
          amountPaid: st.amount,
          discount: 0,
          fine: 0,
          paymentMethod: rnd(['Cash', 'Online', 'Cheque']),
          remarks: 'System Generated'
        });
      }
    }
  }
  await Fee.insertMany(feeDocs);
  await FeePayment.insertMany(feePaymentDocs);
  console.log(`✓ ${feeDocs.length} legacy fee records created`);
  console.log(`✓ ${feePaymentDocs.length} new fee payment records created`);


  // ── 11. Homework ──────────────────────────────────────────────
  const hwDocs = [];
  for (let i = 0; i < 10; i++) {
    const cls = rnd(classDocs);
    hwDocs.push({
      title: `${rnd(SUBJECTS)} Assignment ${i + 1}`,
      description: `Complete exercises from Chapter ${rndInt(1, 10)}. Show all working.`,
      subject: rnd(SUBJECTS),
      classId: cls._id,
      assignedBy: rnd(teacherDocs)._id,
      dueDate: daysAhead(rndInt(1, 10)),
      submissions: studentDocs.slice(0, 5).map(s => ({
        student: s._id,
        submittedAt: daysAgo(rndInt(0, 3)),
        status: rnd(['Submitted', 'Graded']),
        grade: rnd(['A', 'B', 'C']),
      })),
    });
  }
  await Homework.insertMany(hwDocs);
  console.log(`✓ ${hwDocs.length} homework records created`);

  // ── 12. Library ───────────────────────────────────────────────
  const BOOKS = [
    { title: 'NCERT Mathematics Class 10', author: 'NCERT Board', isbn: '978-8174502087' },
    { title: 'NCERT Science Class 9', author: 'NCERT Board', isbn: '978-8174504746' },
    { title: 'Wings of Fire', author: 'Dr. A.P.J. Abdul Kalam', isbn: '978-8173711466' },
    { title: 'Discovery of India', author: 'Jawaharlal Nehru', isbn: '978-0143031031' },
    { title: 'Introduction to Algorithms', author: 'Cormen et al.', isbn: '978-0262033848' },
    { title: 'The Guide', author: 'R.K. Narayan', isbn: '978-0143068426' },
    { title: 'Malgudi Days', author: 'R.K. Narayan', isbn: '978-0143030195' },
    { title: 'India After Gandhi', author: 'Ramachandra Guha', isbn: '978-0330396110' },
    { title: 'Five Point Someone', author: 'Chetan Bhagat', isbn: '978-8129104595' },
    { title: 'The Alchemist', author: 'Paulo Coelho', isbn: '978-0062315007' },
    { title: 'Physics NCERT Class 12 Part 1', author: 'NCERT', isbn: '978-8174506177' },
    { title: 'Chemistry NCERT Class 11', author: 'NCERT', isbn: '978-8174504630' },
  ];
  const bookDocs = await LibraryBook.insertMany(
    BOOKS.map(b => ({ ...b, category: rnd(BOOK_CATEGORIES), copies: rndInt(2, 8), available: rndInt(1, 5), publisher: rnd(['NCERT', 'Penguin', 'HarperCollins', 'Oxford']), year: rndInt(2005, 2022), shelfNo: `S${rndInt(1, 20)}-${rndInt(1, 5)}` }))
  );
  const issueDocs = [];
  for (let i = 0; i < 15; i++) {
    const issued = daysAgo(rndInt(1, 20));
    const due = new Date(issued.getTime() + 14 * 86400000);
    const isRet = rnd([true, false]);
    issueDocs.push({
      book: rnd(bookDocs)._id, student: rnd(studentDocs)._id,
      issuedDate: issued, dueDate: due,
      returnDate: isRet ? daysAgo(rndInt(0, 5)) : null,
      status: isRet ? 'Returned' : due < new Date() ? 'Overdue' : 'Issued',
      fine: due < new Date() && !isRet ? rndInt(5, 50) : 0,
      issuedBy: adminUser._id,
    });
  }
  await LibraryIssue.insertMany(issueDocs);
  console.log(`✓ ${bookDocs.length} books, ${issueDocs.length} issues created`);

  // ── 13. Announcements ─────────────────────────────────────────
  await Announcement.insertMany([
    { title: 'Annual Sports Day', content: 'Annual Sports Day will be held on March 8th. All students must participate.', audience: ['All'], priority: 'Important', postedBy: principalUser._id, expiresAt: daysAhead(30) },
    { title: 'Fee Submission Reminder', content: 'Last date for fee submission is March 15. Late fees of ₹50/day will apply.', audience: ['Student', 'Parent'], priority: 'Urgent', postedBy: adminUser._id, expiresAt: daysAhead(15) },
    { title: 'Staff Meeting', content: 'Mandatory staff meeting on Saturday at 2 PM in the conference hall.', audience: ['Teacher', 'Admin'], priority: 'Important', postedBy: principalUser._id },
    { title: 'Parent-Teacher Meet', content: 'Parent-Teacher meet scheduled for March 12. Attendance is compulsory.', audience: ['All'], priority: 'Normal', postedBy: principalUser._id, expiresAt: daysAhead(20) },
    { title: 'Holiday Notice', content: 'School will remain closed on March 25 on account of Holi.', audience: ['All'], priority: 'Normal', postedBy: adminUser._id, expiresAt: daysAhead(25) },
  ]);
  console.log('✓ Announcements created');

  // ── 14. Transport ─────────────────────────────────────────────
  const routeDocs = await TransportRoute.insertMany([
    { routeNo: 'RT-01', name: 'Andheri–Bandra Route', stops: [{ stop: 'Andheri Station', time: '07:00', fare: 800 }, { stop: 'Vile Parle', time: '07:15', fare: 700 }, { stop: 'Santacruz', time: '07:30', fare: 600 }], driver: { name: 'Ramesh Yadav', phone: '9898989898', license: 'MH-02-20134567' }, vehicle: { number: 'MH04BT1234', model: 'Tata Starbus', capacity: 50 } },
    { routeNo: 'RT-02', name: 'Borivali–Kandivali Route', stops: [{ stop: 'Borivali Station', time: '07:00', fare: 900 }, { stop: 'Kandivali', time: '07:20', fare: 800 }, { stop: 'Malad', time: '07:35', fare: 700 }], driver: { name: 'Suresh Pawar', phone: '9867452310', license: 'MH-04-20189876' }, vehicle: { number: 'MH04CD5678', model: 'Ashok Leyland', capacity: 45 } },
    { routeNo: 'RT-03', name: 'Thane–Mulund Route', stops: [{ stop: 'Thane Station', time: '06:50', fare: 1100 }, { stop: 'Mulund', time: '07:15', fare: 900 }], driver: { name: 'Prakash Mane', phone: '9765432187', license: 'MH-05-20156789' }, vehicle: { number: 'MH05EF9012', model: 'Eicher Bus', capacity: 40 } },
  ]);
  const transportAssignments = studentDocs.slice(0, 15).map(s => ({
    student: s._id, route: rnd(routeDocs)._id,
    stop: rnd(['Andheri Station', 'Kandivali', 'Thane Station']),
    fare: rndInt(600, 1100),
  }));
  await TransportAssignment.insertMany(transportAssignments);
  console.log(`✓ ${routeDocs.length} routes, ${transportAssignments.length} assignments created`);

  // ── 15. Leave requests ────────────────────────────────────────
  const teacherUserIds = teacherUsers.map(t => t._id);
  const leaveDocs = [];
  for (let i = 0; i < 12; i++) {
    const from = daysAgo(rndInt(-5, 20));
    const to = new Date(from.getTime() + rndInt(1, 5) * 86400000);
    leaveDocs.push({
      applicant: rnd(teacherUserIds), role: 'Teacher',
      type: rnd(LEAVE_TYPES),
      from, to, days: rndInt(1, 5),
      reason: rnd(['Medical emergency', 'Personal work', 'Family function', 'Health issues', 'Travel']),
      status: rnd(['Pending', 'Pending', 'Approved', 'Rejected']),
      reviewedBy: principalUser._id,
    });
  }
  await Leave.insertMany(leaveDocs);
  console.log(`✓ ${leaveDocs.length} leave requests created`);

  // ── 16. Payroll ───────────────────────────────────────────────
  const months = ['2024-01', '2024-02', '2024-03'];
  const payrollDocs = [];
  for (const t of teacherDocs) {
    for (const month of months) {
      const basic = t.salary || 40000;
      const allow = rndInt(3000, 8000);
      const deduct = rndInt(1000, 4000);
      payrollDocs.push({
        teacher: t._id, month, basicSalary: basic,
        allowances: allow, deductions: deduct,
        netSalary: basic + allow - deduct,
        status: month === '2024-03' ? rnd(['Pending', 'Paid']) : 'Paid',
        paidDate: month !== '2024-03' ? daysAgo(rndInt(1, 30)) : null,
      });
    }
  }
  await Payroll.insertMany(payrollDocs);
  console.log(`✓ ${payrollDocs.length} payroll records created`);

  // ── 17. Activity Logs ─────────────────────────────────────────
  await ActivityLog.insertMany([
    { user: adminUser._id, action: 'User Approved', module: 'Registrations', details: 'Approved Teacher Anita Desai', createdAt: daysAgo(1) },
    { user: adminUser._id, action: 'Fee Collected', module: 'Fees', details: '₹12,000 from Rahul Mehta', createdAt: daysAgo(0) },
    { user: principalUser._id, action: 'Announcement Posted', module: 'Announcements', details: 'Sports Day notice', createdAt: daysAgo(2) },
    { user: rnd(teacherUserIds), action: 'Attendance Marked', module: 'Attendance', details: 'Class 10A attendance marked', createdAt: daysAgo(0) },
    { user: rnd(teacherUserIds), action: 'Results Entered', module: 'Exams', details: 'Unit Test 1 results for Class 10', createdAt: daysAgo(3) },
  ]);
  console.log('✓ Activity logs created');

  // ── 18. Talent Tests ──────────────────────────────────────────
  await TalentTest.insertMany([
    {
      title: 'Math Olympiad 2024', standard: '10', subject: 'Mathematics',
      questions: [
        { question: 'If x² + 5x + 6 = 0, find x', options: ['x=-2,-3', 'x=2,3', 'x=-1,-6', 'x=1,6'], answer: 0, marks: 2 },
        { question: 'Area of circle with radius 7cm', options: ['154 cm²', '144 cm²', '164 cm²', '174 cm²'], answer: 0, marks: 2 },
        { question: 'LCM of 12 and 18', options: ['24', '36', '48', '72'], answer: 1, marks: 1 },
      ],
      duration: 60, date: daysAhead(20), createdBy: adminUser._id,
    },
    {
      title: 'Science Quiz 2024', standard: '9', subject: 'Science',
      questions: [
        { question: 'Chemical formula of water', options: ['H2O', 'CO2', 'NaCl', 'H2SO4'], answer: 0, marks: 1 },
        { question: 'Speed of light', options: ['3×10⁸ m/s', '3×10⁶ m/s', '3×10¹⁰ m/s', '3×10⁴ m/s'], answer: 0, marks: 1 },
        { question: 'Photosynthesis occurs in', options: ['Mitochondria', 'Nucleus', 'Chloroplast', 'Ribosome'], answer: 2, marks: 2 },
      ],
      duration: 45, date: daysAhead(15), createdBy: adminUser._id,
    },
  ]);
  console.log('✓ Talent tests created');

  console.log('\n🎉 SEED COMPLETE! Login credentials:');
  console.log('  Admin:     admin@abhyaas.in     / admin123');
  console.log('  Principal: principal@abhyaas.in / principal123');
  console.log('  Teacher:   teacher1@abhyaas.in  / teacher123');
  console.log('  Student:   student1@abhyaas.in  / student123');

  await mongoose.disconnect();
}

// seed().catch(err => { console.error(err); process.exit(1); });