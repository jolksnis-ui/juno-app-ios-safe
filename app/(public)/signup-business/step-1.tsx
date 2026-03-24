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

// Figma design tokens (Register / Business Account - Juno Bio Auth flows)
const FIGMA = {
  backgroundGradient: ['#26272B', '#18181B'] as const,
  textPrimary: '#FFFFFF',
  textLabel: '#D1D1D6',      // Gray iron / 300
  textPlaceholder: '#A0A0AB', // Gray iron / 400
  inputBg: '#3F3F46',        // Gray iron / 700
  borderFooter: '#51525C',   // Gray iron / 600
  buttonBg: '#FFFFFF',
  buttonText: '#18181B',     // Gray iron / 900
  dotActive: '#FFFFFF',
  dotInactive: '#3F3F46',
};

const countries = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France',
  'Spain', 'Italy', 'Netherlands', 'India', 'China', 'Japan', 'Brazil', 'Mexico',
  'Argentina', 'Chile', 'Colombia', 'Peru', 'South Africa', 'Nigeria', 'Egypt',
  'Kenya', 'Singapore', 'Malaysia', 'Thailand', 'Philippines', 'Indonesia',
  'Vietnam', 'South Korea', 'Taiwan', 'New Zealand', 'Switzerland', 'Sweden',
  'Norway', 'Denmark', 'Finland', 'Belgium', 'Austria', 'Portugal', 'Greece',
  'Poland', 'Turkey', 'Russia', 'Ukraine', 'Israel', 'United Arab Emirates', 'Saudi Arabia',
];

export default function BusinessDetailsStep() {
  const styles = useStyles(createStyles);
  const { state, updateBusinessData, nextStep, setAccountType, setErrors, clearErrors } = useSignupContext();

  useEffect(() => {
    setAccountType('business');
  }, []);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [countryFieldRecentlySelected, setCountryFieldRecentlySelected] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const { businessData } = state;

    if (!businessData.email?.trim()) {
      errors.email = 'Business email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!businessData.businessName?.trim()) errors.businessName = 'Full legal entity name is required';
    if (!businessData.representativeName?.trim()) errors.representativeName = 'Business representative name is required';
    if (!businessData.businessWebsite?.trim()) errors.businessWebsite = 'Business website is required';
    if (!businessData.businessCountry?.trim()) errors.businessCountry = 'Country of incorporation is required';
    if (!businessData.businessAddress?.trim()) errors.businessAddress = 'Business address line is required';
    if (!businessData.businessCity?.trim()) errors.businessCity = 'City is required';
    if (!businessData.businessState?.trim()) errors.businessState = 'State / Province / Region is required';
    if (!businessData.businessZipCode?.trim()) errors.businessZipCode = 'ZIP / Postal Code is required';

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
    router.push('/(public)/signup-business/step-2');
  };

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const updateField = (field: string, value: string) => {
    updateBusinessData({ [field]: value });
    if (formErrors[field]) {
      const next = { ...formErrors };
      delete next[field];
      setFormErrors(next);
    }
  };

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={FIGMA.backgroundGradient}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.container}>
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
            {[1, 2, 3, 4, 5, 6].map((step) => (
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
            <Text style={styles.title}>Business details</Text>
            <Text style={styles.subtitle}>
              Enter your company info to access secure global banking.
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
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              <FloatingLabelInput
                label="Business Email*"
                value={state.businessData.email}
                onChangeText={(text) => updateField('email', text)}
                error={formErrors.email}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                autoCapitalize="none"
                forceDarkTheme
              />
              <FloatingLabelInput
                label="Full Legal Entity Name*"
                value={state.businessData.businessName}
                onChangeText={(text) => updateField('businessName', text)}
                error={formErrors.businessName}
                autoComplete="organization"
                textContentType="organizationName"
                forceDarkTheme
              />
              <FloatingLabelInput
                label="Business Representatives Name*"
                value={state.businessData.representativeName}
                onChangeText={(text) => updateField('representativeName', text)}
                error={formErrors.representativeName}
                textContentType="name"
                forceDarkTheme
              />
              <FloatingLabelInput
                label="Business Website*"
                value={state.businessData.businessWebsite}
                onChangeText={(text) => updateField('businessWebsite', text)}
                error={formErrors.businessWebsite}
                keyboardType="url"
                autoCapitalize="none"
                forceDarkTheme
              />

              <View style={styles.countryInputWrapper}>
                <TouchableOpacity
                  style={[
                    styles.countrySelectorBox,
                    formErrors.businessCountry && styles.countrySelectorError,
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
                    {state.businessData.businessCountry ? (
                      <>
                        <Text style={styles.countrySelectorLabel}>Country of incorporation*</Text>
                        <Text style={styles.countrySelectorValue}>{state.businessData.businessCountry}</Text>
                      </>
                    ) : (
                      <Text style={styles.countrySelectorPlaceholder}>Country of incorporation*</Text>
                    )}
                  </View>
                  <View style={styles.countrySelectorIcon}>
                    <ChevronRightRoundedIcon size={24} color="#E4E4E7" />
                  </View>
                </TouchableOpacity>
                {formErrors.businessCountry && (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text style={styles.errorText}>{formErrors.businessCountry}</Text>
                  </View>
                )}
              </View>

              <FloatingLabelInput
                label="Business Address Line*"
                value={state.businessData.businessAddress}
                onChangeText={(text) => updateField('businessAddress', text)}
                error={formErrors.businessAddress}
                autoComplete="street-address"
                textContentType="fullStreetAddress"
                forceDarkTheme
              />
              <FloatingLabelInput
                label="City*"
                value={state.businessData.businessCity}
                onChangeText={(text) => updateField('businessCity', text)}
                error={formErrors.businessCity}
                autoComplete="address-line2"
                textContentType="addressCity"
                forceDarkTheme
              />
              <FloatingLabelInput
                label="State / Province / Region*"
                value={state.businessData.businessState}
                onChangeText={(text) => updateField('businessState', text)}
                error={formErrors.businessState}
                autoComplete="address-line1"
                textContentType="addressState"
                forceDarkTheme
              />
              <FloatingLabelInput
                label="ZIP / Postal Code*"
                value={state.businessData.businessZipCode}
                onChangeText={(text) => updateField('businessZipCode', text)}
                error={formErrors.businessZipCode}
                autoComplete="postal-code"
                textContentType="postalCode"
                forceDarkTheme
                marginBottom={0}
              />
            </Animated.View>
          </ScrollView>

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
              <Text style={styles.modalTitle}>Select country of incorporation</Text>
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
                    updateField('businessCountry', item);
                    setShowCountryModal(false);
                    setCountryFieldRecentlySelected(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setTimeout(() => setCountryFieldRecentlySelected(false), 2000);
                  }}
                >
                  <Text style={styles.countryItemText}>{item}</Text>
                  {state.businessData.businessCountry === item && (
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
  wrapper: { flex: 1 },
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 24,
  },
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
  titleBlock: { gap: 12, alignSelf: 'stretch' },
  title: {
    fontFamily: 'Inter',
    fontWeight: '700',
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
  keyboardAvoidingView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    flexGrow: 1,
  },
  formSection: { gap: 0 },
  countryInputWrapper: { marginBottom: 24 },
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
  countrySelectorFocused: { borderColor: '#FFFFFF' },
  countrySelectorError: { borderColor: '#EF4444' },
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
  buttonDisabled: { opacity: 0.6 },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: FIGMA.buttonText,
    letterSpacing: 0.5,
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
  modalOverlay: { flex: 1 },
  modalContainer: { flex: 1 },
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
  modalCloseButton: { padding: 4 },
  countryList: { flex: 1 },
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
