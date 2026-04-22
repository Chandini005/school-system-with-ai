import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  const URI = 'mongodb+srv://chandini:TestDb321@edumanagercluster.weofmss.mongodb.net/school_management_db?appName=EduManagerCluster';
  try {
    await mongoose.connect(URI);
    const collections = await mongoose.connection.db.listCollections().toArray();
    const colNames = collections.map(c => c.name);
    console.log('Collections:', colNames);
    
    // Attempt to find academic years in any likely collection
    const targetCol = colNames.find(c => c.toLowerCase().includes('academicyear'));
    if (targetCol) {
        const years = await mongoose.connection.db.collection(targetCol).find().toArray();
        console.log('Found Years in', targetCol, ':', years.map(y => y.name));
    } else {
        console.log('AcademicYear collection not found.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}
check();
