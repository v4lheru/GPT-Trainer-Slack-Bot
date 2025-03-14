/**
 * Test script for GPT-trainer API integration
 * 
 * This script tests the GPT-trainer API integration by creating a session
 * and sending a message to it.
 */

require('dotenv').config();
const axios = require('axios');

// Configuration
const config = {
    apiKey: process.env.GPT_TRAINER_API_KEY,
    baseUrl: process.env.GPT_TRAINER_API_URL,
    chatbotUuid: process.env.GPT_TRAINER_CHATBOT_UUID,
    httpTimeout: 30000, // 30 seconds
};

// Create axios client
const client = axios.create({
    baseURL: config.baseUrl,
    timeout: config.httpTimeout,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
    }
});

/**
 * Create a new session
 */
async function createSession() {
    try {
        const url = `/api/v1/chatbot/${config.chatbotUuid}/session/create`;
        console.log(`🔍 Creating session: ${url}`);

        const response = await client.post(url, {});
        console.log(`✅ Session created: ${response.data.uuid}`);
        return response.data.uuid;
    } catch (error) {
        console.error('❌ Error creating session:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        throw error;
    }
}

/**
 * Send a message to a session
 */
async function sendMessage(sessionUuid, query) {
    try {
        // Try the non-streaming endpoint first
        const url = `/api/v1/session/${sessionUuid}/message`;
        console.log(`🔍 Sending message to: ${url}`);
        console.log(`📝 Query: ${query}`);

        try {
            const response = await client.post(url, { query });
            console.log(`✅ Response received:`);
            console.log(`Status: ${response.status}`);
            console.log(`Data:`, response.data);
            return response.data;
        } catch (nonStreamError) {
            console.warn('⚠️ Non-streaming endpoint failed, trying streaming endpoint');
            console.error(nonStreamError.message);

            if (nonStreamError.response) {
                console.error('Response status:', nonStreamError.response.status);
                console.error('Response data:', nonStreamError.response.data);
            }

            // Try the streaming endpoint
            const streamUrl = `/api/v1/session/${sessionUuid}/message/stream`;
            console.log(`🔍 Trying streaming endpoint: ${streamUrl}`);

            // Create a new axios instance with different settings
            const directClient = axios.create({
                baseURL: config.baseUrl,
                timeout: config.httpTimeout * 2,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Accept': 'application/json'
                }
            });

            try {
                const directResponse = await directClient.post(streamUrl, { query });
                console.log(`✅ Streaming response received:`);
                console.log(`Status: ${directResponse.status}`);
                console.log(`Data:`, directResponse.data);
                return directResponse.data;
            } catch (directError) {
                console.error('❌ Streaming endpoint failed:', directError.message);

                if (directError.response) {
                    console.error('Response status:', directError.response.status);
                    console.error('Response data:', directError.response.data);
                }

                throw directError;
            }
        }
    } catch (error) {
        console.error('❌ All attempts failed:', error.message);
        throw error;
    }
}

/**
 * Main function
 */
async function main() {
    try {
        // Create a session
        const sessionUuid = await createSession();

        // Send a message
        const query = "Hello, how are you today?";
        const response = await sendMessage(sessionUuid, query);

        console.log('\n✅ Test completed successfully!');
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    }
}

// Run the test
main();
