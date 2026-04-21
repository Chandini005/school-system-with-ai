import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Class, Teacher, Subject } from './backend/models/index.js';

dotenv.config({ path: './backend/.env' });

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const classes = await Class.find().populate('subjects');
    const teachers = await Teacher.find();
    
    console.log(`Classes: ${classes.length}`);
    console.log(`Teachers: ${teachers.length}`);
    
    classes.forEach(c => {
      const unassigned = c.subjects.filter(s => !s.teacher).length;
      console.log(`Class ${c.name}: ${c.subjects.length} subjects (${unassigned} unassigned)`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
