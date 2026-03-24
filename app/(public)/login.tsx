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
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Theme, darkTheme } from '@/types/theme';
import { OnboardingColors } from '@/constants/guidelineColors';
import { FloatingLabelInput } from '@/components/FloatingLabelInput';
import { LoginBackground } from '@/components/LoginBackground';
import { useToast } from '@/contexts/ToastContext';

export default function LoginScreen() {
  // Always use dark theme for login screen
  const styles = createStyles(darkTheme);
  const { showError, showSuccess } = useToast();

  // Form state
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      ]).start();

    // Check biometric availability
  }, []);

  const validateEmail = (val: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(val)) {
      setEmailError('Invalid email format');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleContinue = () => {
    const isEmailValid = validateEmail(email);
    if (!isEmailValid) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/(public)/login-password', params: { email } });
  };

  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to login',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        showSuccess('Biometric authentication successful');
        showError('Please enter your credentials for first-time setup');
      }
    } catch {
      showError('Biometric authentication failed');
    }
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
                  transform: [
                    { translateY: slideAnim },
                    { scale: scaleAnim },
                    { translateX: shakeAnim },
                  ],
                },
              ]}
            >
              <View style={styles.mainContent}>
              {/* Back Button */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.canGoBack() ? router.back() : undefined}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="arrow-back" size={24} color={OnboardingColors.title} />
              </TouchableOpacity>

              {/* Welcome Section - Figma design */}
              <View style={styles.welcomeSection}>
                <Text style={styles.welcomeText}>Welcome Back</Text>
                <Text style={styles.subWelcomeText}>
                  Sign in with your email or use your passkey for a quick login.
                </Text>
              </View>

              {/* Form Section - Email only */}
              <View style={styles.formSection}>
                <FloatingLabelInput
                  label="Email"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) validateEmail(text);
                  }}
                  error={emailError}
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  forceDarkTheme={true}
                />

                {/* Sign In Button - Figma: white bg, dark text */}
                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                  <TouchableOpacity
                    style={styles.signInButton}
                    onPress={handleContinue}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.signInText}>Sign in</Text>
                  </TouchableOpacity>
                </Animated.View>

                {/* Divider + Passkey - Figma Juno Bio Auth flows */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.alternativeButtons}>
                  <TouchableOpacity
                    style={styles.passkeyButton}
                    onPress={() => showError('Passkey login coming soon')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="key-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.passkeyText}>Log in with passkey</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.passkeyButton}
                    onPress={handleBiometricLogin}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="finger-print" size={20} color="#FFFFFF" />
                    <Text style={styles.passkeyText}>Log in with biometric</Text>
                  </TouchableOpacity>
                </View>
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
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
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
  welcomeSection: {
    alignItems: 'stretch',
    marginBottom: 32,
    gap: 12,
  },
  welcomeText: {
    fontFamily: 'StagnanRegular',
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
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: OnboardingColors.checkboxBorder,
    marginRight: 8,
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#51525C',
  },
  dividerText: {
    fontSize: 12,
    color: '#D1D1D6',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  alternativeButtons: {
    gap: 16,
  },
  passkeyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#51525C',
    backgroundColor: 'transparent',
    gap: 8,
  },
  passkeyText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'none',
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