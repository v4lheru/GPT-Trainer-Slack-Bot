/**
 * Session Management Service
 * 
 * This module provides session management for GPT-trainer conversations.
 * It maps Slack user IDs to GPT-trainer session UUIDs.
 */

import { GPTTrainerClient } from '../api/gpt-trainer';
import { logger } from '../utils/logger';

/**
 * Session information
 */
export interface SessionInfo {
    gptTrainerSessionId: string;
    createdAt: Date;
    lastActive: Date;
}

/**
 * Session store interface
 */
export interface SessionStore {
    [slackUserId: string]: SessionInfo;
}

/**
 * Session manager configuration
 */
export interface SessionManagerConfig {
    maxIdleTime: number;
    cleanupInterval: number;
}

/**
 * Session manager for handling GPT-trainer sessions
 */
export class SessionManager {
    private sessions: SessionStore = {};
    private readonly gptTrainerClient: GPTTrainerClient;
    private readonly config: SessionManagerConfig;
    private cleanupIntervalId: NodeJS.Timeout | null = null;

    /**
     * Create a new session manager
     * 
     * @param gptTrainerClient GPT-trainer client
     * @param config Session manager configuration
     */
    constructor(
        gptTrainerClient: GPTTrainerClient,
        config: SessionManagerConfig = {
            maxIdleTime: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
            cleanupInterval: 60 * 60 * 1000, // 1 hour in milliseconds
        }
    ) {
        this.gptTrainerClient = gptTrainerClient;
        this.config = config;

        // Set up periodic cleanup of idle sessions
        this.startCleanupInterval();

        logger.info('Session manager initialized');
    }

    /**
     * Start the cleanup interval
     */
    private startCleanupInterval(): void {
        if (this.cleanupIntervalId) {
            clearInterval(this.cleanupIntervalId);
        }

        this.cleanupIntervalId = setInterval(
            () => this.cleanupIdleSessions(),
            this.config.cleanupInterval
        );

        logger.info(`Session cleanup scheduled every ${this.config.cleanupInterval / 1000} seconds`);
    }

    /**
     * Stop the cleanup interval
     */
    public stopCleanupInterval(): void {
        if (this.cleanupIntervalId) {
            clearInterval(this.cleanupIntervalId);
            this.cleanupIntervalId = null;
            logger.info('Session cleanup stopped');
        }
    }

    /**
     * Get a session for a Slack user
     * 
     * @param slackUserId Slack user ID
     * @returns Promise resolving to the session ID or undefined if not found
     */
    public async getSession(slackUserId: string): Promise<string | undefined> {
        const session = this.sessions[slackUserId];
        if (!session) return undefined;

        // Update last active timestamp
        session.lastActive = new Date();
        return session.gptTrainerSessionId;
    }

    /**
     * Create a new session for a Slack user
     * 
     * @param slackUserId Slack user ID
     * @returns Promise resolving to the new session ID
     */
    public async createSession(slackUserId: string): Promise<string> {
        // Create a new session in GPT-trainer
        const response = await this.gptTrainerClient.createSession();

        // Store the mapping
        this.sessions[slackUserId] = {
            gptTrainerSessionId: response.uuid,
            createdAt: new Date(),
            lastActive: new Date()
        };

        logger.info(`Created new session for user ${slackUserId}: ${response.uuid}`);
        return response.uuid;
    }

    /**
     * Get or create a session for a Slack user
     * 
     * @param slackUserId Slack user ID
     * @returns Promise resolving to the session ID
     */
    public async getOrCreateSession(slackUserId: string): Promise<string> {
        const existingSessionId = await this.getSession(slackUserId);
        if (existingSessionId) return existingSessionId;

        return this.createSession(slackUserId);
    }

    /**
     * Clean up idle sessions
     */
    private cleanupIdleSessions(): void {
        const now = new Date();
        let cleanedCount = 0;

        Object.keys(this.sessions).forEach(slackUserId => {
            const session = this.sessions[slackUserId];
            const idleTime = now.getTime() - session.lastActive.getTime();

            if (idleTime > this.config.maxIdleTime) {
                delete this.sessions[slackUserId];
                cleanedCount++;
            }
        });

        if (cleanedCount > 0) {
            logger.info(`Cleaned up ${cleanedCount} idle sessions`);
        }
    }

    /**
     * Get the number of active sessions
     * 
     * @returns The number of active sessions
     */
    public getSessionCount(): number {
        return Object.keys(this.sessions).length;
    }

    /**
     * Get all sessions
     * 
     * @returns All sessions
     */
    public getAllSessions(): SessionStore {
        return { ...this.sessions };
    }
}
