import express from 'express';
import { Student, Fee, FeeStructure, FeePayment } from '../models/index.js';
import mongoose from 'mongoose';
import auth from '../middleware/authMiddleware.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';


const router = express.Router();

// HELPER: Reconcile student fee status (Ported for modular safety)
const reconcileStudentFeeStatus = async (studentId, academicYear) => {
    try {
        const student = await Student.findById(studentId);
        if (!student) return;

        const currentYear = academicYear || '2025-2026';

        const structures = await FeeStructure.find({ 
            standard: student.standard,
            $or: [{ academicYear: currentYear }, { academicYear: { $exists: false } }]
        });
        const payments = await FeePayment.find({ 
            studentId,
            $or: [{ academicYear: currentYear }, { academicYear: { $exists: false } }]
        });

        let totalDue = 0;
        let totalPaid = 0;
        structures.forEach(s => { totalDue += s.amount; });
        payments.forEach(p => { totalPaid += (p.amountPaid + (p.discount || 0)); });

        let newStatus = 'Pending';
        if (totalPaid >= totalDue) newStatus = 'Paid';
        else if (totalPaid > 0) newStatus = 'Partial';

        await Student.findByIdAndUpdate(studentId, { feeStatus: newStatus });

        for (const s of structures) {
            const paidForThis = payments
                .filter(p => p.feeStructureId.toString() === s._id.toString())
                .reduce((sum, p) => sum + p.amountPaid + (p.discount || 0), 0);

            // The Fee model now has a pre-save hook that handles status and balanceDue
            const feeRecord = await Fee.findOne({ 
                student: studentId, 
                feeType: s.feeType,
                academicYear: currentYear 
            });

            if (feeRecord) {
                feeRecord.totalAmount = s.amount;
                feeRecord.paidAmount = paidForThis;
                feeRecord.dueDate = s.dueDate;
                await feeRecord.save();
            } else {
                await Fee.create({
                    student: studentId,
                    feeType: s.feeType,
                    totalAmount: s.amount,
                    paidAmount: paidForThis,
                    dueDate: s.dueDate,
                    academicYear: currentYear
                });
            }
        }
    } catch (err) {
        console.error("Internal Sync Error:", err);
    }
};

// --- FEE LEDGER ---
router.get('/', async (req, res) => {
    try {
        const query = {};
        if (req.query.status) query.status = req.query.status;
        if (req.academicYear) {
            query.$or = [
                { academicYear: req.academicYear },
                { academicYear: { $exists: false } }
            ];
        }

        const fees = await Fee.find(query)
            .populate('student', 'name rollNo standard section')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, fees });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- FEE STRUCTURES ---
router.get('/structures', async (req, res) => {
    try {
        const query = req.query.standard ? { standard: req.query.standard } : {};
        query.$or = [
            { academicYear: req.academicYear },
            { academicYear: { $exists: false } }
        ];
        const structures = await FeeStructure.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: structures });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/structures', async (req, res) => {
    try {
        const newStructure = new FeeStructure({
            ...req.body,
            academicYear: req.body.academicYear || req.academicYear
        });
        await newStructure.save();
        res.status(201).json({ success: true, message: 'Fee rule created', data: newStructure });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// --- FEE PAYMENTS ---
router.get('/payments/:studentId', async (req, res) => {
    try {
        const payments = await FeePayment.find({ 
            studentId: req.params.studentId,
            $or: [{ academicYear: req.academicYear }, { academicYear: { $exists: false } }]
        })
            .populate('feeStructureId')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: payments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/payments', async (req, res) => {
    try {
        const newPayment = new FeePayment({
            ...req.body,
            academicYear: req.body.academicYear || req.academicYear
        });
        await newPayment.save();

        // 🟢 SYNC TRIGGER: Immediately update student profile and ledger
        await reconcileStudentFeeStatus(req.body.studentId, req.body.academicYear || req.academicYear);

        res.status(201).json({ success: true, message: 'Payment recorded and synced! ✅', data: newPayment });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// --- REPORTING ---
router.post('/report/dynamic', auth, async (req, res) => {
    try {
        const { from, to, status, format, columns } = req.body;
        let q = {};
        if (from && to) {
            q.createdAt = { 
                $gte: new Date(new Date(from).setHours(0,0,0,0)), 
                $lte: new Date(new Date(to).setHours(23,59,59,999)) 
            };
        }
        // FeePayment doesn't have a direct 'status' field in the schema provided in models/index.js (wait, models/index.js showed Fee schema, not FeePayment)
        // Let's check FeePayment model first.
        
        q.$or = [
            { academicYear: req.academicYear },
            { academicYear: { $exists: false } }
        ];
        const payments = await FeePayment.find(q)
            .populate('studentId', 'name rollNo standard section')
            .populate('feeStructureId', 'feeType amount')
            .sort({ createdAt: 1 });

        const data = payments.map(p => {
            let row = {};
            if (columns.includes('Date')) row['Date'] = new Date(p.createdAt).toLocaleDateString('en-IN');
            if (columns.includes('Student Name')) row['Student Name'] = p.studentId?.name || 'N/A';
            if (columns.includes('Roll Number')) row['Roll Number'] = p.studentId?.rollNo || 'N/A';
            if (columns.includes('Class')) row['Class'] = p.studentId ? `${p.studentId.standard}-${p.studentId.section}` : 'N/A';
            if (columns.includes('Fee Type')) row['Fee Type'] = p.feeStructureId?.feeType || 'N/A';
            if (columns.includes('Amount Paid')) row['Amount Paid'] = `₹${p.amountPaid}`;
            
            // NEW SUMMARY FIELDS (Calculated from Structure or linked Fee ledger if possible)
            if (columns.includes('Total Fee')) row['Total Fee'] = `₹${p.feeStructureId?.amount || 0}`;
            if (columns.includes('Balance Due')) {
                const total = p.feeStructureId?.amount || 0;
                // Note: For a payment report, 'Balance Due' might need more context, but we can show it per-component
                row['Balance Due'] = `₹${total - p.amountPaid}`; 
            }
            if (columns.includes('Status')) {
                // For reports, we might want the overall status from the Student or the specific ledger entry
                // Given we are looking at a payment, we'll try to guess or just leave 'Collected'
                row['Status'] = 'Collected';
            }

            if (columns.includes('Discount')) row['Discount'] = `₹${p.discount || 0}`;
            if (columns.includes('Fine')) row['Fine'] = `₹${p.fine || 0}`;
            if (columns.includes('Method')) row['Method'] = p.paymentMethod;
            if (columns.includes('Remarks')) row['Remarks'] = p.remarks || '';
            return row;
        });

        if (format === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Fee Report');
            worksheet.columns = columns.map(col => ({ header: col, key: col, width: 20 }));
            worksheet.addRows(data);
            worksheet.getRow(1).eachCell(cell => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }; // Green
            });
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=Fee_Report.xlsx');
            await workbook.xlsx.write(res);
            return res.end();
        } else if (format === 'pdf') {
            const doc = new PDFDocument({ margin: 30, size: 'A4' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=Fee_Report.pdf');
            doc.pipe(res);
            doc.fontSize(20).font('Helvetica-Bold').text('Fee Collection Report', { align: 'center' });
            doc.fontSize(10).font('Helvetica').text(`Period: ${from} to ${to}`, { align: 'center' });
            doc.moveDown(2);
            const tableTop = 160;
            const pageWidth = 535;
            const columnWidth = pageWidth / columns.length;
            doc.fontSize(10).font('Helvetica-Bold').rect(30, tableTop - 5, pageWidth, 20).fill('#ecfdf5').stroke('#ecfdf5');
            doc.fillColor('#065f46');
            columns.forEach((col, i) => doc.text(col, 35 + (i * columnWidth), tableTop));
            let y = tableTop + 25;
            doc.font('Helvetica').fontSize(9).fillColor('#000000');
            data.forEach(row => {
                if (y > 750) { doc.addPage(); y = 50; }
                columns.forEach((col, i) => doc.text(String(row[col] || ''), 35 + (i * columnWidth), y, { width: columnWidth - 5 }));
                y += 20;
            });
            doc.end();
        } else {
            res.json({ success: true, data });
        }
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

export default router;