import express from 'express';
import { EJSON } from 'bson';

import Customer from '../models/Customer.js';
import Transaction from '../models/Transaction.js';
import InterestConfig from '../models/InterestConfig.js';
import User from '../models/User.js';
import Counter from '../models/Counter.js';

import { authMiddleware, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

function formatTimestampForFilename(date = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    return [
        date.getFullYear(),
        pad(date.getMonth() + 1),
        pad(date.getDate()),
        '-',
        pad(date.getHours()),
        pad(date.getMinutes()),
        pad(date.getSeconds())
    ].join('');
}

async function exportAllCollections() {
    const customers = await Customer.find().lean();
    const transactions = await Transaction.find().lean();
    const interest_configs = await InterestConfig.find().lean();
    const users = await User.find().lean();
    const counters = await Counter.find().lean();

    const counts = {
        customers: customers.length,
        transactions: transactions.length,
        interest_configs: interest_configs.length,
        users: users.length,
        counters: counters.length
    };

    return {
        meta: {
            app: 'FastAccounting',
            format: 'ejson-bundle',
            created_at: new Date().toISOString(),
            counts
        },
        collections: {
            customers,
            transactions,
            interest_configs,
            users,
            counters
        }
    };
}

async function upsertMany(model, docs) {
    if (!Array.isArray(docs) || docs.length === 0) return { count: 0, affected: 0 };

    const ops = docs.map((doc) => {
        if (!doc || !doc._id) return null;
        return {
            replaceOne: {
                filter: { _id: doc._id },
                replacement: doc,
                upsert: true
            }
        };
    }).filter(Boolean);

    if (ops.length === 0) return { count: docs.length, affected: 0 };

    const res = await model.collection.bulkWrite(ops, { ordered: false });
    const affected = (res.upsertedCount || 0) + (res.modifiedCount || 0) + (res.insertedCount || 0);

    return { count: docs.length, affected };
}

// ADMIN: download a single EJSON bundle of all collections
router.get('/export', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const bundle = await exportAllCollections();
        const filename = `fastaccounting-backup-${formatTimestampForFilename()}.ejson.json`;

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        const body = EJSON.stringify(bundle, { relaxed: false, indent: 2 });
        res.send(body);
    } catch (error) {
        console.error('Backup export error:', error);
        res.status(500).json({ error: 'Cannot export backup' });
    }
});

// ADMIN: import an EJSON bundle back into the current database (UPSERT by _id)
router.post(
    '/import',
    authMiddleware,
    requireAdmin,
    express.text({ type: '*/*', limit: '50mb' }),
    async (req, res) => {
        try {
            if (!req.body || typeof req.body !== 'string') {
                return res.status(400).json({ error: 'Missing backup file content' });
            }

            let parsed;
            try {
                parsed = EJSON.parse(req.body, { relaxed: false });
            } catch {
                return res.status(400).json({ error: 'Invalid backup format (expected EJSON)' });
            }

            const collections = parsed?.collections;
            if (!collections || typeof collections !== 'object') {
                return res.status(400).json({ error: 'Backup file missing collections' });
            }

            const results = {};
            results.customers = await upsertMany(Customer, collections.customers || []);
            results.transactions = await upsertMany(Transaction, collections.transactions || []);
            results.interest_configs = await upsertMany(InterestConfig, collections.interest_configs || []);
            results.users = await upsertMany(User, collections.users || []);
            results.counters = await upsertMany(Counter, collections.counters || []);

            res.json({
                ok: true,
                imported_at: new Date().toISOString(),
                results
            });
        } catch (error) {
            console.error('Backup import error:', error);
            res.status(500).json({ error: 'Cannot import backup' });
        }
    }
);

export default router;
