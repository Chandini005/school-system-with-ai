import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { AcademicYear, Student } from './models/index.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://chandini:TestDb321@edumanagercluster.weofmss.mongodb.net/school_management_db?appName=EduManagerCluster';

const seedAndTest = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Find a test student or create one
        let student = await Student.findOne({});
        if (!student) {
            student = await Student.create({
                name: 'Test Student',
                rollNo: 'S-TEST-001',
                loginId: 'AB-STD-999',
                academicHistory: [{
                    academicYear: '2024-2025',
                    standard: '10',
                    section: 'A',
                    status: 'Active'
                }]
            });
            console.log('Created Test Student');
        } else {
            // Reset student for test
            student.academicHistory = [{
                academicYear: '2024-2025',
                standard: '10',
                section: 'A',
                status: 'Active'
            }];
            await student.save();
            console.log('Reset Test Student');
        }

        console.log('Initial Student State:', JSON.stringify(student.academicHistory, null, 2));

        // 2. Simulate Promotion Logic
        // Step 1: Update current statuses to "Promoted"
        await Student.updateOne(
            { _id: student._id, "academicHistory.status": "Active" },
            { $set: { "academicHistory.$.status": "Promoted" } }
        );

        // Step 2: Push new records into the array
        const nextYear = '2025-2026';
        const nextStandard = '11';
        const nextSection = 'A';

        await Student.updateOne(
            { _id: student._id },
            { 
                $push: { 
                    academicHistory: {
                        academicYear: nextYear,
                        standard: nextStandard,
                        section: nextSection,
                        status: 'Active'
                    }
                },
                $set: {
                    standard: nextStandard,
                    section: nextSection
                }
            }
        );

        const updatedStudent = await Student.findById(student._id);
        console.log('Updated Student State:', JSON.stringify(updatedStudent.academicHistory, null, 2));
        console.log('Top-level Standard:', updatedStudent.standard);

        if (updatedStudent.academicHistory.length === 2 && 
            updatedStudent.academicHistory[0].status === 'Promoted' &&
            updatedStudent.academicHistory[1].status === 'Active' &&
            updatedStudent.academicHistory[1].academicYear === '2025-2026') {
            console.log('✅ Promotion logic verified!');
        } else {
            console.log('❌ Promotion logic failed verification.');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Verification Error:', error);
        process.exit(1);
    }
};

seedAndTest();
