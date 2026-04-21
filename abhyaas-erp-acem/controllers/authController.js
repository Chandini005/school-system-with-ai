import models from '../models/index.js';
const { CentralAuth, User } = models;
import { getTenantModel } from '../utils/tenant.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// @desc    Register a new user (Creates PendingRegistration)
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
    try {
        const {
            school_id, name, email, password, role, profilePhotoUrl,
            // Common Optional
            mobile, address, username,
            // Student specific
            rollNo, standard, fatherName, motherName, dob, gender, section, admissionDate,
            // Staff specific
            teacherId, adminId, principalId, designation, salary, joiningDate,
            qualification, experience, accessLevel, officeContact, officeAddress
        } = req.body;

        // Basic validation
        if (!school_id || !name || !email || !password || !role) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields (Name, Email, Password, Role, School)' });
        }

        // Check if school exists
        const schoolExists = await School.findById(school_id);
        if (!schoolExists) {
            return res.status(404).json({ success: false, message: 'School not found with that ID' });
        }

        // Check if user already exists (Approved)
        const existingUser = await User.findOne({ email, school_id });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists in this school' });
        }

        // Check if pending registration already exists
        const existingPending = await PendingRegistration.findOne({ email, school_id });
        if (existingPending) {
            return res.status(400).json({ success: false, message: 'A pending registration already exists for this email' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Build the base pending registration object
        const pendingData = {
            school_id, name, email, passwordHash, role, profilePhotoUrl,
            mobile, address, username
        };

        // Role-specific field assignment
        if (role === 'Student') {
            if (rollNo) pendingData.rollNo = rollNo;
            if (standard) pendingData.standard = standard;
            if (fatherName) pendingData.fatherName = fatherName;
            if (motherName) pendingData.motherName = motherName;
            if (dob) pendingData.dob = dob;
            if (gender) pendingData.gender = gender;
            if (section) pendingData.section = section;
            if (admissionDate) pendingData.admissionDate = admissionDate;
        } else if (role === 'Teacher') {
            if (teacherId) pendingData.teacherId = teacherId;
            if (designation) pendingData.designation = designation;
            if (salary) pendingData.salary = salary;
            if (joiningDate) pendingData.joiningDate = joiningDate;
            if (qualification) pendingData.qualification = qualification;
            if (experience) pendingData.experience = experience;
        } else if (role === 'Admin') {
            if (adminId) pendingData.adminId = adminId;
            if (designation) pendingData.designation = designation;
            if (accessLevel) pendingData.accessLevel = accessLevel;
        } else if (role === 'Principal') {
            if (principalId) pendingData.principalId = principalId;
            if (qualification) pendingData.qualification = qualification;
            if (experience) pendingData.experience = experience;
            if (joiningDate) pendingData.joiningDate = joiningDate;
            if (officeContact) pendingData.officeContact = officeContact;
            if (officeAddress) pendingData.officeAddress = officeAddress;
        }

        const pendingUser = await PendingRegistration.create(pendingData);

        res.status(201).json({
            success: true,
            message: 'Registration submitted successfully. Awaiting admin approval.',
            data: {
                id: pendingUser._id,
                name: pendingUser.name,
                role: pendingUser.role,
                status: pendingUser.status
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error during registration',
            error: error.message
        });
    }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
    try {
        const { email, password, school_id } = req.body;

        // Validate email, password & school_id
        if (!email || !password || !school_id) {
            return res.status(400).json({ success: false, message: 'Please provide email, password, and school selection' });
        }

        // Find user (tenant isolation enforced)
        const user = await User.findOne({ email, school_id });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials or incorrect school' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Sign JWT
        const jwtSecret = process.env.JWT_SECRET || 'supersecretkey'; // Use env var in production
        const payload = {
            id: user._id,
            school_id: user.school_id,
            role: user.role
        };

        const token = jwt.sign(payload, jwtSecret, { expiresIn: '1d' });

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                school_id: user.school_id,
                profilePhotoUrl: user.profilePhotoUrl
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error during login',
            error: error.message
        });
    }
};