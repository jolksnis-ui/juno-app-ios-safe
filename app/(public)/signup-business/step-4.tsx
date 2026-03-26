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
import * as DocumentPicker from 'expo-document-picker';
import { MdiEditOutlineIcon } from '@/components/icons/LoginIcons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { GuidelineColors } from '@/constants/guidelineColors';
import { LoginBackground } from '@/components/LoginBackground';
import { useSignupContext } from '@/contexts/SignupContext';

// Same design tokens as Business details (step-1)
const FIGMA = {
  textPrimary: '#FFFFFF',
  textLabel: '#D1D1D6',
  borderFooter: '#51525C',
  buttonBg: '#FFFFFF',
  buttonText: '#18181B',
  dotActive: '#FFFFFF',
  dotInactive: '#3F3F46',
} as const;

// Document field config matching Figma: Register / Business Documentation
const DOCUMENT_FIELDS = [
  { id: 'commercialRegistryExtract', label: 'Online Commercial Registry Extract*', required: true },
  { id: 'certificateOfIncorporation', label: 'Certificate of Incorporation*', required: true },
  { id: 'articlesMemorandum', label: 'Articles / Memorandum of Association*', required: true },
  { id: 'proofOfBusinessAddress', label: 'Proof of Business Address*', required: true },
  { id: 'companyStructureChart', label: 'Signed and Dated Company Structure Chart', required: false },
  { id: 'ownershipStructure', label: 'Ownership Structure / Shareholders Register*', required: true },
  { id: 'directorsRegister', label: 'Directors Register*', required: true },
  { id: 'bankStatement', label: "Bank Statement in the Company's Name*", required: true },
  { id: 'operatingLicenses', label: 'Operating Licenses*', required: true },
] as const;

/** Parse stored value to get display name (from real picker or legacy placeholder). */
function getFileDisplayName(value: string | undefined): string {
  if (!value) return '';
  try {
    const parsed = JSON.parse(value) as { name?: string };
    if (parsed?.name && typeof parsed.name === 'string') return parsed.name;
  } catch {
    // legacy: uploaded_${fieldId}_${timestamp}
  }
  return 'File uploaded';
}

const TOTAL_STEPS = 6;
const CURRENT_STEP = 4;

export default function BusinessDocumentationStep() {
  const styles = createStyles();
  const { state, updateBusinessData, nextStep, previousStep, resetState } = useSignupContext();

  const docs = state.businessData.businessDocuments ?? {};
  const [uploads, setUploads] = useState<Record<string, string>>(docs);
  const [pickingFieldId, setPickingFieldId] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    setUploads((prev) => ({ ...prev, ...docs }));
  }, [state.businessData.businessDocuments]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleChooseFile = async (fieldId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPickingFieldId(fieldId);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      const value = JSON.stringify({ uri: asset.uri, name: asset.name ?? 'Document' });
      setUploads((prev) => ({ ...prev, [fieldId]: value }));
      updateBusinessData({
        businessDocuments: { ...state.businessData.businessDocuments, [fieldId]: value },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    } finally {
      setPickingFieldId(null);
    }
  };

  const handleDeleteFile = (fieldId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = { ...uploads };
    delete next[fieldId];
    setUploads(next);
    const nextDocs = { ...state.businessData.businessDocuments };
    delete nextDocs[fieldId];
    updateBusinessData({ businessDocuments: nextDocs });
  };

  const handleContinue = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    nextStep();
    router.push('/(public)/signup-business/step-5');
  };

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    previousStep();
    router.back();
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    resetState();
    router.replace('/(auth)/dashboard');
  };

  return (
    <LoginBackground>
      <SafeAreaView style={styles.container}>
        {/* Fixed header – same structure as Business details: back, dots, title, subtitle */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              onPress={handleGoBack}
              style={styles.backButton}
              activeOpacity={0.7}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Ionicons name="arrow-back" size={24} color={FIGMA.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSkip}
              style={styles.skipButton}
              activeOpacity={0.7}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dotsRow}>
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

          <View style={styles.titleBlock}>
            <Text style={styles.title}>Business documentation</Text>
            <Text style={styles.subtitle}>
              Upload your official business documents to verify your company.
            </Text>
          </View>
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          {/* Scroll: only info section + document fields (same as Business details with inputs inside scroll) */}
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
              {/* Info section – file size and upload hint */}
              <View style={styles.infoBanner}>
                <Ionicons name="information-circle-outline" size={20} color={FIGMA.textPrimary} />
                <Text style={styles.infoBannerText}>
                  Files should be up to 4mb. You can upload one or multiple.
                </Text>
              </View>

              {/* Document upload fields – same idea as inputs on Business details */}
              {DOCUMENT_FIELDS.map((field) => {
                const hasFile = !!uploads[field.id];
                const isPicking = pickingFieldId === field.id;
                return (
                  <View key={field.id} style={styles.fieldBlock}>
                    <View style={styles.labelRow}>
                      <Text style={styles.label} numberOfLines={2}>
                        {field.label}
                      </Text>
                    </View>

                    {!hasFile && !isPicking && (
                      <TouchableOpacity
                        style={styles.fileRow}
                        onPress={() => handleChooseFile(field.id)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.chooseFileBtn}>
                          <Text style={styles.chooseFileText}>Choose file</Text>
                        </View>
                        <Text style={styles.noFileText} numberOfLines={1}>
                          No file chosen
                        </Text>
                      </TouchableOpacity>
                    )}

                    {isPicking && (
                      <View style={styles.fileRowChosen}>
                        <Ionicons name="checkmark-circle" size={24} color={FIGMA.textPrimary} style={styles.checkIcon} />
                        <Text style={styles.chosenFileLoadingText} numberOfLines={1}>
                          Chosen file...
                        </Text>
                        <ActivityIndicator size="small" color={FIGMA.textPrimary} />
                      </View>
                    )}

                    {hasFile && !isPicking && (
                      <View style={styles.fileRowChosen}>
                        <Ionicons name="checkmark-circle" size={24} color={FIGMA.textPrimary} style={styles.checkIcon} />
                        <Text style={styles.fileNameText} numberOfLines={1} ellipsizeMode="tail">
                          {getFileDisplayName(uploads[field.id])}
                        </Text>
                        <TouchableOpacity
                          style={styles.iconButton}
                          onPress={() => handleChooseFile(field.id)}
                          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                          <MdiEditOutlineIcon size={22} color="#E4E4E7" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.iconButton}
                          onPress={() => handleDeleteFile(field.id)}
                          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                          <Ionicons name="close" size={24} color={FIGMA.textPrimary} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </Animated.View>
          </ScrollView>

          {/* Fixed footer – same as Business details: border top + Continue button + terms */}
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
    </LoginBackground>
  );
}

/** Same layout as Business details: fixed header, scroll with form content, fixed footer */
const createStyles = () =>
  StyleSheet.create({
    container: { flex: 1 },
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
    backButton: { padding: 4 },
    skipButton: { padding: 4 },
    skipText: {
      fontSize: 14,
      fontWeight: '600',
      color: FIGMA.textPrimary,
      letterSpacing: 0.5,
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
    dotActive: { backgroundColor: FIGMA.dotActive },
    dotInactive: { backgroundColor: FIGMA.dotInactive },
    titleBlock: { gap: 12, alignSelf: 'stretch' },
    title: {
      fontWeight: '600',
      fontSize: 28,
      lineHeight: 34,
      color: FIGMA.textPrimary,
    },
    subtitle: {
      fontWeight: '500',
      fontSize: 16,
      lineHeight: 20,
      color: FIGMA.textLabel,
    },
    keyboardAvoidingView: { flex: 1 },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 0,
      flexGrow: 1,
    },
    formSection: { gap: 0 },
    infoBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: 8,
      marginBottom: 24,
    },
    infoBannerText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
      color: GuidelineColors.grayIron300,
      lineHeight: 20,
    },
    fieldBlock: {
      marginBottom: 24,
      gap: 8,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    label: {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
      color: GuidelineColors.grayIron300,
    },
    fileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 8,
      paddingRight: 12,
      paddingVertical: 0,
      minHeight: 56,
      backgroundColor: GuidelineColors.grayIron700,
      borderWidth: 1,
      borderColor: GuidelineColors.grayIron600,
      borderRadius: 8,
      gap: 12,
    },
    fileRowChosen: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 12,
      paddingRight: 12,
      paddingVertical: 12,
      minHeight: 56,
      backgroundColor: GuidelineColors.grayIron700,
      borderWidth: 1,
      borderColor: GuidelineColors.grayIron600,
      borderRadius: 8,
      gap: 6,
    },
    chooseFileBtn: {
      paddingVertical: 8,
      paddingHorizontal: 8,
      backgroundColor: GuidelineColors.grayIron200,
      borderWidth: 1,
      borderColor: GuidelineColors.grayIron600,
      borderRadius: 4,
    },
    chooseFileText: {
      fontSize: 14,
      fontWeight: '600',
      color: GuidelineColors.grayIron900,
    },
    noFileText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
      color: GuidelineColors.grayIron300,
    },
    loadingText: {
      fontSize: 14,
      fontWeight: '500',
      color: GuidelineColors.grayIron300,
    },
    checkIcon: {
      marginRight: 6,
    },
    fileNameText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
      color: FIGMA.textPrimary,
      marginRight: 6,
    },
    chosenFileLoadingText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
      color: GuidelineColors.grayIron300,
    },
    iconButton: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
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

      fontFamily: 'Inter',

    },
    termsText: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
      color: GuidelineColors.grayIron400,
      textAlign: 'center',
    },
    termsTextHighlight: {
      lineHeight: 20,
      color: FIGMA.textPrimary,
      fontWeight: '500',
    },
  });
