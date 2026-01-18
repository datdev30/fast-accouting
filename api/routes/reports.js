import express from 'express';
import Customer from '../models/Customer.js';
import Transaction from '../models/Transaction.js';
import { generatePDF } from '../utils/pdf.js';
import archiver from 'archiver';
import fs from 'fs/promises';
import path from 'path';
import { removeAccents } from '../utils/helpers.js';
import { APIError, ErrorCodes } from '../utils/errors.js';
import logger from '../utils/logger.js';
import { resolveCustomerId } from '../utils/customerHelpers.js';

const router = express.Router();

function sanitizeFilename(input) {
    const base = removeAccents(String(input || '')).trim();
    const safe = base.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '');
    return safe || 'file';
}

/**
 * GET /api/reports/:customer_id/pdf
 * Generate PDF report for customer
 */
router.get('/:customer_id/pdf', async (req, res) => {
    try {
        const { customer_id } = req.params;
        const { start_date, end_date } = req.query;

        // Fetch customer
        const customerKey = customer_id.trim();
        const customer = await Customer.findOne({ $or: [{ id: customerKey }, { _id: customerKey }] });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Build query for transactions
        let query = { customer_id: customerKey };

        if (start_date || end_date) {
            query.transaction_date = {};
            if (start_date) {
                query.transaction_date.$gte = new Date(start_date);
            }
            if (end_date) {
                const endDateObj = new Date(end_date);
                endDateObj.setHours(23, 59, 59, 999);
                query.transaction_date.$lte = endDateObj;
            }
        }

        const transactions = await Transaction.find(query).sort({ transaction_date: 1 });

        // Generate PDF
        const pdfBuffer = await generatePDF(customer, transactions);

        // Send as download: Phieu_TTCN_<tên KH>.pdf
        const safeName = sanitizeFilename(customer.name || customer_id);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Phieu_TTCN_${safeName}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/reports/batch-export
 * Generate PDFs for all customers with OPEN debts.
 * - If `output_path` is provided: write PDFs to that folder and return JSON.
 * - Otherwise: return a downloadable ZIP of PDFs.
 */
router.post('/batch-export', async (req, res, next) => {
    try {
        const outputPath = req.body?.output_path ? String(req.body.output_path) : null;

        const customers = await Customer.find().sort({ id: 1, _id: 1 });

        const generated = [];
        for (const customer of customers) {
            const customerId = (customer.id ?? customer._id)?.toString().trim();
            if (!customerId) continue;

            const transactions = await Transaction.find({
                customer_id: customerId,
                status: 'OPEN'
            }).sort({ transaction_date: 1 });

            if (!transactions || transactions.length === 0) continue;

            const pdfBuffer = await generatePDF(customer, transactions);
            const namePart = sanitizeFilename(customer.name || customerId);
            const fileName = `${sanitizeFilename(`report_${customerId}`)}_${namePart}.pdf`;

            generated.push({
                customer_id: customerId,
                customer_name: customer.name,
                fileName,
                pdfBuffer
            });
        }

        if (outputPath) {
            const resolved = path.resolve(outputPath);
            await fs.mkdir(resolved, { recursive: true });

            let count = 0;
            for (const item of generated) {
                const filePath = path.join(resolved, item.fileName);
                await fs.writeFile(filePath, item.pdfBuffer);
                count++;
            }

            return res.json({
                ok: true,
                mode: 'filesystem',
                output_path: resolved,
                count
            });
        }

        const now = new Date();
        const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
        const zipName = `reports_${ts}.zip`;

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.on('error', (err) => {
            console.error('ZIP archive error:', err);
            if (!res.headersSent) {
                res.status(500);
            }
            res.end();
        });

        archive.pipe(res);

        for (const item of generated) {
            archive.append(item.pdfBuffer, { name: item.fileName });
        }

        await archive.finalize();
    } catch (error) {
        next(error);
    }
});

export default router;
