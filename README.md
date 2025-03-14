# GPT-trainer Slack Bot

## Project Overview

GPT-trainer Slack Bot is an intelligent Slack bot that connects your team's conversations with the powerful GPT-trainer AI capabilities. It serves as a bridge between your Slack workspace and GPT-trainer, allowing seamless access to AI assistance without leaving your communication platform.

The bot integrates directly with the GPT-trainer API, enabling your team to interact with your custom-trained AI models directly from Slack. It maintains conversation context through sessions, allowing for natural, multi-turn interactions.

## Features

- **Seamless Slack Integration**: Fully integrated with Slack's messaging platform
- **Custom AI Responses**: Leverages your GPT-trainer chatbots for domain-specific knowledge
- **Persistent Sessions**: Maintains conversation context for coherent multi-turn interactions
- **Thread Support**: Works in threads for organized conversations
- **Direct Message Support**: Available in DMs for private assistance
- **Mention Support**: Can be mentioned in channels to provide assistance
- **Error Handling**: Robust error handling and recovery
- **Logging**: Comprehensive logging for monitoring and debugging
- **Streaming Support**: Uses GPT-trainer's streaming API for faster responses
- **Fallback Mechanisms**: Gracefully handles API errors with informative messages

## Technical Architecture

GPT-trainer Slack Bot is built with a modular architecture that separates concerns and allows for easy extension:

1. **Slack Integration Layer**: Handles all communication with the Slack API
2. **GPT-trainer API Client**: Manages connections to the GPT-trainer service
   - Supports both streaming and non-streaming endpoints
   - Implements fallback mechanisms for API errors
   - Handles session creation and message sending
3. **Session Management**: Maintains user sessions for conversation continuity
   - Maps Slack user IDs to GPT-trainer session UUIDs
   - Handles session cleanup for inactive conversations
4. **Configuration Layer**: Provides flexible configuration options
   - Environment-based configuration
   - Constants for application-wide settings

## Prerequisites

- Node.js 16+ installed
- npm 7+ installed
- Slack workspace with admin access
- GPT-trainer API key and chatbot UUID

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/v4lheru/GPT-Trainer-Slack-Bot.git
   cd GPT-Trainer-Slack-Bot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the required environment variables (see `.env.example` for reference):
   ```
   # Node environment
   NODE_ENV=development
   PORT=3000

   # Slack configuration
   SLACK_BOT_TOKEN=xoxb-your-bot-token
   SLACK_SIGNING_SECRET=your-signing-secret
   SLACK_APP_TOKEN=xapp-your-app-token

   # GPT-trainer configuration
   GPT_TRAINER_API_KEY=your-gpt-trainer-api-key
   GPT_TRAINER_CHATBOT_UUID=your-chatbot-uuid
   GPT_TRAINER_API_URL=https://app.gpt-trainer.com

   # Application configuration
   LOG_LEVEL=info
   SESSION_CLEANUP_INTERVAL=3600000
   ```

## Running the Bot

### Development Mode

```bash
npm run dev
```

This will start the bot in development mode with hot reloading.

### Production Mode

```bash
npm run build
npm start
```

This will build the TypeScript code and start the bot in production mode.

## Deployment on Railway

This project includes configuration files for deploying on Railway:

1. `railway.json` - Configuration for Railway deployment
2. `Procfile` - Process file for Railway

To deploy on Railway:

1. Push your code to a GitHub repository
2. Create a new project on Railway from the GitHub repository
3. Set up the environment variables in the Railway dashboard
4. Deploy the project

## Project Structure

```
/
├── src/
│   ├── config/           # Configuration management
│   │   ├── constants.ts  # Application constants
│   │   └── environment.ts # Environment variables
│   ├── api/              # API client definitions
│   │   ├── slack.ts      # Slack API client
│   │   └── gpt-trainer.ts # GPT-trainer API client
│   ├── services/         # Business logic
│   │   └── session.ts    # Session management service
│   ├── types/            # TypeScript interfaces and types
│   │   ├── slack.ts      # Slack types
│   │   └── gpt-trainer.ts # GPT-trainer types
│   ├── utils/            # Utility functions
│   │   ├── logger.ts     # Logging utility
│   │   └── error-handler.ts # Error handling
│   ├── slack/            # Slack integration
│   │   ├── app.ts        # Slack app configuration
│   │   └── events/       # Event handlers
│   └── index.ts          # Application entry point
├── tsconfig.json         # TypeScript configuration
├── package.json          # Dependencies and scripts
└── .env.example          # Environment variable template
```

## Interacting with the Bot

Once deployed, you can interact with GPT-trainer Slack Bot in several ways:

1. **Direct Messages**: Send a DM to the bot for private conversations
2. **Mentions**: Mention the bot in a channel using `@GPT-trainer`
3. **Threads**: The bot can participate in conversation threads

Example interactions:

- `@GPT-trainer What is the company policy on remote work?`
- `@GPT-trainer Can you explain how our product works?`
- `@GPT-trainer Help me draft an email to a client`

The bot will maintain context throughout the conversation, allowing for natural follow-up questions and multi-turn interactions.

## GPT-trainer API Integration

The bot integrates with the GPT-trainer API using the following endpoints:

1. **Create Session**: `https://app.gpt-trainer.com/api/v1/chatbot/{chatbot_uuid}/session/create`
   - Creates a new session for a user
   - Returns a session UUID for subsequent messages

2. **Send Message (Streaming)**: `https://app.gpt-trainer.com/api/v1/session/{session_uuid}/message/stream`
   - Sends a user message to the GPT-trainer API
   - Returns the AI response as a string

The integration includes robust error handling and fallback mechanisms to ensure reliable operation even when API issues occur.

## Extending Functionality

GPT-trainer Slack Bot is designed to be extensible. You can:

1. **Customize Response Formatting**: Modify how responses are presented in Slack
2. **Add New Features**: Implement additional functionality as needed
3. **Integrate with Other Services**: Connect to other APIs or services
4. **Enhance Session Management**: Implement database storage for persistent sessions

## Troubleshooting

If you encounter issues with the GPT-trainer API integration:

1. **Check API Credentials**: Ensure your API key and chatbot UUID are correct
2. **Verify API Endpoints**: The bot uses the streaming endpoint by default
3. **Check Logs**: Examine the logs for detailed error information
4. **Test API Directly**: Use the included test script (`test-gpt-trainer.js`) to test the API directly

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
