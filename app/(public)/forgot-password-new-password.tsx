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
import { router, useLocalSearchParams } from 'expo-router';
import { Theme, darkTheme } from '@/types/theme';
import { OnboardingColors, GuidelineColors } from '@/constants/guidelineColors';
import { FloatingLabelInput } from '@/components/FloatingLabelInput';
import { LoginBackground } from '@/components/LoginBackground';
import { useToast } from '@/contexts/ToastContext';
import { resetPassword } from '@/services/authService';

function RequirementRow({
  met,
  text,
  rowStyle,
  textStyle,
  textMetStyle,
}: {
  met: boolean;
  text: string;
  rowStyle: object;
  textStyle: object;
  textMetStyle: object;
}) {
  return (
    <View style={rowStyle}>
      <Ionicons
        name={met ? 'checkmark-circle' : 'ellipse-outline'}
        size={18}
        color={met ? GuidelineColors.grayIron300 : GuidelineColors.grayIron400}
      />
      <Text style={[textStyle, met && textMetStyle]}>{text}</Text>
    </View>
  );
}

interface PasswordStrength {
  level: number;
  color: string;
  text: string;
  score: number;
}

function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) return { level: 0, color: '#3F3F46', text: '', score: 0 };
  let score = 0;
  if (password.length >= 8) score += 20;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[a-z]/.test(password)) score += 20;
  if (/\d/.test(password)) score += 20;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 20;
  if (score < 40) return { level: 1, color: '#EF4444', text: 'Weak', score };
  if (score < 60) return { level: 2, color: '#F59E0B', text: 'Fair', score };
  if (score < 80) return { level: 3, color: '#3B82F6', text: 'Good', score };
  return { level: 4, color: '#10B981', text: 'Strong', score };
}

export default function ForgotPasswordNewPasswordScreen() {
  const styles = createStyles(darkTheme);
  const { showError } = useToast();
  const { email, code } = useLocalSearchParams<{ email: string; code: string }>();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const displayEmail = email || '';
  const displayCode = code || '';
  const passwordStrength = calculatePasswordStrength(password);

  useEffect(() => {
    if (!displayEmail || !displayCode) {
      router.replace('/(public)/forgot-password');
      return;
    }
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [displayEmail, displayCode]);

  const validateForm = (): boolean => {
    let valid = true;

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      valid = false;
    } else {
      setPasswordError('');
    }

    if (!confirmPassword) {
      setConfirmError('Please confirm your password');
      valid = false;
    } else if (password !== confirmPassword) {
      setConfirmError('Passwords do not match');
      valid = false;
    } else {
      setConfirmError('');
    }

    return valid;
  };

  const handleReset = async () => {
    if (!validateForm()) {
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
    try {
      await resetPassword(displayEmail, displayCode, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(public)/forgot-password-success');
    } catch {
      showError('Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearFieldError = (field: 'password' | 'confirm') => {
    if (field === 'password') setPasswordError('');
    else setConfirmError('');
  };

  if (!displayEmail || !displayCode) return null;

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
                  <Text style={styles.titleText}>Create new password</Text>
                  <Text style={styles.subtitleText}>
                    Set a strong account password.
                  </Text>
                </View>

                <View style={styles.formSection}>
                  <FloatingLabelInput
                    label="New password"
                    value={password}
                    onChangeText={(t) => {
                      setPassword(t);
                      clearFieldError('password');
                    }}
                    error={passwordError}
                    isPassword
                    autoComplete="new-password"
                    textContentType="newPassword"
                    forceDarkTheme={true}
                  />
                  {password.length > 0 && (
                    <View style={styles.strengthContainer}>
                      <View style={styles.strengthBars}>
                        {[1, 2, 3, 4].map((level) => (
                          <View
                            key={level}
                            style={[
                              styles.strengthBar,
                              level <= passwordStrength.level
                                ? { backgroundColor: passwordStrength.color }
                                : styles.strengthBarInactive,
                            ]}
                          />
                        ))}
                      </View>
                      <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                        {passwordStrength.text}
                      </Text>
                    </View>
                  )}
                  <FloatingLabelInput
                    label="Confirm new password"
                    value={confirmPassword}
                    onChangeText={(t) => {
                      setConfirmPassword(t);
                      clearFieldError('confirm');
                    }}
                    error={confirmError}
                    isPassword
                    autoComplete="new-password"
                    textContentType="newPassword"
                    forceDarkTheme={true}
                  />

                  <TouchableOpacity
                    style={styles.signInButton}
                    onPress={handleReset}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color={OnboardingColors.buttonPrimaryText} />
                    ) : (
                      <Text style={styles.signInText}>Reset password</Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.requirementsSection}>
                    <View style={styles.requirementsFrame}>
                      <Text style={styles.requirementsTitle}>Password must contain:</Text>
                      <View style={styles.requirementsList}>
                        <RequirementRow
                          rowStyle={styles.requirementRow}
                          textStyle={styles.requirementText}
                          textMetStyle={styles.requirementTextMet}
                          met={password.length >= 8}
                          text="At least 8 characters"
                        />
                        <RequirementRow
                          rowStyle={styles.requirementRow}
                          textStyle={styles.requirementText}
                          textMetStyle={styles.requirementTextMet}
                          met={/[A-Z]/.test(password)}
                          text="One capital letter"
                        />
                        <RequirementRow
                          rowStyle={styles.requirementRow}
                          textStyle={styles.requirementText}
                          textMetStyle={styles.requirementTextMet}
                          met={/[a-z]/.test(password)}
                          text="One lowercase letter"
                        />
                        <RequirementRow
                          rowStyle={styles.requirementRow}
                          textStyle={styles.requirementText}
                          textMetStyle={styles.requirementTextMet}
                          met={/\d/.test(password)}
                          text="One number"
                        />
                        <RequirementRow
                          rowStyle={styles.requirementRow}
                          textStyle={styles.requirementText}
                          textMetStyle={styles.requirementTextMet}
                          met={/[!@#$%^&*(),.?":{}|<>]/.test(password)}
                          text="One special character"
                        />
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.signUpSection}>
                <Text style={styles.signUpText}>Remember your password?</Text>
                <TouchableOpacity onPress={() => router.replace('/(public)/login')}>
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
    signInButton: {
      width: '100%',
      height: 56,
      marginTop: 8,
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
    requirementsSection: {
      marginTop: 8,
    },
    requirementsFrame: {
      borderRadius: 8,
      borderWidth: 1,
      borderColor: OnboardingColors.border,
      padding: 16,
      gap: 12,
    },
    requirementsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: OnboardingColors.title,
    },
    requirementsList: { gap: 8 },
    requirementRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    requirementText: {
      fontSize: 14,
      color: OnboardingColors.mutedText,
      fontWeight: '500',
    },
    requirementTextMet: {
      color: GuidelineColors.grayIron300,
    },
    strengthContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 24,
    },
    strengthBars: {
      flexDirection: 'row',
      gap: 4,
    },
    strengthBar: {
      width: 24,
      height: 4,
      borderRadius: 2,
    },
    strengthBarInactive: {
      backgroundColor: '#3F3F46',
    },
    strengthText: {
      fontSize: 14,
      fontWeight: '500',
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
