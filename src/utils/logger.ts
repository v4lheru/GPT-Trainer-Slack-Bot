/**
 * Logger Utility
 * 
 * This module provides a centralized logging utility for the application.
 * It uses Winston for structured logging with different levels and formats.
 */

import winston from 'winston';

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
};

// Define log colors
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
};

// Add colors to Winston
winston.addColors(colors);

// Create the logger
export const logger = winston.createLogger({
    levels,
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'gpt-trainer-slack-bot' },
    transports: [
        // Console transport
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize({ all: true }),
                winston.format.printf(
                    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? `\n${info.stack}` : ''}`
                )
            ),
        }),
        // File transport for errors
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
        }),
        // File transport for all logs
        new winston.transports.File({
            filename: 'logs/combined.log',
        }),
    ],
});

// Set log level based on environment
logger.level = process.env.LOG_LEVEL || 'info';

// Log emojis for different log types
export const logEmoji = {
    info: '📝',
    debug: '🔍',
    warn: '⚠️',
    error: '❌',
    slack: '💬',
    ai: '🤖',
    success: '✅',
    warning: '⚠️',
};

// Export the logger
export default logger;
