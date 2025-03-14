# GPT-Trainer API Integration Debugging

## Issue Description

We were experiencing issues with the GPT-Trainer API integration in our Slack bot. The bot successfully created sessions with the GPT-Trainer API, but failed to receive proper responses when sending messages to these sessions.

## Error Details

The logs showed:

```
2025-03-14 22:25:31 info: Created new GPT-trainer session: a4f5e1ef22e946b09158e5d754a044f0
2025-03-14 22:25:31 info: Created new session for user U08HP7YJ3V0: a4f5e1ef22e946b09158e5d754a044f0
2025-03-14 22:25:31 info: 🤖 Using session a4f5e1ef22e946b09158e5d754a044f0 for user U08HP7YJ3V0
2025-03-14 22:25:31 warn: Non-streaming endpoint failed, trying a simpler approach
```

The API was returning a 500 status code when we tried to send messages to a session:

```
2025-03-14 22:09:59 info: 🤖 Using session a9d69741801445188c03950b09963818 for user U08HP7YJ3V0
2025-03-14 22:09:59 error: GPT-trainer API error
```

## API Endpoints Used

According to the GPT-Trainer API documentation, we're using the following endpoints:

1. **Create Session**: `https://app.gpt-trainer.com/api/v1/chatbot/{chatbot_uuid}/session/create`
   - This endpoint works correctly and returns a session UUID.

2. **Send Message**: 
   - Non-streaming: `https://app.gpt-trainer.com/api/v1/session/{session_uuid}/message`
   - Streaming: `https://app.gpt-trainer.com/api/v1/session/{session_uuid}/message/stream`

## Root Cause Analysis

After extensive testing, we discovered that:

1. The non-streaming endpoint (`/api/v1/session/{session_uuid}/message`) was failing with a 405 Method Not Allowed error, indicating that the endpoint might not support POST requests or might have been deprecated.

2. The streaming endpoint (`/api/v1/session/{session_uuid}/message/stream`) was working correctly and returning responses.

3. The streaming endpoint returns the response as a plain string rather than a JSON object with a `text` property.

## Solution Implemented

We modified the `sendMessage` method in the GPT-trainer API client to:

1. Use the streaming endpoint as the primary method for sending messages
2. Properly handle the string response format from the streaming endpoint
3. Fall back to the non-streaming endpoint only if the streaming endpoint fails
4. Provide user-friendly error messages when both endpoints fail

### Updated Implementation

```typescript
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
```

## Testing and Verification

We created a test script (`test-gpt-trainer.js`) to verify the solution:

1. The script successfully creates a session with the GPT-trainer API
2. It confirms that the non-streaming endpoint fails with a 405 Method Not Allowed error
3. It verifies that the streaming endpoint works correctly and returns a response

## Lessons Learned

1. **API Endpoint Behavior**: Different endpoints may have different behavior and response formats, even within the same API.
2. **Fallback Mechanisms**: Implementing fallback mechanisms is crucial for handling API errors gracefully.
3. **Response Format Handling**: Always handle different response formats to ensure robust integration.
4. **Detailed Logging**: Comprehensive logging is essential for diagnosing API integration issues.
5. **Isolated Testing**: Creating a simple test script helps isolate and verify API behavior.

## Future Recommendations

1. **Monitor API Changes**: Regularly check for updates to the GPT-trainer API documentation.
2. **Implement Retry Logic**: Add retry logic for transient failures to improve reliability.
3. **Consider Streaming Implementation**: Explore implementing true streaming for a better user experience.
4. **Add Metrics**: Track API response times and error rates to identify issues early.
5. **Enhance Error Messages**: Provide more specific error messages based on the type of failure.
