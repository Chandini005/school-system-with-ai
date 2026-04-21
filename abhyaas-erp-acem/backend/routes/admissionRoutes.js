import express from 'express';
import { Admission } from '../models/index.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

const adminOnly = [auth, (req, res, next) => req.user.role === 'Admin' ? next() : res.status(403).json({ success: false, message: 'Admin only' })];

// Public route to submit an enquiry
router.post('/enquiry', async (req, res) => {
  try {
    const { parentName, mobile, studentName, className, message } = req.body;
    const admission = await Admission.create({ parentName, mobile, studentName, className, message });
    res.json({ success: true, message: 'Admission enquiry submitted successfully', data: admission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin route to get all enquiries
router.get('/', adminOnly, async (req, res) => {
  try {
    const admissions = await Admission.find().sort({ createdAt: -1 });
    res.json({ success: true, data: admissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin route to update status
router.put('/:id/status', adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const admission = await Admission.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!admission) return res.status(404).json({ success: false, message: 'Admission not found' });
    res.json({ success: true, message: `Admission status updated to ${status}`, data: admission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
