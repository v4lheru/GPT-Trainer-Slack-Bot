/**
 * GPT-trainer Slack Bot
 * Main Entry Point
 * 
 * This file initializes the Slack bot application, sets up error handling,
 * and starts the bot listening for events.
 */

import { logger, logEmoji } from './utils/logger';
import { env } from './config/environment';
import { APP_INFO } from './config/constants';
import { setupGlobalErrorHandlers } from './utils/error-handler';
import { initializeSlackApp, startSlackApp, stopSlackApp } from './slack/app';
import { GPTTrainerClient } from './api/gpt-trainer';
import { SessionManager } from './services/session';

// Import event handlers
import './slack/events';

/**
 * Initialize application components
 */
async function initializeComponents(): Promise<boolean> {
    try {
        logger.info(`${logEmoji.info} Initializing application components...`);

        // Verify environment variables
        if (!env.SLACK_BOT_TOKEN || !env.SLACK_SIGNING_SECRET || !env.SLACK_APP_TOKEN) {
            throw new Error('Missing required Slack environment variables');
        }

        if (!env.GPT_TRAINER_API_KEY || !env.GPT_TRAINER_CHATBOT_UUID) {
            throw new Error('Missing required GPT-trainer environment variables');
        }

        // Initialize Slack app
        initializeSlackApp();

        logger.info(`${logEmoji.info} All components initialized successfully`);
        return true;
    } catch (error) {
        logger.error(`${logEmoji.error} Error initializing components`, { error });
        throw error;
    }
}

/**
 * Start the application
 */
async function startApplication(): Promise<void> {
    try {
        // Set up global error handlers
        setupGlobalErrorHandlers();

        // Initialize components
        await initializeComponents();

        // Start the Slack app
        await startSlackApp();

        logger.info(`${logEmoji.info} ⚡️ ${APP_INFO.NAME} v${APP_INFO.VERSION} is running!`);
        logger.info(`${logEmoji.info} Environment: ${env.NODE_ENV}`);
        logger.info(`${logEmoji.info} Log level: ${env.LOG_LEVEL}`);
    } catch (error) {
        logger.error(`${logEmoji.error} Unable to start application`, { error });
        process.exit(1);
    }
}

/**
 * Gracefully shut down the application
 */
async function gracefulShutdown(): Promise<void> {
    logger.info(`${logEmoji.info} Shutting down gracefully...`);

    try {
        // Perform cleanup tasks
        logger.info(`${logEmoji.info} Cleaning up resources...`);

        // Stop the Slack app
        await stopSlackApp();
        logger.info(`${logEmoji.info} Slack app stopped successfully`);

        logger.info(`${logEmoji.info} Shutdown complete`);
        process.exit(0);
    } catch (error) {
        logger.error(`${logEmoji.error} Error during shutdown`, { error });
        process.exit(1);
    }
}

// Listen for termination signals
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Start the application
startApplication();

// Log startup
logger.info(`${logEmoji.info} ${APP_INFO.NAME} starting up...`);
