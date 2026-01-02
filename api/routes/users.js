import express from 'express';
import User from '../models/User.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { verifyAdminPin } from '../utils/helpers.js';

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
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const users = await User.find()
            .select('username display_name role legacy_password')
            .sort({ username: 1 });

        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/users
 * Admin only - create user
 */
router.post('/', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const { username, password, display_name, role, pin } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const existing = await User.findOne({ username: String(username).trim() });
        if (existing) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await User.hashPassword(password);
        const normalizedRole = normalizeRole(role) || 'SALE';

        const userData = {
            username: String(username).trim(),
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

        res.status(201).json({
            _id: user._id,
            username: user.username,
            display_name: user.display_name,
            role: user.role,
            legacy_password: user.legacy_password
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/users/:id
 * Admin only - update user fields
 */
router.patch('/:id', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const { display_name, role, password, pin } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (display_name !== undefined) {
            user.display_name = display_name ? String(display_name).trim() : null;
        }

        if (role !== undefined) {
            const normalizedRole = normalizeRole(role);
            if (!normalizedRole) {
                return res.status(400).json({ error: 'Invalid role. Use ADMIN or SALE.' });
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

        res.json({
            _id: user._id,
            username: user.username,
            display_name: user.display_name,
            role: user.role,
            legacy_password: user.legacy_password
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/users/delete-secure
 * Admin only - delete user with PIN verification
 */
router.post('/delete-secure', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const { id, pin } = req.body;

        await verifyAdminPin(pin, req.currentUser);

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await User.deleteOne({ _id: id });
        res.json({ message: 'Đã xóa user' });
    } catch (error) {
        console.error('Delete user error:', error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({ error: error.message });
    }
});

export default router;
