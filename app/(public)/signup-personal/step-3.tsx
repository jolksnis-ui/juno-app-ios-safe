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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Theme, darkTheme } from '@/types/theme';
import { OnboardingColors, GuidelineColors } from '@/constants/guidelineColors';
import { FloatingLabelInput } from '@/components/FloatingLabelInput';
import { LoginBackground } from '@/components/LoginBackground';
import { useSignupContext } from '@/contexts/SignupContext';

const TOTAL_STEPS = 5;
const CURRENT_STEP = 3;

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

export default function CreatePasswordStep() {
  const styles = createStyles(darkTheme);
  const { state, updatePersonalData, nextStep, previousStep, setErrors } = useSignupContext();
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const passwordStrength = calculatePasswordStrength(state.personalData.password);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const { personalData } = state;

    if (!personalData.password) {
      errors.password = 'Password is required';
    } else if (personalData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!personalData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (personalData.password !== personalData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errors);
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinue = async () => {
    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      nextStep();
      router.push('/(public)/signup-personal/step-4');
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    previousStep();
    router.back();
  };

  const updateField = (field: string, value: string) => {
    updatePersonalData({ [field]: value });
    if (formErrors[field]) {
      const next = { ...formErrors };
      delete next[field];
      setFormErrors(next);
    }
  };

  return (
    <LoginBackground>
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
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.mainContent}>
                {/* Back Button - same as Welcome Back */}
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleGoBack}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="arrow-back" size={24} color={OnboardingColors.title} />
                </TouchableOpacity>

                {/* Progress dots - signup flow */}
                <View style={styles.progressRow}>
                  {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        i < CURRENT_STEP ? styles.dotActive : styles.dotInactive,
                      ]}
                    />
                  ))}
                </View>

                {/* Welcome Section - same structure as Welcome Back */}
                <View style={styles.welcomeSection}>
                  <Text style={styles.welcomeText}>Create a password</Text>
                  <Text style={styles.subWelcomeText}>
                    Set a strong account password.
                  </Text>
                </View>

                {/* Form Section - same structure as Welcome Back (FloatingLabelInput + button) */}
                <View style={styles.formSection}>
                  <FloatingLabelInput
                    label="Password"
                    value={state.personalData.password}
                    onChangeText={(t) => updateField('password', t)}
                    error={formErrors.password}
                    isPassword
                    autoComplete="new-password"
                    textContentType="newPassword"
                    forceDarkTheme
                  />
                  {state.personalData.password.length > 0 && (
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
                    label="Confirm password"
                    value={state.personalData.confirmPassword}
                    onChangeText={(t) => updateField('confirmPassword', t)}
                    error={formErrors.confirmPassword}
                    isPassword
                    autoComplete="new-password"
                    textContentType="newPassword"
                    forceDarkTheme
                    marginBottom={0}
                  />

                  {/* Password requirements - 32px below fields, frame with stroke, Gray iron */}
                  <View style={styles.requirementsSection}>
                    <View style={styles.requirementsFrame}>
                      <Text style={styles.requirementsTitle}>Password must contain:</Text>
                      <View style={styles.requirementsList}>
                        <RequirementRow
                          rowStyle={styles.requirementRow}
                          textStyle={styles.requirementText}
                          textMetStyle={styles.requirementTextMet}
                          met={state.personalData.password.length >= 8}
                          text="At least 8 characters"
                        />
                        <RequirementRow
                          rowStyle={styles.requirementRow}
                          textStyle={styles.requirementText}
                          textMetStyle={styles.requirementTextMet}
                          met={/[A-Z]/.test(state.personalData.password)}
                          text="One capital letter"
                        />
                        <RequirementRow
                          rowStyle={styles.requirementRow}
                          textStyle={styles.requirementText}
                          textMetStyle={styles.requirementTextMet}
                          met={/[a-z]/.test(state.personalData.password)}
                          text="One lowercase letter"
                        />
                        <RequirementRow
                          rowStyle={styles.requirementRow}
                          textStyle={styles.requirementText}
                          textMetStyle={styles.requirementTextMet}
                          met={/\d/.test(state.personalData.password)}
                          text="One number"
                        />
                        <RequirementRow
                          rowStyle={styles.requirementRow}
                          textStyle={styles.requirementText}
                          textMetStyle={styles.requirementTextMet}
                          met={/[!@#$%^&*(),.?":{}|<>]/.test(state.personalData.password)}
                          text="One special character"
                        />
                      </View>
                    </View>
                  </View>

                </View>
              </View>

              {/* Button + terms at bottom of content, 12px above home indicator */}
              <View style={styles.buttonSection}>
                <TouchableOpacity
                  style={[styles.continueButton, isLoading && styles.continueButtonDisabled]}
                  onPress={handleContinue}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={OnboardingColors.buttonPrimaryText} />
                  ) : (
                    <Text style={styles.continueText}>Continue</Text>
                  )}
                </TouchableOpacity>
                <Text style={styles.termsText}>
                  By clicking Continue, I agree to our{' '}
                  <Text style={styles.termsTextHighlight}>Terms and Conditions</Text>
                  {' '}and{' '}
                  <Text style={styles.termsTextHighlight}>Privacy Policy</Text>.
                </Text>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LoginBackground>
  );
}

const createStyles = (_theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 24,
    paddingBottom: 24,
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
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  dot: {
    flex: 1,
    height: 4,
    borderRadius: 99,
  },
  dotActive: {
    backgroundColor: OnboardingColors.title,
  },
  dotInactive: {
    backgroundColor: OnboardingColors.surfaceSecondary,
  },
  welcomeSection: {
    alignItems: 'stretch',
    marginBottom: 32,
    gap: 12,
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
  strengthContainer: {
    marginTop: -8,
    marginBottom: 16,
    gap: 6,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  strengthBarInactive: {
    backgroundColor: OnboardingColors.surfaceSecondary,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
    alignSelf: 'flex-end',
  },
  buttonSection: {
    marginTop: 'auto',
    gap: 24,
  },
  continueButton: {
    width: '100%',
    height: 56,
    paddingHorizontal: 32,
    borderRadius: 8,
    backgroundColor: OnboardingColors.buttonPrimaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '600',
    color: OnboardingColors.buttonPrimaryText,
    letterSpacing: 0.5,
  },
  requirementsSection: {
    marginTop: 24,
    width: '100%',
  },
  requirementsFrame: {
    borderWidth: 1,
    borderColor: GuidelineColors.grayIron600,
    borderRadius: 8,
    backgroundColor: GuidelineColors.grayIron800,
    padding: 16,
    gap: 12,
  },
  requirementsTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: GuidelineColors.grayIron100,
    marginBottom: 4,
  },
  requirementsList: {
    gap: 8,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  requirementText: {
    fontSize: 14,
    lineHeight: 20,
    color: GuidelineColors.grayIron400,
    fontWeight: '500',
    flex: 1,
  },
  requirementTextMet: {
    color: GuidelineColors.grayIron300,
  },
  termsText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: OnboardingColors.mutedText,
    textAlign: 'center',
  },
  termsTextHighlight: {
    lineHeight: 20,
    color: OnboardingColors.title,
    fontWeight: '500',
  },
});
