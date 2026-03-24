import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../types/theme';
import voiceService, { VoiceServiceCallbacks } from '../services/voiceService';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  suggestedQuestions?: string[];
  onSuggestedQuestionPress?: (question: string) => void;
  placeholder?: string;
}

export default function ChatInput({
  onSendMessage,
  isLoading = false,
  suggestedQuestions = [],
  onSuggestedQuestionPress,
  placeholder = "Ask me about your finances..."
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  
  const inputRef = useRef<TextInput>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Voice service callbacks
  const voiceCallbacks: VoiceServiceCallbacks = {
    onSpeechStart: () => {
      console.log('Speech started');
      setIsRecording(true);
      setVoiceError(null);
      setMessage(''); // Clear existing text when starting new recording
      startPulseAnimation();
    },
    onSpeechEnd: () => {
      console.log('Speech ended');
      setIsRecording(false);
      stopPulseAnimation();
    },
    onSpeechResults: (results: string[]) => {
      console.log('Speech results:', results);
      if (results && results.length > 0) {
        const recognizedText = results[0];
        setMessage(recognizedText);
        setIsRecording(false);
        stopPulseAnimation();
      }
    },
    onSpeechError: (error: any) => {
      console.log('Speech error:', error);
      setIsRecording(false);
      stopPulseAnimation();
      
      // Handle different error types
      let errorMessage = 'Voice recognition failed. Please try again.';
      if (error?.code === '7') {
        errorMessage = 'No speech detected. Please try speaking again.';
      } else if (error?.code === '6') {
        errorMessage = 'Speech recognition service is not available.';
      }
      
      setVoiceError(errorMessage);
      setTimeout(() => setVoiceError(null), 3000);
    },
    onSpeechPartialResults: (results: string[]) => {
      // Optionally show partial results in real-time
      if (results && results.length > 0) {
        console.log('Partial results:', results[0]);
      }
    },
  };

  useEffect(() => {
    // Set up voice service callbacks
    voiceService.setCallbacks(voiceCallbacks);
    
    // Cleanup on unmount
    return () => {
      voiceService.cancelListening();
    };
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
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

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestedQuestionPress = (question: string) => {
    if (onSuggestedQuestionPress) {
      onSuggestedQuestionPress(question);
    } else {
      onSendMessage(question);
    }
    setShowSuggestions(false);
  };

  const handleInputFocus = () => {
    setShowSuggestions(false);
  };

  const handleInputBlur = () => {
    // Show suggestions again if input is empty
    if (!message.trim()) {
      setTimeout(() => setShowSuggestions(true), 100);
    }
  };

  const handleVoicePress = async () => {
    if (isRecording) {
      // Stop recording
      await voiceService.stopListening();
    } else {
      // Start recording
      setShowSuggestions(false);
      const success = await voiceService.startListening();
      if (!success) {
        setVoiceError('Failed to start voice recognition');
        setTimeout(() => setVoiceError(null), 3000);
      }
    }
  };

  const renderSuggestedQuestions = () => {
    if (!showSuggestions || suggestedQuestions.length === 0 || message.trim()) {
      return null;
    }

    return (
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>Suggested questions:</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionsScrollContent}
        >
          {suggestedQuestions.map((question, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionChip}
              onPress={() => handleSuggestedQuestionPress(question)}
            >
              <Text style={styles.suggestionText}>{question}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {renderSuggestedQuestions()}
      
      <View style={styles.inputContainer}>
        {/* Voice Error Message */}
        {voiceError && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={16} color="#FF3B30" />
            <Text style={styles.errorText}>{voiceError}</Text>
          </View>
        )}
        
        <View style={styles.inputWrapper}>
          {/* Voice Button */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[
                styles.voiceButton,
                isRecording && styles.voiceButtonRecording,
                isLoading && styles.voiceButtonDisabled
              ]}
              onPress={handleVoicePress}
              disabled={isLoading}
            >
              <Ionicons 
                name={isRecording ? "stop" : "mic"} 
                size={20} 
                color={isRecording ? "#FFFFFF" : theme.colors.accent} 
              />
            </TouchableOpacity>
          </Animated.View>
          
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            value={message}
            onChangeText={setMessage}
            placeholder={isRecording ? "Listening..." : placeholder}
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            maxLength={1000}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            editable={!isLoading && !isRecording}
          />
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!message.trim() || isLoading) && styles.sendButtonDisabled
            ]}
            onPress={handleSend}
            disabled={!message.trim() || isLoading}
          >
            {isLoading ? (
              <Ionicons name="hourglass-outline" size={20} color={theme.colors.textSecondary} />
            ) : (
              <Ionicons 
                name="send" 
                size={20} 
                color={message.trim() ? '#FFFFFF' : theme.colors.textSecondary} 
              />
            )}
          </TouchableOpacity>
        </View>
        
        {/* Recording Status */}
        {isRecording && (
          <View style={styles.recordingStatus}>
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
            </View>
            <Text style={styles.recordingText}>Listening... Tap microphone to stop</Text>
          </View>
        )}
        
        {/* Character count */}
        {message.length > 800 && (
          <Text style={styles.characterCount}>
            {message.length}/1000
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  suggestionsScrollContent: {
    paddingRight: 16,
  },
  suggestionChip: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  suggestionText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    maxHeight: 120,
    paddingVertical: 8,
    paddingRight: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.surfaceSecondary,
  },
  characterCount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginLeft: 8,
    flex: 1,
  },
  voiceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  voiceButtonRecording: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  voiceButtonDisabled: {
    opacity: 0.5,
    borderColor: theme.colors.surfaceSecondary,
  },
  recordingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  recordingIndicator: {
    marginRight: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  recordingText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
});
