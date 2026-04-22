import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const subjects = mongoose.connection.collection('subjects');
    
    console.log('🔍 Checking for legacy indexes on subjects collection...');
    const indexes = await subjects.indexes();
    
    const rogueIndex = indexes.find(idx => idx.name === 'teacherId_1' || idx.key.teacherId);
    
    if (rogueIndex) {
      console.log(`⚠️  Found rogue index: ${rogueIndex.name}. Dropping it...`);
      await subjects.dropIndex(rogueIndex.name);
      console.log('✅ Index dropped successfully!');
    } else {
      console.log('ℹ️  No rogue teacherId index found. Collection is clean.');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error fixing indexes:', err);
    process.exit(1);
  }
}

run();
