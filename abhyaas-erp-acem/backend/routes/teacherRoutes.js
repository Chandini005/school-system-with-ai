
// export default router;
import express from 'express';
import mongoose from 'mongoose'; // We need mongoose for the native dragnet search!
import { Teacher, CentralAuth } from '../models/index.js';

const router = express.Router();

// GET all teachers (with optional search and department filters)
router.get('/', async (req, res) => {
    try {
        const query = {};
        if (req.query.department) query.department = req.query.department;
        if (req.query.search) query.name = { $regex: req.query.search, $options: 'i' };

        // 1. Fetch all teachers from the new Teacher collection
        const teachers = await Teacher.find(query).sort({ createdAt: -1 }).lean();

        // 2. Grab all their emails
        const teacherEmails = teachers.filter(t => t.email).map(t => t.email.toLowerCase());

        // 3. THE DRAGNET: Search abhyaas_users collection for these emails
        const db = mongoose.connection.db;
        const allUsers = await db.collection('abhyaas_users').find({ email: { $in: teacherEmails } }).toArray();

        // Map emails to their old database _ids
        const emailToOldIdMap = {};
        allUsers.forEach(u => emailToOldIdMap[u.email.toLowerCase()] = u._id.toString());

        // 4. Gather ALL possible IDs to search CentralAuth
        const possibleRefs = teachers.map(t => t._id.toString());
        Object.values(emailToOldIdMap).forEach(id => possibleRefs.push(id));

        // Safely convert string IDs back to ObjectIds for the query
        const objectIdRefs = possibleRefs
            .filter(id => mongoose.Types.ObjectId.isValid(id))
            .map(id => new mongoose.Types.ObjectId(id));

        // 5. Fetch the IDs from the CentralAuth Master Key table
        const authRecords = await CentralAuth.find({ userRef: { $in: objectIdRefs } }).lean();

        const authMap = {};
        authRecords.forEach(record => {
            authMap[record.userRef.toString()] = record.loginId;
        });

        // 6. Stitch the Login IDs to the right teacher
        const teachersWithLoginIds = teachers.map(teacher => {
            const teacherIdStr = teacher._id.toString();
            const teacherEmailStr = teacher.email ? teacher.email.toLowerCase() : '';

            // Check the new database structure first
            let matchedId = authMap[teacherIdStr];

            // If not found, check the old database structures using their email
            if (!matchedId && emailToOldIdMap[teacherEmailStr]) {
                const oldUserId = emailToOldIdMap[teacherEmailStr];
                matchedId = authMap[oldUserId];
            }

            return {
                ...teacher,
                loginId: matchedId || 'Pending'
            };
        });

        res.json({ success: true, data: teachersWithLoginIds });
    } catch (e) {
        console.error("Error fetching teachers:", e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// DELETE a teacher
router.delete('/:id', async (req, res) => {
    try {
        await Teacher.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;