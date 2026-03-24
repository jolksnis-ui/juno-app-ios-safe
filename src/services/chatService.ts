import { ChatMessage, ChatContext, LLMRequest, LLMResponse, ChatActionButton, FinancialInsight, QuotationData } from '../types/chat';
import { getClientBalances, getCryptoBalances } from './balanceService';
import { getCryptoTransactions, getFiatTransactions } from './transactionService';
import { getUserData } from './secureStorage';
import { mockChatService } from './mockChatService';
import { createClaudeAPI, ClaudeMessage } from './claudeAPI';
import { transactionIntentParser, BuyCryptoIntent } from './transactionIntentParser';
import { chatQuotationManager } from './chatQuotationManager';
import { getCryptoExchangeRate } from './exchangeService';

// Claude API configuration
const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY || '';
const claudeClient = CLAUDE_API_KEY ? createClaudeAPI(CLAUDE_API_KEY) : null;

// Configure Claude settings from environment variables
if (claudeClient) {
  const model = process.env.EXPO_PUBLIC_CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
  const maxTokens = parseInt(process.env.EXPO_PUBLIC_CLAUDE_MAX_TOKENS || '1024');
  
  claudeClient.setModel(model);
  claudeClient.setMaxTokens(maxTokens);
}

export class ChatService {
  private static instance: ChatService;
  private activeQuotationSessionId: string | null = null;
  
  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  /**
   * Generate a unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current user context for the chat
   */
  async getUserContext(): Promise<ChatContext> {
    try {
      const userData = await getUserData();
      if (!userData) {
        throw new Error('User not authenticated');
      }

      // Fetch user's financial data
      const [fiatBalances, cryptoBalances, recentCryptoTx, recentFiatTx] = await Promise.allSettled([
        getClientBalances(),
        getCryptoBalances(),
        getCryptoTransactions(1, 5), // Last 5 crypto transactions
        getFiatTransactions(1, 5)    // Last 5 fiat transactions
      ]);

      const context: ChatContext = {
        userBalances: {
          fiat: fiatBalances.status === 'fulfilled' ? fiatBalances.value.clientBalanceList : [],
          crypto: cryptoBalances.status === 'fulfilled' ? cryptoBalances.value.clientBalanceList : [],
          totalFiat: fiatBalances.status === 'fulfilled' ? fiatBalances.value.totalFiatAmount : 0,
          totalCrypto: cryptoBalances.status === 'fulfilled' ? cryptoBalances.value.totalCryptoAmount : 0,
        },
        recentTransactions: [
          ...(recentCryptoTx.status === 'fulfilled' ? recentCryptoTx.value.transactions : []),
          ...(recentFiatTx.status === 'fulfilled' ? recentFiatTx.value.transactions : [])
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10),
        userPreferences: {
          preferredCurrency: 'USD',
          riskTolerance: 'medium',
          notificationSettings: {}
        }
      };

      return context;
    } catch (error) {
      console.error('Error getting user context:', error);
      return {
        userBalances: { fiat: [], crypto: [], totalFiat: 0, totalCrypto: 0 },
        recentTransactions: [],
        userPreferences: {
          preferredCurrency: 'USD',
          riskTolerance: 'medium',
          notificationSettings: {}
        }
      };
    }
  }

  /**
   * Create system prompt for the financial assistant
   */
  private createSystemPrompt(context: ChatContext): string {
    const { userBalances, recentTransactions } = context;
    
    return `You are Juno AI, an intelligent financial assistant for the Juno fintech app. You help users manage their fiat and cryptocurrency portfolios with expert advice and insights.

CURRENT USER CONTEXT:
- Total Fiat Balance: $${userBalances?.totalFiat?.toFixed(2) || '0.00'}
- Total Crypto Balance: $${userBalances?.totalCrypto?.toFixed(2) || '0.00'}
- Fiat Assets: ${userBalances?.fiat?.length || 0} currencies
- Crypto Assets: ${userBalances?.crypto?.length || 0} cryptocurrencies
- Recent Transactions: ${recentTransactions?.length || 0} transactions

CAPABILITIES:
1. Balance inquiries and portfolio analysis
2. Transaction history and insights
3. Market trends and price analysis
4. Investment recommendations and risk assessment
5. Educational content about crypto and traditional finance
6. Help with app features and navigation

GUIDELINES:
- Always prioritize user security and financial safety
- Provide accurate, helpful, and actionable advice
- Use clear, friendly language suitable for all experience levels
- When discussing investments, always mention risks
- For transaction requests, guide users to appropriate app screens
- Format numbers clearly with proper currency symbols
- Be concise but comprehensive in responses

RESPONSE FORMAT:
- Use markdown formatting for better readability
- Include relevant action buttons when appropriate
- Provide specific data when available
- Always be helpful and professional

Remember: You cannot execute transactions directly. Always guide users to the appropriate app screens for actual financial operations.`;
  }

  /**
   * Convert our chat messages to Claude format
   */
  private convertToClaude(messages: ChatMessage[]): ClaudeMessage[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * Process user message and generate AI response using Claude API
   */
  async processMessage(
    userMessage: string, 
    conversationHistory: ChatMessage[] = [],
    onQuotationUpdate?: (quotation: QuotationData) => void
  ): Promise<ChatMessage> {
    try {
      // Check for transaction intent first
      const transactionIntent = await transactionIntentParser.parseMessage(userMessage);
      
      if (transactionIntent && transactionIntent.type === 'buy_crypto') {
        return await this.handleBuyCryptoIntent(
          transactionIntent.intent as BuyCryptoIntent,
          userMessage,
          onQuotationUpdate
        );
      }

      // Get current user context
      const context = await this.getUserContext();

      // If Claude client is not configured, use mock service
      if (!claudeClient) {
        console.log('Claude API key not configured, using mock service');
        return await mockChatService.processMessage(userMessage, context);
      }
      
      // Prepare conversation history for Claude
      const claudeMessages: ClaudeMessage[] = [
        // Include last 10 messages for context
        ...this.convertToClaude(conversationHistory.slice(-10)),
        {
          role: 'user',
          content: userMessage
        }
      ];

      // Call Claude API
      const aiResponse = await claudeClient.sendMessage(
        claudeMessages,
        this.createSystemPrompt(context),
        {
          maxTokens: 1000,
          temperature: 0.7
        }
      );

      // Analyze response to determine type and generate action buttons
      const { type, actionButtons } = this.analyzeResponse(aiResponse, userMessage);

      // Create response message
      const responseMessage: ChatMessage = {
        id: this.generateMessageId(),
        content: aiResponse,
        role: 'assistant',
        timestamp: new Date(),
        type,
        metadata: {
          actionButtons
        }
      };

      return responseMessage;

    } catch (error) {
      console.error('Error processing message with Claude API, falling back to mock service:', error);
      
      // Fallback to mock service if Claude fails
      try {
        const context = await this.getUserContext();
        return await mockChatService.processMessage(userMessage, context);
      } catch (mockError) {
        console.error('Mock service also failed:', mockError);
        
        // Final fallback error message
        return {
          id: this.generateMessageId(),
          content: 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.',
          role: 'assistant',
          timestamp: new Date(),
          type: 'text'
        };
      }
    }
  }

  /**
   * Analyze AI response to determine type and generate action buttons
   */
  private analyzeResponse(response: string, userMessage: string): { type: ChatMessage['type'], actionButtons?: ChatActionButton[] } {
    const lowerResponse = response.toLowerCase();
    const lowerMessage = userMessage.toLowerCase();
    const actionButtons: ChatActionButton[] = [];

    let type: ChatMessage['type'] = 'text';

    // Detect balance-related responses
    if (lowerMessage.includes('balance') || lowerMessage.includes('portfolio') || lowerResponse.includes('balance')) {
      type = 'balance';
      actionButtons.push({
        id: 'view_dashboard',
        label: 'View Dashboard',
        action: 'navigate',
        data: { screen: '/(auth)/dashboard' }
      });
    }

    // Detect transaction-related responses
    if (lowerMessage.includes('transaction') || lowerMessage.includes('history') || lowerResponse.includes('transaction')) {
      type = 'transaction';
      actionButtons.push({
        id: 'view_transactions',
        label: 'View Transactions',
        action: 'navigate',
        data: { screen: '/(auth)/transactions' }
      });
    }

    // Detect buy/sell/exchange mentions
    if (lowerMessage.includes('buy') || lowerResponse.includes('buy')) {
      actionButtons.push({
        id: 'buy_crypto',
        label: 'Buy Crypto',
        action: 'navigate',
        data: { screen: '/(auth)/buy-crypto' }
      });
    }

    if (lowerMessage.includes('sell') || lowerResponse.includes('sell')) {
      actionButtons.push({
        id: 'sell_crypto',
        label: 'Sell Crypto',
        action: 'navigate',
        data: { screen: '/(auth)/sell-crypto' }
      });
    }

    if (lowerMessage.includes('exchange') || lowerResponse.includes('exchange')) {
      actionButtons.push({
        id: 'exchange_crypto',
        label: 'Exchange Crypto',
        action: 'navigate',
        data: { screen: '/(auth)/exchange-crypto' }
      });
    }

    // Detect insights and recommendations
    if (lowerResponse.includes('recommend') || lowerResponse.includes('suggest') || lowerResponse.includes('analysis')) {
      type = 'insight';
    }

    return { type, actionButtons: actionButtons.length > 0 ? actionButtons : undefined };
  }

  /**
   * Generate financial insights based on user data
   */
  async generateFinancialInsights(context: ChatContext): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];
    const { userBalances, recentTransactions } = context;

    try {
      // Portfolio diversification analysis
      if (userBalances && (userBalances.fiat.length > 0 || userBalances.crypto.length > 0)) {
        const totalValue = userBalances.totalFiat + userBalances.totalCrypto;
        const cryptoPercentage = totalValue > 0 ? (userBalances.totalCrypto / totalValue) * 100 : 0;

        insights.push({
          type: 'portfolio_analysis',
          title: 'Portfolio Allocation',
          description: `Your portfolio is ${cryptoPercentage.toFixed(1)}% crypto and ${(100 - cryptoPercentage).toFixed(1)}% fiat. ${cryptoPercentage > 70 ? 'Consider diversifying with more stable assets.' : cryptoPercentage < 10 ? 'You might want to explore cryptocurrency investments.' : 'Good balance between crypto and traditional assets.'}`,
          data: { cryptoPercentage, fiatPercentage: 100 - cryptoPercentage },
          confidence: 0.8,
          timestamp: new Date()
        });
      }

      // Transaction pattern analysis
      if (recentTransactions && recentTransactions.length > 0) {
        const buyTransactions = recentTransactions.filter(tx => tx.type === 'Buy').length;
        const sellTransactions = recentTransactions.filter(tx => tx.type === 'Sell').length;

        if (buyTransactions > sellTransactions * 2) {
          insights.push({
            type: 'recommendation',
            title: 'Trading Pattern',
            description: 'You\'ve been buying more than selling recently. Consider taking some profits if your investments have performed well.',
            data: { buyCount: buyTransactions, sellCount: sellTransactions },
            confidence: 0.7,
            timestamp: new Date()
          });
        }
      }

      return insights;
    } catch (error) {
      console.error('Error generating insights:', error);
      return [];
    }
  }

  /**
   * Handle buy crypto intent
   */
  private async handleBuyCryptoIntent(
    intent: BuyCryptoIntent,
    originalMessage: string,
    onQuotationUpdate?: (quotation: QuotationData) => void
  ): Promise<ChatMessage> {
    try {
      // Enhance intent with user context
      const enhancedIntent = await transactionIntentParser.enhanceIntentWithContext(intent);
      
      // Check if clarification is needed
      if (enhancedIntent.needsClarification) {
        const clarificationMessage = transactionIntentParser.generateClarificationMessage(enhancedIntent);
        return {
          id: this.generateMessageId(),
          content: clarificationMessage,
          role: 'assistant',
          timestamp: new Date(),
          type: 'text',
          metadata: {
            actionButtons: this.generateCryptoCurrencyButtons()
          }
        };
      }

      // All required information available, start quotation
      if (enhancedIntent.amount && enhancedIntent.toCurrency && enhancedIntent.fromCurrency) {
        return await this.startBuyCryptoQuotation(
          enhancedIntent,
          onQuotationUpdate
        );
      }

      // Fallback message
      return {
        id: this.generateMessageId(),
        content: "I can help you buy crypto! Please specify the amount and cryptocurrency you'd like to buy.",
        role: 'assistant',
        timestamp: new Date(),
        type: 'text'
      };
    } catch (error) {
      console.error('Error handling buy crypto intent:', error);
      return {
        id: this.generateMessageId(),
        content: "I encountered an error while processing your request. Please try again.",
        role: 'assistant',
        timestamp: new Date(),
        type: 'text'
      };
    }
  }

  /**
   * Start buy crypto quotation process
   */
  private async startBuyCryptoQuotation(
    intent: BuyCryptoIntent,
    onQuotationUpdate?: (quotation: QuotationData) => void
  ): Promise<ChatMessage> {
    try {
      const sessionId = `chat_quotation_${Date.now()}`;
      this.activeQuotationSessionId = sessionId;

      // Create currency objects
      const fromCurrency = { code: intent.fromCurrency!, name: intent.fromCurrency! };
      const toCurrency = { code: intent.toCurrency!, name: intent.toCurrency! };

      // Start quotation using the manager (reuses existing logic)
      const quotation = await chatQuotationManager.startBuyQuotation(
        sessionId,
        fromCurrency,
        toCurrency,
        intent.amount!,
        intent.amountType!,
        (updatedQuotation) => {
          if (onQuotationUpdate) {
            onQuotationUpdate(updatedQuotation);
          }
        },
        () => {
          // Handle expiry - the callback in ChatContext will handle the message
          this.activeQuotationSessionId = null;
          if (onQuotationUpdate) {
            // Send an expired quotation to trigger the expiry message
            const expiredQuotation = { ...chatQuotationManager.getQuotation(sessionId)! };
            expiredQuotation.status = 'expired';
            onQuotationUpdate(expiredQuotation);
          }
        }
      );

      // Return quotation message
      return {
        id: this.generateMessageId(),
        content: this.formatQuotationMessage(quotation),
        role: 'assistant',
        timestamp: new Date(),
        type: 'quotation',
        metadata: {
          quotationData: quotation,
          transactionIntent: {
            type: 'buy_crypto',
            amount: intent.amount,
            amountType: intent.amountType,
            fromCurrency: intent.fromCurrency,
            toCurrency: intent.toCurrency,
            status: 'confirming'
          },
          actionButtons: [
            {
              id: 'confirm_buy',
              label: '🔒 Confirm Purchase',
              action: 'confirm_transaction',
              variant: 'primary',
              data: { sessionId }
            },
            {
              id: 'cancel_buy',
              label: 'Cancel',
              action: 'cancel_transaction',
              variant: 'secondary',
              data: { sessionId }
            }
          ]
        }
      };
    } catch (error) {
      console.error('Error starting buy crypto quotation:', error);
      throw error;
    }
  }

  /**
   * Format quotation message
   */
  private formatQuotationMessage(quotation: QuotationData): string {
    const feeAmount = quotation.fiatAmount * (quotation.feePercent / 100);
    const fiatBeforeFee = quotation.fiatAmount - feeAmount;
    
    return `💰 **Buy ${quotation.cryptoCurrency}**\n\n` +
           `You Pay: **${quotation.fiatCurrency} ${quotation.fiatAmount.toFixed(2)}**\n` +
           `Fee (${quotation.feePercent}%): ${quotation.fiatCurrency} ${feeAmount.toFixed(2)}\n` +
           `━━━━━━━━━━━━━━━\n` +
           `You Get: **${quotation.cryptoAmount.toFixed(8)} ${quotation.cryptoCurrency}**\n\n` +
           `Rate: 1 ${quotation.cryptoCurrency} = ${quotation.fiatCurrency} ${quotation.price}\n` +
           `⏱ Quote valid for 25 seconds`;
  }

  /**
   * Generate crypto currency selection buttons
   */
  private generateCryptoCurrencyButtons(): ChatActionButton[] {
    const cryptos = ['BTC', 'ETH', 'USDT', 'USDC', 'LTC'];
    return cryptos.map(crypto => ({
      id: `select_${crypto.toLowerCase()}`,
      label: crypto,
      action: 'execute',
      data: { action: 'select_crypto', crypto }
    }));
  }

  /**
   * Execute buy transaction with authentication
   */
  async executeBuyTransaction(sessionId: string): Promise<ChatMessage> {
    try {
      if (!this.activeQuotationSessionId || this.activeQuotationSessionId !== sessionId) {
        throw new Error('No active quotation found');
      }

      // Execute transaction using the manager (reuses existing logic)
      const result = await chatQuotationManager.executeBuyTransaction(sessionId);
      
      // Clear active session
      this.activeQuotationSessionId = null;

      return {
        id: this.generateMessageId(),
        content: `✅ **Transaction Successful!**\n\n` +
                 `${result.msg || 'Your crypto purchase has been completed successfully!'}\n\n` +
                 `Transaction ID: ${result.transactionId || 'N/A'}`,
        role: 'assistant',
        timestamp: new Date(),
        type: 'transaction',
        metadata: {
          transactionData: result,
          actionButtons: [
            {
              id: 'view_dashboard',
              label: 'View Dashboard',
              action: 'navigate',
              data: { screen: '/(auth)/dashboard?tab=crypto' }
            },
            {
              id: 'view_transactions',
              label: 'View Transactions',
              action: 'navigate',
              data: { screen: '/(auth)/transactions?tab=crypto' }
            }
          ]
        }
      };
    } catch (error) {
      console.error('Error executing buy transaction:', error);
      return {
        id: this.generateMessageId(),
        content: `❌ **Transaction Failed**\n\n${error instanceof Error ? error.message : 'Failed to complete transaction. Please try again.'}`,
        role: 'assistant',
        timestamp: new Date(),
        type: 'text'
      };
    }
  }

  /**
   * Cancel active quotation
   */
  cancelQuotation(sessionId: string): void {
    if (this.activeQuotationSessionId === sessionId) {
      chatQuotationManager.stopQuotation(sessionId);
      this.activeQuotationSessionId = null;
    }
  }

  /**
   * Get suggested questions based on user context
   */
  getSuggestedQuestions(context: ChatContext): string[] {
    const suggestions = [
      "What's my current portfolio balance?",
      "Show me my recent transactions",
      "How is my crypto portfolio performing?",
      "What are the current Bitcoin prices?",
      "Help me buy some cryptocurrency",
      "Explain the difference between Bitcoin and Ethereum",
      "What are the risks of crypto investing?",
      "How do I secure my crypto assets?"
    ];

    // Customize suggestions based on user's portfolio
    if (context.userBalances?.crypto && context.userBalances.crypto.length > 0) {
      suggestions.unshift("Analyze my crypto holdings");
    }

    if (context.userBalances?.totalFiat && context.userBalances.totalFiat > 1000) {
      suggestions.push("Should I invest more in crypto?");
    }

    return suggestions.slice(0, 6); // Return top 6 suggestions
  }
}

export const chatService = ChatService.getInstance();
