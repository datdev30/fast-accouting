import express from 'express';
import { pipeline } from 'stream';
import { promisify } from 'util';

import mongoose, { Types } from 'mongoose';
import Transaction from '../models/Transaction.js';
import Customer from '../models/Customer.js';
import InterestConfig from '../models/InterestConfig.js';
import User from '../models/User.js';
import { getNextId } from '../utils/counter.js';
import { calculateInterestAmount } from '../utils/interest.js';
import { verifyAdminPin } from '../utils/helpers.js';
import { authMiddleware, requireAdmin, requireAdminOrSale } from '../middleware/auth.js';
import { validate, transactionSchemas } from '../middleware/validation.js';
import { APIError, ErrorCodes } from '../utils/errors.js';
import logger from '../utils/logger.js';
import { resolveCustomerId } from '../utils/customerHelpers.js';
import multer from 'multer';
import { deleteDriveFile, downloadDriveFileStream, getDriveAccountDebugInfo, getDriveEnvDebugContext, uploadTransactionImageToDrive } from '../utils/drive.js';

const router = express.Router();
const pipelineAsync = promisify(pipeline);

function buildTransactionLookupQuery(idParam) {
    // Transaction schema uses `_id: Mixed` (PROD may store business key in `_id`, e.g. "GD0001").
    // So we can safely query `_id` as a string without ObjectId casting issues.
    const or = [{ id: idParam }, { _id: idParam }];
    return { $or: or };
}

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

const handleTransactionImageUpload = (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (!err) return next();

        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ error: 'Ảnh quá dung lượng (tối đa 5MB)' });
        }

        return res.status(400).json({ error: err.message || 'Upload ảnh không hợp lệ' });
    });
};

/**
 * POST /api/transactions/:id/image
 * Upload/replace transaction image (stored in Google Drive)
 */
router.post('/:id/image', authMiddleware, handleTransactionImageUpload, async (req, res, next) => {
    try {
        const tx = await Transaction.findOne(buildTransactionLookupQuery(req.params.id));
        if (!tx) {
            throw new APIError('Transaction not found', 404, ErrorCodes.NOT_FOUND);
        }

        const file = req.file;
        if (!file) {
            throw new APIError('Missing image file (field name: image)', 400, ErrorCodes.VALIDATION_ERROR);
        }

        if (!file.mimetype || !file.mimetype.startsWith('image/')) {
            throw new APIError('File phải là hình ảnh', 400, ErrorCodes.VALIDATION_ERROR);
        }

        const driveFileId = await uploadTransactionImageToDrive({
            buffer: file.buffer,
            mimeType: file.mimetype,
            originalName: file.originalname,
            transactionId: tx.id ?? String(tx._id)
        });

        if (!driveFileId) {
            throw new APIError('Upload to Drive failed', 500, ErrorCodes.DRIVE_ERROR);
        }

        tx.image_drive_file_id = driveFileId;
        tx.image_mime_type = file.mimetype;
        tx.image_original_name = file.originalname;
        tx.image_uploaded_at = new Date();
        await tx.save();

        return res.json({
            ok: true,
            image_drive_file_id: tx.image_drive_file_id,
            image_mime_type: tx.image_mime_type,
            image_original_name: tx.image_original_name,
            image_uploaded_at: tx.image_uploaded_at
        });
    } catch (error) {
        logger.error('Upload transaction image error', { 
            error: error.message, 
            transactionId: req.params.id,
            code: error?.code
        });

        const driveDebug = process.env.NODE_ENV === 'development' || process.env.DRIVE_DEBUG === '1';
        const driveAccount = driveDebug
            ? await getDriveAccountDebugInfo().catch(() => null)
            : null;

        const driveErrorDetails = driveDebug
            ? {
                drive_error: {
                    message: error?.message,
                    code: error?.code,
                    reason: error?.errors?.[0]?.reason,
                    domain: error?.errors?.[0]?.domain,
                    errors: error?.errors
                },
                drive_env: getDriveEnvDebugContext(),
                drive_account: driveAccount
            }
            : {};

        // googleapis errors often have `code`
        if (error?.code === 403) {
            const reason = error?.errors?.[0]?.reason;
            const domain = error?.errors?.[0]?.domain;

            if (reason === 'storageQuotaExceeded' || domain === 'usageLimits') {
                throw new APIError(
                    'Google Drive storage quota exceeded (check Drive storage, folder permissions, and OAuth account).',
                    502,
                    ErrorCodes.DRIVE_QUOTA_EXCEEDED,
                    driveErrorDetails
                );
            }

            throw new APIError(
                'Drive permission denied (check folder sharing/permissions for service account)',
                502,
                ErrorCodes.DRIVE_PERMISSION_DENIED,
                driveErrorDetails
            );
        }
        if (error?.code === 404) {
            throw new APIError(
                'Drive folder/file not found (check DRIVE_TRANSACTION_IMAGES_FOLDER_ID)',
                502,
                ErrorCodes.DRIVE_ERROR,
                driveErrorDetails
            );
        }

        // OAuth: refresh token hết hạn / bị thu hồi
        const msg = String(error?.message || '');
        const isInvalidGrant = /invalid_grant|expired|revoked|invalid.*token/i.test(msg) ||
            error?.response?.data?.error === 'invalid_grant';
        const finalMessage = isInvalidGrant
            ? 'Refresh token OAuth không còn hợp lệ. Chạy lại script drive-oauth-generate-refresh-token.js để lấy token mới.'
            : error.message;

        throw new APIError(finalMessage, 500, ErrorCodes.DRIVE_ERROR, driveErrorDetails);
    }
});

/**
 * GET /api/transactions/:id/image
 * Stream transaction image from Google Drive
 */
router.get('/:id/image', authMiddleware, async (req, res, next) => {
    try {
        const tx = await Transaction.findOne(buildTransactionLookupQuery(req.params.id));
        if (!tx) {
            throw new APIError('Transaction not found', 404, ErrorCodes.NOT_FOUND);
        }

        if (!tx.image_drive_file_id) {
            throw new APIError('Transaction has no image', 404, ErrorCodes.NOT_FOUND);
        }

        const driveResp = await downloadDriveFileStream(tx.image_drive_file_id);

        const contentType = tx.image_mime_type || driveResp?.headers?.['content-type'] || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);

        try {
            await pipelineAsync(driveResp.data, res);
        } catch (streamErr) {
            logger.error('Drive stream error', { 
                error: streamErr.message, 
                transactionId: req.params.id,
                stack: streamErr.stack 
            });
            if (!res.headersSent) {
                return res.status(502).json({ error: 'Failed to download image from Drive' });
            }
            try { res.end(); } catch (_) { /* ignore */ }
        }
    } catch (error) {
        logger.error('Get transaction image error', { 
            error: error.message, 
            transactionId: req.params.id,
            code: error?.code
        });

        const driveDebug = process.env.NODE_ENV === 'development' || process.env.DRIVE_DEBUG === '1';
        const driveAccount = driveDebug
            ? await getDriveAccountDebugInfo().catch(() => null)
            : null;

        const driveErrorDetails = driveDebug
            ? {
                drive_error: {
                    message: error?.message,
                    code: error?.code,
                    reason: error?.errors?.[0]?.reason,
                    domain: error?.errors?.[0]?.domain,
                    errors: error?.errors
                },
                drive_env: getDriveEnvDebugContext(),
                drive_account: driveAccount
            }
            : {};

        // googleapis errors often have `code`
        if (error?.code === 404) {
            throw new APIError('Image not found on Drive', 404, ErrorCodes.NOT_FOUND, driveErrorDetails);
        }
        if (error?.code === 403) {
            const reason = error?.errors?.[0]?.reason;
            const domain = error?.errors?.[0]?.domain;

            if (reason === 'storageQuotaExceeded' || domain === 'usageLimits') {
                throw new APIError(
                    'Google Drive storage quota exceeded (check Drive storage, file permissions, and OAuth account).',
                    502,
                    ErrorCodes.DRIVE_QUOTA_EXCEEDED,
                    driveErrorDetails
                );
            }

            throw new APIError(
                'Drive permission denied (check folder sharing/permissions)',
                502,
                ErrorCodes.DRIVE_PERMISSION_DENIED,
                driveErrorDetails
            );
        }

        next(error);
    }
});

/**
 * DELETE /api/transactions/:id/image
 * Remove transaction image (clears DB fields; attempts to delete Drive file)
 */
router.delete('/:id/image', authMiddleware, async (req, res, next) => {
    try {
        const tx = await Transaction.findOne(buildTransactionLookupQuery(req.params.id));
        if (!tx) {
            throw new APIError('Transaction not found', 404, ErrorCodes.NOT_FOUND);
        }

        const fileId = tx.image_drive_file_id;
        if (!fileId) {
            return res.json({ ok: true, removed: false });
        }

        const driveDeleted = await deleteDriveFile(fileId);

        tx.image_drive_file_id = null;
        tx.image_mime_type = null;
        tx.image_original_name = null;
        tx.image_uploaded_at = null;
        await tx.save();

        return res.json({ ok: true, removed: true, drive_deleted: driveDeleted });
    } catch (error) {
        logger.error('Delete transaction image error', { 
            error: error.message, 
            transactionId: req.params.id
        });
        next(error);
    }
});

/**
 * GET /api/transactions/drive-status
 * Kiểm tra cấu hình Drive (chỉ trả về boolean, không lộ secret). Cần đăng nhập.
 */
router.get('/drive-status', authMiddleware, (req, res) => {
    try {
        const ctx = getDriveEnvDebugContext();
        const ok = !!(ctx.folderId_present && ctx.oauth_client_id_present && ctx.oauth_client_secret_present && ctx.oauth_refresh_token_present);
        return res.json({ drive_configured: ok, ...ctx });
    } catch (e) {
        return res.json({ drive_configured: false, error: String(e?.message || e) });
    }
});

/**
 * POST /api/transactions
 * Create new transaction
 */
router.post('/', validate(transactionSchemas.create), async (req, res, next) => {
    try {
        const { customer_id, type, amount, content, transaction_date } = req.body;

        // Validate customer exists
        const customer = await resolveCustomerId(customer_id);
        if (!customer) {
            throw new APIError('Customer not found', 404, ErrorCodes.NOT_FOUND);
        }

        // Validate interest config exists
        const interestConfig = await InterestConfig.findOne({ code: type });
        if (!interestConfig) {
            throw new APIError('Invalid transaction type', 404, ErrorCodes.INVALID_TRANSACTION_TYPE);
        }

        // Snapshot interest rate
        const rateSnapshot = interestConfig.rate_per_month;

        // Generate custom ID
        const newId = await getNextId('transaction');

        const transaction = new Transaction({
            id: newId,
            customer_id: customer.id ?? customer._id,
            type,
            amount,
            content,
            transaction_date: transaction_date || new Date(),
            interest_rate_snapshot: rateSnapshot
        });

        await transaction.save();

        logger.info('Transaction created', { 
            transactionId: newId, 
            customerId: customer_id,
            amount,
            type 
        });

        res.status(201).json(transaction);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/transactions
 * Get transactions with filters and calculated interest
 */
router.get('/', async (req, res, next) => {
    try {
        const { customer_id, start_date, end_date } = req.query;

        // Build query
        let query = {};

        if (customer_id) {
            // Check if customer_id is a custom ID (KHxxx) or MongoDB _id
            if (typeof customer_id === 'string' && customer_id.startsWith('KH')) {
                query.customer_id = customer_id;
            } else if (Types.ObjectId.isValid(customer_id)) {
                // If it's a valid MongoDB ObjectId, find the customer and use their custom ID
                const customer = await Customer.findById(customer_id);
                if (customer) {
                    const raw = customer.toObject({ virtuals: false });
                    query.customer_id = raw.id?.trim();
                } else {
                    // If no customer found by ID, maybe it's a custom ID that doesn't start with KH (unlikely)
                    query.customer_id = customer_id.trim();
                }
            } else {
                query.customer_id = customer_id.trim();
            }
        }

        if (start_date) {
            query.transaction_date = { ...query.transaction_date, $gte: new Date(start_date) };
        }

        if (end_date) {
            query.transaction_date = { ...query.transaction_date, $lte: new Date(end_date) };
        }

        const transactions = await Transaction.find(query).sort({ transaction_date: -1 });

        // Get unique customer IDs (normalize + drop empty)
        const custIds = [...new Set(
            transactions
                .map(tx => (tx.customer_id ?? '').toString().trim())
                .filter(Boolean)
        )];

        // Fetch customers
        // PROD can store the business key in `_id` (e.g., "KH001") instead of `id`.
        const customers = custIds.length
            ? await Customer.find({ $or: [{ id: { $in: custIds } }, { _id: { $in: custIds } }] })
            : [];

        const custMap = {};
        customers.forEach(c => {
            const idKey = (c.id ?? '').toString().trim();
            const mongoKey = (c._id ?? '').toString().trim();
            if (idKey) custMap[idKey] = c;
            if (mongoKey) custMap[mongoKey] = c;
        });

        // Build results with interest calculation
        const now = new Date();
        const results = transactions.map(tx => {
            const txObj = tx.toObject();
            const txCustId = tx.customer_id?.trim();
            txObj._id = tx.id ?? txObj._id;
            txObj.customer = txCustId;

            // Add customer name
            if (txCustId && custMap[txCustId]) {
                txObj.customer_name = custMap[txCustId].name;
            } else {
                txObj.customer_name = 'Unknown';
            }

            // Calculate interest
            if (tx.status === 'OPEN') {
                const calc = calculateInterestAmount(
                    tx.amount,
                    tx.interest_rate_snapshot,
                    tx.transaction_date,
                    now
                );
                txObj.interest_calculation = calc;
            } else if (tx.status === 'PAID') {
                txObj.interest_calculation = {
                    months: tx.final_months || 0,
                    rounded_interest: tx.final_interest || 0
                };
            } else {
                txObj.interest_calculation = null;
            }

            return txObj;
        });

        res.json(results);
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/transactions/:id
 * Update transaction
 */
router.patch('/:id', validate(transactionSchemas.update), async (req, res, next) => {
    try {
        const { customer_id, type, amount, content, transaction_date, status, closed_at } = req.body;

        const tx = await Transaction.findOne(buildTransactionLookupQuery(req.params.id));

        if (!tx) {
            throw new APIError('Transaction not found', 404, ErrorCodes.NOT_FOUND);
        }

        let needsRecalc = false;

        // Update type (and snapshot rate)
        if (type !== undefined) {
            const interestConfig = await InterestConfig.findOne({ code: type });
            if (!interestConfig) {
                throw new APIError('Invalid transaction type', 404, ErrorCodes.INVALID_TRANSACTION_TYPE);
            }
            tx.type = type;
            tx.interest_rate_snapshot = interestConfig.rate_per_month;
            needsRecalc = true;
        }

        // Update customer
        if (customer_id !== undefined) {
            const customer = await Customer.findOne({ $or: [{ id: customer_id }, { _id: customer_id }] });
            if (!customer) {
                throw new APIError('Customer not found', 404, ErrorCodes.NOT_FOUND);
            }
            tx.customer_id = customer_id;
        }

        // Update amount
        if (amount !== undefined) {
            if (isNaN(amount) || amount <= 0) {
                throw new APIError('Giá trị tiền không hợp lệ', 400, ErrorCodes.INVALID_AMOUNT);
            }
            tx.amount = amount;
            needsRecalc = true;
        }

        // Update content
        if (content !== undefined) {
            tx.content = content;
        }

        // Update transaction date
        if (transaction_date !== undefined) {
            tx.transaction_date = new Date(transaction_date);
            if (isNaN(tx.transaction_date.getTime())) {
                throw new APIError('Ngày giao dịch không hợp lệ', 400, ErrorCodes.VALIDATION_ERROR);
            }
            needsRecalc = true;
        }

        // Handle status change
        const newStatus = status !== undefined ? status : tx.status;
        const statusChanged = newStatus !== tx.status;

        if (closed_at !== undefined) {
            needsRecalc = true;
        }

        if (newStatus === 'OPEN') {
            if (statusChanged) {
                // Clear all payment-related fields when switching to OPEN
                tx.status = 'OPEN';
                tx.closed_at = null;
                tx.final_interest = null;
                tx.final_months = null;
                tx.final_total = null;
            }
            // If closed_at is explicitly set to null in request, ensure it's cleared
            if (closed_at === null) {
                tx.closed_at = null;
            }
        } else if (newStatus === 'PAID') {
            // Determine payment date
            let targetPaymentDate;

            if (closed_at !== undefined && closed_at !== null) {
                targetPaymentDate = new Date(closed_at);
            } else if (tx.closed_at) {
                targetPaymentDate = tx.closed_at;
            } else {
                targetPaymentDate = new Date();
            }

            if (isNaN(targetPaymentDate.getTime())) {
                throw new APIError('Ngày thanh toán không hợp lệ', 400, ErrorCodes.VALIDATION_ERROR);
            }

            // Normalize dates to start of day for consistent comparison and calculation
            const normalizedPaymentDate = new Date(targetPaymentDate);
            normalizedPaymentDate.setHours(0, 0, 0, 0);
            
            const txDateNormalized = new Date(tx.transaction_date);
            txDateNormalized.setHours(0, 0, 0, 0);

            if (normalizedPaymentDate < txDateNormalized) {
                throw new APIError(
                    'Ngày thanh toán không được nhỏ hơn ngày giao dịch',
                    400,
                    ErrorCodes.INVALID_DATE_RANGE
                );
            }

            // Calculate interest from transaction_date to payment_date
            // Both dates are normalized to start of day for consistent day-based calculation
            const calc = calculateInterestAmount(
                tx.amount,
                tx.interest_rate_snapshot,
                txDateNormalized,
                normalizedPaymentDate
            );

            tx.status = 'PAID';
            tx.closed_at = normalizedPaymentDate;
            tx.final_interest = calc.rounded_interest;
            tx.final_months = calc.months;
            tx.final_total = tx.amount + calc.rounded_interest;
        }

        await tx.save();

        logger.info('Transaction updated', { 
            transactionId: tx.id || tx._id,
            customerId: tx.customer_id,
            status: tx.status
        });

        res.json(tx);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/transactions/bulk-pay
 * Bulk payment for all OPEN transactions of a customer
 */
router.post('/bulk-pay', authMiddleware, requireAdminOrSale, async (req, res, next) => {
    try {
        const { customer_id, payment_date, pin } = req.body;

        // Verify user PIN (ADMIN or SALE)
        await verifyAdminPin(pin, req.currentUser);

        // Find OPEN transactions
        const transactions = await Transaction.find({
            customer_id,
            status: 'OPEN'
        });

        if (transactions.length === 0) {
            return res.json({ message: 'Không có giao dịch nào cần thanh toán', count: 0 });
        }

        // Parse payment_date and normalize to start of day in local timezone
        // This ensures consistent date comparison and interest calculation
        const paymentDateObj = new Date(payment_date);
        if (!payment_date || isNaN(paymentDateObj.getTime())) {
            throw new APIError('Ngày thanh toán không hợp lệ', 400, ErrorCodes.VALIDATION_ERROR);
        }
        
        // Normalize to start of day to ensure consistent date comparison
        // Set to 00:00:00 in local timezone
        const normalizedPaymentDate = new Date(paymentDateObj);
        normalizedPaymentDate.setHours(0, 0, 0, 0);
        
        let count = 0;

        for (const tx of transactions) {
            // Normalize transaction_date to start of day for comparison and calculation
            const txDateNormalized = new Date(tx.transaction_date);
            txDateNormalized.setHours(0, 0, 0, 0);
            
            if (normalizedPaymentDate < txDateNormalized) {
                throw new APIError(
                    `Ngày thanh toán không được nhỏ hơn ngày giao dịch (giao dịch ${tx.id || tx._id})`,
                    400,
                    ErrorCodes.INVALID_DATE_RANGE
                );
            }
            
            // Calculate interest from transaction_date to payment_date
            // Both dates are normalized to start of day for consistent day-based calculation
            const calc = calculateInterestAmount(
                tx.amount,
                tx.interest_rate_snapshot,
                txDateNormalized,
                normalizedPaymentDate
            );

            tx.status = 'PAID';
            tx.closed_at = normalizedPaymentDate;
            tx.final_interest = calc.rounded_interest;
            tx.final_months = calc.months;
            tx.final_total = tx.amount + calc.rounded_interest;

            await tx.save();
            count++;
        }

        logger.info('Bulk payment completed', { 
            customerId, 
            count,
            paymentDate: payment_date 
        });

        res.json({ message: 'Thanh toán thành công', count });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/transactions/delete-secure
 * Delete transaction with PIN verification
 */
router.post('/delete-secure', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const { id, pin } = req.body;

        // Verify admin PIN
        await verifyAdminPin(pin, req.currentUser);

        const tx = await Transaction.findOne({ $or: [{ id }, { _id: id }] });

        if (!tx) {
            throw new APIError('Transaction not found', 404, ErrorCodes.NOT_FOUND);
        }

        await Transaction.deleteOne({ $or: [{ id }, { _id: id }] });

        res.json({ message: 'Đã xóa giao dịch' });
    } catch (error) {
        logger.error('Delete transaction error', { 
            error: error.message, 
            transactionId: id,
            stack: error.stack 
        });
        next(error);
    }
});

/**
 * GET /api/transactions/reports/monthly-count?year=2024
 * Số lượng giao dịch theo từng tháng trong năm
 */
router.get('/reports/monthly-count', async (req, res, next) => {
    try {
        const year = parseInt(req.query.year, 10) || new Date().getFullYear();
        const start = new Date(year, 0, 1);
        const end = new Date(year, 11, 31, 23, 59, 59, 999);

        const agg = await Transaction.aggregate([
            { $match: { transaction_date: { $gte: start, $lte: end } } },
            { $group: { _id: { $month: '$transaction_date' }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        const map = {};
        agg.forEach((r) => { map[r._id] = r.count; });

        const labels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
        const result = labels.map((label, i) => ({
            month: i + 1,
            label,
            count: map[i + 1] || 0
        }));

        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/transactions/reports/debt
 * Debt report for all customers
 */
router.get('/reports/debt', async (req, res, next) => {
    try {
        const customers = await Customer.find().lean();
        const transactions = await Transaction.find().lean();

        const txByCustomerId = {};
        for (const tx of transactions) {
            const key = (tx?.customer_id ?? '').toString().trim();
            if (!key) continue;
            if (!txByCustomerId[key]) txByCustomerId[key] = [];
            txByCustomerId[key].push(tx);
        }

        const now = new Date();
        const reports = customers.map(customer => {
            const customId = (customer?.id ?? '').toString().trim();
            const mongoId = (customer?._id ?? '').toString().trim();
            const customerKey = customId || mongoId;

            const customerTxs = customerKey ? (txByCustomerId[customerKey] || []) : [];

            let lifetimePrincipal = 0;
            let lifetimeInterest = 0;
            let collected = 0;

            for (const tx of customerTxs) {
                const principal = Number(tx.amount || 0);
                let interest = 0;

                if (tx.status === 'OPEN') {
                    const calc = calculateInterestAmount(
                        principal,
                        tx.interest_rate_snapshot,
                        tx.transaction_date,
                        now
                    );
                    interest = Number(calc.rounded_interest || 0);
                } else if (tx.status === 'PAID') {
                    interest = Number(tx.final_interest || 0);
                    const val = Number(tx.final_total ?? (principal + interest));
                    collected += val;
                }

                lifetimePrincipal += principal;
                lifetimeInterest += interest;
            }

            const totalPayment = lifetimePrincipal + lifetimeInterest;
            const totalRemaining = totalPayment - collected;

            return {
                customer_id: customerKey,
                customer_name: customer.name,
                total_principal: Math.round(lifetimePrincipal * 100) / 100,
                total_interest: Math.round(lifetimeInterest * 100) / 100,
                total_debt: Math.round(totalRemaining * 100) / 100,
                total_collected: Math.round(collected * 100) / 100,
                transaction_count: customerTxs.length
            };
        });

        res.json(reports);
    } catch (error) {
        next(error);
    }
});

export default router;
