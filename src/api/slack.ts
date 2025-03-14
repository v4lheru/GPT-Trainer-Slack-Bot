/**
 * Slack API Client
 * 
 * This module implements the Slack API client.
 * It handles communication with the Slack API for bot interactions.
 */

import { App } from '@slack/bolt';
import { SlackEvent, SlackMessage, SlackThreadInfo } from '../types/slack';
import { logger } from '../utils/logger';

/**
 * Slack API client
 */
export class SlackClient {
    private readonly app: App;

    /**
     * Create a new Slack client
     * 
     * @param app The Slack Bolt app instance
     */
    constructor(app: App) {
        this.app = app;
        logger.info('Slack client initialized');
    }

    /**
     * Send a message to a channel
     * 
     * @param channel Channel ID
     * @param text Message text
     * @param threadTs Optional thread timestamp
     * @param blocks Optional message blocks
     * @returns Promise resolving to the message timestamp
     */
    public async sendMessage(
        channel: string,
        text: string,
        threadTs?: string,
        blocks?: any[]
    ): Promise<string> {
        try {
            const message: SlackMessage = {
                channel,
                text,
            };

            if (threadTs) {
                message.thread_ts = threadTs;
            }

            if (blocks) {
                message.blocks = blocks;
            }

            const result = await this.app.client.chat.postMessage(message);
            return result.ts as string;
        } catch (error) {
            logger.error('Error sending message', { error });
            throw new Error(`Failed to send message: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Update a message
     * 
     * @param channel Channel ID
     * @param ts Message timestamp
     * @param text New message text
     * @param blocks Optional new message blocks
     * @returns Promise resolving to the updated message
     */
    public async updateMessage(
        channel: string,
        ts: string,
        text: string,
        blocks?: any[]
    ): Promise<any> {
        try {
            const message: SlackMessage & { ts: string } = {
                channel,
                ts,
                text,
            };

            if (blocks) {
                message.blocks = blocks;
            }

            return await this.app.client.chat.update(message);
        } catch (error) {
            logger.error('Error updating message', { error });
            throw new Error(`Failed to update message: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get conversation history
     * 
     * @param channel Channel ID
     * @param ts Thread timestamp
     * @param limit Maximum number of messages to retrieve
     * @returns Promise resolving to the conversation history
     */
    public async getConversationHistory(
        channel: string,
        ts: string,
        limit: number = 100
    ): Promise<any[]> {
        try {
            const result = await this.app.client.conversations.replies({
                channel,
                ts,
                limit,
            });

            return result.messages || [];
        } catch (error) {
            logger.error('Error getting conversation history', { error });
            throw new Error(`Failed to get conversation history: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get user information
     * 
     * @param userId User ID
     * @returns Promise resolving to the user information
     */
    public async getUserInfo(userId: string): Promise<any> {
        try {
            const result = await this.app.client.users.info({
                user: userId,
            });

            return result.user;
        } catch (error) {
            logger.error('Error getting user info', { error });
            throw new Error(`Failed to get user info: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get channel information
     * 
     * @param channelId Channel ID
     * @returns Promise resolving to the channel information
     */
    public async getChannelInfo(channelId: string): Promise<any> {
        try {
            const result = await this.app.client.conversations.info({
                channel: channelId,
            });

            return result.channel;
        } catch (error) {
            logger.error('Error getting channel info', { error });
            throw new Error(`Failed to get channel info: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get bot user ID
     * 
     * @returns Promise resolving to the bot user ID
     */
    public async getBotUserId(): Promise<string> {
        try {
            const authInfo = await this.app.client.auth.test();
            return authInfo.user_id as string;
        } catch (error) {
            logger.error('Error getting bot user ID', { error });
            throw new Error(`Failed to get bot user ID: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
