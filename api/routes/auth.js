import express from 'express';
import { getUserModel } from '../db/models.js';
import { withUserAuthMethods, hashPassword } from '../utils/userAuth.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate, authSchemas } from '../middleware/validation.js';
import { APIError, ErrorCodes } from '../utils/errors.js';
import logger from '../utils/logger.js';
import { clearRateLimit } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register new user
 */
router.post('/register', validate(authSchemas.register), async (req, res, next) => {
    try {
        const { username, password, display_name } = req.body;
        const User = getUserModel();

        // Normalize username to lowercase
        const normalizedUsername = String(username).trim().toLowerCase();

        // Check if user exists
        const existingUser = await User.findOne({ username: normalizedUsername });
        if (existingUser) {
            throw new APIError('Username already exists', 400, ErrorCodes.ALREADY_EXISTS);
        }

        // Hash password
        const hashedPassword = User.hashPassword
            ? await User.hashPassword(password)
            : await hashPassword(password);

        // Create user
        const user = new User({
            _id: normalizedUsername,
            username: normalizedUsername,
            password_hash: hashedPassword,
            legacy_password: false,
            display_name: display_name || normalizedUsername,
            role: 'SALE'
        });

        await user.save();

        logger.info('User registered', { username: user.username });

        res.status(201).json({
            message: 'User created successfully',
            username: user.username
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/login
 * Login user and return JWT token
 */
router.post('/login', validate(authSchemas.login), async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const User = getUserModel();

        // Normalize username to lowercase
        const normalizedUsername = String(username).trim().toLowerCase();

        // Find user
        let user = await User.findOne({ username: normalizedUsername });
        user = withUserAuthMethods(user);
        if (!user) {
            throw new APIError('Tên đăng nhập hoặc mật khẩu không đúng', 401, ErrorCodes.INVALID_CREDENTIALS);
        }

        // Compare password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new APIError('Tên đăng nhập hoặc mật khẩu không đúng', 401, ErrorCodes.INVALID_CREDENTIALS);
        }

        // Generate JWT token
        const token = user.generateToken();

        // Clear rate limit for this IP address on successful login
        const clientId = req.ip || req.connection.remoteAddress || 'unknown';
        clearRateLimit(clientId);

        logger.info('User logged in', { username: user.username, role: user.role });

        res.json({
            token,
            username: user.username,
            display_name: user.display_name || user.username,
            role: user.role || null
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/logout
 * Logout (client-side token removal, stateless)
 */
router.post('/logout', (req, res) => {
    // With JWT, logout is handled client-side by removing token
    res.json({ message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 * Get current user info (protected route)
 */
router.get('/me', authMiddleware, async (req, res, next) => {
    try {
        const User = getUserModel();
        const userId = req.user?.id;
        const username = req.user?.username;

        let user = null;
        if (userId !== null && userId !== undefined) {
            user = await User.findById(userId);
        }

        if (!user && username) {
            const normalizedUsername = String(username).trim().toLowerCase();
            user = await User.findOne({ username: normalizedUsername });
        }

        if (!user) {
            throw new APIError('User not found', 404, ErrorCodes.NOT_FOUND);
        }

        res.json({
            username: user.username,
            display_name: user.display_name || user.username,
            role: user.role || null
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/clear-rate-limit
 * Clear rate limit for current IP (for development/testing)
 * Works in development mode without auth, requires ADMIN in production
 */
router.post('/clear-rate-limit', async (req, res, next) => {
    try {
        const isDevelopment = process.env.NODE_ENV !== 'production';
        
        // In production, require authentication and ADMIN role
        if (!isDevelopment) {
            // Use authMiddleware as middleware
            return authMiddleware(req, res, async () => {
                try {
                    const userId = req.user?.id;
                    const username = req.user?.username;

                    const User = getUserModel();
                    let user = null;
                    if (userId !== null && userId !== undefined) {
                        user = await User.findById(userId);
                    }
                    if (!user && username) {
                        const normalizedUsername = String(username).trim().toLowerCase();
                        user = await User.findOne({ username: normalizedUsername });
                    }

                    if (!user || user.role !== 'ADMIN') {
                        return res.status(403).json({ error: 'Chỉ ADMIN mới có quyền xóa rate limit' });
                    }

                    const clientId = req.ip || req.connection.remoteAddress || 'unknown';
                    const cleared = clearRateLimit(clientId);

                    logger.info('Rate limit cleared by ADMIN', { clientId, cleared, username: user.username });

                    res.json({
                        message: 'Đã xóa rate limit',
                        cleared
                    });
                } catch (error) {
                    next(error);
                }
            });
        }

        // In development, allow without auth
        const clientId = req.ip || req.connection.remoteAddress || 'unknown';
        const cleared = clearRateLimit(clientId);

        logger.info('Rate limit cleared (development mode)', { clientId, cleared });

        res.json({
            message: 'Đã xóa rate limit (development mode)',
            cleared,
            clientId
        });
    } catch (error) {
        next(error);
    }
});

export default router;
