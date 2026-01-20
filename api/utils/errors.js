/**
 * Standardized error handling
 * Provides consistent error format with error codes
 */
import logger from './logger.js';

/**
 * Custom API Error class
 */
export class APIError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
        super(message);
        this.name = 'APIError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}

/**
 * Error codes
 */
export const ErrorCodes = {
    // Validation
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    
    // Authentication
    UNAUTHORIZED: 'UNAUTHORIZED',
    INVALID_TOKEN: 'INVALID_TOKEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    
    // Authorization
    FORBIDDEN: 'FORBIDDEN',
    ADMIN_REQUIRED: 'ADMIN_REQUIRED',
    INVALID_PIN: 'INVALID_PIN',
    
    // Resources
    NOT_FOUND: 'NOT_FOUND',
    ALREADY_EXISTS: 'ALREADY_EXISTS',
    
    // Business Logic
    INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
    INVALID_AMOUNT: 'INVALID_AMOUNT',
    INVALID_TRANSACTION_TYPE: 'INVALID_TRANSACTION_TYPE',
    
    // External Services
    DRIVE_ERROR: 'DRIVE_ERROR',
    DRIVE_QUOTA_EXCEEDED: 'DRIVE_QUOTA_EXCEEDED',
    DRIVE_PERMISSION_DENIED: 'DRIVE_PERMISSION_DENIED',
    
    // Database
    DATABASE_ERROR: 'DATABASE_ERROR',
    READ_ONLY_MODE: 'READ_ONLY_MODE',
    
    // Server
    INTERNAL_ERROR: 'INTERNAL_ERROR'
};

/**
 * Create standardized error response
 */
export function createErrorResponse(error, req = null) {
    // If it's already an APIError, use it
    if (error instanceof APIError) {
        return {
            error: error.message,
            code: error.code,
            status: error.statusCode,
            ...(error.details && { details: error.details }),
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        };
    }

    // Handle known error types
    if (error.name === 'JsonWebTokenError') {
        return {
            error: 'Invalid token',
            code: ErrorCodes.INVALID_TOKEN,
            status: 401
        };
    }

    if (error.name === 'TokenExpiredError') {
        return {
            error: 'Token expired',
            code: ErrorCodes.TOKEN_EXPIRED,
            status: 401
        };
    }

    // Default error
    return {
        error: error.message || 'Internal Server Error',
        code: ErrorCodes.INTERNAL_ERROR,
        status: error.statusCode || 500,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    };
}

/**
 * Error handler middleware
 */
export function errorHandler(err, req, res, next) {
    const errorResponse = createErrorResponse(err, req);
    const statusCode = errorResponse.status || 500;

    // Log error
    if (statusCode >= 500) {
        logger.error('Server Error', {
            message: err.message,
            stack: err.stack,
            url: req?.url,
            method: req?.method,
            code: errorResponse.code
        });
    }

    res.status(statusCode).json(errorResponse);
}
