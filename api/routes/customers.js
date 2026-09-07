import express from 'express';
import { getCustomerModel, getTransactionModel } from '../db/models.js';
import { getNextId } from '../utils/counter.js';
import { isMongoWriteForbidden, verifyAdminPin } from '../utils/helpers.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { validate, customerSchemas } from '../middleware/validation.js';
import { APIError, ErrorCodes } from '../utils/errors.js';
import logger from '../utils/logger.js';
import { buildCustomerIdResolver, calculateCustomerDebt, getCustomerStatus, resolveCustomerId } from '../utils/customerHelpers.js';

const router = express.Router();

/**
 * GET /api/customers
 * Danh sách KH dùng chung; nợ/số GD tính theo năm làm việc đang chọn.
 */
router.get('/', async (req, res, next) => {
    try {
        const Customer = getCustomerModel();
        const Transaction = getTransactionModel();
        const year = req.workingYear;
        const customers = await Customer.find({}).lean();
        const transactions = await Transaction.find({ working_year: year }).lean();

        const idResolver = buildCustomerIdResolver(customers);

        const txMap = {};
        for (const tx of transactions) {
            const txObj = tx;
            const rawCid = (txObj.customer_id !== null && txObj.customer_id !== undefined) ? txObj.customer_id.toString().trim() : null;
            const resolvedCid = rawCid ? (idResolver[rawCid] || rawCid) : null;

            if (resolvedCid) {
                if (!txMap[resolvedCid]) txMap[resolvedCid] = [];
                txMap[resolvedCid].push(txObj);
            }
        }

        const now = new Date();
        const results = customers.map(c => {
            const rawCustomId = c?.id;
            const customId = rawCustomId !== null && rawCustomId !== undefined
                ? String(rawCustomId).trim()
                : null;
            const mongoId = c?._id !== null && c?._id !== undefined
                ? String(c._id).trim()
                : null;

            const key = customId || mongoId;
            const cTxs = key ? (txMap[key] || []) : [];

            const status = getCustomerStatus(cTxs);
            const debt = calculateCustomerDebt(cTxs, now);

            return {
                _id: c._id,
                id: key,
                name: c.name,
                contact_info: c.contact_info,
                created_at: c.created_at,
                is_paid_in_full: status.isPaidInFull,
                has_history: status.hasHistory,
                transaction_count: cTxs.length,
                total_debt: debt.totalDebt
            };
        });

        res.json(results);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/customers
 */
router.post('/', validate(customerSchemas.create), async (req, res, next) => {
    try {
        const { name, contact_info } = req.body;
        const Customer = getCustomerModel();

        const newId = await getNextId('customer');

        const customer = new Customer({
            id: newId,
            name,
            contact_info: contact_info || null
        });

        await customer.save();

        logger.info('Customer created', { customerId: newId, name });

        res.status(201).json(customer);
    } catch (error) {
        if (isMongoWriteForbidden(error)) {
            throw new APIError(
                'Hệ thống đang ở chế độ chỉ đọc (read-only). Không thể tạo khách hàng.',
                403,
                ErrorCodes.READ_ONLY_MODE
            );
        }
        next(error);
    }
});

/**
 * GET /api/customers/:id
 */
router.get('/:id', async (req, res, next) => {
    try {
        const customerId = String(req.params.id ?? '').trim();
        const customer = await resolveCustomerId(customerId);

        if (!customer) {
            throw new APIError('Customer not found', 404, ErrorCodes.NOT_FOUND);
        }

        res.json(customer);
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/customers/:id
 */
router.patch('/:id', validate(customerSchemas.update), async (req, res, next) => {
    try {
        const { name, contact_info } = req.body;
        const customerId = String(req.params.id ?? '').trim();

        const customer = await resolveCustomerId(customerId);
        if (!customer) {
            throw new APIError('Customer not found', 404, ErrorCodes.NOT_FOUND);
        }

        if (name !== undefined) customer.name = name;
        if (contact_info !== undefined) customer.contact_info = contact_info;

        await customer.save();

        logger.info('Customer updated', { customerId, name: customer.name });

        res.json(customer);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/customers/delete-secure
 * Xóa KH + toàn bộ GD của KH (mọi năm)
 */
router.post('/delete-secure', authMiddleware, requireAdmin, async (req, res, next) => {
    try {
        const { id, pin } = req.body;

        if (!id) {
            throw new APIError('Customer ID is required', 400, ErrorCodes.VALIDATION_ERROR);
        }

        await verifyAdminPin(pin, req.currentUser);

        const Customer = getCustomerModel();
        const Transaction = getTransactionModel();
        const customer = await Customer.findOne({ $or: [{ id }, { _id: id }] });
        if (!customer) {
            throw new APIError('Customer not found', 404, ErrorCodes.NOT_FOUND);
        }

        const customerKey = customer.id || String(customer._id);
        const deleteResult = await Transaction.deleteMany({
            $or: [
                { customer_id: customerKey },
                { customer_id: id }
            ]
        });

        await Customer.deleteOne({ $or: [{ id: customer.id }, { _id: customer._id }] });

        logger.warn('Customer deleted', {
            customerId: customerKey,
            customerName: customer.name,
            deletedTransactions: deleteResult.deletedCount
        });

        res.json({ message: 'Đã xóa khách hàng và toàn bộ dữ liệu liên quan' });
    } catch (error) {
        next(error);
    }
});

export default router;
