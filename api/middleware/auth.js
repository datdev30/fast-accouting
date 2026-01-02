import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
export const authMiddleware = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.header('Authorization');

        if (!authHeader) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        // Extract token (format: "Bearer <token>")
        const token = authHeader.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Access denied. Invalid token format.' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user info to request
        req.user = decoded;

        // Optionally fetch full user from database
        // const user = await User.findById(decoded.id);
        // if (!user) {
        //   return res.status(401).json({ error: 'User not found' });
        // }
        // req.user = user;

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        res.status(500).json({ error: 'Server error during authentication' });
    }
};

/**
 * Optional middleware - doesn't fail if no token
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        }
    } catch (error) {
        // Silently fail - user remains unauthenticated
    }
    next();
};

/**
 * Require ADMIN role
 * Loads the full user document to validate role.
 */
export const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ error: 'Access denied. Not authenticated.' });
        }

        // Need `pin_hash` to verify admin PIN in delete-secure endpoints.
        const currentUser = await User.findById(req.user.id).select('role username pin_hash');
        if (!currentUser) {
            return res.status(401).json({ error: 'User not found' });
        }

        if (currentUser.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Bạn không có quyền xóa dữ liệu' });
        }

        req.currentUser = currentUser;
        next();
    } catch (error) {
        console.error('Require admin error:', error);
        res.status(500).json({ error: 'Server error during authorization' });
    }
};
