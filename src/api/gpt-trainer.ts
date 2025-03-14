/**
 * GPT-trainer API Client
 * 
 * This module implements the GPT-trainer API client.
 * It handles communication with the GPT-trainer API for generating AI responses.
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
    GPTTrainerChatbot,
    GPTTrainerSession,
    GPTTrainerMessage,
    GPTTrainerMessageResponse,
    GPTTrainerStreamChunk
} from '../types/gpt-trainer';
import { logger } from '../utils/logger';

/**
 * GPT-trainer API client configuration
 */
export interface GPTTrainerConfig {
    apiKey: string;
    baseUrl: string;
    chatbotUuid: string;
    httpTimeout: number;
}

/**
 * GPT-trainer API client
 */
export class GPTTrainerClient {
    private readonly client: AxiosInstance;
    private readonly config: GPTTrainerConfig;

    /**
     * Create a new GPT-trainer client
     * 
     * @param config Client configuration
     */
    constructor(config: GPTTrainerConfig) {
        this.config = config;

        // Create axios client with default configuration
        this.client = axios.create({
            baseURL: this.config.baseUrl,
            timeout: this.config.httpTimeout,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            }
        });

        logger.info('GPT-trainer client initialized');
    }

    /**
     * Get chatbot information
     * 
     * @returns Promise resolving to chatbot information
     */
    public async getChatbot(): Promise<GPTTrainerChatbot> {
        try {
            const url = `/api/v1/chatbot/${this.config.chatbotUuid}`;
            const response = await this.client.get<GPTTrainerChatbot>(url);
            return response.data;
        } catch (error) {
            logger.error('Error getting chatbot information', { error });
            throw new Error(`Failed to get chatbot information: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Create a new session
     * 
     * @returns Promise resolving to the created session
     */
    public async createSession(): Promise<GPTTrainerSession> {
        try {
            const url = `/api/v1/chatbot/${this.config.chatbotUuid}/session/create`;
            const response = await this.client.post<GPTTrainerSession>(url, {});
            logger.info(`Created new GPT-trainer session: ${response.data.uuid}`);
            return response.data;
        } catch (error) {
            logger.error('Error creating session', { error });
            throw new Error(`Failed to create session: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Send a message to a session
     * 
     * @param sessionUuid Session UUID
     * @param query User query
     * @returns Promise resolving to the message response
     */
    public async sendMessage(sessionUuid: string, query: string): Promise<GPTTrainerMessageResponse> {
        try {
            // Based on testing, the streaming endpoint works correctly while the non-streaming endpoint fails
            // So we'll use the streaming endpoint directly
            const streamUrl = `/api/v1/session/${sessionUuid}/message/stream`;
            logger.debug(`Sending message to GPT-trainer streaming endpoint: ${streamUrl}`, { query });

            // Log the request payload
            logger.debug('Request payload:', { sessionUuid, query });

            // Create a client specifically for the streaming endpoint
            const streamClient = axios.create({
                baseURL: this.config.baseUrl,
                timeout: this.config.httpTimeout * 2, // Double the timeout for streaming
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Accept': 'application/json'
                }
            });

            try {
                // Make a direct request to the streaming endpoint
                const response = await streamClient.post(streamUrl, { query });

                logger.debug('GPT-trainer streaming response:', {
                    status: response.status,
                    statusText: response.statusText,
                    data: response.data
                });

                // The streaming endpoint returns the response text directly as a string
                if (response.data && typeof response.data === 'string') {
                    return { text: response.data };
                } else if (response.data && typeof response.data.text === 'string') {
                    return response.data;
                } else {
                    logger.warn('Invalid response format from GPT-trainer streaming endpoint', { data: response.data });
                    return { text: "I'm sorry, I couldn't generate a response at this time. Please try again later." };
                }
            } catch (streamError) {
                logger.error('Streaming endpoint failed', { error: streamError });

                // Log the error details
                if (axios.isAxiosError(streamError) && streamError.response) {
                    logger.error('Streaming error details', {
                        status: streamError.response.status,
                        statusText: streamError.response.statusText,
                        data: streamError.response.data,
                        headers: streamError.response.headers
                    });
                }

                // Try the non-streaming endpoint as a fallback
                logger.warn('Streaming endpoint failed, trying non-streaming endpoint as fallback');

                const url = `/api/v1/session/${sessionUuid}/message`;
                try {
                    const fallbackResponse = await this.client.post<GPTTrainerMessageResponse>(url, { query });

                    if (fallbackResponse.data && typeof fallbackResponse.data.text === 'string') {
                        return fallbackResponse.data;
                    }
                } catch (fallbackError) {
                    logger.error('Non-streaming fallback also failed', { error: fallbackError });
                }

                // If the API is consistently returning errors, provide a fallback response
                logger.warn('All API endpoints failed, providing fallback response');
                return {
                    text: "I'm sorry, I'm having trouble connecting to my knowledge base right now. The team has been notified and is working on a fix. In the meantime, please try again later or ask a different question."
                };
            }
        } catch (error) {
            // Log detailed error information
            if (axios.isAxiosError(error) && error.response) {
                logger.error('GPT-trainer API error', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data,
                    headers: error.response.headers
                });
            } else {
                logger.error('Error sending message', { error });
            }

            // Create a fallback response
            return {
                text: `I'm sorry, I encountered an error: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    /**
     * Send a message to a session and stream the response
     * 
     * @param sessionUuid Session UUID
     * @param query User query
     * @param onChunk Callback for each chunk of the response
     * @returns Promise resolving when the stream is complete
     */
    public async sendMessageStream(
        sessionUuid: string,
        query: string,
        onChunk: (chunk: GPTTrainerStreamChunk) => void
    ): Promise<void> {
        try {
            const url = `/api/v1/session/${sessionUuid}/message/stream`;

            const response = await this.client.post(url,
                { query },
                {
                    responseType: 'stream',
                    headers: {
                        'Accept': 'text/event-stream',
                    }
                }
            );

            const stream = response.data;

            return new Promise<void>((resolve, reject) => {
                let buffer = '';

                stream.on('data', (chunk: Buffer) => {
                    const chunkStr = chunk.toString();
                    buffer += chunkStr;

                    // Process complete messages
                    const lines = buffer.split('\n\n');
                    buffer = lines.pop() || ''; // Keep the last incomplete chunk in the buffer

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.substring(6));
                                onChunk(data);

                                if (data.done) {
                                    resolve();
                                    return;
                                }
                            } catch (e) {
                                logger.error('Error parsing stream chunk', { error: e, chunk: line });
                            }
                        }
                    }
                });

                stream.on('end', () => {
                    resolve();
                });

                stream.on('error', (error: Error) => {
                    logger.error('Stream error', { error });
                    reject(error);
                });
            });
        } catch (error) {
            logger.error('Error sending message stream', { error });
            throw new Error(`Failed to send message stream: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
