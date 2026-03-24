import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../types/theme';
import { useChatContext } from '../contexts/ChatContext';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import { ChatMessage as ChatMessageType, ChatActionButton } from '../types/chat';
import { elevenLabsService } from '../services/elevenLabsService';

interface ChatScreenProps {
  onBack?: () => void;
}

export default function ChatScreen({ onBack }: ChatScreenProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const flatListRef = useRef<FlatList>(null);
  
  const {
    messages,
    isLoading,
    isTyping,
    currentSession,
    suggestedQuestions,
    sendMessage,
    clearChat,
    createNewSession,
    handleActionButton,
  } = useChatContext();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Handle audio pause/resume based on screen focus
  useFocusEffect(
    useCallback(() => {
      // Screen is focused - resume audio if it was paused
      if (elevenLabsService.isPausedState()) {
        elevenLabsService.resume();
      }

      return () => {
        // Screen is losing focus - pause audio if playing
        if (elevenLabsService.isCurrentlySpeaking() && !elevenLabsService.isPausedState()) {
          elevenLabsService.pause();
        }
      };
    }, [])
  );

  const handleSendMessage = async (message: string) => {
    await sendMessage(message);
  };

  const handleActionPress = async (action: ChatActionButton) => {
    // Use the handleActionButton from context for transaction actions
    if (action.action === 'confirm_transaction' || 
        action.action === 'cancel_transaction' || 
        action.action === 'refresh_quotation') {
      await handleActionButton(action.action, action.data);
      return;
    }
    
    // Handle other actions locally
    switch (action.action) {
      case 'navigate':
        if (action.data?.screen) {
          router.push(action.data.screen);
        }
        break;
      case 'copy':
        // Handle copy functionality if needed
        break;
      case 'execute':
        await handleActionButton(action.action, action.data);
        break;
    }
  };

  const handleClearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: clearChat,
        },
      ]
    );
  };

  const handleNewChat = () => {
    createNewSession();
  };

  const renderMessage = ({ item }: { item: ChatMessageType }) => (
    <ChatMessage message={item} onActionPress={handleActionPress} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIcon}>
        <Ionicons name="chatbubble-ellipses-outline" size={48} color={theme.colors.textSecondary} />
      </View>
      <Text style={styles.emptyStateTitle}>Welcome to Juno AI</Text>
      <Text style={styles.emptyStateSubtitle}>
        Your intelligent financial assistant is here to help you manage your portfolio, 
        understand transactions, and make informed investment decisions.
      </Text>
      <View style={styles.emptyStateFeatures}>
        <View style={styles.featureItem}>
          <Ionicons name="wallet-outline" size={20} color={theme.colors.accent} />
          <Text style={styles.featureText}>Check balances & portfolio</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="analytics-outline" size={20} color={theme.colors.accent} />
          <Text style={styles.featureText}>Get financial insights</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="help-circle-outline" size={20} color={theme.colors.accent} />
          <Text style={styles.featureText}>Learn about crypto & finance</Text>
        </View>
      </View>
    </View>
  );

  const renderTypingIndicator = () => {
    if (!isTyping) return null;

    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingBubble}>
          <View style={styles.typingDots}>
            <View style={[styles.typingDot, styles.typingDot1]} />
            <View style={[styles.typingDot, styles.typingDot2]} />
            <View style={[styles.typingDot, styles.typingDot3]} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onBack || (() => router.back())}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Juno AI</Text>
          <Text style={styles.headerSubtitle}>
            {currentSession?.title || 'Financial Assistant'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleNewChat}>
            <Ionicons name="add" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          
          {messages.length > 0 && (
            <TouchableOpacity style={styles.headerButton} onPress={handleClearChat}>
              <Ionicons name="trash-outline" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Messages */}
      <View style={styles.messagesContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.messagesList,
            messages.length === 0 && styles.emptyMessagesList
          ]}
          ListEmptyComponent={renderEmptyState}
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
        />
        
        {renderTypingIndicator()}
      </View>

      {/* Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        suggestedQuestions={messages.length === 0 ? suggestedQuestions : []}
        placeholder="Ask me about your finances..."
      />
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  headerButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    paddingVertical: 16,
  },
  emptyMessagesList: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyStateFeatures: {
    alignSelf: 'stretch',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  featureText: {
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 12,
    fontWeight: '500',
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingBubble: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.textSecondary,
    marginHorizontal: 2,
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.7,
  },
  typingDot3: {
    opacity: 1,
  },
});
