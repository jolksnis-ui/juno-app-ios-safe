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
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChevronRightRoundedIcon } from '@/components/icons/LoginIcons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme, darkTheme } from '@/types/theme';
import { LoginBackground } from '@/components/LoginBackground';
import { useSignupContext } from '@/contexts/SignupContext';
import { OnboardingColors } from '@/constants/guidelineColors';

// Same Figma tokens as Personal details (step-1) for dropdown structure and styling
const FIGMA = {
  backgroundGradient: ['#26272B', '#18181B'] as const,
  textPrimary: '#FFFFFF',
  textLabel: '#D1D1D6',
  textPlaceholder: '#A0A0AB',
  inputBg: '#3F3F46',
  borderFooter: '#51525C',
  buttonBg: '#FFFFFF',
  buttonText: '#18181B',
};

interface SelectOption {
  value: string;
  label: string;
}

const accountPurposeOptions: SelectOption[] = [
  { value: '1st_party_inbound', label: '1st party inbound payments' },
  { value: '1st_party_outbound', label: '1st party outbound payments' },
  { value: '3rd_party_inbound', label: '3rd party inbound payments' },
  { value: '3rd_party_outbound', label: '3rd party outbound payments' },
  { value: 'fx', label: 'FX' },
];

const TOTAL_STEPS = 5;
const CURRENT_STEP = 4;

export default function AccountPurposeStep() {
  const styles = createStyles(darkTheme);
  const { state, updatePersonalData, nextStep, previousStep, validateCurrentStep, resetState } = useSignupContext();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [accountPurposeRecentlySelected, setAccountPurposeRecentlySelected] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showFooterDivider, setShowFooterDivider] = useState(false);
  const scrollViewHeightRef = useRef(0);
  const contentHeightRef = useRef(0);

  const updateFooterDivider = () => {
    const sh = scrollViewHeightRef.current;
    const ch = contentHeightRef.current;
    setShowFooterDivider(sh > 0 && ch > sh);
  };

  const handleContinue = () => {
    if (!validateCurrentStep()) {
      Alert.alert('Required Fields', 'Please complete all required fields before continuing.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    nextStep();
    router.push('/(public)/signup-personal/step-5');
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    resetState();
    router.replace('/(auth)/dashboard');
  };

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    previousStep();
    router.back();
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const updateField = (field: string, value: string) => {
    updatePersonalData({ [field]: value });
  };

  const getSelectedPurposeLabel = () => {
    const selected = accountPurposeOptions.find((o) => o.value === state.personalData.accountPurpose);
    return selected ? selected.label : 'Select reason opening account';
  };

  const renderDropdownItem = ({ item }: { item: SelectOption }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => {
        updateField('accountPurpose', item.value);
        setIsDropdownVisible(false);
        setAccountPurposeRecentlySelected(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTimeout(() => setAccountPurposeRecentlySelected(false), 2000);
      }}
    >
      <Text style={styles.countryItemText}>{item.label}</Text>
      {state.personalData.accountPurpose === item.value && (
        <Ionicons name="checkmark" size={20} color={FIGMA.buttonBg} />
      )}
    </TouchableOpacity>
  );

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
            onContentSizeChange={(_, contentHeight) => {
              contentHeightRef.current = contentHeight;
              updateFooterDivider();
            }}
            onLayout={(e) => {
              scrollViewHeightRef.current = e.nativeEvent.layout.height;
              updateFooterDivider();
            }}
          >
            <Animated.View style={[styles.contentContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <View style={styles.mainContent}>
                {/* Back + Skip - same row as Create Password has back only; we add Skip */}
                <View style={styles.topRow}>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleGoBack}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons name="arrow-back" size={24} color={OnboardingColors.title} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.skipButton} onPress={handleSkip} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Text style={styles.skipText}>Skip</Text>
                  </TouchableOpacity>
                </View>

                {/* Progress dots - same as Create Password */}
                <View style={styles.progressRow}>
                  {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                    <View
                      key={i}
                      style={[styles.dot, i < CURRENT_STEP ? styles.dotActive : styles.dotInactive]}
                    />
                  ))}
                </View>

                {/* Welcome Section - same structure as Create Password */}
                <View style={styles.welcomeSection}>
                  <Text style={styles.welcomeText}>Account Purpose</Text>
                  <Text style={styles.subWelcomeText}>
                    Tell us why you're opening this account and how it will be used.
                  </Text>
                </View>

                {/* Form Section */}
                <View style={styles.formSection}>
                  {/* Account Purpose - same structure as Personal details Country dropdown */}
                  <View style={styles.countryInputWrapper}>
                    <TouchableOpacity
                      style={[
                        styles.countrySelectorBox,
                        (isDropdownVisible || accountPurposeRecentlySelected) && styles.countrySelectorFocused,
                      ]}
                      onPress={() => {
                        setIsDropdownVisible(true);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      activeOpacity={1}
                    >
                      <View style={styles.countrySelectorContent}>
                        {state.personalData.accountPurpose ? (
                          <>
                            <Text style={styles.countrySelectorLabel}>Account Purpose*</Text>
                            <Text style={styles.countrySelectorValue}>{getSelectedPurposeLabel()}</Text>
                          </>
                        ) : (
                          <Text style={styles.countrySelectorPlaceholder}>Account Purpose*</Text>
                        )}
                      </View>
                      <View style={styles.countrySelectorIcon}>
                        <ChevronRightRoundedIcon size={24} color="#E4E4E7" />
                      </View>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.textFieldBlock}>
                    <Text style={styles.textFieldLabel}>Please explain the flow of funds in / out of your Juno Money*</Text>
                    <TextInput
                      style={[styles.textFieldInput, focusedField === 'fundFlow' && styles.textFieldInputFocused]}
                      value={state.personalData.fundFlowExplanation}
                      onChangeText={(t) => updateField('fundFlowExplanation', t)}
                      onFocus={() => setFocusedField('fundFlow')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter text here"
                      placeholderTextColor={OnboardingColors.mutedText}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
                  <View style={styles.textFieldBlock}>
                    <Text style={styles.textFieldLabel}>Please explain the Source of Funds that will be sent into your Juno Money account*</Text>
                    <TextInput
                      style={[styles.textFieldInput, focusedField === 'sourceOfFunds' && styles.textFieldInputFocused]}
                      value={state.personalData.sourceOfFunds}
                      onChangeText={(t) => updateField('sourceOfFunds', t)}
                      onFocus={() => setFocusedField('sourceOfFunds')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter text here"
                      placeholderTextColor={OnboardingColors.mutedText}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.continueButton, !validateCurrentStep() && styles.continueButtonDisabled]}
                    onPress={handleContinue}
                    disabled={!validateCurrentStep()}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.continueText}>Continue</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>

        <Modal
          visible={isDropdownVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setIsDropdownVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <LinearGradient
              colors={FIGMA.backgroundGradient}
              style={StyleSheet.absoluteFill}
            />
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Account Purpose*</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setIsDropdownVisible(false)}
                >
                  <Ionicons name="close" size={24} color={FIGMA.textPrimary} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={accountPurposeOptions}
                keyExtractor={(item) => item.value}
                renderItem={renderDropdownItem}
                style={styles.countryList}
                showsVerticalScrollIndicator={false}
              />
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    </LoginBackground>
  );
}

const createStyles = (_theme: Theme) =>
  StyleSheet.create({
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
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    backButton: {
      alignSelf: 'flex-start',
      padding: 4,
    },
    skipButton: {
      padding: 4,
    },
    skipText: {
      fontSize: 14,
      fontWeight: '600',
      color: OnboardingColors.title,
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
    /* Account Purpose - same structure and styling as Personal details Country dropdown */
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
    countrySelectorFocused: {
      borderColor: '#FFFFFF',
    },
    textFieldBlock: {
      marginBottom: 24,
    },
    textFieldLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: OnboardingColors.secondaryText,
      marginBottom: 8,
    },
    textFieldInput: {
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 14,
      paddingTop: 14,
      minHeight: 100,
      backgroundColor: OnboardingColors.surfaceSecondary,
      borderWidth: 1,
      borderColor: 'transparent',
      fontSize: 16,
      fontWeight: '500',
      color: OnboardingColors.primaryText,
    },
    textFieldInputFocused: {
      borderColor: '#FFFFFF',
    },
    footer: {
      paddingHorizontal: 16,
      paddingTop: 24,
      paddingBottom: 24,
      gap: 24,
    },
    footerWithDivider: {
      borderTopWidth: 1,
      borderTopColor: FIGMA.borderFooter,
    },
    continueButton: {
      marginTop: 36,
      width: '100%',
      height: 56,
      paddingHorizontal: 32,
      borderRadius: 8,
      backgroundColor: OnboardingColors.buttonPrimaryBackground,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0,
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
