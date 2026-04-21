import mongoose from 'mongoose';
import { AcademicYear } from './backend/models/index.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  const URI = 'mongodb+srv://chandini:TestDb321@edumanagercluster.weofmss.mongodb.net/school_management_db?appName=EduManagerCluster';
  await mongoose.connect(URI);
  const years = await AcademicYear.find();
  console.log('Existing Years:', years.map(y => y.name));
  process.exit(0);
}
check();
