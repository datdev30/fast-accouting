/**
 * Rate limiting middleware
 * Protects API from abuse and DDoS attacks
 */

// Simple in-memory rate limiter (for production, use Redis)
const requestCounts = new Map();

function getClientIdentifier(req) {
    // Use IP address as identifier
    return req.ip || req.connection.remoteAddress || 'unknown';
}

function cleanupOldEntries() {
    const now = Date.now();
    const oneMinute = 60 * 1000;
    
    for (const [key, value] of requestCounts.entries()) {
        if (now - value.resetTime > oneMinute) {
            requestCounts.delete(key);
        }
    }
}

// Cleanup every 5 minutes
setInterval(cleanupOldEntries, 5 * 60 * 1000);

/**
 * Create rate limiter middleware
 * @param {Object} options - Rate limit options
 * @param {number} options.windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @param {number} options.max - Maximum requests per window (default: 100)
 * @param {string} options.message - Error message (default: 'Too many requests')
 */
export function rateLimiter(options = {}) {
    const {
        windowMs = 60 * 1000, // 1 minute
        max = 100,
        message = 'Quá nhiều yêu cầu. Vui lòng thử lại sau.'
    } = options;

    return (req, res, next) => {
        // Skip rate limiting for health check
        if (req.path === '/' || req.path === '/api') {
            return next();
        }

        const clientId = getClientIdentifier(req);
        const now = Date.now();
        const key = `${clientId}:${Math.floor(now / windowMs)}`;

        const current = requestCounts.get(key) || { count: 0, resetTime: now + windowMs };
        
        if (current.count >= max) {
            return res.status(429).json({
                error: message,
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: Math.ceil((current.resetTime - now) / 1000)
            });
        }

        current.count++;
        requestCounts.set(key, current);

        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, max - current.count));
        res.setHeader('X-RateLimit-Reset', new Date(current.resetTime).toISOString());

        next();
    };
}

/**
 * Stricter rate limiter for authentication endpoints
 */
export const authRateLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: 'Quá nhiều lần đăng nhập. Vui lòng thử lại sau 15 phút.'
});

/**
 * Standard rate limiter for API endpoints
 */
export const apiRateLimiter = rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.'
});
