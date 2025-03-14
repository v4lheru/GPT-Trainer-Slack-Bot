/**
 * Environment Configuration
 * 
 * This module loads and validates environment variables required for the application.
 * It uses dotenv to load variables from the .env file and provides a type-safe way
 * to access them throughout the application.
 */

import dotenv from 'dotenv';
import { logger } from '../utils/logger';
import { ConfigurationError } from '../utils/error-handler';

// Load environment variables from .env file
dotenv.config();

/**
 * Environment variable interface
 */
export interface EnvironmentVariables {
    // Node environment
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: number;

    // Slack configuration
    SLACK_BOT_TOKEN: string;
    SLACK_SIGNING_SECRET: string;
    SLACK_APP_TOKEN: string;

    // GPT-trainer configuration
    GPT_TRAINER_API_KEY: string;
    GPT_TRAINER_CHATBOT_UUID: string;
    GPT_TRAINER_API_URL: string;

    // Application configuration
    LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
    SESSION_CLEANUP_INTERVAL: number;
}

/**
 * Default values for optional environment variables
 */
const DEFAULT_ENV = {
    NODE_ENV: 'development',
    PORT: 3000,
    LOG_LEVEL: 'info',
    GPT_TRAINER_API_URL: 'https://app.gpt-trainer.com',
    SESSION_CLEANUP_INTERVAL: 3600000, // 1 hour in milliseconds
} as const;

/**
 * Required environment variables
 */
const REQUIRED_ENV_VARS = [
    'SLACK_BOT_TOKEN',
    'SLACK_SIGNING_SECRET',
    'SLACK_APP_TOKEN',
    'GPT_TRAINER_API_KEY',
    'GPT_TRAINER_CHATBOT_UUID',
];

/**
 * Load and validate environment variables
 * 
 * @returns Environment variables
 */
export function loadEnvironment(): EnvironmentVariables {
    // Check for required environment variables
    const missingVars = REQUIRED_ENV_VARS.filter(
        (name) => !process.env[name]
    );

    if (missingVars.length > 0) {
        const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`;
        logger.error(errorMessage);
        throw new ConfigurationError(errorMessage);
    }

    // Parse and validate environment variables
    const env: EnvironmentVariables = {
        // Node environment
        NODE_ENV: (process.env.NODE_ENV as EnvironmentVariables['NODE_ENV']) || DEFAULT_ENV.NODE_ENV,
        PORT: parseInt(process.env.PORT || String(DEFAULT_ENV.PORT), 10),

        // Slack configuration
        SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN!,
        SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET!,
        SLACK_APP_TOKEN: process.env.SLACK_APP_TOKEN!,

        // GPT-trainer configuration
        GPT_TRAINER_API_KEY: process.env.GPT_TRAINER_API_KEY!,
        GPT_TRAINER_CHATBOT_UUID: process.env.GPT_TRAINER_CHATBOT_UUID!,
        GPT_TRAINER_API_URL: process.env.GPT_TRAINER_API_URL || DEFAULT_ENV.GPT_TRAINER_API_URL,

        // Application configuration
        LOG_LEVEL: (process.env.LOG_LEVEL as EnvironmentVariables['LOG_LEVEL']) || DEFAULT_ENV.LOG_LEVEL,
        SESSION_CLEANUP_INTERVAL: parseInt(
            process.env.SESSION_CLEANUP_INTERVAL || String(DEFAULT_ENV.SESSION_CLEANUP_INTERVAL),
            10
        ),
    };

    // Validate PORT is a number
    if (isNaN(env.PORT)) {
        throw new ConfigurationError('PORT must be a number');
    }

    // Validate SESSION_CLEANUP_INTERVAL is a number
    if (isNaN(env.SESSION_CLEANUP_INTERVAL)) {
        throw new ConfigurationError('SESSION_CLEANUP_INTERVAL must be a number');
    }

    return env;
}

/**
 * Environment variables singleton
 */
export const env = loadEnvironment();

/**
 * Check if the current environment is development
 * 
 * @returns True if the current environment is development
 */
export function isDevelopment(): boolean {
    return env.NODE_ENV === 'development';
}

/**
 * Check if the current environment is production
 * 
 * @returns True if the current environment is production
 */
export function isProduction(): boolean {
    return env.NODE_ENV === 'production';
}

/**
 * Check if the current environment is test
 * 
 * @returns True if the current environment is test
 */
export function isTest(): boolean {
    return env.NODE_ENV === 'test';
}
