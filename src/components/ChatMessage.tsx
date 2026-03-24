import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ChatMessage as ChatMessageType, ChatActionButton } from '../types/chat';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../types/theme';
import elevenLabsService, { TTSCallbacks } from '../services/elevenLabsService';
import { QuotationBubble } from './chat/QuotationBubble';
import { useChatContext } from '../contexts/ChatContext';

interface ChatMessageProps {
  message: ChatMessageType;
  onActionPress?: (action: ChatActionButton) => void;
}

export default function ChatMessage({ message, onActionPress }: ChatMessageProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { isAuthenticating } = useChatContext();
  
  // TTS state
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const pulseAnim = useState(new Animated.Value(1))[0];

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  // TTS callbacks
  const ttsCallbacks: TTSCallbacks = {
    onStart: () => {
      setTtsError(null);
    },
    onLoading: (loading: boolean) => {
      setIsLoading(loading);
      if (loading) {
        startPulseAnimation();
      } else {
        stopPulseAnimation();
      }
    },
    onSpeaking: (speaking: boolean) => {
      setIsSpeaking(speaking);
      if (speaking) {
        startPulseAnimation();
      } else {
        stopPulseAnimation();
      }
    },
    onError: (error: string) => {
      setTtsError(error);
      setIsLoading(false);
      setIsSpeaking(false);
      stopPulseAnimation();
      // Clear error after 3 seconds
      setTimeout(() => setTtsError(null), 3000);
    },
    onComplete: () => {
      setIsSpeaking(false);
      setIsLoading(false);
      stopPulseAnimation();
    },
  };

  useEffect(() => {
    // Set up TTS callbacks for this message
    elevenLabsService.setCallbacks(ttsCallbacks);
    
    return () => {
      // Cleanup if component unmounts
      if (isSpeaking || isLoading) {
        elevenLabsService.stopCurrentAudio();
      }
    };
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleSpeakPress = async () => {
    if (isSpeaking || isLoading) {
      // Stop current audio
      await elevenLabsService.stopCurrentAudio();
    } else {
      // Start speaking
      await elevenLabsService.speak(message.content);
    }
  };

  const handleActionPress = (action: ChatActionButton) => {
    if (onActionPress) {
      onActionPress(action);
    } else {
      // Default action handling
      switch (action.action) {
        case 'navigate':
          if (action.data?.screen) {
            router.push(action.data.screen);
          }
          break;
        case 'copy':
          // Handle copy action if needed
          break;
        case 'execute':
          // Handle execute action if needed
          break;
      }
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return timestamp.toLocaleDateString();
  };

  const getMessageIcon = () => {
    switch (message.type) {
      case 'balance':
        return 'wallet-outline';
      case 'transaction':
        return 'swap-horizontal-outline';
      case 'insight':
        return 'analytics-outline';
      default:
        return null;
    }
  };

  const renderActionButtons = () => {
    if (!message.metadata?.actionButtons || message.metadata.actionButtons.length === 0) {
      return null;
    }

    // console.log('Rendering action buttons:', JSON.stringify(message.metadata.actionButtons, null, 2));

    return (
      <View style={styles.actionButtonsContainer}>
        {message.metadata.actionButtons.map((action, index) => {
          const buttonText = String(action.label || `Button ${index + 1}`).trim();
          // console.log(`Button ${index}:`, action.label, 'Rendered as:', buttonText);
          return (
            <TouchableOpacity
              key={action.id || `button-${index}`}
              style={styles.actionButton}
              onPress={() => handleActionPress(action)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText} numberOfLines={1}>
                {buttonText}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.accent} />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      <View style={[styles.messageWrapper, isUser ? styles.userWrapper : styles.assistantWrapper]}>
        {/* Message Header */}
        {isAssistant && (
          <View style={styles.messageHeader}>
            <View style={styles.avatarContainer}>
              <Ionicons name="chatbubble-ellipses" size={16} color={theme.colors.accent} />
            </View>
            <Text style={styles.senderName}>Juno AI</Text>
            {getMessageIcon() && (
              <Ionicons 
                name={getMessageIcon() as any} 
                size={14} 
                color={theme.colors.textSecondary} 
                style={styles.messageTypeIcon}
              />
            )}
          </View>
        )}

        {/* Message Content */}
        {message.type === 'quotation' && message.metadata?.quotationData ? (
          // Render QuotationBubble for quotation messages
          <QuotationBubble
            quotation={message.metadata.quotationData}
            onConfirm={() => {
              const confirmButton = message.metadata?.actionButtons?.find(b => b.action === 'confirm_transaction');
              if (confirmButton && onActionPress) {
                onActionPress(confirmButton);
              }
            }}
            onCancel={() => {
              const cancelButton = message.metadata?.actionButtons?.find(b => b.action === 'cancel_transaction');
              if (cancelButton && onActionPress) {
                onActionPress(cancelButton);
              }
            }}
            onRefresh={() => {
              // Find refresh button or create a new action for refreshing quotation
              const refreshButton = message.metadata?.actionButtons?.find(b => b.action === 'refresh_quotation');
              if (refreshButton && onActionPress) {
                onActionPress(refreshButton);
              } else if (onActionPress) {
                // Create a refresh action on the fly
                onActionPress({
                  id: 'refresh_quote',
                  label: 'Refresh Quote',
                  action: 'refresh_quotation',
                  data: message.metadata?.transactionIntent
                });
              }
            }}
            isAuthenticating={isAuthenticating}
          />
        ) : (
          // Regular message bubble
          <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
            <View style={styles.messageContentWrapper}>
              <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
                {message.content}
              </Text>
            
            {/* Speaker Button for Assistant Messages */}
            {isAssistant && (
              <Animated.View style={[styles.speakerButtonContainer, { transform: [{ scale: pulseAnim }] }]}>
                <TouchableOpacity
                  style={[
                    styles.speakerButton,
                    (isSpeaking || isLoading) && styles.speakerButtonActive
                  ]}
                  onPress={handleSpeakPress}
                  disabled={false}
                >
                  <Ionicons 
                    name={
                      isLoading ? "hourglass-outline" :
                      isSpeaking ? "stop" : 
                      "volume-high-outline"
                    } 
                    size={16} 
                    color={
                      (isSpeaking || isLoading) ? "#FFFFFF" : theme.colors.accent
                    } 
                  />
                </TouchableOpacity>
              </Animated.View>
            )}
            </View>
            
            {/* Timestamp */}
            <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.assistantTimestamp]}>
              {formatTimestamp(message.timestamp)}
            </Text>
          </View>
        )}

        {/* TTS Error Message */}
        {isAssistant && ttsError && (
          <View style={styles.ttsErrorContainer}>
            <Ionicons name="warning-outline" size={14} color="#FF3B30" />
            <Text style={styles.ttsErrorText}>{ttsError}</Text>
          </View>
        )}

        {/* TTS Status Indicator */}
        {isAssistant && (isSpeaking || isLoading) && (
          <View style={styles.ttsStatusContainer}>
            <View style={styles.ttsStatusIndicator}>
              <View style={[styles.ttsStatusDot, (isSpeaking || isLoading) && styles.ttsStatusDotActive]} />
            </View>
            <Text style={styles.ttsStatusText}>
              {isLoading ? "Generating speech..." : "Speaking..."}
            </Text>
          </View>
        )}

        {/* Action Buttons - Only show for non-quotation messages */}
        {isAssistant && message.type !== 'quotation' && renderActionButtons()}
        
        {/* Debug Test Button
        {isAssistant && (
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Test Button</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.accent} />
          </TouchableOpacity>
        )} */}
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  messageWrapper: {
    maxWidth: '85%',
  },
  userWrapper: {
    alignItems: 'flex-end',
  },
  assistantWrapper: {
    alignItems: 'flex-start',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  avatarContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  messageTypeIcon: {
    marginLeft: 6,
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 60,
  },
  userBubble: {
    backgroundColor: theme.colors.accent,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: theme.colors.text,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 6,
    opacity: 0.7,
  },
  userTimestamp: {
    color: '#FFFFFF',
    textAlign: 'right',
  },
  assistantTimestamp: {
    color: theme.colors.textSecondary,
  },
  actionButtonsContainer: {
    marginTop: 6,
    gap: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    minHeight: 48,
    shadowColor: theme.colors.accent,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.accent,
    // flex: 1,
    textAlign: 'left',
    marginRight: 8,
    backgroundColor: 'transparent',
    includeFontPadding: false,
  },
  messageContentWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  speakerButtonContainer: {
    marginLeft: 8,
    marginTop: 2,
  },
  speakerButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.accent,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  speakerButtonActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  ttsErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 0,
    marginTop: 0,
    alignSelf: 'flex-start',
  },
  ttsErrorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginLeft: 6,
    flex: 1,
  },
  ttsStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 0,
    marginTop: 0,
  },
  ttsStatusIndicator: {
    marginRight: 6,
  },
  ttsStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.textSecondary,
  },
  ttsStatusDotActive: {
    backgroundColor: theme.colors.accent,
  },
  ttsStatusText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
});
