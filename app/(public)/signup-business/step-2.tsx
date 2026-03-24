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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useSignupContext } from '@/contexts/SignupContext';
import { useToast } from '@/contexts/ToastContext';
import { OnboardingColors } from '@/constants/guidelineColors';

// Same structure as Business details (step-1): header = back on top, then progress row below, same padding/gap
const FIGMA = {
  backgroundGradient: ['#26272B', '#18181B'] as const,
  textPrimary: '#FFFFFF',
  textLabel: '#D1D1D6',
  textMuted: '#A0A0AB',
  inputBg: '#3F3F46',
  inputBgFocused: '#26272B',
  inputBorder: '#FFFFFF',
  buttonBg: '#FFFFFF',
  buttonText: '#18181B',
  dotActive: '#FFFFFF',
  dotInactive: '#3F3F46',
};

const DIGIT_COUNT = 6;

export default function BusinessEmailVerificationStep() {
  const { state, updateBusinessData, nextStep, previousStep } = useSignupContext();
  const { showError } = useToast();
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [code, setCode] = useState(() => {
    const s = (state.businessData.verificationCode ?? '').split('').slice(0, DIGIT_COUNT);
    return [...s, ...Array(DIGIT_COUNT).fill('')].slice(0, DIGIT_COUNT) as string[];
  });
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const codeString = code.join('');
  const email = state.businessData.email || 'your business email address';

  useEffect(() => {
    updateBusinessData({ verificationCode: codeString });
  }, [codeString]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

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

  const handleSubmit = async () => {
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
    setIsLoading(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await new Promise((r) => setTimeout(r, 200));
      nextStep();
      router.push('/(public)/signup-business/step-3');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    try {
      await new Promise((r) => setTimeout(r, 200));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => (prev <= 1 ? (clearInterval(timer), 0) : prev - 1));
      }, 1000);
    } catch {
      Alert.alert('Error', 'Failed to resend code.');
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    if (state.businessData.email && countdown === 0) {
      const t = 60;
      setCountdown(t);
      const timer = setInterval(() => {
        setCountdown((prev) => (prev <= 1 ? (clearInterval(timer), 0) : prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, []);

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    previousStep();
    router.back();
  };

  return (
    <View style={styles.wrapper}>
      <LinearGradient colors={FIGMA.backgroundGradient} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.mainContent}>
              <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButton} activeOpacity={0.7} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
                  <Ionicons name="arrow-back" size={24} color={OnboardingColors.title} />
                </TouchableOpacity>
                <View style={styles.dotsRow}>
                  {[1, 2, 3, 4, 5, 6].map((step) => (
                    <View key={step} style={[styles.dot, step <= 2 ? styles.dotActive : styles.dotInactive]} />
                  ))}
                </View>
                <View style={styles.titleBlock}>
                  <Text style={styles.welcomeText}>Verify business email</Text>
                  <Text style={styles.subWelcomeText}>We sent it to {email}.</Text>
                </View>
              </Animated.View>

              <Animated.View style={[styles.formSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { translateX: shakeAnim }] }]}>
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
                  style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={OnboardingColors.buttonPrimaryText} />
                  ) : (
                    <Text style={styles.submitText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>

            <Animated.View style={[styles.resendSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <Text style={styles.resendSectionLabel}>Didn't receive the code?</Text>
              <TouchableOpacity
                onPress={handleResend}
                disabled={countdown > 0 || isResending}
                activeOpacity={0.7}
              >
                <Text style={[styles.resendSectionLink, (countdown > 0 || isResending) && styles.resendSectionLinkDisabled]}>
                  {isResending ? 'Sending...' : countdown > 0 ? `Resend code (${countdown}s)` : 'Resend code'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { flex: 1 },
  backButton: { padding: 4 },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'stretch',
  },
  dot: {
    flex: 1,
    height: 4,
    borderRadius: 99,
  },
  dotActive: { backgroundColor: FIGMA.dotActive },
  dotInactive: { backgroundColor: FIGMA.dotInactive },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },
  mainContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 24,
    paddingBottom: 24,
    gap: 24,
    alignSelf: 'stretch',
  },
  titleBlock: {
    gap: 12,
    alignSelf: 'stretch',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: OnboardingColors.title,
    letterSpacing: 0.5,
  },
  subWelcomeText: {
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
    marginBottom: 30,
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
  submitButton: {
    width: '100%',
    height: 56,
    marginBottom: 24,
    paddingHorizontal: 32,
    borderRadius: 8,
    backgroundColor: OnboardingColors.buttonPrimaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
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
  resendSectionLabel: {
    fontSize: 14,
    lineHeight: 20,
    color: OnboardingColors.mutedText,
    fontWeight: '500',
  },
  resendSectionLink: {
    fontSize: 14,
    lineHeight: 20,
    color: OnboardingColors.primaryText,
    fontWeight: '600',
  },
  resendSectionLinkDisabled: {
    color: OnboardingColors.mutedText,
  },
});
