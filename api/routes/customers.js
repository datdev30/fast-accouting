import express from 'express';
import Customer from '../models/Customer.js';
import Transaction from '../models/Transaction.js';
import { getNextId } from '../utils/counter.js';
import { isMongoWriteForbidden, verifyAdminPin } from '../utils/helpers.js';
import User from '../models/User.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/customers
 * Get all customers with status
 */
router.get('/', async (req, res) => {
    try {
        const customers = await Customer.find().lean();
        const transactions = await Transaction.find().lean();

        const idResolver = {};
        customers.forEach(c => {
            const rawCustomId = c?.id;
            const customId = rawCustomId !== null && rawCustomId !== undefined
                ? String(rawCustomId).trim()
                : null;

            const mongoId = c?._id !== null && c?._id !== undefined
                ? String(c._id).trim()
                : null;

            const key = customId || mongoId;
            if (!key) return;

            if (customId) idResolver[customId] = key;
            if (mongoId) idResolver[mongoId] = key;
        });

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

        // Build results with status
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
            const hasHistory = cTxs.length > 0;
            const hasOpenDebt = cTxs.some(tx => tx.status === 'OPEN');
            const isPaidInFull = hasHistory && !hasOpenDebt;

            return {
                _id: c._id,
                id: key, // Custom ID (KHxxx) or fallback to Mongo _id
                name: c.name,
                contact_info: c.contact_info,
                created_at: c.created_at,
                is_paid_in_full: isPaidInFull,
                has_history: hasHistory,
                transaction_count: cTxs.length
            };
        });

        res.json(results);
    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/customers
 * Create new customer
 */
router.post('/', async (req, res) => {
    try {
        const { name, contact_info } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        // Generate custom ID
        const newId = await getNextId('customer');

        const customer = new Customer({
            id: newId,
            name,
            contact_info: contact_info || null
        });

        await customer.save();

        res.status(201).json(customer);
    } catch (error) {
        console.error('Create customer error:', error);
        const statusCode = error.statusCode || (isMongoWriteForbidden(error) ? 403 : 500);
        res.status(statusCode).json({
            error: statusCode === 403
                ? 'Hệ thống đang ở chế độ chỉ đọc (read-only). Không thể tạo khách hàng.'
                : error.message
        });
    }
});

/**
 * GET /api/customers/:id
 * Get single customer
 */
router.get('/:id', async (req, res) => {
    try {
        const customerId = String(req.params.id ?? '').trim();
        const customer = await Customer.findOne({ $or: [{ id: customerId }, { _id: customerId }] });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json(customer);
    } catch (error) {
        console.error('Get customer error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/customers/:id
 * Update customer
 */
router.patch('/:id', async (req, res) => {
    try {
        const { name, contact_info } = req.body;

        const customerId = String(req.params.id ?? '').trim();
        const customer = await Customer.findOne({ $or: [{ id: customerId }, { _id: customerId }] });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Update fields
        if (name !== undefined) customer.name = name;
        if (contact_info !== undefined) customer.contact_info = contact_info;

        await customer.save();

        res.json(customer);
    } catch (error) {
        console.error('Update customer error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/customers/delete-secure
 * Delete customer with PIN verification (cascade delete transactions)
 */
router.post('/delete-secure', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const { id, pin } = req.body;

        // Verify admin PIN
        await verifyAdminPin(pin, req.currentUser);

        const customer = await Customer.findOne({ id });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Cascade delete transactions
        await Transaction.deleteMany({ customer_id: id });

        // Delete customer
        await Customer.deleteOne({ id });

        res.json({ message: 'Đã xóa khách hàng và toàn bộ dữ liệu liên quan' });
    } catch (error) {
        console.error('Delete customer error:', error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({ error: error.message });
    }
});

export default router;
