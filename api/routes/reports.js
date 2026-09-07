import express from 'express';
import { getCustomerModel, getTransactionModel } from '../db/models.js';
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
router.get('/:customer_id/pdf', async (req, res, next) => {
    try {
        const { customer_id } = req.params;
        const { start_date, end_date, include_all } = req.query;
        const includeAll = include_all === 'true';

        // Fetch customer
        const customerKey = customer_id.trim();
        const customer = await getCustomerModel().findOne({
            $or: [{ id: customerKey }, { _id: customerKey }]
        });

        if (!customer) {
            throw new APIError('Customer not found', 404, ErrorCodes.NOT_FOUND);
        }

        // Build query for transactions
        let query = { customer_id: customerKey, working_year: req.workingYear };

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

        const transactions = await getTransactionModel().find(query).sort({ transaction_date: 1 });

        // Ensure transactions have valid dates and convert to plain objects if needed
        const normalizedTransactions = transactions.map(tx => {
            const txObj = tx.toObject ? tx.toObject() : tx;
            // Ensure transaction_date is a Date object
            if (txObj.transaction_date && !(txObj.transaction_date instanceof Date)) {
                txObj.transaction_date = new Date(txObj.transaction_date);
            }
            return txObj;
        });

        // Generate PDF with includeAll flag
        const pdfBuffer = await generatePDF(customer, normalizedTransactions, includeAll);

        // Send as download with appropriate filename
        const safeName = sanitizeFilename(customer.name || customer_id);
        const filename = includeAll 
            ? `Tat_ca_giao_dich_${safeName}.pdf`
            : `Phieu_TTCN_${safeName}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(pdfBuffer);
    } catch (error) {
        logger.error('PDF generation failed', { 
            customer_id: req.params.customer_id, 
            error: error.message, 
            stack: error.stack,
            includeAll: req.query.include_all === 'true'
        });
        next(error);
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

        const customers = await getCustomerModel().find({}).sort({ id: 1, _id: 1 });

        const generated = [];
        for (const customer of customers) {
            const customerId = (customer.id ?? customer._id)?.toString().trim();
            if (!customerId) continue;

            const transactions = await getTransactionModel().find({
                customer_id: customerId,
                working_year: req.workingYear,
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
            logger.error('ZIP archive error', { 
                error: err.message, 
                stack: err.stack 
            });
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
