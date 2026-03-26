import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChevronRightRoundedIcon } from '@/components/icons/LoginIcons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStyles } from '@/hooks/useTheme';
import { Theme } from '@/types/theme';
import { FloatingLabelInput } from '@/components/FloatingLabelInput';
import { useSignupContext } from '@/contexts/SignupContext';

// Figma design tokens (Register / Personal Account - Juno Bio Auth flows)
const FIGMA = {
  backgroundGradient: ['#26272B', '#18181B'] as const,
  textPrimary: '#FFFFFF',
  textLabel: '#D1D1D6',      // Gray iron / 300
  textPlaceholder: '#A0A0AB', // Gray iron / 400
  inputBg: '#3F3F46',        // Gray iron / 700
  borderFooter: '#51525C',    // Gray iron / 600
  buttonBg: '#FFFFFF',
  buttonText: '#18181B',      // Gray iron / 900
  dotActive: '#FFFFFF',
  dotInactive: '#3F3F46',
};

export default function PersonalDetailsStep() {
  const styles = useStyles(createStyles);
  const { state, updatePersonalData, nextStep, setAccountType, setErrors, clearErrors } = useSignupContext();
  
  // Set account type on mount
  useEffect(() => {
    setAccountType('personal');
  }, []);

  // Form validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [countryFieldRecentlySelected, setCountryFieldRecentlySelected] = useState(false);

  // Common countries list
  const countries = [
    'United States',
    'Canada',
    'United Kingdom',
    'Australia',
    'Germany',
    'France',
    'Spain',
    'Italy',
    'Netherlands',
    'India',
    'China',
    'Japan',
    'Brazil',
    'Mexico',
    'Argentina',
    'Chile',
    'Colombia',
    'Peru',
    'South Africa',
    'Nigeria',
    'Egypt',
    'Kenya',
    'Singapore',
    'Malaysia',
    'Thailand',
    'Philippines',
    'Indonesia',
    'Vietnam',
    'South Korea',
    'Taiwan',
    'New Zealand',
    'Switzerland',
    'Sweden',
    'Norway',
    'Denmark',
    'Finland',
    'Belgium',
    'Austria',
    'Portugal',
    'Greece',
    'Poland',
    'Turkey',
    'Russia',
    'Ukraine',
    'Israel',
    'United Arab Emirates',
    'Saudi Arabia',
  ];

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const { personalData } = state;

    if (!personalData.fullName?.trim()) {
      errors.fullName = 'Full name is required';
    }

    if (!personalData.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!personalData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone is required';
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(personalData.phoneNumber)) {
      errors.phoneNumber = 'Invalid phone format';
    }

    if (!personalData.dateOfBirth?.trim()) {
      errors.dateOfBirth = 'Date of birth is required';
    }

    if (!personalData.country.trim()) {
      errors.country = 'Country of residence is required';
    }

    if (!personalData.address.trim()) {
      errors.address = 'Personal address line is required';
    }

    if (!personalData.city.trim()) {
      errors.city = 'City is required';
    }

    if (!personalData.state.trim()) {
      errors.state = 'State / Province / Region is required';
    }

    if (!personalData.zipCode.trim()) {
      errors.zipCode = 'ZIP / Postal Code is required';
    }

    setFormErrors(errors);
    setErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleContinue = () => {
    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    clearErrors();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    nextStep();
    router.push('/(public)/signup-personal/step-2');
  };

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const updateField = (field: string, value: string) => {
    updatePersonalData({ [field]: value });
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      const newErrors = { ...formErrors };
      delete newErrors[field];
      setFormErrors(newErrors);
    }
  };

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={FIGMA.backgroundGradient}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.container}>
        {/* Header: back + progress dots + title + subtitle (Figma layout) */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity
            onPress={handleGoBack}
            style={styles.backButton}
            activeOpacity={0.7}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name="arrow-back" size={24} color={FIGMA.textPrimary} />
          </TouchableOpacity>

          <View style={styles.dotsRow}>
            {[1, 2, 3, 4, 5].map((step) => (
              <View
                key={step}
                style={[
                  styles.dot,
                  step === 1 ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.title}>Personal details</Text>
            <Text style={styles.subtitle}>
              Tell us a bit about yourself so we can set up your personal account in minutes.
            </Text>
          </View>
        </Animated.View>

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
                styles.formSection,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <FloatingLabelInput
                label="Full name*"
                value={state.personalData.fullName || ''}
                onChangeText={(text) => updateField('fullName', text)}
                error={formErrors.fullName}
                autoComplete="name"
                textContentType="name"
                forceDarkTheme
              />
              <FloatingLabelInput
                label="Email*"
                value={state.personalData.email || ''}
                onChangeText={(text) => updateField('email', text)}
                error={formErrors.email}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                autoCapitalize="none"
                forceDarkTheme
              />
              <FloatingLabelInput
                label="Phone*"
                value={state.personalData.phoneNumber}
                onChangeText={(text) => updateField('phoneNumber', text)}
                error={formErrors.phoneNumber}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                forceDarkTheme
              />
              <FloatingLabelInput
                label="Date of Birth*"
                value={state.personalData.dateOfBirth || ''}
                onChangeText={(text) => updateField('dateOfBirth', text)}
                error={formErrors.dateOfBirth}
                keyboardType="numeric"
                forceDarkTheme
              />

              <View style={styles.countryInputWrapper}>
                <TouchableOpacity
                  style={[
                    styles.countrySelectorBox,
                    formErrors.country && styles.countrySelectorError,
                    (showCountryModal || countryFieldRecentlySelected) && styles.countrySelectorFocused,
                  ]}
                  onPress={() => {
                    Keyboard.dismiss();
                    setCountryFieldRecentlySelected(false);
                    setShowCountryModal(true);
                  }}
                  activeOpacity={1}
                >
                  <View style={styles.countrySelectorContent}>
                    {state.personalData.country ? (
                      <>
                        <Text style={styles.countrySelectorLabel}>Country of residence*</Text>
                        <Text style={styles.countrySelectorValue}>{state.personalData.country}</Text>
                      </>
                    ) : (
                      <Text style={styles.countrySelectorPlaceholder}>Country of residence*</Text>
                    )}
                  </View>
                  <View style={styles.countrySelectorIcon}>
                    <ChevronRightRoundedIcon size={24} color="#E4E4E7" />
                  </View>
                </TouchableOpacity>
                {formErrors.country && (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text style={styles.errorText}>{formErrors.country}</Text>
                  </View>
                )}
              </View>

              <FloatingLabelInput
                label="Address Line*"
                value={state.personalData.address}
                onChangeText={(text) => updateField('address', text)}
                error={formErrors.address}
                autoComplete="street-address"
                textContentType="fullStreetAddress"
                forceDarkTheme
              />
              <FloatingLabelInput
                label="City*"
                value={state.personalData.city}
                onChangeText={(text) => updateField('city', text)}
                error={formErrors.city}
                autoComplete="address-line2"
                textContentType="addressCity"
                forceDarkTheme
              />
              <FloatingLabelInput
                label="State / Province / Region*"
                value={state.personalData.state}
                onChangeText={(text) => updateField('state', text)}
                error={formErrors.state}
                autoComplete="address-line1"
                textContentType="addressState"
                forceDarkTheme
              />
              <FloatingLabelInput
                label="ZIP / Postal Code*"
                value={state.personalData.zipCode}
                onChangeText={(text) => updateField('zipCode', text)}
                error={formErrors.zipCode}
                autoComplete="postal-code"
                textContentType="postalCode"
                forceDarkTheme
                marginBottom={0}
              />
            </Animated.View>
          </ScrollView>

          {/* Footer: border top, CONTINUE button, terms (Figma) */}
          <Animated.View style={[styles.footer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
            <Text style={styles.termsText}>
              By clicking Continue, I agree to our{' '}
              <Text style={styles.termsTextHighlight}>Terms and Conditions</Text>
              {' '}and{' '}
              <Text style={styles.termsTextHighlight}>Privacy Policy</Text>.
            </Text>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Country Selection Modal */}
      <Modal
        visible={showCountryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCountryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={FIGMA.backgroundGradient}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowCountryModal(false)}
              >
                <Ionicons name="close" size={24} color={FIGMA.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={countries}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryItem}
                  onPress={() => {
                    updateField('country', item);
                    setShowCountryModal(false);
                    setCountryFieldRecentlySelected(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setTimeout(() => setCountryFieldRecentlySelected(false), 2000);
                  }}
                >
                  <Text style={styles.countryItemText}>{item}</Text>
                  {state.personalData.country === item && (
                    <Ionicons name="checkmark" size={20} color={FIGMA.buttonBg} />
                  )}
                </TouchableOpacity>
              )}
              style={styles.countryList}
              showsVerticalScrollIndicator={false}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (_theme: Theme) => StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 24,
  },
  backButton: {
    padding: 4,
  },
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
  dotActive: {
    backgroundColor: FIGMA.dotActive,
  },
  dotInactive: {
    backgroundColor: FIGMA.dotInactive,
  },
  titleBlock: {
    gap: 12,
    alignSelf: 'stretch',
  },
  title: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 28,
    lineHeight: 34,
    color: FIGMA.textPrimary,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 20,
    color: FIGMA.textLabel,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    flexGrow: 1,
  },
  formSection: {
    gap: 0,
  },
  countryInputWrapper: {
    marginBottom: 24,
  },
  countrySelectorBox: {
    borderRadius: 8,
    height: 56,
    minHeight: 56,
    backgroundColor: FIGMA.inputBg,
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    position: 'relative',
  },
  countrySelectorContent: {
    flex: 1,
    alignItems: 'flex-start',
    minHeight: 56,
  },
  countrySelectorIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  countrySelectorFocused: {
    borderColor: '#FFFFFF',
  },
  countrySelectorError: {
    borderColor: '#EF4444',
  },
  countrySelectorLabel: {
    position: 'absolute',
    left: 0,
    top: 8,
    fontSize: 12,
    fontWeight: '500',
    color: FIGMA.textPlaceholder,
    textAlign: 'left',
  },
  countrySelectorValue: {
    fontSize: 16,
    fontWeight: '500',
    color: FIGMA.textPrimary,
    paddingTop: 24,
    paddingBottom: 12,
  },
  countrySelectorPlaceholder: {
    fontSize: 16,
    fontWeight: '500',
    color: FIGMA.textPlaceholder,
    paddingTop: 16,
    paddingBottom: 12,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginLeft: 4,
    fontWeight: '500',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: FIGMA.borderFooter,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 24,
  },
  continueButton: {
    width: '100%',
    height: 56,
    paddingHorizontal: 32,
    borderRadius: 8,
    backgroundColor: FIGMA.buttonBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: FIGMA.buttonText,
    letterSpacing: 0.5,

    fontFamily: 'Inter',

  },
  termsText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: FIGMA.textPlaceholder,
    textAlign: 'center',
  },
  termsTextHighlight: {
    lineHeight: 20,
    color: FIGMA.textPrimary,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: FIGMA.borderFooter,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: FIGMA.textPrimary,
  },
  modalCloseButton: {
    padding: 4,
  },
  countryList: {
    flex: 1,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: FIGMA.borderFooter,
  },
  countryItemText: {
    fontSize: 16,
    color: FIGMA.textPrimary,
    flex: 1,
  },
});