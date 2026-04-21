import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import School from './models/School.js';
import User from './models/User.js';

dotenv.config();

const seedData = async () => {
    try {
        // Updated connection string to point to your Cloud Database!
        await mongoose.connect('mongodb+srv://chandini:TestDb321@edumanagercluster.weofmss.mongodb.net/school_management_db?appName=EduManagerCluster', {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log("Connected to MongoDB Cloud...");

        await School.deleteMany({});
        await User.deleteMany({});

        const schoolData = [
            { name: "Abhyas International School", address: "Rajam", email: "contact@abhyas.edu", contact: "9100000001" },
            { name: "DAV School", address: "Rajam", email: "info@davrajam.edu", contact: "9100000002" },
            { name: "Sun School", address: "Rajam", email: "admin@sunschool.edu", contact: "9100000003" }
        ];

        const createdSchools = await School.insertMany(schoolData);
        const mainSchool = createdSchools[0];
        console.log("🏢 Schools created successfully!");

        const hashedPassword = await bcrypt.hash('password123', 10);

        // Created 4 users to perfectly match your 4 database roles
        const users = [
            { name: "Main Admin", email: "admin@test.com", password: hashedPassword, role: "Admin", school_id: mainSchool._id },
            { name: "John Teacher", email: "teacher@test.com", password: hashedPassword, role: "Teacher", school_id: mainSchool._id },
            { name: "Rahul Student", email: "student@test.com", password: hashedPassword, role: "Student", school_id: mainSchool._id },
            { name: "Jane Principal", email: "principal@test.com", password: hashedPassword, role: "Principal", school_id: mainSchool._id }
        ];

        await User.insertMany(users);

        console.log("\n✅ CLOUD DATABASE SEEDED SUCCESSFULLY!");
        console.log("----------------------------------");
        console.log("School: Abhyas International School");
        console.log("Common Password: password123");
        console.log("----------------------------------");
        console.log("Admin:     admin@test.com");
        console.log("Teacher:   teacher@test.com");
        console.log("Student:   student@test.com");
        console.log("Principal: principal@test.com");

        process.exit();
    } catch (error) {
        console.error("❌ Seeding failed:", error.message);
        process.exit(1);
    }
};

seedData();