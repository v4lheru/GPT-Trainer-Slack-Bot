/**
 * GPT-trainer Types
 * 
 * This module defines TypeScript interfaces for the GPT-trainer API.
 */

/**
 * GPT-trainer Chatbot Interface
 */
export interface GPTTrainerChatbot {
    uuid: string;
    name: string;
    created_at: string;
    modified_at: string;
    meta: {
        rate_limit: [number, number];
        rate_limit_message: string;
        show_citations: boolean;
        visibility: string;
    };
}

/**
 * GPT-trainer Session Interface
 */
export interface GPTTrainerSession {
    uuid: string;
    created_at: string;
    modified_at: string;
}

/**
 * GPT-trainer Message Interface
 */
export interface GPTTrainerMessage {
    query: string;
}

/**
 * GPT-trainer Message Response Interface
 */
export interface GPTTrainerMessageResponse {
    text: string;
    citations?: Array<{
        text: string;
        document_id: string;
        document_name: string;
        document_url?: string;
    }>;
}

/**
 * GPT-trainer Stream Chunk Interface
 */
export interface GPTTrainerStreamChunk {
    text: string;
    done: boolean;
    citations?: Array<{
        text: string;
        document_id: string;
        document_name: string;
        document_url?: string;
    }>;
}
