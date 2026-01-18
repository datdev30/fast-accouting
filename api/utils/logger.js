/**
 * Structured logging utility
 * Provides consistent logging format across the application
 */

const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

const currentLogLevel = process.env.LOG_LEVEL?.toUpperCase() || (process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG');

function shouldLog(level) {
    return LOG_LEVELS[level] <= LOG_LEVELS[currentLogLevel];
}

function formatLog(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        ...meta
    };

    // In production, output JSON for log aggregation
    if (process.env.NODE_ENV === 'production') {
        return JSON.stringify(logEntry);
    }

    // In development, output formatted string
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
}

const logger = {
    error(message, meta = {}) {
        if (shouldLog('ERROR')) {
            console.error(formatLog('ERROR', message, meta));
        }
    },

    warn(message, meta = {}) {
        if (shouldLog('WARN')) {
            console.warn(formatLog('WARN', message, meta));
        }
    },

    info(message, meta = {}) {
        if (shouldLog('INFO')) {
            console.log(formatLog('INFO', message, meta));
        }
    },

    debug(message, meta = {}) {
        if (shouldLog('DEBUG')) {
            console.log(formatLog('DEBUG', message, meta));
        }
    }
};

export default logger;
