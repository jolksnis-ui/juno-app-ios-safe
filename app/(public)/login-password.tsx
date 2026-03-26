import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HugeiconsUserIcon, MdiEditOutlineIcon } from '@/components/icons/LoginIcons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthContext } from '@/contexts/AuthContext';
import { Theme, darkTheme } from '@/types/theme';
import { OnboardingColors } from '@/constants/guidelineColors';
import { FloatingLabelInput } from '@/components/FloatingLabelInput';
import { LoginBackground } from '@/components/LoginBackground';
import { useToast } from '@/contexts/ToastContext';

export default function LoginPasswordScreen() {
  const styles = createStyles(darkTheme);
  const { login } = useAuthContext();
  const { showError } = useToast();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const displayEmail = email || '';

  useEffect(() => {
    if (!displayEmail) {
      router.replace('/(public)/login');
      return;
    }
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [displayEmail]);

  const validatePassword = (val: string): boolean => {
    if (!val) {
      setPasswordError('Password is required');
      return false;
    }
    if (val.length < 4) {
      setPasswordError('Password must be at least 4 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleLogin = async () => {
    if (!displayEmail) return;
    if (!validatePassword(password)) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    try {
      await login({ email: displayEmail, password });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditEmail = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
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
              {/* Back Button */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="arrow-back" size={24} color={OnboardingColors.title} />
              </TouchableOpacity>

              {/* Header - Figma: Enter Password */}
              <View style={styles.headerSection}>
                <Text style={styles.titleText}>Enter Password</Text>
                <Text style={styles.subtitleText}>
                  Use your account password to continue.
                </Text>
              </View>

              {/* Form Section - Figma style */}
              <View style={styles.formSection}>
                {/* Email display row - Figma Component 82 */}
                <TouchableOpacity
                  style={styles.emailDisplayRow}
                  onPress={handleEditEmail}
                  activeOpacity={0.8}
                >
                  <View style={styles.emailIconCircle}>
                    <HugeiconsUserIcon size={22} color={OnboardingColors.title} />
                  </View>
                  <View style={styles.emailTextFrame}>
                    <Text style={styles.emailText} numberOfLines={1}>
                      {displayEmail}
                    </Text>
                  </View>
                  <MdiEditOutlineIcon size={24} color="#E4E4E7" />
                </TouchableOpacity>

                {/* Password input */}
                <FloatingLabelInput
                  label="Password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) validatePassword(text);
                  }}
                  error={passwordError}
                  isPassword
                  autoComplete="password"
                  textContentType="password"
                  forceDarkTheme={true}
                />

                {/* Remember 30 days & Forgot password - Figma */}
                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    style={styles.rememberMe}
                    onPress={() => {
                      setRememberMe(!rememberMe);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                      {rememberMe && <Ionicons name="checkmark" size={12} color={OnboardingColors.buttonPrimaryText} />}
                    </View>
                    <Text style={styles.rememberText}>Remember 30 days</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => router.push('/(public)/forgot-password')}>
                    <Text style={styles.forgotText}>Forgot password</Text>
                  </TouchableOpacity>
                </View>

                {/* LOG IN Button - Figma: white bg, height 56 */}
                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                  <TouchableOpacity
                    style={styles.signInButton}
                    onPress={handleLogin}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color={OnboardingColors.buttonPrimaryText} />
                    ) : (
                      <Text style={styles.signInText}>Sign in</Text>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </View>
              </View>

              {/* Sign Up Link - pinned to bottom */}
              <View style={styles.signUpSection}>
                <Text style={styles.signUpText}>Don't have an account?</Text>
                <TouchableOpacity onPress={() => router.push('/(public)/signup-account-type')}>
                  <Text style={styles.signUpLink}>Sign up</Text>
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
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
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
  titleText: {
    fontFamily: 'Inter',
    fontSize: 28,
    fontWeight: '600',
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
  emailDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: 16,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 16,
    marginBottom: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: OnboardingColors.border,
  },
  emailIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: OnboardingColors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailTextFrame: {
    flex: 1,
    justifyContent: 'center',
  },
  emailText: {
    fontSize: 16,
    color: OnboardingColors.primaryText,
    fontWeight: '500',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: OnboardingColors.checkboxBorder,
    backgroundColor: OnboardingColors.checkboxBackground,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: OnboardingColors.checkboxChecked,
    borderColor: OnboardingColors.checkboxChecked,
  },
  rememberText: {
    fontSize: 14,
    color: OnboardingColors.secondaryText,
    fontWeight: '500',
  },
  forgotText: {
    fontSize: 14,
    color: OnboardingColors.primaryText,
    fontWeight: '600',
  },
  signInButton: {
    width: '100%',
    height: 56,
    marginBottom: 24,
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
  signUpSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingBottom: 12,
  },
  signUpText: {
    fontSize: 14,
    color: OnboardingColors.mutedText,
    fontWeight: '500',
  },
  signUpLink: {
    fontSize: 14,
    color: OnboardingColors.primaryText,
    fontWeight: '600',
  },
});
