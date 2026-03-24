import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { Theme, darkTheme } from '@/types/theme';
import { OnboardingColors } from '@/constants/guidelineColors';
import { LoginBackground } from '@/components/LoginBackground';
import { useToast } from '@/contexts/ToastContext';
import { requestPasswordReset } from '@/services/authService';

const DIGIT_COUNT = 6;

const FIGMA = {
  inputBg: '#3F3F46',
  inputBgFocused: '#26272B',
  inputBorder: '#FFFFFF',
  textMuted: '#A0A0AB',
};

export default function ForgotPasswordCodeScreen() {
  const styles = createStyles(darkTheme);
  const { showError, showSuccess } = useToast();
  const { email } = useLocalSearchParams<{ email: string }>();

  const displayEmail = email || '';
  const [code, setCode] = useState<string[]>(Array(DIGIT_COUNT).fill(''));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const codeString = code.join('');

  useEffect(() => {
    if (!displayEmail) {
      router.replace('/(public)/forgot-password');
      return;
    }
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [displayEmail]);

  useEffect(() => {
    if (displayEmail && countdown === 0) {
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => (prev <= 1 ? (clearInterval(timer), 0) : prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [displayEmail]);

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < DIGIT_COUNT - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, e: { nativeEvent: { key: string } }) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = () => {
    if (codeString.length !== DIGIT_COUNT) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showError('Please enter the full 6-digit code');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push({
      pathname: '/(public)/forgot-password-new-password',
      params: { email: displayEmail, code: codeString },
    });
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    try {
      await requestPasswordReset(displayEmail);
      showSuccess('Code sent again');
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => (prev <= 1 ? (clearInterval(timer), 0) : prev - 1));
      }, 1000);
    } catch {
      showError('Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  if (!displayEmail) return null;

  return (
    <LoginBackground>
      <StatusBar barStyle="light-content" backgroundColor={OnboardingColors.statusBarBackground} />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={[
                styles.contentContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }, { translateX: shakeAnim }],
                },
              ]}
            >
              <View style={styles.mainContent}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => router.back()}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="arrow-back" size={24} color={OnboardingColors.title} />
                </TouchableOpacity>

                <View style={styles.headerSection}>
                  <Text style={styles.titleText}>Check your email</Text>
                  <Text style={styles.subtitleText}>
                    We sent a verification code to {displayEmail}
                  </Text>
                </View>

                <View style={styles.formSection}>
                  <View style={styles.inputRow}>
                    {[0, 1, 2].map((i) => (
                      <TextInput
                        key={`a-${i}`}
                        ref={(r) => { inputRefs.current[i] = r; }}
                        style={[styles.digitBox, focusedIndex === i && styles.digitBoxFocused]}
                        value={code[i]}
                        onChangeText={(v) => handleDigitChange(i, v)}
                        onKeyPress={(e) => handleKeyPress(i, e)}
                        onFocus={() => setFocusedIndex(i)}
                        onBlur={() => setFocusedIndex(null)}
                        keyboardType="number-pad"
                        maxLength={1}
                        placeholder="0"
                        placeholderTextColor={OnboardingColors.mutedText}
                      />
                    ))}
                    <Text style={styles.dash}>-</Text>
                    {[3, 4, 5].map((i) => (
                      <TextInput
                        key={`b-${i}`}
                        ref={(r) => { inputRefs.current[i] = r; }}
                        style={[styles.digitBox, focusedIndex === i && styles.digitBoxFocused]}
                        value={code[i]}
                        onChangeText={(v) => handleDigitChange(i, v)}
                        onKeyPress={(e) => handleKeyPress(i, e)}
                        onFocus={() => setFocusedIndex(i)}
                        onBlur={() => setFocusedIndex(null)}
                        keyboardType="number-pad"
                        maxLength={1}
                        placeholder="0"
                        placeholderTextColor={OnboardingColors.mutedText}
                      />
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.signInButton}
                    onPress={handleSubmit}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.signInText}>Continue</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.resendSection}>
                <Text style={styles.resendText}>Didn't receive the code?</Text>
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={countdown > 0 || isResending}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.resendLink,
                      (countdown > 0 || isResending) && styles.resendLinkDisabled,
                    ]}
                  >
                    {isResending ? 'Sending...' : countdown > 0 ? `Resend code (${countdown}s)` : 'Resend code'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LoginBackground>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1 },
    keyboardAvoidingView: { flex: 1 },
    scrollContent: {
      flexGrow: 1,
      paddingTop: 24,
      paddingBottom: 12,
    },
    contentContainer: {
      flex: 1,
      paddingHorizontal: 16,
      justifyContent: 'space-between',
      alignItems: 'stretch',
    },
    mainContent: { flexGrow: 1 },
    backButton: {
      alignSelf: 'flex-start',
      marginBottom: 24,
      padding: 4,
    },
    headerSection: {
      marginBottom: 32,
      gap: 12,
    },
    titleText: {
      fontFamily: 'StagnanRegular',
      fontSize: 28,
      fontWeight: '700',
      color: OnboardingColors.title,
      letterSpacing: 0.5,
    },
    subtitleText: {
      fontSize: 16,
      color: OnboardingColors.subtitle,
      fontWeight: '500',
      lineHeight: 20,
    },
    formSection: {
      width: '100%',
      maxWidth: 400,
      alignSelf: 'center',
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 32,
    },
    digitBox: {
      flex: 1,
      backgroundColor: FIGMA.inputBg,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 8,
      fontSize: 52,
      fontWeight: '500',
      color: OnboardingColors.title,
      textAlign: 'center',
      minHeight: 64,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    digitBoxFocused: {
      backgroundColor: FIGMA.inputBgFocused,
      borderColor: FIGMA.inputBorder,
    },
    dash: {
      fontSize: 60,
      fontWeight: '500',
      color: FIGMA.textMuted,
      marginHorizontal: 2,
    },
    signInButton: {
      width: '100%',
      height: 56,
      paddingHorizontal: 32,
      borderRadius: 8,
      backgroundColor: OnboardingColors.buttonPrimaryBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    signInText: {
      fontSize: 16,
      fontWeight: '600',
      color: OnboardingColors.buttonPrimaryText,
      letterSpacing: 0.5,
    },
    resendSection: {
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingBottom: 12,
    },
    resendText: {
      fontSize: 14,
      lineHeight: 20,
      color: OnboardingColors.mutedText,
      fontWeight: '500',
    },
    resendLink: {
      fontSize: 14,
      lineHeight: 20,
      color: OnboardingColors.primaryText,
      fontWeight: '600',
    },
    resendLinkDisabled: {
      color: OnboardingColors.mutedText,
    },
  });
