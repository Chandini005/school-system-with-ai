import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Subject, Class, Teacher } from './backend/models/index.js';
import path from 'path';

dotenv.config({ path: './backend/.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27015/abhyaas-erp-acem';

async function check() {
  try {
    await mongoose.connect(MONGO_URI);
    const subjectCount = await Subject.countDocuments();
    const classCount = await Class.countDocuments();
    const teacherCount = await Teacher.countDocuments();
    
    console.log(`Subjects: ${subjectCount}`);
    console.log(`Classes: ${classCount}`);
    console.log(`Teachers: ${teacherCount}`);
    
    if (subjectCount > 0) {
      const sample = await Subject.findOne().populate('teacher');
      console.log('Sample Subject:', JSON.stringify(sample, null, 2));
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
