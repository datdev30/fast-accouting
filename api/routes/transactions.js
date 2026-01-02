import express from 'express';

import mongoose, { Types } from 'mongoose';
import Transaction from '../models/Transaction.js';
import Customer from '../models/Customer.js';
import InterestConfig from '../models/InterestConfig.js';
import User from '../models/User.js';
import { getNextId } from '../utils/counter.js';
import { calculateInterestAmount } from '../utils/interest.js';
import { verifyAdminPin } from '../utils/helpers.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/transactions
 * Create new transaction
 */
router.post('/', async (req, res) => {
    try {
        const { customer_id, type, amount, content, transaction_date } = req.body;

        if (amount === undefined || amount === null || isNaN(amount)) {
            return res.status(400).json({ error: 'Giá trị tiền không hợp lệ' });
        }

        // Validate customer exists (PROD can store business key in `_id`)
        const customer = await Customer.findOne({ $or: [{ id: customer_id }, { _id: customer_id }] });
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Validate interest config exists
        const interestConfig = await InterestConfig.findOne({ code: type });
        if (!interestConfig) {
            return res.status(404).json({ error: 'Invalid transaction type' });
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

        res.status(201).json(transaction);
    } catch (error) {
        console.error('Create transaction error:', error);
        res.status(500).json({
            error: error.message,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
    }
});

/**
 * GET /api/transactions
 * Get transactions with filters and calculated interest
 */
router.get('/', async (req, res) => {
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
        console.error('Get transactions error:', error);
        res.status(500).json({
            error: error.message,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
    }
});

/**
 * PATCH /api/transactions/:id
 * Update transaction
 */
router.patch('/:id', async (req, res) => {
    try {
        const { customer_id, type, amount, content, transaction_date, status, closed_at } = req.body;

        const tx = await Transaction.findOne({ $or: [{ id: req.params.id }, { _id: req.params.id }] });

        if (!tx) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        let needsRecalc = false;

        // Update type (and snapshot rate)
        if (type !== undefined) {
            const interestConfig = await InterestConfig.findOne({ code: type });
            if (!interestConfig) {
                return res.status(404).json({ error: 'Invalid transaction type' });
            }
            tx.type = type;
            tx.interest_rate_snapshot = interestConfig.rate_per_month;
            needsRecalc = true;
        }

        // Update customer
        if (customer_id !== undefined) {
            const customer = await Customer.findOne({ $or: [{ id: customer_id }, { _id: customer_id }] });
            if (!customer) {
                return res.status(404).json({ error: 'Customer not found' });
            }
            tx.customer_id = customer_id;
        }

        // Update amount
        if (amount !== undefined) {
            if (isNaN(amount)) {
                return res.status(400).json({ error: 'Giá trị tiền không hợp lệ' });
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
                return res.status(400).json({ error: 'Ngày giao dịch không hợp lệ' });
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
                tx.status = 'OPEN';
                tx.closed_at = null;
                tx.final_interest = null;
                tx.final_months = null;
                tx.final_total = null;
            }
        } else if (newStatus === 'PAID') {
            // Determine payment date
            let targetPaymentDate;

            if (closed_at) {
                targetPaymentDate = new Date(closed_at);
            } else if (tx.closed_at) {
                targetPaymentDate = tx.closed_at;
            } else {
                targetPaymentDate = new Date();
            }

            if (isNaN(targetPaymentDate.getTime())) {
                return res.status(400).json({ error: 'Ngày thanh toán không hợp lệ' });
            }

            if (targetPaymentDate < tx.transaction_date) {
                return res.status(400).json({
                    error: 'Ngày thanh toán không được nhỏ hơn ngày giao dịch'
                });
            }

            // Calculate interest
            const calc = calculateInterestAmount(
                tx.amount,
                tx.interest_rate_snapshot,
                tx.transaction_date,
                targetPaymentDate
            );

            tx.status = 'PAID';
            tx.closed_at = targetPaymentDate;
            tx.final_interest = calc.rounded_interest;
            tx.final_months = calc.months;
            tx.final_total = tx.amount + calc.rounded_interest;
        }

        await tx.save();

        res.json(tx);
    } catch (error) {
        console.error('Update transaction error:', error);
        res.status(500).json({
            error: error.message,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
    }
});

/**
 * POST /api/transactions/bulk-pay
 * Bulk payment for all OPEN transactions of a customer
 */
router.post('/bulk-pay', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const { customer_id, payment_date, pin } = req.body;

        // Verify admin PIN
        await verifyAdminPin(pin, req.currentUser);

        // Find OPEN transactions
        const transactions = await Transaction.find({
            customer_id,
            status: 'OPEN'
        });

        if (transactions.length === 0) {
            return res.json({ message: 'Không có giao dịch nào cần thanh toán', count: 0 });
        }

        const paymentDateObj = new Date(payment_date);
        if (!payment_date || isNaN(paymentDateObj.getTime())) {
            return res.status(400).json({ error: 'Ngày thanh toán không hợp lệ' });
        }
        let count = 0;

        for (const tx of transactions) {
            if (paymentDateObj < tx.transaction_date) {
                return res.status(400).json({
                    error: `Ngày thanh toán không được nhỏ hơn ngày giao dịch (giao dịch ${tx.id || tx._id})`
                });
            }
            // Calculate interest
            const calc = calculateInterestAmount(
                tx.amount,
                tx.interest_rate_snapshot,
                tx.transaction_date,
                paymentDateObj
            );

            tx.status = 'PAID';
            tx.closed_at = paymentDateObj;
            tx.final_interest = calc.rounded_interest;
            tx.final_months = calc.months;
            tx.final_total = tx.amount + calc.rounded_interest;

            await tx.save();
            count++;
        }

        res.json({ message: 'Thanh toán thành công', count });
    } catch (error) {
        console.error('Bulk pay error:', error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({ error: error.message });
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
            return res.status(404).json({ error: 'Transaction not found' });
        }

        await Transaction.deleteOne({ $or: [{ id }, { _id: id }] });

        res.json({ message: 'Đã xóa giao dịch' });
    } catch (error) {
        console.error('Delete transaction error:', error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({ error: error.message });
    }
});

/**
 * GET /api/transactions/reports/debt
 * Debt report for all customers
 */
router.get('/reports/debt', async (req, res) => {
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
        console.error('Debt report error:', error);
        res.status(500).json({
            error: error.message,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
    }
});

export default router;
