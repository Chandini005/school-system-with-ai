import express from 'express';
import { Student, FeePayment } from '../models/index.js';

const router = express.Router();

router.get('/overview', async (req, res) => {
    try {
        // 1. Calculate Real Class Strength
        const classStrengthData = await Student.aggregate([
            { $group: { _id: "$standard", count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);
        const classStrength = classStrengthData.map(c => ({ 
            name: `Class ${c._id}`, 
            count: c.count 
        }));

        // 2. Calculate Real Fee Collection Trend (Grouped by Month)
        const feeData = await FeePayment.aggregate([
            {
                $group: {
                    _id: { month: { $month: "$createdAt" } },
                    collected: { $sum: "$amountPaid" }
                }
            },
            { $sort: { "_id.month": 1 } }
        ]);

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const feeTrend = feeData.map(f => ({
            _id: monthNames[f._id.month - 1], 
            collected: f.collected
        }));

        // 3. Static Grade Distribution (Until we add complex grading logic)
        const gradeDist = [
            { _id: 'A+', count: 12 }, { _id: 'A', count: 25 }, 
            { _id: 'B+', count: 30 }, { _id: 'B', count: 15 }, 
            { _id: 'C', count: 5 }, { _id: 'F', count: 2 }
        ];

        // Send it all back to the React frontend!
        res.status(200).json({
            success: true,
            classStrength,
            feeTrend,
            gradeDist
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;