import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Teacher, Subject, Class } from '../models/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27015/abhyaas-erp-acem';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Create Teachers
    const teachers = [
      { name: 'Dr. Ramesh Kumar', mobile: '9876543210', email: 'ramesh@school.com', department: 'Science', subjects: ['Physics', 'Science'] },
      { name: 'Mrs. Anita Sharma', mobile: '9876543211', email: 'anita@school.com', department: 'Math', subjects: ['Mathematics', 'Algebra'] },
      { name: 'Mr. David Wilson', mobile: '9876543212', email: 'david@school.com', department: 'English', subjects: ['English', 'Literature'] },
      { name: 'Mr. Rahul Verma', mobile: '9876543213', email: 'rahul@school.com', department: 'Computer', subjects: ['Computer', 'IT'] },
      { name: 'Ms. Sneh Lata', mobile: '9876543214', email: 'sneh@school.com', department: 'Social', subjects: ['Social Studies', 'History'] },
      { name: 'Mr. Amit Singh', mobile: '9876543215', email: 'amit@school.com', department: 'Science', subjects: ['Biology', 'Science'] },
      { name: 'Mrs. Pooja Gupta', mobile: '9876543216', email: 'pooja@school.com', department: 'Math', subjects: ['Mathematics', 'Geometry'] },
      { name: 'Ms. Sarah Jones', mobile: '9876543217', email: 'sarah@school.com', department: 'English', subjects: ['English', 'Grammar'] },
      { name: 'Mr. Kevin Peters', mobile: '9876543218', email: 'kevin@school.com', department: 'Sports', subjects: ['PE', 'Games'] },
      { name: 'Mrs. Meera Nair', mobile: '9876543219', email: 'meera@school.com', department: 'Arts', subjects: ['Art', 'Craft'] },
      { name: 'Mr. Vikram Rathore', mobile: '9876543220', email: 'vikram@school.com', department: 'Social', subjects: ['Geography', 'Civics'] },
      { name: 'Ms. Deepa Reddy', mobile: '9876543221', email: 'deepa@school.com', department: 'Science', subjects: ['Chemistry', 'Science'] },
      { name: 'Mr. John Miller', mobile: '9876543222', email: 'john@school.com', department: 'Math', subjects: ['Mathematics', 'Calculus'] },
      { name: 'Mrs. Sunita Rao', mobile: '9876543223', email: 'sunita@school.com', department: 'Languages', subjects: ['Hindi', 'Sanskrit'] },
      { name: 'Mr. Robert Fox', mobile: '9876543224', email: 'robert@school.com', department: 'Music', subjects: ['Music', 'Instruments'] },
      { name: 'Ms. Kavita Jain', mobile: '9876543225', email: 'kavita@school.com', department: 'Science', subjects: ['Physics', 'Science'] },
      { name: 'Mr. Sanjay Dutt', mobile: '9876543226', email: 'sanjay@school.com', department: 'Math', subjects: ['Mathematics', 'Statistics'] },
      { name: 'Mrs. Alice Brown', mobile: '9876543227', email: 'alice@school.com', department: 'English', subjects: ['English', 'Composition'] },
      { name: 'Mr. Tom Hardy', mobile: '9876543228', email: 'tom@school.com', department: 'Computer', subjects: ['Computer', 'Coding'] },
      { name: 'Ms. Priya Mani', mobile: '9876543229', email: 'priya@school.com', department: 'Social', subjects: ['Social Studies', 'History'] },
      { name: 'Mr. Gary Oldman', mobile: '9876543230', email: 'gary@school.com', department: 'Science', subjects: ['Biology', 'Environments'] },
      { name: 'Mrs. Helen Mirren', mobile: '9876543231', email: 'helen@school.com', department: 'Math', subjects: ['Mathematics', 'Applied'] },
      { name: 'Ms. Emma Stone', mobile: '9876543232', email: 'emma@school.com', department: 'Arts', subjects: ['Drama', 'Arts'] },
      { name: 'Mr. Chris Pratt', mobile: '9876543233', email: 'chris@school.com', department: 'Sports', subjects: ['PE', 'Fitness'] },
      { name: 'Mrs. Meryl Streep', mobile: '9876543234', email: 'meryl@school.com', department: 'Languages', subjects: ['French', 'Spanish'] }
    ];

    console.log('🌱 Seeding Teachers...');
    for (const t of teachers) {
      await Teacher.findOneAndUpdate({ email: t.email }, t, { upsert: true, new: true });
    }
    const seededTeachers = await Teacher.find({ email: { $in: teachers.map(d => d.email) } });
    console.log(`✅ Seeded ${seededTeachers.length} teachers.`);

    // 2. Create Global Subjects (Templates)
    const subjectsData = [
      { name: 'Mathematics', code: 'MATH-GEN', type: 'Theory', standard: 'All' },
      { name: 'Physics', code: 'PHYS-GEN', type: 'Both', standard: 'All' },
      { name: 'Chemistry', code: 'CHEM-GEN', type: 'Both', standard: 'All' },
      { name: 'English', code: 'ENG-GEN', type: 'Theory', standard: 'All' },
      { name: 'Computer Science', code: 'CS-GEN', type: 'Practical', standard: 'All' },
    ];

    console.log('🌱 Seeding Global Subjects...');
    for (const s of subjectsData) {
      await Subject.findOneAndUpdate({ code: s.code }, s, { upsert: true });
    }
    console.log('✅ Seeded global subjects.');

    console.log('\n✨ Seeding Complete!');
    console.log('👉 You can now go to "View Classes", pick a class, and see the auto-generated subjects.');
    console.log('👉 Then, go to "Subjects" module to assign the newly seeded teachers to those subjects.');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
