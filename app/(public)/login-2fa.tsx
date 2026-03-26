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
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useAuthContext } from '@/contexts/AuthContext';
import { Theme, darkTheme } from '@/types/theme';
import { OnboardingColors } from '@/constants/guidelineColors';
import { LoginBackground } from '@/components/LoginBackground';
import { useToast } from '@/contexts/ToastContext';

const DIGIT_COUNT = 6;

export default function Login2FAScreen() {
  const styles = createStyles(darkTheme);
  const { showError, showSuccess } = useToast();
  const { user } = useAuthContext();

  const [code, setCode] = useState<string[]>(() => Array(DIGIT_COUNT).fill(''));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const codeString = code.join('');

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

  const handleVerify = async () => {
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
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    try {
      // Placeholder: 2FA verification will be wired when API is ready
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSuccess(`Welcome back, ${user?.name ?? 'User'}!`);
      router.replace('/(auth)/dashboard');
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecoveryCode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showError('Recovery code flow coming soon');
  };

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
                  <Text style={styles.titleText}>Two-factor authentication</Text>
                  <Text style={styles.subtitleText}>
                    Enter the 6-digit code from your authenticator app to continue.
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

                  <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                    <TouchableOpacity
                      style={styles.verifyButton}
                      onPress={handleVerify}
                      disabled={isLoading}
                      activeOpacity={0.8}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color={OnboardingColors.buttonPrimaryText} />
                      ) : (
                        <Text style={styles.verifyButtonText}>Verify code</Text>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </View>

              <View style={styles.recoverySection}>
                <Text style={styles.recoveryLabel}>Can't access your authenticator app?</Text>
                <TouchableOpacity onPress={handleRecoveryCode} activeOpacity={0.7}>
                  <Text style={styles.recoveryLink}>Use a recovery code instead</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LoginBackground>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoidingView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 24,
    paddingBottom: 12,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'stretch',
  },
  mainContent: {
    flexGrow: 1,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 24,
    padding: 4,
  },
  headerSection: {
    marginBottom: 32,
    gap: 12,
  },
  // Title — 28, Semibold
  titleText: {
    fontFamily: 'Inter',
    fontSize: 28,
    fontWeight: '600',
    color: OnboardingColors.title,
    letterSpacing: 0.5,
  },
  // Subtitle — 16, Medium
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
  // Code digit input — 52, Medium
  digitBox: {
    flex: 1,
    backgroundColor: OnboardingColors.surfaceSecondary,
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
    backgroundColor: OnboardingColors.inputBackground,
    borderColor: OnboardingColors.title,
  },
  // Code separator dash — 60, Medium
  dash: {
    fontSize: 60,
    fontWeight: '500',
    color: OnboardingColors.mutedText,
    marginHorizontal: 2,
  },
  verifyButton: {
    width: '100%',
    height: 56,
    paddingHorizontal: 32,
    borderRadius: 8,
    backgroundColor: OnboardingColors.buttonPrimaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Primary button — 16, Semibold
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: OnboardingColors.buttonPrimaryText,
    letterSpacing: 0.5,

    fontFamily: 'StagnanMedium',

  },
  recoverySection: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 24,
    paddingBottom: 12,
  },
  // Recovery label — 14, Medium
  recoveryLabel: {
    fontSize: 14,
    color: OnboardingColors.mutedText,
    fontWeight: '500',
  },
  // Recovery link — 14, Semibold
  recoveryLink: {
    fontSize: 14,
    color: OnboardingColors.primaryText,
    fontWeight: '600',
  },
});
