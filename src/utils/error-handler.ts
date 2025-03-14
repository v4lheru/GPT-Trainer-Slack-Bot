/**
 * Error Handler Utility
 * 
 * This module provides error handling utilities for the application.
 * It defines custom error types and error handling functions.
 */

import { logger, logEmoji } from './logger';

/**
 * Base application error class
 */
export class AppError extends Error {
    public readonly code: string;
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    /**
     * Create a new application error
     * 
     * @param message Error message
     * @param code Error code
     * @param statusCode HTTP status code
     * @param isOperational Whether the error is operational
     */
    constructor(
        message: string,
        code: string = 'INTERNAL_ERROR',
        statusCode: number = 500,
        isOperational: boolean = true
    ) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.statusCode = statusCode;
        this.isOperational = isOperational;

        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * API error class for errors from external APIs
 */
export class APIError extends AppError {
    public readonly source: string;
    public readonly originalError: any;

    /**
     * Create a new API error
     * 
     * @param message Error message
     * @param source API source
     * @param originalError Original error
     * @param code Error code
     * @param statusCode HTTP status code
     */
    constructor(
        message: string,
        source: string,
        originalError: any,
        code: string = 'API_ERROR',
        statusCode: number = 500
    ) {
        super(message, code, statusCode, true);
        this.source = source;
        this.originalError = originalError;
    }
}

/**
 * Slack API error class
 */
export class SlackAPIError extends APIError {
    /**
     * Create a new Slack API error
     * 
     * @param message Error message
     * @param originalError Original error
     * @param code Error code
     * @param statusCode HTTP status code
     */
    constructor(
        message: string,
        originalError: any,
        code: string = 'SLACK_API_ERROR',
        statusCode: number = 500
    ) {
        super(message, 'Slack API', originalError, code, statusCode);
    }
}

/**
 * GPT-trainer API error class
 */
export class GPTTrainerAPIError extends APIError {
    /**
     * Create a new GPT-trainer API error
     * 
     * @param message Error message
     * @param originalError Original error
     * @param code Error code
     * @param statusCode HTTP status code
     */
    constructor(
        message: string,
        originalError: any,
        code: string = 'GPT_TRAINER_API_ERROR',
        statusCode: number = 500
    ) {
        super(message, 'GPT-trainer API', originalError, code, statusCode);
    }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
    public readonly field?: string;

    /**
     * Create a new validation error
     * 
     * @param message Error message
     * @param field Optional field name
     */
    constructor(message: string, field?: string) {
        super(message, 'VALIDATION_ERROR', 400, true);
        this.field = field;
    }
}

/**
 * Configuration error class
 */
export class ConfigurationError extends AppError {
    /**
     * Create a new configuration error
     * 
     * @param message Error message
     */
    constructor(message: string) {
        super(message, 'CONFIGURATION_ERROR', 500, true);
    }
}

/**
 * Global error handler
 * 
 * @param error Error to handle
 */
export function handleError(error: Error): void {
    // Log the error
    if (error instanceof AppError) {
        logger.error(`${logEmoji.error} ${error.name}: ${error.message}`, {
            code: error.code,
            statusCode: error.statusCode,
            isOperational: error.isOperational,
            stack: error.stack,
        });
    } else {
        logger.error(`${logEmoji.error} Unhandled Error: ${error.message}`, {
            stack: error.stack,
        });
    }

    // If the error is not operational, crash the application
    if (error instanceof AppError && !error.isOperational) {
        logger.error(`${logEmoji.error} Non-operational error. Exiting...`);
        process.exit(1);
    }
}

/**
 * Format an error for user display
 * 
 * @param error Error to format
 * @returns User-friendly error message
 */
export function formatErrorForUser(error: Error): string {
    if (error instanceof APIError) {
        return `There was an error communicating with the ${error.source}. Please try again later.`;
    } else if (error instanceof ValidationError) {
        return `Invalid input: ${error.message}`;
    } else if (error instanceof ConfigurationError) {
        return 'There is a configuration issue with the application. Please contact support.';
    } else {
        return 'An unexpected error occurred. Please try again later.';
    }
}

/**
 * Get a user-friendly error message (alias for formatErrorForUser)
 * 
 * @param error Error to format
 * @returns User-friendly error message
 */
export function getUserFriendlyErrorMessage(error: Error): string {
    return formatErrorForUser(error);
}

/**
 * Set up global error handlers
 */
export function setupGlobalErrorHandlers(): void {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        logger.error(`${logEmoji.error} Uncaught Exception:`, { error });
        process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        logger.error(`${logEmoji.error} Unhandled Rejection:`, { reason, promise });
    });

    logger.info(`${logEmoji.info} Global error handlers set up`);
}
