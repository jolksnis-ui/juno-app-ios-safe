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
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChevronRightRoundedIcon } from '@/components/icons/LoginIcons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useSignupContext } from '@/contexts/SignupContext';
import { OnboardingColors } from '@/constants/guidelineColors';

// Same Figma tokens and structure as Personal details (step-1)
const FIGMA = {
  backgroundGradient: ['#26272B', '#18181B'] as const,
  textPrimary: '#FFFFFF',
  textLabel: '#D1D1D6',
  textPlaceholder: '#A0A0AB',
  inputBg: '#3F3F46',
  borderFooter: '#51525C',
  buttonBg: '#FFFFFF',
  buttonText: '#18181B',
  dotActive: '#FFFFFF',
  dotInactive: '#3F3F46',
};

interface SelectOption {
  value: string;
  label: string;
}

const amountOptions: SelectOption[] = [
  { value: '1-5', label: '1-5' },
  { value: '6-20', label: '6-20' },
  { value: '21-50', label: '21-50' },
  { value: '51-100', label: '51-100' },
  { value: '100+', label: '100+' },
];

const currencyOptions: SelectOption[] = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'Other', label: 'Other' },
];

const jurisdictionOptions: SelectOption[] = [
  { value: 'US', label: 'United States' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'EU', label: 'European Union' },
  { value: 'Other', label: 'Other' },
];

const fxPairsOptions: SelectOption[] = [
  { value: 'USD/EUR', label: 'USD/EUR' },
  { value: 'USD/GBP', label: 'USD/GBP' },
  { value: 'EUR/GBP', label: 'EUR/GBP' },
  { value: 'Other', label: 'Other' },
];

type FieldKey =
  | 'inboundPerMonth'
  | 'inboundAvgUsd'
  | 'mainInboundCurrencies'
  | 'topJurisdictionsInbound'
  | 'outboundPerMonth'
  | 'outboundAvgUsd'
  | 'mainOutboundCurrencies'
  | 'topJurisdictionsOutbound'
  | 'fxPerMonth'
  | 'fxAvgUsd'
  | 'mainFxPairs';

export default function TransactionActivityStep() {
  const { resetState } = useSignupContext();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [inboundPerMonth, setInboundPerMonth] = useState('');
  const [inboundAvgUsd, setInboundAvgUsd] = useState('');
  const [mainInboundCurrencies, setMainInboundCurrencies] = useState('');
  const [additionalInbound, setAdditionalInbound] = useState('');
  const [topJurisdictionsInbound, setTopJurisdictionsInbound] = useState('');
  const [topEntitiesInbound, setTopEntitiesInbound] = useState('');

  const [outboundPerMonth, setOutboundPerMonth] = useState('');
  const [outboundAvgUsd, setOutboundAvgUsd] = useState('');
  const [mainOutboundCurrencies, setMainOutboundCurrencies] = useState('');
  const [additionalOutbound, setAdditionalOutbound] = useState('');
  const [topJurisdictionsOutbound, setTopJurisdictionsOutbound] = useState('');
  const [topBeneficiaries, setTopBeneficiaries] = useState('');

  const [fxPerMonth, setFxPerMonth] = useState('');
  const [fxAvgUsd, setFxAvgUsd] = useState('');
  const [mainFxPairs, setMainFxPairs] = useState('');

  const [dropdownModal, setDropdownModal] = useState<{
    visible: boolean;
    field: FieldKey | null;
    options: SelectOption[];
    onSelect: (value: string) => void;
    title: string;
    selectedValue: string;
  }>({ visible: false, field: null, options: [], onSelect: () => {}, title: '', selectedValue: '' });

  const [recentlySelectedField, setRecentlySelectedField] = useState<FieldKey | null>(null);

  const openDropdown = (
    field: FieldKey,
    options: SelectOption[],
    onSelect: (value: string) => void,
    title: string,
    selectedValue: string
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDropdownModal({ visible: true, field, options, onSelect, title, selectedValue });
  };

  const closeDropdown = () => {
    setDropdownModal((prev) => ({ ...prev, visible: false }));
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetState();
      router.replace('/(auth)/dashboard');
    } catch {
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleComplete();
  };

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  /* Same logic as FloatingLabelInput: label large (16px) by default, on press becomes small (12px), value shows below */
  const renderSelectRow = (
    label: string,
    value: string,
    innerLabel: string,
    options: SelectOption[],
    field: FieldKey,
    onSelect: (value: string) => void,
    modalTitle: string
  ) => (
    <FloatingLabelSelectRow
      labelAbove={label}
      value={value}
      innerLabel={innerLabel}
      options={options}
      field={field}
      onSelect={onSelect}
      modalTitle={modalTitle}
      isFocused={(dropdownModal.visible && dropdownModal.field === field) || recentlySelectedField === field}
      openDropdown={openDropdown}
      styles={styles}
    />
  );

  /* Exact structure from second screenshot (Additional inbound currency requirements) / Account Purpose flow-of-funds block */
  const renderAccountPurposeStyleTextRow = (
    label: string,
    value: string,
    onChange: (t: string) => void,
    fieldKey: string,
    _multiline?: boolean,
    placeholder?: string
  ) => (
    <View style={styles.textFieldBlock}>
      <Text style={styles.textFieldLabel}>{label}</Text>
      <TextInput
        style={[styles.textFieldInput, focusedField === fieldKey && styles.textFieldInputFocused]}
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocusedField(fieldKey)}
        onBlur={() => setFocusedField(null)}
        placeholder={placeholder ?? 'Enter text here'}
        placeholderTextColor={OnboardingColors.mutedText}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={FIGMA.backgroundGradient}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.container}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {/* Header: same structure as Personal details - back + Skip row, dots, title, subtitle */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              onPress={handleGoBack}
              style={styles.backButton}
              activeOpacity={0.7}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Ionicons name="arrow-back" size={24} color={FIGMA.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dotsRow}>
            {[1, 2, 3, 4, 5].map((step) => (
              <View
                key={step}
                style={[styles.dot, styles.dotActive]}
              />
            ))}
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.title}>Transaction Activity</Text>
            <Text style={styles.subtitle}>
              Provide details of your typical incoming and outgoing transactions.
            </Text>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formSection}>
              <View style={styles.sections}>
            {/* Inbound */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Inbound</Text>
              {renderSelectRow(
                'Estimated number of inbound transactions per month*',
                inboundPerMonth,
                'Select amount',
                amountOptions,
                'inboundPerMonth',
                setInboundPerMonth,
                'Inbound per month'
              )}
              {renderSelectRow(
                'Average USD value of each inbound transaction*',
                inboundAvgUsd,
                'Select amount',
                amountOptions,
                'inboundAvgUsd',
                setInboundAvgUsd,
                'Average USD'
              )}
              {renderSelectRow(
                'Main inbound currencies*',
                mainInboundCurrencies,
                'Select currencies',
                currencyOptions,
                'mainInboundCurrencies',
                setMainInboundCurrencies,
                'Main currencies'
              )}
              {renderAccountPurposeStyleTextRow(
                'Additional inbound currency requirements',
                additionalInbound,
                setAdditionalInbound,
                'additionalInbound',
                true,
                'e.g. Names, comma-separated'
              )}
              {renderSelectRow(
                'Top Jurisdictions you will receive funds from*',
                topJurisdictionsInbound,
                'Select currencies',
                jurisdictionOptions,
                'topJurisdictionsInbound',
                setTopJurisdictionsInbound,
                'Jurisdictions'
              )}
              {renderAccountPurposeStyleTextRow(
                'Top entities / individuals that will send funds into your Juno Money Account*',
                topEntitiesInbound,
                setTopEntitiesInbound,
                'topEntitiesInbound',
                false,
                'List full names with commas'
              )}
            </View>

            {/* Outbound */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Outbound</Text>
              {renderSelectRow(
                'Estimated number of outbound transactions per month*',
                outboundPerMonth,
                'Select amount',
                amountOptions,
                'outboundPerMonth',
                setOutboundPerMonth,
                'Outbound per month'
              )}
              {renderSelectRow(
                'Average USD value of each outbound transaction*',
                outboundAvgUsd,
                'Select amount',
                amountOptions,
                'outboundAvgUsd',
                setOutboundAvgUsd,
                'Average USD'
              )}
              {renderSelectRow(
                'Main outbound currencies*',
                mainOutboundCurrencies,
                'Select currencies',
                currencyOptions,
                'mainOutboundCurrencies',
                setMainOutboundCurrencies,
                'Main currencies'
              )}
              {renderAccountPurposeStyleTextRow(
                'Additional outbound currency requirements',
                additionalOutbound,
                setAdditionalOutbound,
                'additionalOutbound',
                true,
                'e.g. Names, comma-separated'
              )}
              {renderSelectRow(
                'Top Jurisdictions you will send funds to*',
                topJurisdictionsOutbound,
                'Select currencies',
                jurisdictionOptions,
                'topJurisdictionsOutbound',
                setTopJurisdictionsOutbound,
                'Jurisdictions'
              )}
              {renderAccountPurposeStyleTextRow(
                'Top beneficiaries that will receive funds from your Juno Money*',
                topBeneficiaries,
                setTopBeneficiaries,
                'topBeneficiaries',
                false,
                'List full names with commas'
              )}
            </View>

            {/* FX */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>FX</Text>
              {renderSelectRow(
                'Number of FX transactions per month*',
                fxPerMonth,
                'Select amount',
                amountOptions,
                'fxPerMonth',
                setFxPerMonth,
                'FX per month'
              )}
              {renderSelectRow(
                'Average USD value of each FX transaction*',
                fxAvgUsd,
                'Select amount',
                amountOptions,
                'fxAvgUsd',
                setFxAvgUsd,
                'Average USD'
              )}
              {renderSelectRow(
                'Main FX pairs*',
                mainFxPairs,
                'Select main FX pairs',
                fxPairsOptions,
                'mainFxPairs',
                setMainFxPairs,
                'FX pairs'
              )}
              </View>
            </View>
            </View>
          </ScrollView>

          {/* Footer: same as Personal details + terms */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.continueButton, isLoading && styles.buttonDisabled]}
              onPress={handleComplete}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={FIGMA.buttonText} />
              ) : (
                <Text style={styles.continueButtonText}>Continue</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.termsText}>
              By clicking Continue, I agree to our{' '}
              <Text style={styles.termsTextHighlight}>Terms and Conditions</Text>
              {' '}and{' '}
              <Text style={styles.termsTextHighlight}>Privacy Policy</Text>.
            </Text>
          </View>
        </KeyboardAvoidingView>
        </Animated.View>
      </SafeAreaView>

      <Modal
        visible={dropdownModal.visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeDropdown}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={FIGMA.backgroundGradient}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{dropdownModal.title}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeDropdown}
              >
                <Ionicons name="close" size={24} color={FIGMA.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={dropdownModal.options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryItem}
                  onPress={() => {
                    const field = dropdownModal.field;
                    dropdownModal.onSelect(item.value);
                    if (field) setRecentlySelectedField(field);
                    closeDropdown();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setTimeout(() => setRecentlySelectedField(null), 2000);
                  }}
                >
                  <Text style={styles.countryItemText}>{item.label}</Text>
                  {dropdownModal.selectedValue === item.value && (
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

const styles = StyleSheet.create({
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
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  skipButton: {
    padding: 4,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: FIGMA.textPrimary,
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
  sections: {
    gap: 32, /* 32px between Inbound, Outbound, FX sections */
  },
  section: {
    gap: 24, /* 24px between inputs within each section */
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: FIGMA.textPrimary,
  },
  /* Label above (14px) + inside box same as Personal details Country dropdown; spacing from section gap: 24 */
  selectFieldWrapper: {
    marginBottom: 0,
  },
  selectFieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: FIGMA.textLabel,
    marginBottom: 8,
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
  countrySelectorFocused: {
    borderColor: '#FFFFFF',
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
  /* Text fields: same structure as Account Purpose page; spacing from section gap: 24 */
  textFieldBlock: {
    marginBottom: 0,
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

/* Same structure as Country dropdown: 56px box, TouchableOpacity wrapper, label+value or placeholder, chevron */
function FloatingLabelSelectRow({
  labelAbove,
  value,
  innerLabel,
  options,
  field,
  onSelect,
  modalTitle,
  isFocused,
  openDropdown,
  styles: st,
}: {
  labelAbove: string;
  value: string;
  innerLabel: string;
  options: SelectOption[];
  field: FieldKey;
  onSelect: (value: string) => void;
  modalTitle: string;
  isFocused: boolean;
  openDropdown: (field: FieldKey, options: SelectOption[], onSelect: (value: string) => void, title: string, selectedValue: string) => void;
  styles: typeof styles;
}) {
  const displayValue = value ? options.find((o) => o.value === value)?.label ?? value : '';
  return (
    <View style={st.selectFieldWrapper}>
      <Text style={st.selectFieldLabel}>{labelAbove}</Text>
      <TouchableOpacity
        style={[st.countrySelectorBox, isFocused && st.countrySelectorFocused]}
        onPress={() => openDropdown(field, options, onSelect, modalTitle, value)}
        activeOpacity={1}
      >
        <View style={st.countrySelectorContent}>
          {displayValue ? (
            <>
              <Text style={st.countrySelectorLabel}>{innerLabel}</Text>
              <Text style={st.countrySelectorValue}>{displayValue}</Text>
            </>
          ) : (
            <Text style={st.countrySelectorPlaceholder}>{innerLabel}</Text>
          )}
        </View>
        <View style={st.countrySelectorIcon}>
          <ChevronRightRoundedIcon size={24} color="#E4E4E7" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

