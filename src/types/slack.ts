/**
 * Slack Types
 * 
 * This module defines TypeScript interfaces for Slack API interactions.
 */

/**
 * Slack Event Interface
 */
export interface SlackEvent {
    type: string;
    user: string;
    text: string;
    channel: string;
    ts: string;
    thread_ts?: string;
    bot_id?: string;
}

/**
 * Slack Message Interface
 */
export interface SlackMessage {
    channel: string;
    text: string;
    thread_ts?: string;
    blocks?: any[];
}

/**
 * Slack Block Interface
 */
export interface SlackBlock {
    type: string;
    block_id?: string;
    [key: string]: any;
}

/**
 * Slack Text Object Interface
 */
export interface SlackTextObject {
    type: 'plain_text' | 'mrkdwn';
    text: string;
    emoji?: boolean;
    verbatim?: boolean;
}

/**
 * Slack User Info Interface
 */
export interface SlackUserInfo {
    id: string;
    team_id: string;
    name: string;
    real_name: string;
    profile: {
        display_name: string;
        email?: string;
        image_24?: string;
        image_32?: string;
        image_48?: string;
        image_72?: string;
        image_192?: string;
        image_512?: string;
    };
    is_bot: boolean;
    is_admin?: boolean;
}

/**
 * Slack Channel Info Interface
 */
export interface SlackChannelInfo {
    id: string;
    name: string;
    is_channel: boolean;
    is_group: boolean;
    is_im: boolean;
    created: number;
    creator: string;
    is_archived: boolean;
    is_general: boolean;
    name_normalized: string;
    is_shared: boolean;
    is_private: boolean;
    is_member: boolean;
    topic: {
        value: string;
        creator: string;
        last_set: number;
    };
    purpose: {
        value: string;
        creator: string;
        last_set: number;
    };
}

/**
 * Slack Thread Info Interface
 */
export interface SlackThreadInfo {
    channelId: string;
    threadTs: string;
    userId?: string;
}
