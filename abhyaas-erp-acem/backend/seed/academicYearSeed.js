import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { AcademicYear } from '../models/index.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://chandini:TestDb321@edumanagercluster.weofmss.mongodb.net/school_management_db?appName=EduManagerCluster';

async function seedYears() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');

    await AcademicYear.deleteMany({});
    const years = await AcademicYear.insertMany([
      { name: '2023-2024', isActive: false },
      { name: '2024-2025', isActive: false },
      { name: '2025-2026', isActive: true },
      { name: '2026-2027', isActive: false }
    ]);
    console.log(`✓ Seeded ${years.length} Academic Years`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedYears();
