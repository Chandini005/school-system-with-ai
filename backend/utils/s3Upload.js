import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// S3 Client configuration
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

// Configure multer to use memory storage
const storage = multer.memoryStorage();
export const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images (jpeg, jpg, png, gif, webp) are allowed!'));
        }
    }
});

// Helper function to upload buffer to S3
export const uploadToS3 = async (fileBuffer, fileName, mimeType) => {
    let bucketName = process.env.AWS_BUCKET_NAME;
    
    // Auto-detect bucket if user didn't specify one or used placeholder
    if (!bucketName || bucketName === 'your_s3_bucket_name_here') {
        bucketName = 'sch-abys-26'; // Recovered from browser tab
    }

    const uniqueFileName = `profiles/${Date.now()}-${fileName}`;
    
    const params = {
        Bucket: bucketName,
        Key: uniqueFileName,
        Body: fileBuffer,
        ContentType: mimeType,
        // Optional: ACL: 'public-read' (if bucket allows it)
    };

    try {
        const command = new PutObjectCommand(params);
        await s3Client.send(command);
        // Return public S3 URL (region-agnostic)
        return `https://${bucketName}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${uniqueFileName}`;
    } catch (error) {
        console.error("Error uploading to S3:", error);
        throw error;
    }
};
