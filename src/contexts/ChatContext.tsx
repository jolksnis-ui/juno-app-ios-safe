import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Alert } from 'react-native';
import { ChatMessage, ChatSession, ChatContext as ChatContextType, FinancialInsight, QuotationData } from '../types/chat';
import { chatService } from '../services/chatService';
import { useToast } from './ToastContext';
import { authenticateForCryptoTransaction } from '../services/biometricService';

interface ChatProviderContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  isTyping: boolean;
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  insights: FinancialInsight[];
  suggestedQuestions: string[];
  activeQuotation: QuotationData | null;
  isAuthenticating: boolean;
  sendMessage: (message: string) => Promise<void>;
  clearChat: () => void;
  createNewSession: () => void;
  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  refreshInsights: () => Promise<void>;
  handleActionButton: (action: string, data: any) => Promise<void>;
}

const ChatProviderContext = createContext<ChatProviderContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { showError, showSuccess } = useToast();
  const [isTyping, setIsTyping] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [activeQuotation, setActiveQuotation] = useState<QuotationData | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Initialize chat on component mount
  useEffect(() => {
    initializeChat();
  }, []);

  /**
   * Initialize chat with default session and suggested questions
   */
  const initializeChat = async () => {
    // Create initial session
    createNewSession();
    
    // Load suggested questions
    await loadSuggestedQuestions();
  };

  /**
   * Load suggested questions based on user context
   */
  const loadSuggestedQuestions = async () => {
    try {
      const context = await chatService.getUserContext();
      const questions = chatService.getSuggestedQuestions(context);
      setSuggestedQuestions(questions);
    } catch (error) {
      console.error('Error loading suggested questions:', error);
      // Fallback to default questions
      setSuggestedQuestions([
        "What's my current balance?",
        "Show me recent transactions",
        "Help me buy crypto",
        "Explain Bitcoin",
        "What are the risks?",
        "How to secure my assets?"
      ]);
    }
  };

  /**
   * Generate a unique session ID
   */
  const generateSessionId = (): string => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  /**
   * Generate session title from first message
   */
  const generateSessionTitle = (firstMessage: string): string => {
    const title = firstMessage.length > 30 
      ? firstMessage.substring(0, 30) + '...' 
      : firstMessage;
    return title || 'New Chat';
  };

  /**
   * Send a message and get AI response
   */
  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    try {
      setIsLoading(true);
      setIsTyping(true);

      // Create user message
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        content: message.trim(),
        role: 'user',
        timestamp: new Date(),
        type: 'text'
      };

      // Add user message to chat
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      // Update session title if this is the first message
      if (currentSession && updatedMessages.length === 1) {
        const updatedSession = {
          ...currentSession,
          title: generateSessionTitle(message),
          messages: updatedMessages,
          updatedAt: new Date()
        };
        setCurrentSession(updatedSession);
        
        // Update in sessions list
        setSessions(prev => prev.map(s => 
          s.id === updatedSession.id ? updatedSession : s
        ));
      }

      // Get AI response with quotation update callback
      const aiResponse = await chatService.processMessage(
        message, 
        updatedMessages,
        (quotation: QuotationData) => {
          // Update the active quotation in state
          setActiveQuotation(quotation);
          
          // Check if quotation expired
          if (quotation.status === 'expired') {
            // Add expiry message
            const expiryMessage: ChatMessage = {
              id: `msg_${Date.now()}_expired`,
              content: '⏱️ The quotation has expired. Please request a new quote if you want to continue.',
              role: 'assistant',
              timestamp: new Date(),
              type: 'text'
            };
            setMessages(prev => [...prev, expiryMessage]);
            setActiveQuotation(null);
          } else {
            // Update the message with new quotation data
            setMessages(prev => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage?.type === 'quotation' && lastMessage.metadata?.quotationData) {
                const updatedMessage = {
                  ...lastMessage,
                  metadata: {
                    ...lastMessage.metadata,
                    quotationData: quotation
                  }
                };
                return [...prev.slice(0, -1), updatedMessage];
              }
              return prev;
            });
          }
        }
      );

      // Add AI response to chat
      const finalMessages = [...updatedMessages, aiResponse];
      setMessages(finalMessages);

      // Update current session with all messages
      if (currentSession) {
        const updatedSession = {
          ...currentSession,
          messages: finalMessages,
          updatedAt: new Date()
        };
        setCurrentSession(updatedSession);
        
        // Update in sessions list
        setSessions(prev => prev.map(s => 
          s.id === updatedSession.id ? updatedSession : s
        ));
      }

      // Refresh insights if this was an insight-related query
      if (aiResponse.type === 'insight' || message.toLowerCase().includes('insight') || message.toLowerCase().includes('analysis')) {
        await refreshInsights();
      }

    } catch (error) {
      console.error('Error sending message:', error);
      showError('Failed to send message. Please try again.', 'General Error');
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        content: 'I apologize, but I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  /**
   * Clear current chat
   */
  const clearChat = () => {
    setMessages([]);
    if (currentSession) {
      const clearedSession = {
        ...currentSession,
        messages: [],
        updatedAt: new Date()
      };
      setCurrentSession(clearedSession);
      
      // Update in sessions list
      setSessions(prev => prev.map(s => 
        s.id === clearedSession.id ? clearedSession : s
      ));
    }
  };

  /**
   * Create a new chat session
   */
  const createNewSession = () => {
    const newSession: ChatSession = {
      id: generateSessionId(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setCurrentSession(newSession);
    setMessages([]);
    setSessions(prev => [...prev, newSession]);
  };

  /**
   * Load a specific session
   */
  const loadSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSession(session);
      setMessages(session.messages);
    }
  };

  /**
   * Delete a session
   */
  const deleteSession = (sessionId: string) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);
    
    // If deleting current session, create a new one
    if (currentSession?.id === sessionId) {
      createNewSession();
    }
  };

  /**
   * Refresh financial insights
   */
  /**
   * Handle action button clicks from chat messages
   */
  const handleActionButton = useCallback(async (action: string, data: any) => {
    switch (action) {
      case 'confirm_transaction':
        await handleTransactionConfirmation(data.sessionId);
        break;
      case 'cancel_transaction':
        handleTransactionCancellation(data.sessionId);
        break;
      case 'refresh_quotation':
        await handleQuotationRefresh(data);
        break;
      case 'navigate':
        // Navigation will be handled by the UI component
        break;
      case 'execute':
        if (data.action === 'select_crypto') {
          // Send a message with the selected crypto
          await sendMessage(`I want to buy ${data.crypto}`);
        }
        break;
      default:
        console.log('Unhandled action:', action, data);
    }
  }, [sendMessage]);

  /**
   * Handle transaction confirmation with biometric authentication
   */
  const handleTransactionConfirmation = async (sessionId: string) => {
    try {
      // Add authentication status message
      const authMessage: ChatMessage = {
        id: `msg_${Date.now()}_auth`,
        content: '🔐 Please authenticate to confirm your purchase...',
        role: 'assistant',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, authMessage]);
      
      setIsAuthenticating(true);
      
      // Trigger biometric authentication
      const authResult = await authenticateForCryptoTransaction();
      // const authResult = { success: true, error: "" }
      
      if (!authResult.success) {
        // Add authentication failed message
        const failMessage: ChatMessage = {
          id: `msg_${Date.now()}_auth_fail`,
          content: `❌ Authentication failed: ${authResult.error || 'Please try again'}`,
          role: 'assistant',
          timestamp: new Date(),
          type: 'text'
        };
        setMessages(prev => [...prev, failMessage]);
        showError(authResult.error || 'Authentication failed', 'Authentication Error');
        return;
      }

      // Add authentication success message
      const successMessage: ChatMessage = {
        id: `msg_${Date.now()}_auth_success`,
        content: '✅ Authentication successful! Processing your transaction...',
        role: 'assistant',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, successMessage]);

      // Authentication successful, execute transaction
      setIsLoading(true);
      setIsTyping(true);
      
      const transactionResult = await chatService.executeBuyTransaction(sessionId);
      
      // Update the quotation message to show executed status
      setMessages(prev => {
        return prev.map(msg => {
          if (msg.type === 'quotation' && msg.metadata?.quotationData && 
              msg.metadata?.actionButtons?.some(btn => btn.data?.sessionId === sessionId)) {
            // Create a new message object with executed status
            return {
              ...msg,
              metadata: {
                ...msg.metadata,
                quotationData: {
                  ...msg.metadata.quotationData,
                  status: 'executed' as const
                }
              }
            };
          }
          return msg;
        });
      });
      
      // Add transaction result to messages
      const finalMessages = [...messages, transactionResult];
      setMessages(finalMessages);
      
      // Update session
      if (currentSession) {
        const updatedSession = {
          ...currentSession,
          messages: finalMessages,
          updatedAt: new Date()
        };
        setCurrentSession(updatedSession);
        setSessions(prev => prev.map(s => 
          s.id === updatedSession.id ? updatedSession : s
        ));
      }
      
      // Clear active quotation
      setActiveQuotation(null);
      
      if (transactionResult.metadata?.transactionData) {
        showSuccess('Transaction completed successfully!', 'Success');
      }
    } catch (error) {
      console.error('Error confirming transaction:', error);
      showError('Failed to complete transaction', 'Transaction Error');
    } finally {
      setIsAuthenticating(false);
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  /**
   * Handle quotation refresh
   */
  const handleQuotationRefresh = async (data: any) => {
    // Clear the expired quotation
    setActiveQuotation(null);
    
    // Send a new message to request a fresh quote
    if (data && data.toCurrency && data.amount) {
      const message = data.amountType === 'crypto' 
        ? `Buy ${data.amount} of ${data.toCurrency}`
        : `Buy ${data.amount} ${data.fromCurrency || 'USD'} worth of ${data.toCurrency}`;
      
      await sendMessage(message);
    } else {
      // Add a message asking for clarification
      const refreshMessage: ChatMessage = {
        id: `msg_${Date.now()}_refresh`,
        content: 'Please specify the amount and cryptocurrency you want to buy.',
        role: 'assistant',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, refreshMessage]);
    }
  };

  /**
   * Handle transaction cancellation
   */
  const handleTransactionCancellation = (sessionId: string) => {
    chatService.cancelQuotation(sessionId);
    setActiveQuotation(null);
    
    // Update the quotation message to show cancelled status - properly create a new message object
    setMessages(prev => {
      return prev.map(msg => {
        if (msg.type === 'quotation' && msg.metadata?.quotationData && 
            msg.metadata?.actionButtons?.some(btn => btn.data?.sessionId === sessionId)) {
          // Create a new message object with updated status
          return {
            ...msg,
            metadata: {
              ...msg.metadata,
              quotationData: {
                ...msg.metadata.quotationData,
                status: 'cancelled' as const
              }
            }
          };
        }
        return msg;
      });
    });
    
    // Add cancellation message
    const cancelMessage: ChatMessage = {
      id: `msg_${Date.now()}_cancel`,
      content: '❌ Transaction cancelled. Let me know if you need anything else!',
      role: 'assistant',
      timestamp: new Date(),
      type: 'text'
    };
    
    setMessages(prev => [...prev, cancelMessage]);
  };

  const refreshInsights = async () => {
    try {
      const context = await chatService.getUserContext();
      const newInsights = await chatService.generateFinancialInsights(context);
      
      // Merge with existing insights, avoiding duplicates
      const mergedInsights = [...insights];
      newInsights.forEach(newInsight => {
        const exists = mergedInsights.find(existing => 
          existing.type === newInsight.type && existing.title === newInsight.title
        );
        if (!exists) {
          mergedInsights.push(newInsight);
        }
      });

      // Keep only the most recent 10 insights
      const sortedInsights = mergedInsights
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10);

      setInsights(sortedInsights);
    } catch (error) {
      console.error('Error refreshing insights:', error);
    }
  };

  const value: ChatProviderContextType = {
    messages,
    isLoading,
    isTyping,
    currentSession,
    sessions,
    insights,
    suggestedQuestions,
    activeQuotation,
    isAuthenticating,
    sendMessage,
    clearChat,
    createNewSession,
    loadSession,
    deleteSession,
    refreshInsights,
    handleActionButton
  };

  return (
    <ChatProviderContext.Provider value={value}>
      {children}
    </ChatProviderContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatProviderContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}
