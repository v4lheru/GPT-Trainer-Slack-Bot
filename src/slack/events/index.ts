/**
 * Slack Event Handlers
 * 
 * This module registers event handlers for various Slack events.
 * It serves as the entry point for all event-related functionality.
 */

import { app, slackClient } from '../app';
import { logger, logEmoji } from '../../utils/logger';
import { GPTTrainerClient } from '../../api/gpt-trainer';
import { SessionManager } from '../../services/session';
import { env } from '../../config/environment';
import { GPT_TRAINER_CONFIG, SLACK_CONFIG } from '../../config/constants';
import { SlackThreadInfo } from '../../types/slack';
import { formatErrorForUser } from '../../utils/error-handler';

// Create GPT-trainer client
const gptTrainerClient = new GPTTrainerClient({
    apiKey: env.GPT_TRAINER_API_KEY,
    baseUrl: env.GPT_TRAINER_API_URL,
    chatbotUuid: env.GPT_TRAINER_CHATBOT_UUID,
    httpTimeout: GPT_TRAINER_CONFIG.HTTP_TIMEOUT,
});

// Create session manager
const sessionManager = new SessionManager(gptTrainerClient, {
    maxIdleTime: env.SESSION_CLEANUP_INTERVAL,
    cleanupInterval: env.SESSION_CLEANUP_INTERVAL,
});

// Bot user ID (will be populated after the app starts)
let botUserId: string | undefined;

/**
 * Initialize the bot user ID
 */
app.event('app_home_opened', async ({ client }) => {
    try {
        if (!botUserId) {
            const authInfo = await client.auth.test();
            botUserId = authInfo.user_id;
            logger.info(`${logEmoji.slack} Bot user ID initialized: ${botUserId}`);
        }
    } catch (error) {
        logger.error(`${logEmoji.error} Error initializing bot user ID`, { error });
    }
});

/**
 * Send a thinking message
 * 
 * @param threadInfo Thread information
 * @returns Promise resolving to the message timestamp
 */
async function sendThinkingMessage(threadInfo: SlackThreadInfo): Promise<string> {
    try {
        const result = await slackClient.sendMessage(
            threadInfo.channelId,
            SLACK_CONFIG.THINKING_MESSAGE,
            threadInfo.threadTs
        );

        logger.debug(`${logEmoji.slack} Sent thinking message to thread ${threadInfo.threadTs}`);
        return result;
    } catch (error) {
        logger.error(`${logEmoji.error} Error sending thinking message`, { error });
        throw error;
    }
}

/**
 * Send an error message
 * 
 * @param threadInfo Thread information
 * @param error Error to format
 * @returns Promise resolving to the message timestamp
 */
async function sendErrorMessage(threadInfo: SlackThreadInfo, error: Error): Promise<string> {
    try {
        const errorMessage = formatErrorForUser(error);

        const result = await slackClient.sendMessage(
            threadInfo.channelId,
            `${SLACK_CONFIG.ERROR_TITLE}: ${errorMessage}`,
            threadInfo.threadTs
        );

        logger.debug(`${logEmoji.slack} Sent error message to thread ${threadInfo.threadTs}`);
        return result;
    } catch (sendError) {
        logger.error(`${logEmoji.error} Error sending error message`, { error: sendError });
        throw sendError;
    }
}

/**
 * Process a message and generate a response
 * 
 * @param threadInfo Thread information
 * @param messageText Message text
 * @returns Promise resolving when the response is sent
 */
async function processMessageAndGenerateResponse(
    threadInfo: SlackThreadInfo,
    messageText: string
): Promise<void> {
    let thinkingMessageTs: string | undefined;

    try {
        // Send a thinking message
        thinkingMessageTs = await sendThinkingMessage(threadInfo);

        // Get or create a session for this user
        const sessionId = await sessionManager.getOrCreateSession(threadInfo.userId || '');
        logger.info(`${logEmoji.ai} Using session ${sessionId} for user ${threadInfo.userId}`);

        // Send the message to GPT-trainer
        const response = await gptTrainerClient.sendMessage(sessionId, messageText);

        // Log the response
        logger.debug(`${logEmoji.ai} GPT-trainer response:`, { response });

        // Update the thinking message with the response
        await slackClient.updateMessage(
            threadInfo.channelId,
            thinkingMessageTs,
            response.text || "I'm sorry, I couldn't generate a response at this time."
        );

        logger.info(`${logEmoji.ai} Sent response to thread ${threadInfo.threadTs}`);
    } catch (error) {
        logger.error(`${logEmoji.error} Error processing message`, { error });

        // If we sent a thinking message, update it with an error
        if (thinkingMessageTs) {
            try {
                await slackClient.updateMessage(
                    threadInfo.channelId,
                    thinkingMessageTs,
                    `${SLACK_CONFIG.ERROR_MESSAGE} ${error instanceof Error ? error.message : String(error)}`
                );
            } catch (updateError) {
                logger.error(`${logEmoji.error} Error updating thinking message with error`, { error: updateError });
                // If we can't update the thinking message, send a new error message
                await sendErrorMessage(threadInfo, error instanceof Error ? error : new Error(String(error)));
            }
        } else {
            // If we didn't send a thinking message, send a new error message
            await sendErrorMessage(threadInfo, error instanceof Error ? error : new Error(String(error)));
        }
    }
}

/**
 * Handle message events
 */
app.message(async ({ message, client }) => {
    try {
        logger.debug(`${logEmoji.slack} Received message event: ${JSON.stringify(message)}`);

        // Ensure we have a proper message with a user and text
        if (!('user' in message) || !message.user || !('text' in message) || !message.text) {
            logger.debug(`${logEmoji.slack} Ignoring message without user or text content`);
            return;
        }

        // Ignore messages from the bot itself
        if (botUserId && message.user === botUserId) {
            return;
        }

        // Create thread info
        const threadInfo: SlackThreadInfo = {
            channelId: message.channel,
            threadTs: 'thread_ts' in message && message.thread_ts ? message.thread_ts : message.ts,
            userId: message.user,
        };

        // Process the message and generate a response
        await processMessageAndGenerateResponse(threadInfo, message.text);
    } catch (error) {
        logger.error(`${logEmoji.error} Error handling message event`, { error });
    }
});

/**
 * Handle app_mention events
 */
app.event('app_mention', async ({ event, client }) => {
    try {
        logger.debug(`${logEmoji.slack} Received app_mention event: ${JSON.stringify(event)}`);

        // Create thread info
        const threadInfo: SlackThreadInfo = {
            channelId: event.channel,
            threadTs: 'thread_ts' in event && event.thread_ts ? event.thread_ts : event.ts,
            userId: event.user,
        };

        // Process the message and generate a response
        await processMessageAndGenerateResponse(threadInfo, event.text);
    } catch (error) {
        logger.error(`${logEmoji.error} Error handling app_mention event`, { error });
    }
});

logger.info(`${logEmoji.slack} Slack event handlers registered`);
