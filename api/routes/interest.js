import express from 'express';
import InterestConfig from '../models/InterestConfig.js';
import User from '../models/User.js';
import { verifyAdminPin } from '../utils/helpers.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { validate, interestConfigSchemas } from '../middleware/validation.js';
import { APIError, ErrorCodes } from '../utils/errors.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/interest-configs
 * Get all interest configurations
 */
router.get('/', async (req, res, next) => {
    try {
        const configs = await InterestConfig.find();
        res.json(configs);
    } catch (error) {
        next(error);
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
router.get('/:code', async (req, res, next) => {
    try {
        const config = await InterestConfig.findOne({ code: req.params.code.toUpperCase() });

        if (!config) {
            throw new APIError('Config not found', 404, ErrorCodes.NOT_FOUND);
        }

        res.json(config);
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/interest-configs/:code
 * Update interest configuration
 */
router.patch('/:code', validate(interestConfigSchemas.update), async (req, res, next) => {
    try {
        const { name, rate_per_month, description } = req.body;

        const config = await InterestConfig.findOne({ code: req.params.code.toUpperCase() });

        if (!config) {
            throw new APIError('Config not found', 404, ErrorCodes.NOT_FOUND);
        }

        // Update fields
        if (name !== undefined) config.name = name;
        if (rate_per_month !== undefined) config.rate_per_month = rate_per_month;
        if (description !== undefined) config.description = description;

        await config.save();

        logger.info('Interest config updated', { code: config.code, name: config.name });

        res.json(config);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/interest-configs/delete-secure
 * Delete interest configuration with PIN verification
 */
router.post('/delete-secure', authMiddleware, requireAdmin, async (req, res, next) => {
    try {
        const { code, pin } = req.body;

        if (!code) {
            throw new APIError('Config code is required', 400, ErrorCodes.VALIDATION_ERROR);
        }

        // Verify admin PIN
        await verifyAdminPin(pin, req.currentUser);

        const normalizedCode = String(code).trim().toUpperCase();
        const config = await InterestConfig.findOne({ code: normalizedCode });

        if (!config) {
            throw new APIError('Config not found', 404, ErrorCodes.NOT_FOUND);
        }

        await InterestConfig.deleteOne({ code: normalizedCode });

        logger.warn('Interest config deleted', { code: normalizedCode, name: config.name });

        res.json({ message: 'Đã xóa cấu hình' });
    } catch (error) {
        next(error);
    }
});

export default router;
