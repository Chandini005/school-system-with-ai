import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Teacher, Subject, Class, Timetable } from '../models/index.js';
import { TimetableGenerator } from '../utils/timetableGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

const suffix = () => Math.random().toString(36).substring(2, 7).toUpperCase();

async function bootstrap() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 0. Cleanup
    await Class.deleteMany({});
    await Subject.deleteMany({});
    await Timetable.deleteMany({});
    console.log('🧹 Database cleared for full bootstrapping');

    const teachers = await Teacher.find({});
    
    // 1. Create Classes 1 to 10
    const classNames = ['1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade', '6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade'];
    
    for (let i = 0; i < classNames.length; i++) {
        const name = classNames[i];
        console.log(`🏗️  Processing ${name}...`);
        
        const newClass = new Class({
            name: name,
            standard: String(i + 1),
            section: 'A',
            roomNumber: `Room-${100 + i}`
        });
        await newClass.save();

        // 2. Assign Subjects & Teachers
        const templates = [
            { name: 'Mathematics', dept: 'Math' },
            { name: 'Science', dept: 'Science' },
            { name: 'English', dept: 'English' },
            { name: 'Social Studies', dept: 'Social' },
            { name: 'Computer', dept: 'Computer' },
            { name: 'PE / Sports', dept: 'Sports' }
        ];

        const subjectIds = [];
        for (const t of templates) {
            // Pick a teacher from the correct department (Safe check)
            const deptTeachers = teachers.filter(teach => teach.department?.includes(t.dept));
            const assignedTeacher = deptTeachers.length > 0 
                ? deptTeachers[Math.floor(Math.random() * deptTeachers.length)] 
                : teachers[Math.floor(Math.random() * teachers.length)];

            const sub = new Subject({
                name: t.name,
                code: `${t.name.substring(0,3).toUpperCase()}-${i+1}A`,
                standard: String(i + 1),
                teacher: assignedTeacher._id,
                type: 'Theory',
                room: newClass.roomNumber
            });
            await sub.save();
            subjectIds.push(sub._id);
        }

        newClass.subjects = subjectIds;
        await newClass.save();
    }

    console.log('✅ 10 Classes created with assigned teachers.');

    // 3. Auto-Generate Timetable (SYSTEM-WIDE)
    console.log('🗓️  Generating Global Timetable for all classes...');
    
    const generator = new TimetableGenerator();
    const result = await generator.generate({ mode: 'full' });

    if (result.status === 'success') {
       console.log('✅ Solution found! Saving to database...');
       
       const operations = [];
       for (const [cId, days] of Object.entries(result.data)) {
         for (const [day, periods] of Object.entries(days)) {
           operations.push(
             Timetable.findOneAndUpdate(
               { classId: cId, day: day },
               { classId: cId, day: day, periods: Object.values(periods).filter(p => p !== null) },
               { upsert: true }
             )
           );
         }
       }
       await Promise.all(operations);
       console.log('✨ SUCCESS: Global conflict-free timetable generated and saved for 10 classes.');
    } else {
       console.error('❌ Generator failed:', result.reason);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error during bootstrapping:', err);
    process.exit(1);
  }
}

bootstrap();
