import express from 'express';
import { Inventory, InventoryCategory } from '../models/index.js';
import auth from '../middleware/authMiddleware.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';


const router = express.Router();

const adminOnly = [auth, (req, res, next) => {
    if (req.user && req.user.role === 'Admin') return next();
    return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
}];

// ─── CATEGORY ENDPOINTS ───

router.get('/categories', auth, async (req, res) => {
    try {
        const categories = await InventoryCategory.find().sort({ createdAt: -1 });
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/categories', adminOnly, async (req, res) => {
    try {
        const newCat = new InventoryCategory(req.body);
        await newCat.save();
        res.json({ success: true, data: newCat });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/categories/:id', adminOnly, async (req, res) => {
    try {
        const updatedCat = await InventoryCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: updatedCat });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/categories/:id', adminOnly, async (req, res) => {
    try {
        const category = await InventoryCategory.findById(req.params.id);
        if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

        // Check if any items are linked to this category name
        const itemCount = await Inventory.countDocuments({ category: category.name });
        if (itemCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category. There are ${itemCount} items still linked to it.`
            });
        }

        await InventoryCategory.findByIdAndDelete(req.params.id);

        // Safety cleanup for any items that might have this category name but weren't counted (should be 0 anyway)
        await Inventory.updateMany({ category: category.name }, { $set: { category: 'Uncategorized' } });

        res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── ITEM ENDPOINTS ───

router.get('/', auth, async (req, res) => {
    try {
        const items = await Inventory.find().sort({ createdAt: -1 });
        res.json({ success: true, data: items });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/', adminOnly, async (req, res) => {
    try {
        const itemId = 'INV-' + Math.floor(1000 + Math.random() * 9000);
        const { quantity = 0, inUse = 0, threshold = 10, good, name, category, unit } = req.body;
        
        // When initially adding, all items are 'good' conditionally unless specified
        const newItem = new Inventory({
            itemId, name, category, unit: unit || 'pcs',
            quantity: Number(quantity),
            threshold: Number(threshold),
            inUse: Number(inUse),
            good: good !== undefined ? Number(good) : (Number(quantity) - Number(inUse)),
            bad: 0,
            maintenance: 0
        });
        
        // Status checks
        if (newItem.good <= 0) newItem.status = 'Out of Stock';
        else if (newItem.good <= newItem.threshold) newItem.status = 'Low Stock';
        else newItem.status = 'In Stock';
        
        await newItem.save();
        res.json({ success: true, data: newItem });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/:id', adminOnly, async (req, res) => {
    try {
        const item = await Inventory.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

        const { quantity, inUse, good, bad, maintenance, threshold, name, category, unit } = req.body;

        if (name !== undefined) item.name = name;
        if (category !== undefined) item.category = category;
        if (unit !== undefined) item.unit = unit;

        if (threshold !== undefined) item.threshold = Number(threshold);
        if (quantity !== undefined) item.quantity = Number(quantity); // Strictly from user input
        if (inUse !== undefined) item.inUse = Number(inUse);
        if (good !== undefined) item.good = Number(good); // Now editable directly!
        if (bad !== undefined) item.bad = Number(bad);
        if (maintenance !== undefined) item.maintenance = Number(maintenance);

        if (item.good < 0) {
            return res.status(400).json({ success: false, message: 'Invalid condition allocation: Bad + Maintenance exceeds Total Quantity' });
        }

        // Status checks based purely on good condition items vs threshold
        if (item.good <= 0 && item.quantity > 0) item.status = 'Out of Stock'; // No good ones left
        else if (item.quantity === 0) item.status = 'Out of Stock';
        else if (item.good <= item.threshold) item.status = 'Low Stock';
        else item.status = 'In Stock';

        await item.save();
        res.json({ success: true, data: item });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/:id', adminOnly, async (req, res) => {
    try {
        await Inventory.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- REPORTING ---
router.post('/report/dynamic', auth, async (req, res) => {
    try {
        const { category, format, columns } = req.body;
        let q = {};
        if (category && category !== 'All') q.category = category;

        const items = await Inventory.find(q).sort({ name: 1 });

        const data = items.map(item => {
            let row = {};
            if (columns.includes('Item ID')) row['Item ID'] = item.itemId;
            if (columns.includes('Item Name')) row['Item Name'] = item.name;
            if (columns.includes('Category')) row['Category'] = item.category;
            if (columns.includes('Total Qty')) row['Total Qty'] = `${item.quantity} ${item.unit}`;
            if (columns.includes('Good Condition')) row['Good Condition'] = item.good;
            if (columns.includes('In Use')) row['In Use'] = item.inUse;
            if (columns.includes('Bad Condition')) row['Bad Condition'] = item.bad;
            if (columns.includes('Maintenance')) row['Maintenance'] = item.maintenance;
            if (columns.includes('Status')) row['Status'] = item.status;
            return row;
        });

        if (format === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Inventory Report');
            worksheet.columns = columns.map(col => ({ header: col, key: col, width: 20 }));
            worksheet.addRows(data);
            worksheet.getRow(1).eachCell(cell => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } }; // Indigo
            });
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=Inventory_Report.xlsx');
            await workbook.xlsx.write(res);
            return res.end();
        } else if (format === 'pdf') {
            const doc = new PDFDocument({ margin: 30, size: 'A4' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=Inventory_Report.pdf');
            doc.pipe(res);
            doc.fontSize(20).font('Helvetica-Bold').text('Inventory Status Report', { align: 'center' });
            doc.fontSize(10).font('Helvetica').text(`Category: ${category || 'All'}`, { align: 'center' });
            doc.moveDown(2);
            const tableTop = 160;
            const pageWidth = 535;
            const columnWidth = pageWidth / columns.length;
            doc.fontSize(10).font('Helvetica-Bold').rect(30, tableTop - 5, pageWidth, 20).fill('#eef2ff').stroke('#eef2ff');
            doc.fillColor('#3730a3');
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