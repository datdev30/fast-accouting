import express from 'express';
import Customer from '../models/Customer.js';
import Transaction from '../models/Transaction.js';
import { getNextId } from '../utils/counter.js';
import { isMongoWriteForbidden, verifyAdminPin } from '../utils/helpers.js';
import User from '../models/User.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { validate, customerSchemas } from '../middleware/validation.js';
import { APIError, ErrorCodes } from '../utils/errors.js';
import logger from '../utils/logger.js';
import { buildCustomerIdResolver, calculateCustomerDebt, getCustomerStatus, resolveCustomerId } from '../utils/customerHelpers.js';

const router = express.Router();

/**
 * GET /api/customers
 * Get all customers with status
 */
router.get('/', async (req, res, next) => {
    try {
        const customers = await Customer.find().lean();
        const transactions = await Transaction.find().lean();

        // Use helper function for ID resolution
        const idResolver = buildCustomerIdResolver(customers);

        // Map transactions to unified Custom ID
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

        // Build results with status and total_debt using helper functions
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

            // Use helper functions
            const status = getCustomerStatus(cTxs);
            const debt = calculateCustomerDebt(cTxs, now);

            return {
                _id: c._id,
                id: key, // Custom ID (KHxxx) or fallback to Mongo _id
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
 * Create new customer
 */
router.post('/', validate(customerSchemas.create), async (req, res, next) => {
    try {
        const { name, contact_info } = req.body;

        // Generate custom ID
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
 * Get single customer
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
 * Update customer
 */
router.patch('/:id', validate(customerSchemas.update), async (req, res, next) => {
    try {
        const { name, contact_info } = req.body;
        const customerId = String(req.params.id ?? '').trim();
        
        const customer = await resolveCustomerId(customerId);
        if (!customer) {
            throw new APIError('Customer not found', 404, ErrorCodes.NOT_FOUND);
        }

        // Update fields
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
 * Delete customer with PIN verification (cascade delete transactions)
 */
router.post('/delete-secure', authMiddleware, requireAdmin, async (req, res, next) => {
    try {
        const { id, pin } = req.body;

        if (!id) {
            throw new APIError('Customer ID is required', 400, ErrorCodes.VALIDATION_ERROR);
        }

        // Verify admin PIN
        await verifyAdminPin(pin, req.currentUser);

        const customer = await Customer.findOne({ id });
        if (!customer) {
            throw new APIError('Customer not found', 404, ErrorCodes.NOT_FOUND);
        }

        // Cascade delete transactions
        const deleteResult = await Transaction.deleteMany({ customer_id: id });

        // Delete customer
        await Customer.deleteOne({ id });

        logger.warn('Customer deleted', { 
            customerId: id, 
            customerName: customer.name,
            deletedTransactions: deleteResult.deletedCount 
        });

        res.json({ message: 'Đã xóa khách hàng và toàn bộ dữ liệu liên quan' });
    } catch (error) {
        next(error);
    }
});

export default router;
