import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://chandini:TestDb321@edumanagercluster.weofmss.mongodb.net/school_management_db?appName=EduManagerCluster';

console.log('Testing connection to MongoDB...');
mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => {
    console.log('✅ SUCCESS! Connection to MongoDB Atlas Cluster established successfully.');
    process.exit(0);
})
.catch((err) => {
    console.error('❌ FAILED! Connection error details:', err.message);
    process.exit(1);
});
