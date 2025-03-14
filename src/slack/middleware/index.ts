/**
 * Slack Middleware
 * 
 * This module provides middleware functions for the Slack Bolt app.
 * It includes middleware for authentication, logging, error handling, and more.
 */

import { App } from '@slack/bolt';
import { logger, logEmoji } from '../../utils/logger';
import { handleError, getUserFriendlyErrorMessage } from '../../utils/error-handler';
import * as blockKit from '../utils/block-kit';
import { getThreadInfo } from '../utils/conversation';

/**
 * Register all middleware with the Slack app
 * 
 * @param app The Slack app
 */
export function registerMiddleware(app: App): void {
    // Add logging middleware
    app.use(async ({ logger, body, next }) => {
        // Log the incoming request
        const requestType = body.type || 'unknown';
        logger.debug(`${logEmoji.slack} Incoming Slack ${requestType} request`);

        // Call the next middleware
        await next();
    });

    // Add error handling middleware
    app.error(async (error) => {
        // Log the error
        logger.error(`${logEmoji.error} Slack error: ${error.message}`, { error });

        // Handle the error
        handleError(error);
    });

    // Add action handling middleware for feedback buttons
    app.action(/^feedback_.*/, async ({ action, body, ack, client, logger }) => {
        try {
            // Acknowledge the action
            await ack();

            // Type assertion for action and body
            const buttonAction = action as any;
            const buttonBody = body as any;

            // Get the feedback type from the action ID
            const feedbackType = buttonAction.action_id?.replace('feedback_', '') || 'unknown';

            // Get the message timestamp
            const messageTs = buttonBody.message?.ts;

            // Get the channel ID
            const channelId = buttonBody.channel?.id;

            // Get the user ID
            const userId = buttonBody.user?.id;

            if (!messageTs || !channelId || !userId) {
                logger.error(`${logEmoji.error} Missing required fields for feedback`, { action, body });
                return;
            }

            // Log the feedback
            logger.info(`${logEmoji.slack} Received ${feedbackType} feedback from user ${userId} for message ${messageTs} in channel ${channelId}`);

            // Update the message to show the feedback was received
            const blocks = [...(buttonBody.message?.blocks || [])];

            // Find the actions block
            const actionsBlockIndex = blocks.findIndex((block: any) => block.type === 'actions');

            if (actionsBlockIndex !== -1) {
                // Replace the actions block with a context block
                blocks[actionsBlockIndex] = blockKit.context([
                    blockKit.mrkdwn(`*Feedback:* ${feedbackType === 'helpful' ? '👍 Helpful' : '👎 Not Helpful'} (from <@${userId}>)`),
                ]);

                // Update the message
                await client.chat.update({
                    channel: channelId,
                    ts: messageTs,
                    blocks,
                    text: buttonBody.message?.text || 'AI Response',
                });
            }
        } catch (error) {
            logger.error(`${logEmoji.error} Error handling feedback action`, { error, action });
        }
    });

    logger.info(`${logEmoji.slack} Registered Slack middleware`);
}

/**
 * Rate limiting middleware
 * 
 * This middleware can be added to specific routes that need rate limiting.
 */
export async function rateLimitMiddleware({ body, next }: any): Promise<void> {
    // Get the user ID
    const userId = body.user?.id || body.user_id;

    if (!userId) {
        // If there's no user ID, just continue
        await next();
        return;
    }

    // Here you would typically check if the user has exceeded rate limits
    // For now, we just continue
    await next();
}

/**
 * Authentication middleware
 * 
 * This middleware can be added to specific routes that need authentication.
 */
export async function authMiddleware({ body, next }: any): Promise<void> {
    // Get the user ID
    const userId = body.user?.id || body.user_id;

    if (!userId) {
        // If there's no user ID, just continue
        await next();
        return;
    }

    // Here you would typically check if the user is authorized
    // For now, we just continue
    await next();
}
