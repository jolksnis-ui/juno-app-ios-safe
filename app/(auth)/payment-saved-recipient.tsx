import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useStyles } from '../../src/hooks/useTheme';
import { Theme } from '../../src/types/theme';
import { getClientBalances, TokenExpiredError } from '../../src/services/balanceService';
import { FiatBalance } from '../../src/types/balance';
import {
  AttachmentFile,
  PAYMENT_CURRENCIES,
} from '../../src/types/payment';
import { getClientFee, SavedRecipient } from '../../src/services/paymentService';
import { authenticateForCryptoTransaction } from '../../src/services/biometricService';
import { useToast } from '../../src/contexts/ToastContext';

interface SavedRecipientFormData {
  selectedCurrency: {
    code: string;
    name: string;
    symbol: string;
  };
  amount: string;
  accountNickname: string;
  beneficiaryName: string;
  additionalInfo: string;
  reference: string;
  attachments: AttachmentFile[];
}

export default function PaymentSavedRecipientScreen() {
  const params = useLocalSearchParams();
  const styles = useStyles((theme: Theme) => createStyles(theme));
  const { showError } = useToast();
  
  // Parse recipient data from params
  const recipientData: SavedRecipient = JSON.parse(params.recipientData as string);
  
  // Balance data
  const [fiatBalances, setFiatBalances] = useState<FiatBalance[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState(true);
  
  // API data
  const [fee, setFee] = useState<number>(0);
  const [isLoadingFee, setIsLoadingFee] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState<SavedRecipientFormData>({
    selectedCurrency: PAYMENT_CURRENCIES.find(c => c.code === recipientData.currency) || PAYMENT_CURRENCIES[0],
    amount: '',
    accountNickname: recipientData.accountNickName,
    beneficiaryName: recipientData.beneficiaryName,
    additionalInfo: '',
    reference: '',
    attachments: [],
  });
  
  // UI state
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [amountError, setAmountError] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await Promise.all([
      loadFiatBalances(),
      loadClientFee(formData.selectedCurrency.code)
    ]);
  };

  const loadClientFee = async (currency: string) => {
    setIsLoadingFee(true);
    try {
      const response = await getClientFee('Payment', 'fiat', currency);
      setFee(response.percentFee);
    } catch (error) {
      console.error('Error loading client fee:', error);
      if (error instanceof TokenExpiredError) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [{ text: 'OK', onPress: () => router.replace('/(public)/login') }]
        );
      } else {
        showError('Failed to load fee data. Please try again.', 'Network Error');
      }
    } finally {
      setIsLoadingFee(false);
    }
  };

  const loadFiatBalances = async () => {
    setIsLoadingBalances(true);
    try {
      const response = await getClientBalances();
      setFiatBalances(response.clientBalanceList);
    } catch (error) {
      console.error('Error loading fiat balances:', error);
      if (error instanceof TokenExpiredError) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [{ text: 'OK', onPress: () => router.replace('/(public)/login') }]
        );
      } else {
        showError('Failed to load balances. Please try again.', 'Network Error');
      }
    } finally {
      setIsLoadingBalances(false);
    }
  };

  const getAvailableBalance = () => {
    const balance = fiatBalances.find(
      b => b.currencyShortName === formData.selectedCurrency.code
    );
    return balance?.balanceAmount || 0;
  };

  const handleCurrencyChange = async (currency: typeof PAYMENT_CURRENCIES[0]) => {
    setFormData(prev => ({ ...prev, selectedCurrency: currency, amount: '' }));
    setShowCurrencySelector(false);
    
    // Reload balance and fee for new currency
    await Promise.all([
      loadFiatBalances(),
      loadClientFee(currency.code)
    ]);
  };

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      return;
    }
    
    setFormData(prev => ({ ...prev, amount: cleanValue }));
    
    // Validate amount
    if (cleanValue && parseFloat(cleanValue) > 0) {
      const amount = parseFloat(cleanValue);
      const feeAmount = amount * fee / 100;
      const totalRequired = amount + feeAmount;
      if (totalRequired > getAvailableBalance()) {
        setAmountError('Insufficient balance including fees');
      } else {
        setAmountError(null);
      }
    } else {
      setAmountError(null);
    }
  };

  const handleInputChange = (field: keyof SavedRecipientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAttachFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const newAttachment: AttachmentFile = {
          id: Date.now().toString(),
          name: file.name,
          size: file.size || 0,
          type: file.mimeType || 'unknown',
          uri: file.uri,
        };

        setFormData(prev => ({
          ...prev,
          attachments: [...prev.attachments, newAttachment],
        }));
      }
    } catch (error) {
      console.error('Error picking document:', error);
      showError('Failed to attach file. Please try again.', 'General Error');
    }
  };

  const removeAttachment = (id: string) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(att => att.id !== id),
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setAmountError('Please enter a valid amount');
      return false;
    }

    const amount = parseFloat(formData.amount);
    const feeAmount = amount * fee / 100;
    const totalRequired = amount + feeAmount;
    if (totalRequired > getAvailableBalance()) {
      setAmountError('Insufficient balance including fees');
      return false;
    }

    return true;
  };

  const handleContinue = async () => {
    if (!validateForm()) {
      showError('Please enter a valid amount.', 'Validation Error');
      return;
    }

    try {
      setIsAuthenticating(true);
      
      // Mandatory biometric authentication (same as crypto transactions)
      const authResult = await authenticateForCryptoTransaction();
      // const authResult = { success: true, error: "" }
      
      if (authResult.success) {
        // Authentication successful - proceed to confirmation
        // Build complete form data for confirmation screen
        const completeFormData = {
          selectedCurrency: formData.selectedCurrency,
          amount: formData.amount,
          recipientName: recipientData.beneficiaryName,
          recipientCountry: { 
            _id: '', 
            code: '', 
            name: recipientData.beneficiaryCountry, 
            enabled: true, 
            __v: 0 
          },
          recipientAddress: recipientData.beneficiaryAddress,
          bankName: recipientData.bankName,
          bankCountry: { 
            _id: '', 
            code: '', 
            name: recipientData.bankCountry, 
            enabled: true, 
            __v: 0 
          },
          bankAddress: recipientData.bankAddress,
          saveRecipient: false, // Already saved
          recipientNickname: formData.accountNickname,
          accountNumber: '', // Not needed for saved recipients
          sortCode: recipientData.sortCode,
          iban: recipientData.iban,
          swiftCode: '', // Not in saved data
          paymentPurpose: '', // Not required for saved recipients
          reference: formData.reference,
          additionalInfo: formData.additionalInfo,
          attachments: formData.attachments,
        };

        // Navigate to confirmation screen
        router.push({
          pathname: '/(auth)/payment-out-confirm',
          params: {
            formData: JSON.stringify(completeFormData),
            fee: fee.toString()
          }
        });
      } else {
        // Authentication failed - show error and stay on form
        Alert.alert(
          'Authentication Required',
          authResult.error || 'Authentication failed. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert(
        'Authentication Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={styles.headerTitle.color} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PAYMENT OUT</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Currency and Amount Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PAY WITH</Text>
            <View style={styles.currencyAmountContainer}>
              <View style={styles.currencyContainer}>
                <TouchableOpacity
                  style={styles.currencySelector}
                  onPress={() => setShowCurrencySelector(!showCurrencySelector)}
                >
                  <Text style={styles.currencySymbol}>{formData.selectedCurrency.symbol}</Text>
                  <Text style={styles.currencyCode}>{formData.selectedCurrency.code}</Text>
                  <Ionicons name="chevron-down" size={16} color="#8E8E93" />
                </TouchableOpacity>
                <Text style={styles.currencyName}>{formData.selectedCurrency.name.toUpperCase()}</Text>
              </View>
              
              <View style={styles.amountContainer}>
                <TextInput
                  style={styles.amountInput}
                  value={formData.amount}
                  onChangeText={handleAmountChange}
                  placeholder="0.00"
                  placeholderTextColor="#666666"
                  keyboardType="numeric"
                />
                <Text style={styles.maxLabel}>MAX</Text>
              </View>
            </View>
            
            <View style={styles.balanceRow}>
              <Text style={styles.balanceText}>
                {isLoadingBalances ? 'Loading...' : `${formData.selectedCurrency.symbol}${getAvailableBalance().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </Text>
            </View>
            
            {amountError && (
              <Text style={styles.errorText}>{amountError}</Text>
            )}
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Account Nickname - Prefilled, Non-editable */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ACCOUNT NICKNAME</Text>
              <View style={styles.readOnlyInput}>
                <Text style={styles.readOnlyText}>{formData.accountNickname}</Text>
              </View>
            </View>

            {/* Beneficiary Name - Prefilled, Non-editable */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>BENEFICIARY NAME</Text>
              <View style={styles.readOnlyInput}>
                <Text style={styles.readOnlyText}>{formData.beneficiaryName}</Text>
              </View>
            </View>

            {/* Reference */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>REFERENCE</Text>
              <TextInput
                style={styles.textInput}
                value={formData.reference}
                onChangeText={(value) => handleInputChange('reference', value)}
                placeholder="Enter reference"
                placeholderTextColor="#666666"
              />
            </View>

            {/* Additional Info */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ADDITIONAL INFO</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.additionalInfo}
                onChangeText={(value) => handleInputChange('additionalInfo', value)}
                placeholder="Enter additional information"
                placeholderTextColor="#666666"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Attachments */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ATTACHMENTS</Text>
              <TouchableOpacity style={styles.attachButton} onPress={handleAttachFile}>
                <Ionicons name="attach" size={20} color="#00D4AA" />
                <Text style={styles.attachButtonText}>Attach Files</Text>
              </TouchableOpacity>

              {formData.attachments.length > 0 && (
                <View style={styles.attachmentsList}>
                  {formData.attachments.map((attachment) => (
                    <View key={attachment.id} style={styles.attachmentItem}>
                      <View style={styles.attachmentInfo}>
                        <Text style={styles.attachmentName}>{attachment.name}</Text>
                        <Text style={styles.attachmentSize}>{formatFileSize(attachment.size)}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeAttachmentButton}
                        onPress={() => removeAttachment(attachment.id)}
                      >
                        <Ionicons name="close" size={16} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.continueButton,
              isAuthenticating && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={isAuthenticating}
          >
            {isAuthenticating ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#000000" />
                <Text style={[styles.continueButtonText, { marginLeft: 8 }]}>AUTHENTICATING...</Text>
              </View>
            ) : (
              <Text style={styles.continueButtonText}>CONTINUE</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Currency Selector Modal */}
      <Modal
        visible={showCurrencySelector}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCurrencySelector(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Currency</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCurrencySelector(false)}
            >
              <Ionicons name="close" size={24} color={styles.modalTitle.color} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={PAYMENT_CURRENCIES}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => handleCurrencyChange(item)}
              >
                <View style={styles.modalItemInfo}>
                  <Text style={styles.modalItemFlag}>{item.flag}</Text>
                  <View style={styles.modalItemDetails}>
                    <Text style={styles.modalItemCode}>{item.code} - {item.name}</Text>
                    <Text style={styles.modalItemName}>{item.symbol}</Text>
                  </View>
                </View>
                {formData.selectedCurrency.code === item.code && (
                  <Ionicons name="checkmark" size={20} color="#00D4AA" />
                )}
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.code}
            style={styles.modalList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  currencyAmountContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  currencyContainer: {
    flex: 1,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: '#00D4AA',
    marginRight: 8,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginRight: 8,
  },
  currencyName: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  amountContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  amountInput: {
    fontSize: 32,
    fontWeight: '300',
    color: theme.colors.text,
    textAlign: 'right',
    minWidth: 100,
    marginBottom: 4,
  },
  maxLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  balanceRow: {
    alignItems: 'flex-end',
  },
  balanceText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text,
    minHeight: 56,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  readOnlyInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    minHeight: 56,
    justifyContent: 'center',
    opacity: 0.7,
  },
  readOnlyText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#00D4AA',
    borderStyle: 'dashed',
  },
  attachButtonText: {
    fontSize: 16,
    color: '#00D4AA',
    fontWeight: '500',
    marginLeft: 8,

    fontFamily: 'StagnanMedium',

  },
  attachmentsList: {
    marginTop: 12,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
    marginBottom: 2,
  },
  attachmentSize: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  removeAttachmentButton: {
    padding: 4,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  continueButton: {
    backgroundColor: theme.colors.buttonPrimary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.buttonText,

    fontFamily: 'StagnanMedium',

  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
    fontWeight: '500',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalItemFlag: {
    fontSize: 24,
    marginRight: 12,
    minWidth: 32,
  },
  modalItemDetails: {
    flex: 1,
  },
  modalItemCode: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  modalItemName: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});
