import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Student, Teacher, Registration } from '../models/index.js';

const router = express.Router();

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        const query = status ? { status } : {};
        const registrations = await Registration.find(query).sort({ createdAt: -1 });
        res.json({ success: true, data: registrations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/', upload.single('profilePhoto'), async (req, res) => {
    try {
        const regData = { ...req.body };

        // --- STRICT VALIDATIONS ---
        const { role, name, email, password } = regData;

        if (!role || !name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Role, name, email and password are required' });
        }

        const phoneToValidate = regData.mobile || regData.officeContact;
        if (phoneToValidate && !/^\d{10}$/.test(phoneToValidate)) {
            return res.status(400).json({ success: false, message: 'Phone number must be exactly 10 digits' });
        }

        const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
        if (req.file) regData.profilePhotoUrl = `${BASE_URL}/uploads/${req.file.filename}`;

        const newReg = new Registration(regData);
        await newReg.save();
        res.json({ success: true, data: newReg });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 🔴 THE MAGIC HAPPENS HERE
router.put('/:id/:action', async (req, res) => {
    try {
        const { id, action } = req.params;
        let newStatus = action === 'approve' ? 'Approved' : 'Rejected';

        // 1. Find the registration details
        const reg = await Registration.findById(id);
        if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });

        // 2. If approving, migrate data to the correct official collection
        if (action === 'approve' && reg.status !== 'Approved') {
            if (reg.role === 'Student') {
                const newStudent = new Student({
                    name: reg.name,
                    email: reg.email,
                    rollNo: reg.rollNo || `STU-${Math.floor(Math.random() * 10000)}`,
                    standard: reg.className || reg.standard,
                    section: reg.section,
                    phone: reg.mobile || reg.phone,
                    gender: reg.gender,
                    parentName: reg.fatherName || reg.motherName || 'Not Provided',
                    parentPhone: reg.mobile || reg.phone,
                    house: reg.house,
                    address: reg.address,
                    profilePhotoUrl: reg.profilePhotoUrl,
                    academicHistory: [{
                        academicYear: req.academicYear || '2025-2026',
                        standard: reg.className || reg.standard,
                        section: reg.section,
                        status: 'Active'
                    }]
                });
                await newStudent.save();
            } else if (reg.role === 'Teacher') {
                const newTeacher = new Teacher({
                    name: reg.name,
                    email: reg.email,
                    teacherId: reg.teacherId || `TCH-${Math.floor(Math.random() * 10000)}`,
                    phone: reg.mobile || reg.phone,
                    department: reg.department,
                    qualification: reg.qualification,
                    experience: reg.experience,
                    salary: reg.salary,
                    designation: 'Faculty', // Default designation
                    profilePhotoUrl: reg.profilePhotoUrl
                });
                await newTeacher.save();
            }
        }

        // 3. Update the status of the registration to "Approved"
        reg.status = newStatus;
        await reg.save();

        res.json({ success: true, data: reg });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;