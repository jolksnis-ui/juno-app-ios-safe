# Juno AI Chatbot Implementation

## Overview

This document describes the implementation of an intelligent LLM-powered chatbot for the Juno fintech mobile application. The chatbot serves as a financial assistant, helping users manage their portfolios, understand transactions, and make informed investment decisions.

## Features

### Core Capabilities
- **Portfolio Analysis**: Real-time balance inquiries and portfolio insights
- **Transaction Support**: Help with buying, selling, and exchanging cryptocurrencies
- **Financial Education**: Explanations of crypto concepts and investment strategies
- **Risk Assessment**: Security best practices and investment risk analysis
- **Smart Navigation**: Context-aware action buttons for quick app navigation

### Technical Features
- **Dual AI Backend**: Claude 3.5 Sonnet integration with intelligent mock service fallback
- **Context-Aware Responses**: Uses real user data for personalized advice
- **Secure Storage**: Encrypted conversation history and user preferences
- **Real-time Updates**: Live portfolio data integration
- **Responsive UI**: Modern chat interface with typing indicators
- **Streaming Support**: Real-time response streaming (configurable)

## Architecture

### File Structure
```
src/
├── types/
│   └── chat.ts                 # TypeScript interfaces for chat system
├── services/
│   ├── chatService.ts          # Main chat service with Claude API integration
│   ├── claudeAPI.ts            # Claude API client and utilities
│   └── mockChatService.ts      # Fallback service with intelligent responses
├── contexts/
│   └── ChatContext.tsx         # React context for chat state management
├── components/
│   ├── ChatMessage.tsx         # Individual message component
│   └── ChatInput.tsx           # Chat input with suggestions
├── screens/
│   └── ChatScreen.tsx          # Main chat interface
└── app/(auth)/
    └── chat.tsx                # Chat route
```

### Key Components

#### 1. ChatService
- **Primary**: Claude 3.5 Sonnet integration for advanced AI responses
- **Fallback**: Mock service with pattern-based intelligent responses
- **Context Integration**: Accesses user balances, transactions, and preferences
- **Security**: No sensitive data sent to external APIs without user consent

#### 2. ChatContext
- **State Management**: Handles messages, sessions, and loading states
- **Persistence**: Secure storage of conversation history
- **Session Management**: Multiple chat sessions with automatic titles
- **Insights**: Financial analysis and recommendations

#### 3. UI Components
- **ChatMessage**: Displays messages with action buttons and timestamps
- **ChatInput**: Multi-line input with suggested questions
- **ChatScreen**: Full chat interface with empty states and navigation

## Setup Instructions

### 1. Environment Configuration
```bash
# Copy the example environment file
cp .env.example .env

# Add your Claude API key (optional)
EXPO_PUBLIC_CLAUDE_API_KEY=your_claude_api_key_here
```

### 2. Claude API Key (Optional)
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create an account or sign in
3. Generate a new API key
4. Add it to your `.env` file

**Note**: The chatbot works without an API key using the intelligent mock service.

### 3. Claude Configuration (Optional)
You can customize Claude settings in your `.env` file:
```bash
EXPO_PUBLIC_CLAUDE_MODEL="claude-3-5-sonnet-20241022"
EXPO_PUBLIC_CLAUDE_MAX_TOKENS=1024
EXPO_PUBLIC_ENABLE_CLAUDE_STREAMING=false
```

### 3. Navigation Integration
The chatbot is integrated into the main app navigation:
- **Dashboard**: Chat icon in bottom navigation
- **Direct Access**: Navigate to `/(auth)/chat`

## Usage Examples

### User Queries and Expected Responses

#### Portfolio Inquiries
```
User: "What's my current balance?"
AI: Displays portfolio overview with fiat/crypto breakdown and action buttons
```

#### Transaction Help
```
User: "Help me buy Bitcoin"
AI: Provides step-by-step guidance with "Buy Crypto" action button
```

#### Educational Content
```
User: "Explain Ethereum"
AI: Comprehensive explanation of Ethereum features and investment considerations
```

#### Risk Assessment
```
User: "What are the risks of crypto?"
AI: Detailed risk analysis with security best practices
```

## Security & Privacy

### Data Protection
- **Local Storage**: Conversations stored securely on device
- **No PII Leakage**: Sensitive data filtered before API calls
- **User Consent**: Explicit permissions for data sharing
- **Encryption**: All stored data is encrypted

### Financial Compliance
- **No Direct Transactions**: AI cannot execute trades directly
- **Risk Warnings**: All investment advice includes risk disclosures
- **Audit Trail**: Complete conversation history for compliance
- **Regulatory Compliance**: Adheres to fintech regulations

## Customization

### Adding New Response Patterns
Edit `src/services/mockChatService.ts` to add new intelligent responses:

```typescript
// Add new pattern matching
else if (lowerMessage.includes('your_keyword')) {
  response = `Your custom response here`;
  actionButtons.push({
    id: 'custom_action',
    label: 'Custom Action',
    action: 'navigate',
    data: { screen: '/(auth)/your-screen' }
  });
}
```

### Extending Context Data
Modify `getUserContext()` in `chatService.ts` to include additional user data:

```typescript
const context: ChatContext = {
  // Existing context...
  customData: await getCustomUserData(),
};
```

### UI Customization
- **Themes**: Automatically adapts to app's light/dark theme
- **Colors**: Uses app's accent colors and theme system
- **Typography**: Consistent with app's design system

## Performance Considerations

### Optimization Features
- **Message Pagination**: Loads conversations efficiently
- **Context Limiting**: Only sends last 10 messages to AI
- **Caching**: Intelligent caching of user context
- **Fallback Strategy**: Graceful degradation when APIs fail

### Resource Management
- **Memory**: Automatic cleanup of old conversations
- **Storage**: Compressed message storage
- **Network**: Minimal API calls with smart batching

## Troubleshooting

### Common Issues

#### 1. Claude API Key Not Working
- Verify the key is correctly set in `.env` as `EXPO_PUBLIC_CLAUDE_API_KEY`
- Check Anthropic account has sufficient credits
- Ensure key has proper permissions
- Test key validity using the `validateApiKey()` method

#### 2. Mock Service Responses
- If seeing pattern-based responses, Claude API key may be missing
- Check console logs for Claude API errors
- Verify network connectivity
- Ensure API key format is correct (starts with `sk-ant-`)

#### 3. Context Loading Issues
- Ensure user is properly authenticated
- Check balance and transaction service availability
- Review console logs for service errors
- Verify user data permissions

#### 4. Streaming Issues (if enabled)
- Check `EXPO_PUBLIC_ENABLE_CLAUDE_STREAMING` setting
- Verify network supports streaming responses
- Review browser compatibility for streaming

### Debug Mode
Enable detailed logging by checking console for:
```typescript
console.log('Claude API sendMessage error:', error);
console.log('Claude API key not configured, using mock service');
```

## Future Enhancements

### Planned Features
- **Voice Input**: Speech-to-text integration
- **Market Data**: Real-time crypto price integration
- **Advanced Analytics**: ML-powered portfolio insights
- **Multi-language**: Internationalization support
- **Push Notifications**: Proactive financial alerts
- **Streaming Responses**: Real-time message streaming

### Integration Opportunities
- **Calendar**: Investment reminders and DCA scheduling
- **News**: Crypto news integration and analysis
- **Social**: Community insights and sentiment analysis
- **Banking**: Traditional banking integration

## Support

For technical support or questions about the chatbot implementation:

1. **Documentation**: Review this README and inline code comments
2. **Logs**: Check console logs for detailed error information
3. **Testing**: Use the mock service to test functionality
4. **API Issues**: Verify Claude API key and account status
5. **Claude Documentation**: Visit [Anthropic's API docs](https://docs.anthropic.com/)

## License

This chatbot implementation is part of the Juno mobile application and follows the same licensing terms as the main project.
