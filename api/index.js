import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import connectDB from './config/db.js';
import { errorHandler } from './utils/errors.js';
import { apiRateLimiter, authRateLimiter } from './middleware/rateLimiter.js';
import logger from './utils/logger.js';

// Import routes
import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customers.js';
import transactionRoutes from './routes/transactions.js';
import interestRoutes from './routes/interest.js';
import reportRoutes from './routes/reports.js';
import userRoutes from './routes/users.js';
import infoRoutes from './routes/info.js';
import backupRoutes from './routes/backup.js';

// Load environment variables: ưu tiên api/.env (kể cả khi chạy từ thư mục gốc)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config(); // fallback: .env tại cwd

// Initialize Express app
const app = express();

// Middleware
// CORS: Allow both web app and Android WebView origins
let allowedOrigins = ['*']; // Default: allow all

if (process.env.CORS_ORIGIN) {
    // Support multiple origins separated by comma
    allowedOrigins = process.env.CORS_ORIGIN.split(',').map(o => o.trim()).filter(o => o);
    
    // Always ensure Android WebView origins are included
    const androidOrigins = [
        'https://appassets.androidplatform.net', // Standard Android WebView origin
        'https://localhost', // Capacitor default origin with https scheme
        'http://localhost' // Capacitor default origin with http scheme (if used)
    ];
    
    if (!allowedOrigins.includes('*')) {
        androidOrigins.forEach(origin => {
            if (!allowedOrigins.includes(origin)) {
                allowedOrigins.push(origin);
            }
        });
    }
}

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, or same-origin requests)
        if (!origin) return callback(null, true);
        
        // Allow if wildcard is set
        if (allowedOrigins.includes('*')) {
            return callback(null, true);
        }
        
        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            logger.warn('CORS blocked origin', { origin, allowed: allowedOrigins });
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    exposedHeaders: ['Content-Disposition']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
// (serverless) DB connection is established lazily per request

// Health check route
app.get('/', (req, res) => {
    res.json({
        message: 'FastAccounting API',
        version: '1.0.0',
        status: 'running'
    });
});

// Rate limiting - DISABLED for internal system
// Uncomment below lines if you want to enable rate limiting
// app.use('/api/auth', authRateLimiter);
// app.use('/api', apiRateLimiter);

// Ensure DB connection for requests that need it (skip CORS preflight)
app.use(async (req, res, next) => {
    if (req.method === 'OPTIONS') return next();

    try {
        await connectDB();
        return next();
    } catch (err) {
        logger.error('MongoDB connection failed', { error: err.message, stack: err.stack });
        return res.status(500).json({
            error: 'Database connection failed',
            code: 'DATABASE_ERROR'
        });
    }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/interest-configs', interestRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/info', infoRoutes);
app.use('/api/backup', backupRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Route not found',
        code: 'NOT_FOUND'
    });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server (only if not in Vercel)
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        logger.info('Server started', { port: PORT, env: process.env.NODE_ENV });
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📍 http://localhost:${PORT}`);
    });
}

// Export for Vercel serverless
export default app;
