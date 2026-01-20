import express from 'express';
import User from '../models/User.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { verifyAdminPin } from '../utils/helpers.js';
import { validate, userSchemas } from '../middleware/validation.js';
import { APIError, ErrorCodes } from '../utils/errors.js';
import logger from '../utils/logger.js';

const router = express.Router();

function normalizeRole(role) {
    if (!role) return null;
    const r = String(role).trim().toUpperCase();
    if (r === 'ADMIN' || r === 'SALE') return r;
    return null;
}

/**
 * GET /api/users
 * Admin only - list users
 */
router.get('/', authMiddleware, requireAdmin, async (req, res, next) => {
    try {
        const users = await User.find()
            .select('username display_name role legacy_password')
            .sort({ username: 1 });

        res.json(users);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/users
 * Admin only - create user
 */
router.post('/', authMiddleware, requireAdmin, validate(userSchemas.create), async (req, res, next) => {
    try {
        const { username, password, display_name, role, pin } = req.body;

        // Normalize username to lowercase
        const normalizedUsername = String(username).trim().toLowerCase();

        const existing = await User.findOne({ username: normalizedUsername });
        if (existing) {
            throw new APIError('Username already exists', 400, ErrorCodes.ALREADY_EXISTS);
        }

        const hashedPassword = await User.hashPassword(password);
        const normalizedRole = normalizeRole(role) || 'SALE';

        const userData = {
            username: normalizedUsername,
            password_hash: hashedPassword,
            legacy_password: false,
            display_name: display_name ? String(display_name).trim() : null,
            role: normalizedRole
        };

        if (pin && String(pin).length > 0) {
            userData.pin_hash = await User.hashPin(pin);
        }

        const user = new User(userData);

        await user.save();

        logger.info('User created', { username: user.username, role: user.role });

        res.status(201).json({
            _id: user._id,
            username: user.username,
            display_name: user.display_name,
            role: user.role,
            legacy_password: user.legacy_password
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/users/:id
 * Admin only - update user fields
 */
router.patch('/:id', authMiddleware, requireAdmin, validate(userSchemas.update), async (req, res, next) => {
    try {
        const { display_name, role, password, pin } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            throw new APIError('User not found', 404, ErrorCodes.NOT_FOUND);
        }

        if (display_name !== undefined) {
            user.display_name = display_name ? String(display_name).trim() : null;
        }

        if (role !== undefined) {
            const normalizedRole = normalizeRole(role);
            if (!normalizedRole) {
                throw new APIError('Invalid role. Use ADMIN or SALE.', 400, ErrorCodes.VALIDATION_ERROR);
            }
            user.role = normalizedRole;
        }

        if (password !== undefined && String(password).length > 0) {
            user.password_hash = await User.hashPassword(password);
            user.legacy_password = false;
        }

        if (pin !== undefined && String(pin).length > 0) {
            user.pin_hash = await User.hashPin(pin);
        }

        await user.save();

        logger.info('User updated', { userId: user._id, username: user.username, role: user.role });

        res.json({
            _id: user._id,
            username: user.username,
            display_name: user.display_name,
            role: user.role,
            legacy_password: user.legacy_password
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/users/delete-secure
 * Admin only - delete user with PIN verification
 */
router.post('/delete-secure', authMiddleware, requireAdmin, async (req, res, next) => {
    try {
        const { id, pin } = req.body;

        if (!id) {
            throw new APIError('User ID is required', 400, ErrorCodes.VALIDATION_ERROR);
        }

        await verifyAdminPin(pin, req.currentUser);

        const user = await User.findById(id);
        if (!user) {
            throw new APIError('User not found', 404, ErrorCodes.NOT_FOUND);
        }

        await User.deleteOne({ _id: id });

        logger.warn('User deleted', { userId: id, username: user.username });

        res.json({ message: 'Đã xóa user' });
    } catch (error) {
        next(error);
    }
});

export default router;
