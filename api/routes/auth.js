import express from 'express';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register new user
 */
router.post('/register', async (req, res) => {
    try {
        const { username, password, display_name } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password
        const hashedPassword = await User.hashPassword(password);

        // Create user
        const user = new User({
            username,
            password_hash: hashedPassword,
            legacy_password: false,
            display_name: display_name || username,
            role: 'SALE'
        });

        await user.save();

        res.status(201).json({
            message: 'User created successfully',
            username: user.username
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

/**
 * POST /api/auth/login
 * Login user and return JWT token
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Compare password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate JWT token
        const token = user.generateToken();

        res.json({
            token,
            username: user.username,
            display_name: user.display_name || user.username,
            role: user.role || null
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
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
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        const username = req.user?.username;

        let user = null;
        if (userId !== null && userId !== undefined) {
            user = await User.findById(userId).select('-password_hash -pin_hash');
        }

        if (!user && username) {
            user = await User.findOne({ username }).select('-password_hash -pin_hash');
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            username: user.username,
            display_name: user.display_name || user.username,
            role: user.role || null
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
