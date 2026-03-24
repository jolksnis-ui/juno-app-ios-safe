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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Theme, darkTheme } from '@/types/theme';
import { OnboardingColors } from '@/constants/guidelineColors';
import { FloatingLabelInput } from '@/components/FloatingLabelInput';
import { LoginBackground } from '@/components/LoginBackground';
import { useToast } from '@/contexts/ToastContext';
import { requestPasswordReset } from '@/services/authService';

export default function ForgotPasswordScreen() {
  const styles = createStyles(darkTheme);
  const { showError, showSuccess } = useToast();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
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

  const handleContinue = async () => {
    if (!validateEmail(email)) {
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await requestPasswordReset(email);
      showSuccess('Check your email for reset instructions');
      router.push({
        pathname: '/(public)/forgot-password-code',
        params: { email },
      });
    } catch {
      showError('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
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
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => router.canGoBack() ? router.back() : undefined}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="arrow-back" size={24} color={OnboardingColors.title} />
                </TouchableOpacity>

                <View style={styles.welcomeSection}>
                  <Text style={styles.welcomeText}>Forgot password</Text>
                  <Text style={styles.subWelcomeText}>
                    Enter your email address and we'll send you instructions to reset your password.
                  </Text>
                </View>

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

                  <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                    <TouchableOpacity
                      style={styles.signInButton}
                      onPress={handleContinue}
                      disabled={isLoading}
                      activeOpacity={0.8}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color={OnboardingColors.buttonPrimaryText} />
                      ) : (
                        <Text style={styles.signInText}>Send reset link</Text>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </View>

              <View style={styles.signUpSection}>
                <Text style={styles.signUpText}>Remember your password?</Text>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.signUpLink}>Sign in</Text>
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
    signInButton: {
      width: '100%',
      height: 56,
      marginTop: 24,
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
