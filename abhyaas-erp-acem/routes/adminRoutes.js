import express from 'express';
import { getPendingRegistrations, reviewRegistration } from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply middleware to protect all routes
router.use(protect);
router.use(authorize('Admin', 'Principal'));

// GET /api/admin/registrations
router.get('/registrations', getPendingRegistrations);

// PUT /api/admin/registrations/:id
router.put('/registrations/:id', reviewRegistration);

export default router;
