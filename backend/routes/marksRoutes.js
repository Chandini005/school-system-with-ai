import express from 'express';
import { Mark } from '../models/index.js';

const router = express.Router();

// Fetch existing marks if the Admin wants to edit them
router.get('/', async (req, res) => {
    try {
        const { examTitle, standard, subject } = req.query;
        const query = {};
        if (examTitle) query.examTitle = examTitle;
        if (standard) query.standard = standard;
        if (subject) query.subject = subject;

        // Strict Academic Year Filtering with Legacy Fallback
        query.$or = [
          { academicYear: req.academicYear },
          { academicYear: { $exists: false } }
        ];

        const marks = await Mark.findOne(query);
        res.status(200).json({ success: true, data: marks });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Save new marks OR update existing marks automatically
router.post('/', async (req, res) => {
    try {
        const { examTitle, examType, standard, subject, maxMarks, records } = req.body;

        let markSheet = await Mark.findOne({ 
          examTitle, 
          standard, 
          subject,
          academicYear: req.academicYear 
        });

        if (markSheet) {
            // Update the existing sheet
            markSheet.records = records;
            markSheet.maxMarks = maxMarks;
            markSheet.examType = examType;
            await markSheet.save();
            return res.status(200).json({ success: true, message: 'Marks updated successfully', data: markSheet });
        } else {
            // Create a brand new sheet
            markSheet = new Mark({ 
              examTitle, 
              examType, 
              standard, 
              subject, 
              maxMarks, 
              records,
              academicYear: req.academicYear 
            });
            await markSheet.save();
            return res.status(201).json({ success: true, message: 'Marks saved successfully', data: markSheet });
        }
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

export default router;