// ═══════════════════════════════════════════════════════════════════
// models/index.js  — All Mongoose schemas for Abhyaas School ERP
// ═══════════════════════════════════════════════════════════════════
import mongoose from 'mongoose';
const { Schema } = mongoose;

// ─── CENTRAL AUTH (Multi-tenant directory) ──────────────────────
const CentralAuthSchema = new Schema({
  loginId: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  tenantId: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Principal', 'Teacher', 'Student'], required: true },
  userRef: { type: Schema.Types.ObjectId, required: true }
}, { timestamps: true });

// ─── ACADEMIC YEAR (Centralized Table) ──────────────────────────
const AcademicYearSchema = new Schema({
  name: { type: String, required: true, unique: true }, // e.g., "2024-2025"
  startDate: { type: Date },
  endDate: { type: Date },
  isActive: { type: Boolean, default: false },
}, { timestamps: true });

// ─── USER (auth base) ────────────────────────────────────────────
const UserSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Principal', 'Teacher', 'Student', 'Parent'], required: true },
  profilePhotoUrl: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true, collection: 'abhyaas_users' });

// ─── STUDENT ─────────────────────────────────────────────────────
const StudentSchema = new Schema({
  // 1. CORE STATIC PROFILE (Things that never change year-to-year)
  name: { type: String, required: true },
  email: { type: String, lowercase: true },
  phone: { type: String },
  dob: { type: Date },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  bloodGroup: { type: String },
  parentName: { type: String }, // maintained for combined display
  fatherName: { type: String },
  motherName: { type: String },
  parentPhone: { type: String },
  parentEmail: { type: String },
  house: { type: String },
  admissionDate: { type: Date, default: Date.now },
  profilePhotoUrl: { type: String, default: '' },
  loginId: { type: String, unique: true, sparse: true }, // generated once at admission

  // 2. ACADEMIC LEDGER (History of classes/years)
  academicHistory: [{
    academicYear: { type: String, required: true }, // e.g. "2024-2025"
    classId: { type: Schema.Types.ObjectId, ref: 'Class' },
    standard: { type: String },
    section: { type: String },
    status: { type: String, enum: ['Active', 'Promoted', 'Graduated', 'Left'], default: 'Active' }
  }],

  // 3. LEGACY COMPATIBILITY (Keep for existing queries)
  classId: { type: Schema.Types.ObjectId, ref: 'Class' },
  standard: { type: String },
  section: { type: String },
  rollNo: { type: String }, // Legacy, replaced by loginId for uniqueness
  
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// ─── TEACHER ─────────────────────────────────────────────────────
const TeacherSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  teacherId: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  designation: { type: String },
  department: { type: String },
  subjects: [{ type: String }],
  classes: [{ type: Schema.Types.ObjectId, ref: 'Class' }],
  qualification: { type: String },
  experience: { type: Number, default: 0 }, // years
  joinDate: { type: Date, default: Date.now },
  salary: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// ─── CLASS ────────────────────────────────────────────────────────
const ClassSchema = new Schema({
  name: { type: String, required: true },   // "Class 10A"
  standard: { type: String, required: true },   // "10"
  section: { type: String, required: true },   // "A"
  classTeacher: { type: Schema.Types.ObjectId, ref: 'Teacher' },
  subjects: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],
  room: { type: String },
  capacity: { type: Number, default: 40 },
  students: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
}, { timestamps: true });

// ─── HOUSE ────────────────────────────────────────────────────────
const HouseSchema = new Schema({
  name: { type: String, required: true, unique: true },
  color: { type: String, required: true },
  emoji: { type: String },
}, { timestamps: true });

// ─── SUBJECT ──────────────────────────────────────────────────────
const SubjectSchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  standard: { type: String },
  teacher: { type: Schema.Types.ObjectId, ref: 'Teacher' },
  type: { type: String, enum: ['Theory', 'Practical', 'Both'], default: 'Theory' },
}, { timestamps: true });

// ─── ATTENDANCE ───────────────────────────────────────────────────
const AttendanceSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['Present', 'Absent', 'Late', 'Holiday'], default: 'Present' },
  markedBy: { type: Schema.Types.ObjectId, ref: 'Teacher' },
  remarks: { type: String },
  academicYear: { type: String, required: true, default: '2025-2026' },
}, { timestamps: true, collection: 'abhyaas_attendance' });

// ─── EXAM ─────────────────────────────────────────────────────────
const ExamSchema = new Schema({
  name: { type: String, required: true },   // "Unit Test 1"
  type: { type: String, enum: ['Unit Test', 'Mid Term', 'Final', 'Talent Test'], default: 'Unit Test' },
  standard: { type: String },
  subject: { type: String },
  date: { type: Date, required: true },
  totalMarks: { type: Number, default: 100 },
  duration: { type: Number, default: 180 },     // minutes
  venue: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Teacher' },
  academicYear: { type: String, required: true, default: '2025-2026' },
}, { timestamps: true });

// ─── RESULT ───────────────────────────────────────────────────────
const ResultSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  exam: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
  marksObtained: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  grade: { type: String },
  remarks: { type: String },
  enteredBy: { type: Schema.Types.ObjectId, ref: 'Teacher' },
  academicYear: { type: String, required: true, default: '2025-2026' },
}, { timestamps: true });

// ─── TIMETABLE ────────────────────────────────────────────────────
const TimetableSchema = new Schema({
  classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], required: true },
  periods: [{
    periodNo: Number,
    subject: String,
    teacher: { type: Schema.Types.ObjectId, ref: 'Teacher' },
    startTime: String,
    endTime: String,
    room: String,
  }],
}, { timestamps: true });

// ─── FEE ─────────────────────────────────────────────────────────
const FeeSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  feeType: { type: String, required: true }, // Removed strict enum for more flexibility
  totalAmount: { type: Number, required: true }, // Renamed from amount
  paidAmount: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 },
  dueDate: { type: Date, required: true },
  paidDate: { type: Date },
  status: { type: String, enum: ['Paid', 'Pending', 'Overdue', 'Partial'], default: 'Pending' },
  receiptNo: { type: String },
  method: { type: String, enum: ['Cash', 'Online', 'Cheque', 'DD'], default: 'Cash' },
  collectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  remarks: { type: String },
  academicYear: { type: String, required: true, default: '2025-2026' },
}, { timestamps: true });

// 🚀 AUTO-CALCULATE BALANCE AND STATUS
FeeSchema.pre('save', function(next) {
  this.balanceDue = (this.totalAmount || 0) - (this.paidAmount || 0);
  
  if (this.paidAmount >= this.totalAmount) {
    this.status = 'Paid';
  } else if (this.paidAmount > 0) {
    this.status = 'Partial';
  } else if (this.dueDate && new Date(this.dueDate) < new Date()) {
    this.status = 'Overdue';
  } else {
    this.status = 'Pending';
  }
  next();
});

// ─── FEE STRUCTURE ───────────────────────────────────────────────
const FeeStructureSchema = new Schema({
    standard: { type: String, required: true }, // e.g., "10"
    feeType: { type: String, required: true },  // e.g., "Tuition Fee", "Transport"
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    academicYear: { type: String, default: "2025-2026" }
}, { timestamps: true });

// ─── FEE PAYMENT ──────────────────────────────────────────────────
const FeePaymentSchema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    feeStructureId: { type: Schema.Types.ObjectId, ref: 'FeeStructure', required: true },
    amountPaid: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    fine: { type: Number, default: 0 },
    paymentDate: { type: Date, default: Date.now },
    paymentMethod: { type: String, enum: ['Cash', 'Online', 'Cheque'], default: 'Cash' },
    transactionId: { type: String },
    remarks: { type: String },
    academicYear: { type: String, required: true, default: '2025-2026' },
}, { timestamps: true });

// ─── HOMEWORK ─────────────────────────────────────────────────────
const HomeworkSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  subject: { type: String, required: true },
  classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  assignedBy: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
  dueDate: { type: Date, required: true },
  attachmentUrl: { type: String },
  submissions: [{
    student: { type: Schema.Types.ObjectId, ref: 'Student' },
    submittedAt: { type: Date },
    fileUrl: { type: String },
    remarks: { type: String },
    grade: { type: String },
    status: { type: String, enum: ['Submitted', 'Graded', 'Late'], default: 'Submitted' },
  }],
}, { timestamps: true });

// ─── LIBRARY ──────────────────────────────────────────────────────
const LibraryBookSchema = new Schema({
  title: { type: String, required: true },
  author: { type: String },
  isbn: { type: String, unique: true },
  category: { type: String },
  publisher: { type: String },
  year: { type: Number },
  copies: { type: Number, default: 1 },
  available: { type: Number, default: 1 },
  shelfNo: { type: String },
}, { timestamps: true });

const LibraryIssueSchema = new Schema({
  book: { type: Schema.Types.ObjectId, ref: 'LibraryBook', required: true },
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  issuedDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  returnDate: { type: Date },
  status: { type: String, enum: ['Issued', 'Returned', 'Overdue'], default: 'Issued' },
  fine: { type: Number, default: 0 },
  issuedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// ─── ANNOUNCEMENT ─────────────────────────────────────────────────
const AnnouncementSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  audience: [{ type: String, enum: ['All', 'Admin', 'Teacher', 'Student', 'Parent'] }],
  priority: { type: String, enum: ['Normal', 'Important', 'Urgent'], default: 'Normal' },
  postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isBroadcast: { type: Boolean, default: false },
  expiresAt: { type: Date },
  attachmentUrl: { type: String },
}, { timestamps: true });

// ─── TRANSPORT ────────────────────────────────────────────────────
const TransportRouteSchema = new Schema({
  routeNo: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  stops: [{ stop: String, time: String, fare: Number }],
  driver: { name: String, phone: String, license: String },
  vehicle: { number: String, model: String, capacity: Number },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const TransportAssignmentSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  route: { type: Schema.Types.ObjectId, ref: 'TransportRoute', required: true },
  stop: { type: String },
  fare: { type: Number },
}, { timestamps: true });

// ─── LEAVE ────────────────────────────────────────────────────────
const LeaveSchema = new Schema({
  applicant: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String },
  type: { type: String, enum: ['Sick', 'Casual', 'Earned', 'Maternity', 'Emergency'], default: 'Casual' },
  from: { type: Date, required: true },
  to: { type: Date, required: true },
  days: { type: Number },
  reason: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewNote: { type: String },
}, { timestamps: true });

// ─── PAYROLL ──────────────────────────────────────────────────────
const PayrollSchema = new Schema({
  teacher: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
  month: { type: String, required: true },  // "2024-03"
  basicSalary: { type: Number, default: 0 },
  allowances: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  netSalary: { type: Number, default: 0 },
  status: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
  paidDate: { type: Date },
  remarks: { type: String },
}, { timestamps: true });

// ─── ACTIVITY LOG ─────────────────────────────────────────────────
const ActivityLogSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  module: { type: String },
  details: { type: String },
  ip: { type: String },
}, { timestamps: true });

// ─── TALENT TEST ──────────────────────────────────────────────────
const TalentTestSchema = new Schema({
  title: { type: String, required: true },
  standard: { type: String },
  subject: { type: String },
  questions: [{
    question: String,
    options: [String],
    answer: Number,  // index of correct option
    marks: { type: Number, default: 1 },
  }],
  duration: { type: Number, default: 60 }, // minutes
  date: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// ─── PENDING REGISTRATION ─────────────────────────────────────────
const PendingRegistrationSchema = new Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  rollNo: String,
  standard: String,
  section: String,
  classId: String,
  teacherId: String,
  designation: String,
  adminId: String,
  accessLevel: String,
  principalId: String,
  experience: String,
  profilePhotoUrl: String,
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
}, { timestamps: true });

// ─── ADMIN PROFILE ──────────────────────────────────────────────
const AdminProfileSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    school_id: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    adminId: { type: String },
    designation: { type: String },
    accessLevel: { type: String, enum: ['Super Admin', 'Staff Admin'] },
    mobile: { type: String },
    address: { type: String },
    username: { type: String },
    profilePhotoUrl: { type: String }
}, { timestamps: true });

// ─── PRINCIPAL ──────────────────────────────────────────────────
const PrincipalSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    school_id: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    principalId: { type: String },
    qualification: { type: String },
    experience: { type: String },
    joiningDate: { type: Date },
    officeContact: { type: String },
    officeAddress: { type: String },
    mobile: { type: String },
    address: { type: String },
    username: { type: String },
    profilePhotoUrl: { type: String }
}, { timestamps: true });

// ─── SCHOOL ─────────────────────────────────────────────────────
const SchoolSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    address: { type: String },
    logoUrl: { type: String },
    subscriptionStatus: { type: String, enum: ['Active', 'Inactive', 'Trial'], default: 'Trial' },
    tenantDomain: { type: String, unique: true, sparse: true }
}, { timestamps: true });

// ─── INVENTORY ──────────────────────────────────────────────────
const InventorySchema = new Schema({
    itemId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    unit: { type: String, required: true },
    quantity: { type: Number, required: true, default: 0 },
    threshold: { type: Number, required: true, default: 10 },
    good: { type: Number, default: 0 },
    inUse: { type: Number, default: 0 },
    bad: { type: Number, default: 0 },
    maintenance: { type: Number, default: 0 },
    status: { type: String, enum: ['In Stock', 'Low Stock', 'Out of Stock'], default: 'In Stock' }
}, { timestamps: true });

// ─── INVENTORY CATEGORY ──────────────────────────────────────────
const InventoryCategorySchema = new Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

// ─── INVENTORY TRANSACTION ──────────────────────────────────────
const InventoryTransactionSchema = new Schema({
    item: { type: Schema.Types.ObjectId, ref: 'Inventory', required: true },
    type: { type: String, enum: ['IN', 'OUT', 'ISSUE', 'RETURN'], required: true },
    quantity: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    issuedTo: { type: String },
    remarks: { type: String },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// ─── REGISTRATION (Alternative/Legacy) ───────────────────────────
const RegistrationSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    role: { type: String, enum: ['Student', 'Teacher', 'Admin', 'Principal'], required: true },
    profilePhotoUrl: { type: String },
    standard: { type: String },
    section: { type: String },
    dob: { type: Date },
    gender: { type: String },
    fatherName: { type: String },
    motherName: { type: String },
    house: { type: String },
    admissionDate: { type: Date },
    department: { type: String },
    experience: { type: Number },
    qualification: { type: String },
    address: { type: String },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
}, { timestamps: true });

// ─── MARK SHEET ──────────────────────────────────────────────────
const MarkSchema = new Schema({
  examTitle: { type: String, required: true },
  examType: { type: String },
  standard: { type: String, required: true },
  subject: { type: String, required: true },
  maxMarks: { type: Number, required: true },
  academicYear: { type: String, required: true },
  records: [{
    studentId: { type: Schema.Types.ObjectId, ref: 'Student' },
    studentName: String,
    rollNo: String,
    marksObtained: Number,
    isAbsent: { type: Boolean, default: false }
  }]
}, { timestamps: true });

// ─── ADMISSION ───────────────────────────────────────────────────
const AdmissionSchema = new Schema({
  parentName: { type: String, required: true },
  mobile: { type: String, required: true },
  studentName: { type: String },
  className: { type: String, required: true },
  message: { type: String },
  status: { type: String, enum: ['Pending', 'Contacted', 'Accepted', 'Rejected'], default: 'Pending' }
}, { timestamps: true });

// ─── OTP SCHEMA ──────────────────────────────────────────────────
const OTPSchema = new Schema({
  loginId: { type: String, required: true },
  email: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 } // TTL: auto-delete after 10 minutes
});

// ─── AI LEARNING HUB ─────────────────────────────────────────────
const StudentNoteSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  title: { type: String, required: true },
  summary: { type: String },
  originalFileUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const NoteChunkSchema = new Schema({
  noteId: { type: Schema.Types.ObjectId, ref: 'StudentNote', required: true },
  chunkIndex: { type: Number, required: true },
  text: { type: String, required: true }
});

// ─── COMPILE MODELS WITH SAFETY CHECKS ────────────────────────────
export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Student = mongoose.models.Student || mongoose.model('Student', StudentSchema);
export const StudentNote = mongoose.models.StudentNote || mongoose.model('StudentNote', StudentNoteSchema);
export const NoteChunk = mongoose.models.NoteChunk || mongoose.model('NoteChunk', NoteChunkSchema);
export const Teacher = mongoose.models.Teacher || mongoose.model('Teacher', TeacherSchema);
export const Class = mongoose.models.Class || mongoose.model('Class', ClassSchema);
export const House = mongoose.models.House || mongoose.model('House', HouseSchema);
export const Subject = mongoose.models.Subject || mongoose.model('Subject', SubjectSchema);
export const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
export const Exam = mongoose.models.Exam || mongoose.model('Exam', ExamSchema);
export const Result = mongoose.models.Result || mongoose.model('Result', ResultSchema);
export const Timetable = mongoose.models.Timetable || mongoose.model('Timetable', TimetableSchema);
export const Fee = mongoose.models.Fee || mongoose.model('Fee', FeeSchema);
export const Homework = mongoose.models.Homework || mongoose.model('Homework', HomeworkSchema);
export const LibraryBook = mongoose.models.LibraryBook || mongoose.model('LibraryBook', LibraryBookSchema);
export const LibraryIssue = mongoose.models.LibraryIssue || mongoose.model('LibraryIssue', LibraryIssueSchema);
export const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema);
export const TransportRoute = mongoose.models.TransportRoute || mongoose.model('TransportRoute', TransportRouteSchema);
export const TransportAssignment = mongoose.models.TransportAssignment || mongoose.model('TransportAssignment', TransportAssignmentSchema);
export const Leave = mongoose.models.Leave || mongoose.model('Leave', LeaveSchema);
export const Payroll = mongoose.models.Payroll || mongoose.model('Payroll', PayrollSchema);
export const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);
export const TalentTest = mongoose.models.TalentTest || mongoose.model('TalentTest', TalentTestSchema);
export const FeePayment = mongoose.models.FeePayment || mongoose.model('FeePayment', FeePaymentSchema);
export const Registration = mongoose.models.Registration || mongoose.model('Registration', RegistrationSchema);
export const AdminProfile = mongoose.models.AdminProfile || mongoose.model('AdminProfile', AdminProfileSchema);
export const Principal = mongoose.models.Principal || mongoose.model('Principal', PrincipalSchema);
export const School = mongoose.models.School || mongoose.model('School', SchoolSchema);
export const Inventory = mongoose.models.Inventory || mongoose.model('Inventory', InventorySchema);
export const InventoryCategory = mongoose.models.InventoryCategory || mongoose.model('InventoryCategory', InventoryCategorySchema);
export const InventoryTransaction = mongoose.models.InventoryTransaction || mongoose.model('InventoryTransaction', InventoryTransactionSchema);
export const PendingRegistration = mongoose.models.PendingRegistration || mongoose.model('PendingRegistration', PendingRegistrationSchema);
export const CentralAuth = mongoose.models.CentralAuth || mongoose.model('CentralAuth', CentralAuthSchema);
export const AcademicYear = mongoose.models.AcademicYear || mongoose.model('AcademicYear', AcademicYearSchema);
export const FeeStructure = mongoose.models.FeeStructure || mongoose.model('FeeStructure', FeeStructureSchema);
export const Mark = mongoose.models.Mark || mongoose.model('Mark', MarkSchema);
export const Admission = mongoose.models.Admission || mongoose.model('Admission', AdmissionSchema);
export const OTP = mongoose.models.OTP || mongoose.model('OTP', OTPSchema);

export default mongoose;