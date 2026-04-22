import express from 'express';
import { getSchools } from '../controllers/schoolController.js';

const router = express.Router();

// GET /api/schools
router.get('/', getSchools);

export default router;
