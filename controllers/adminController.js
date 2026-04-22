import PendingRegistration from '../models/PendingRegistration.js';
import User from '../models/User.js';

// @desc    Get all pending registrations for the school
// @route   GET /api/admin/registrations
// @access  Private/Admin
export const getPendingRegistrations = async (req, res) => {
    try {
        const pendings = await PendingRegistration.find({
            school_id: req.user.school_id,
            status: 'Pending'
        });

        res.status(200).json({
            success: true,
            data: pendings
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Principal from '../models/Principal.js';
import AdminProfile from '../models/AdminProfile.js';

// @desc    Approve or Reject registration
// @route   PUT /api/admin/registrations/:id
// @access  Private/Admin
export const reviewRegistration = async (req, res) => {
    try {
        const { status } = req.body; // 'Approved' or 'Rejected'
        const pendingId = req.params.id;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const pendingUser = await PendingRegistration.findOne({
            _id: pendingId,
            school_id: req.user.school_id
        });

        if (!pendingUser) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }

        pendingUser.status = status;
        await pendingUser.save();

        if (status === 'Approved') {
            const userData = pendingUser.toObject();

            // 1. Create Core User
            const coreUser = await User.create({
                school_id: userData.school_id,
                name: userData.name,
                email: userData.email,
                password: userData.passwordHash,
                role: userData.role,
                profilePhotoUrl: userData.profilePhotoUrl,
                mobile: userData.mobile,
                address: userData.address,
                username: userData.username
            });

            // 2. Create Role-Specific Profile
            const profileData = {
                user_id: coreUser._id,
                school_id: coreUser.school_id,
                mobile: userData.mobile,
                address: userData.address,
                username: userData.username,
                profilePhotoUrl: userData.profilePhotoUrl
            };

            switch (coreUser.role) {
                case 'Student':
                    await Student.create({
                        ...profileData,
                        rollNo: userData.rollNo,
                        standard: userData.standard,
                        fatherName: userData.fatherName,
                        motherName: userData.motherName,
                        dob: userData.dob,
                        gender: userData.gender,
                        section: userData.section,
                        admissionDate: userData.admissionDate
                    });
                    break;
                case 'Teacher':
                    await Teacher.create({
                        ...profileData,
                        teacherId: userData.teacherId,
                        designation: userData.designation,
                        salary: userData.salary,
                        joiningDate: userData.joiningDate,
                        qualification: userData.qualification,
                        experience: userData.experience
                    });
                    break;
                case 'Principal':
                    await Principal.create({
                        ...profileData,
                        principalId: userData.principalId,
                        qualification: userData.qualification,
                        experience: userData.experience,
                        joiningDate: userData.joiningDate,
                        officeContact: userData.officeContact,
                        officeAddress: userData.officeAddress
                    });
                    break;
                case 'Admin':
                    await AdminProfile.create({
                        ...profileData,
                        adminId: userData.adminId,
                        designation: userData.designation,
                        accessLevel: userData.accessLevel
                    });
                    break;
            }

            // 3. Delete from PendingRegistration collection
            await PendingRegistration.findByIdAndDelete(pendingUser._id);
        }

        res.status(200).json({
            success: true,
            message: `Registration ${status} successfully`,
            data: pendingUser
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};