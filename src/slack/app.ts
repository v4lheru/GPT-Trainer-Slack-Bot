/**
 * Slack App Configuration
 * 
 * This module initializes and configures the Slack Bolt app.
 * It sets up the app with the appropriate tokens and middleware.
 */

import { App, LogLevel } from '@slack/bolt';
import { logger, logEmoji } from '../utils/logger';
import { env } from '../config/environment';
import { SlackClient } from '../api/slack';

/**
 * Map Winston log levels to Bolt log levels
 * 
 * @returns Bolt log level
 */
function getBoltLogLevel(): LogLevel {
    switch (env.LOG_LEVEL) {
        case 'debug':
            return LogLevel.DEBUG;
        case 'info':
            return LogLevel.INFO;
        case 'warn':
            return LogLevel.WARN;
        case 'error':
            return LogLevel.ERROR;
        default:
            return LogLevel.INFO;
    }
}

/**
 * Create and configure the Slack app
 */
export const app = new App({
    token: env.SLACK_BOT_TOKEN,
    signingSecret: env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: env.SLACK_APP_TOKEN,
    logLevel: getBoltLogLevel(),
    logger: {
        debug: (...msgs) => logger.debug(msgs.join(' ')),
        info: (...msgs) => logger.info(msgs.join(' ')),
        warn: (...msgs) => logger.warn(msgs.join(' ')),
        error: (...msgs) => logger.error(msgs.join(' ')),
        setLevel: () => { }, // No-op as we're using our own logger
        getLevel: () => getBoltLogLevel(),
        setName: () => { }, // No-op
    },
    customRoutes: [
        {
            path: '/health',
            method: ['GET'],
            handler: (req, res) => {
                res.writeHead(200);
                res.end('Health check: OK');
            },
        },
    ],
});

/**
 * Create a Slack client instance
 */
export const slackClient = new SlackClient(app);

/**
 * Initialize the Slack app
 */
export function initializeSlackApp(): void {
    logger.info(`${logEmoji.slack} Initializing Slack app...`);

    // Register middleware
    app.use(async ({ next }) => {
        // Log all incoming requests
        logger.debug(`${logEmoji.slack} Received Slack event`);
        await next();
    });

    // Error middleware
    app.error(async (error) => {
        logger.error(`${logEmoji.error} Slack app error:`, { error });
    });

    logger.info(`${logEmoji.slack} Slack app initialized successfully`);
}

/**
 * Start the Slack app
 * 
 * @param port Port to listen on
 * @returns Promise resolving when the app is started
 */
export async function startSlackApp(port: number = env.PORT): Promise<void> {
    try {
        await app.start(port);
        logger.info(`${logEmoji.slack} Slack app is running on port ${port}`);
    } catch (error) {
        logger.error(`${logEmoji.error} Failed to start Slack app:`, { error });
        throw error;
    }
}

/**
 * Stop the Slack app
 * 
 * @returns Promise resolving when the app is stopped
 */
export async function stopSlackApp(): Promise<void> {
    try {
        await app.stop();
        logger.info(`${logEmoji.slack} Slack app stopped`);
    } catch (error) {
        logger.error(`${logEmoji.error} Failed to stop Slack app:`, { error });
        throw error;
    }
}
