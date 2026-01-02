import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

// Import routes
import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customers.js';
import transactionRoutes from './routes/transactions.js';
import interestRoutes from './routes/interest.js';
import reportRoutes from './routes/reports.js';
import userRoutes from './routes/users.js';
import infoRoutes from './routes/info.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
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

// Ensure DB connection for requests that need it (skip CORS preflight)
app.use(async (req, res, next) => {
    if (req.method === 'OPTIONS') return next();

    try {
        await connectDB();
        return next();
    } catch (err) {
        console.error('MongoDB connection failed:', err);
        return res.status(500).json({
            error: 'Database connection failed'
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

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start server (only if not in Vercel)
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📍 http://localhost:${PORT}`);
    });
}

// Export for Vercel serverless
export default app;
