import express from 'express';
import InterestConfig from '../models/InterestConfig.js';
import User from '../models/User.js';
import { verifyAdminPin } from '../utils/helpers.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/interest-configs
 * Get all interest configurations
 */
router.get('/', async (req, res) => {
    try {
        const configs = await InterestConfig.find();
        res.json(configs);
    } catch (error) {
        console.error('Get interest configs error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/interest-configs
 * Create new interest configuration
 */
router.post('/', async (req, res) => {
    try {
        const { code, name, rate_per_month, description } = req.body;

        if (!code || !name || rate_per_month === undefined) {
            return res.status(400).json({ error: 'Code, name, and rate_per_month are required' });
        }

        // Check if code already exists
        const existing = await InterestConfig.findOne({ code });
        if (existing) {
            return res.status(400).json({ error: 'Config code already exists' });
        }

        const config = new InterestConfig({
            code,
            name,
            rate_per_month,
            description: description || null
        });

        await config.save();

        res.status(201).json(config);
    } catch (error) {
        console.error('Create interest config error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/interest-configs/:code
 * Get single interest configuration
 */
router.get('/:code', async (req, res) => {
    try {
        const config = await InterestConfig.findOne({ code: req.params.code });

        if (!config) {
            return res.status(404).json({ error: 'Config not found' });
        }

        res.json(config);
    } catch (error) {
        console.error('Get interest config error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/interest-configs/:code
 * Update interest configuration
 */
router.patch('/:code', async (req, res) => {
    try {
        const { name, rate_per_month, description } = req.body;

        const config = await InterestConfig.findOne({ code: req.params.code });

        if (!config) {
            return res.status(404).json({ error: 'Config not found' });
        }

        // Update fields
        if (name !== undefined) config.name = name;
        if (rate_per_month !== undefined) config.rate_per_month = rate_per_month;
        if (description !== undefined) config.description = description;

        await config.save();

        res.json(config);
    } catch (error) {
        console.error('Update interest config error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/interest-configs/delete-secure
 * Delete interest configuration with PIN verification
 */
router.post('/delete-secure', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const { code, pin } = req.body;

        // Verify admin PIN
        await verifyAdminPin(pin, req.currentUser);

        const config = await InterestConfig.findOne({ code });

        if (!config) {
            return res.status(404).json({ error: 'Config not found' });
        }

        await InterestConfig.deleteOne({ code });

        res.json({ message: 'Đã xóa cấu hình' });
    } catch (error) {
        console.error('Delete interest config error:', error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({ error: error.message });
    }
});

export default router;
