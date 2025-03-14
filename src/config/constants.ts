/**
 * Application Constants
 * 
 * This module defines constants used throughout the application.
 * It centralizes configuration values and settings.
 */

/**
 * Application information
 */
export const APP_INFO = {
    NAME: 'GPT-trainer Slack Bot',
    VERSION: '1.0.0',
    DESCRIPTION: 'A Slack bot that integrates with the GPT-trainer API',
};

/**
 * Default system message for AI interactions
 */
export const DEFAULT_SYSTEM_MESSAGE = `You are an AI assistant in a Slack workspace. You are helpful, concise, and friendly.
    
When responding:
- Be clear and to the point
- Format responses using Slack's markdown
- Use bullet points and headings for organization
- Include code blocks with syntax highlighting when sharing code
- Cite sources when providing factual information`;

/**
 * GPT-trainer configuration
 */
export const GPT_TRAINER_CONFIG = {
    HTTP_TIMEOUT: 60000, // 60 seconds
    RETRY_COUNT: 3,
    RETRY_DELAY: 1000, // 1 second
};

/**
 * Session management configuration
 */
export const SESSION_CONFIG = {
    MAX_IDLE_TIME: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour in milliseconds
};

/**
 * Slack configuration
 */
export const SLACK_CONFIG = {
    MAX_MESSAGE_LENGTH: 40000,
    MAX_BLOCKS_PER_MESSAGE: 50,
    MAX_ATTACHMENTS_PER_MESSAGE: 10,
    THINKING_MESSAGE: 'Thinking...',
    ERROR_TITLE: 'Error',
    ERROR_MESSAGE: 'Something went wrong. Please try again.',
};

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT_CONFIG = {
    MAX_REQUESTS_PER_MINUTE: 50,
    MAX_REQUESTS_PER_HOUR: 1000,
    COOLDOWN_PERIOD_MS: 60000, // 1 minute
};

/**
 * Logging configuration
 */
export const LOGGING_CONFIG = {
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    LOG_FILE_PATH: 'logs/app.log',
    MAX_LOG_FILE_SIZE: 10 * 1024 * 1024, // 10 MB
    MAX_LOG_FILES: 5,
};

/**
 * Feature flags
 */
export const FEATURE_FLAGS = {
    ENABLE_STREAMING: true,
    ENABLE_FEEDBACK: true,
    ENABLE_SUGGESTED_PROMPTS: false,
};

/**
 * Environment names
 */
export enum Environment {
    DEVELOPMENT = 'development',
    PRODUCTION = 'production',
    TEST = 'test',
}
