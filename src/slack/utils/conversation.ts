/**
 * Conversation Utilities
 * 
 * This module provides utilities for managing Slack conversations.
 * It includes functions for thread management and message formatting.
 */

import { App } from '@slack/bolt';
import { logger, logEmoji } from '../../utils/logger';
import * as blockKit from './block-kit';

/**
 * Thread information
 */
export interface ThreadInfo {
    channelId: string;
    threadTs: string;
    userId?: string;
    botId?: string;
}

/**
 * Message role type
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'function';

/**
 * Conversation message interface
 */
export interface ConversationMessage {
    role: MessageRole;
    content: string;
    timestamp?: string;
    name?: string;
}

/**
 * Get thread information from a message
 * 
 * @param message The Slack message
 * @returns Thread information
 */
export function getThreadInfo(message: any): ThreadInfo {
    const channelId = message.channel || message.channel_id;
    const threadTs = message.thread_ts || message.ts;
    const userId = message.user;

    return {
        channelId,
        threadTs,
        userId,
    };
}

/**
 * Convert a Slack message to a conversation message
 * 
 * @param message The Slack message
 * @param botId The bot's user ID
 * @returns A conversation message
 */
export function slackMessageToConversationMessage(message: any, botId?: string): ConversationMessage {
    // Determine the role based on the user ID
    const role: MessageRole = message.user === botId ? 'assistant' : 'user';

    // Extract the text content
    const content = message.text || '';

    // Create the conversation message
    return {
        role,
        content,
        timestamp: new Date(parseFloat(message.ts) * 1000).toISOString(),
    };
}

/**
 * Send a thinking message to a thread
 * 
 * @param app The Slack app
 * @param threadInfo Thread information
 * @returns Promise resolving to the message timestamp
 */
export async function sendThinkingMessage(app: App, threadInfo: ThreadInfo): Promise<string> {
    try {
        const result = await app.client.chat.postMessage({
            channel: threadInfo.channelId,
            thread_ts: threadInfo.threadTs,
            ...blockKit.loadingMessage('Thinking...'),
        });

        logger.debug(`${logEmoji.slack} Sent thinking message to thread ${threadInfo.threadTs}`);

        return result.ts as string;
    } catch (error) {
        logger.error(`${logEmoji.error} Error sending thinking message`, { error });
        throw error;
    }
}

/**
 * Update a message in a thread
 * 
 * @param app The Slack app
 * @param channelId The channel ID
 * @param ts The message timestamp
 * @param blocks The new message blocks
 * @param text The new message text
 * @returns Promise resolving to the updated message
 */
export async function updateMessage(
    app: App,
    channelId: string,
    ts: string,
    blocks: blockKit.Block[],
    text: string
) {
    try {
        const result = await app.client.chat.update({
            channel: channelId,
            ts,
            blocks,
            text,
        });

        logger.debug(`${logEmoji.slack} Updated message ${ts} in channel ${channelId}`);

        return result;
    } catch (error) {
        logger.error(`${logEmoji.error} Error updating message`, { error });
        throw error;
    }
}

/**
 * Send an AI response to a thread
 * 
 * @param app The Slack app
 * @param threadInfo Thread information
 * @param content The AI response content
 * @param metadata Optional metadata to display
 * @returns Promise resolving to the message timestamp
 */
export async function sendAIResponse(
    app: App,
    threadInfo: ThreadInfo,
    content: string,
    metadata?: Record<string, any>
): Promise<string> {
    try {
        // Create the message
        const message = blockKit.aiResponseMessage(content, metadata);

        // Send the message
        const result = await app.client.chat.postMessage({
            channel: threadInfo.channelId,
            thread_ts: threadInfo.threadTs,
            ...message,
        });

        logger.debug(`${logEmoji.slack} Sent AI response to thread ${threadInfo.threadTs}`);

        return result.ts as string;
    } catch (error) {
        logger.error(`${logEmoji.error} Error sending AI response`, { error });
        throw error;
    }
}

/**
 * Update a thinking message with an AI response
 * 
 * @param app The Slack app
 * @param threadInfo Thread information
 * @param thinkingMessageTs The thinking message timestamp
 * @param content The AI response content
 * @param metadata Optional metadata to display
 * @returns Promise resolving to the updated message
 */
export async function updateThinkingMessageWithAIResponse(
    app: App,
    threadInfo: ThreadInfo,
    thinkingMessageTs: string,
    content: string,
    metadata?: Record<string, any>
) {
    try {
        // Create the message
        const message = blockKit.aiResponseMessage(content, metadata);

        // Update the message
        const result = await updateMessage(
            app,
            threadInfo.channelId,
            thinkingMessageTs,
            message.blocks,
            message.text
        );

        logger.debug(`${logEmoji.slack} Updated thinking message with AI response in thread ${threadInfo.threadTs}`);

        return result;
    } catch (error) {
        logger.error(`${logEmoji.error} Error updating thinking message with AI response`, { error });
        throw error;
    }
}

/**
 * Send an error message to a thread
 * 
 * @param app The Slack app
 * @param threadInfo Thread information
 * @param title The error title
 * @param message The error message
 * @param details Optional error details
 * @returns Promise resolving to the message timestamp
 */
export async function sendErrorMessage(
    app: App,
    threadInfo: ThreadInfo,
    title: string,
    message: string,
    details?: string
): Promise<string> {
    try {
        // Create the message
        const errorMessage = blockKit.errorMessage(title, message, details);

        // Send the message
        const result = await app.client.chat.postMessage({
            channel: threadInfo.channelId,
            thread_ts: threadInfo.threadTs,
            ...errorMessage,
        });

        logger.debug(`${logEmoji.slack} Sent error message to thread ${threadInfo.threadTs}`);

        return result.ts as string;
    } catch (error) {
        logger.error(`${logEmoji.error} Error sending error message`, { error });
        throw error;
    }
}

/**
 * Fetch conversation history from Slack
 * 
 * @param app The Slack app
 * @param channelId The channel ID
 * @param threadTs The thread timestamp
 * @param limit The maximum number of messages to fetch
 * @returns Promise resolving to the conversation history
 */
export async function fetchConversationHistory(
    app: App,
    channelId: string,
    threadTs: string,
    limit: number = 100
) {
    try {
        const result = await app.client.conversations.replies({
            channel: channelId,
            ts: threadTs,
            limit,
        });

        logger.debug(`${logEmoji.slack} Fetched conversation history for thread ${threadTs}`);

        return result.messages || [];
    } catch (error) {
        logger.error(`${logEmoji.error} Error fetching conversation history`, { error });
        throw error;
    }
}
