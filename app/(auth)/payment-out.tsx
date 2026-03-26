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
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useStyles } from '../../src/hooks/useTheme';
import { Theme } from '../../src/types/theme';
import { getClientBalances, TokenExpiredError } from '../../src/services/balanceService';
import { FiatBalance } from '../../src/types/balance';
import {
  PaymentOutFormData,
  Country,
  AttachmentFile,
  PaymentOutValidation,
  PAYMENT_CURRENCIES,
  PAYMENT_PURPOSES,
} from '../../src/types/payment';
import { getClientFee, getCountries, getClientRecipients, SavedRecipient } from '../../src/services/paymentService';
import { authenticateForCryptoTransaction } from '../../src/services/biometricService';
import { useToast } from '../../src/contexts/ToastContext';

export default function PaymentOutScreen() {
  const styles = useStyles((theme: Theme) => createStyles(theme));
  const { showError } = useToast();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'new' | 'saved'>('new');
  
  // Balance data
  const [fiatBalances, setFiatBalances] = useState<FiatBalance[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState(true);
  
  // API data
  const [fee, setFee] = useState<number>(0);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [isLoadingFee, setIsLoadingFee] = useState(false);
  const [savedRecipients, setSavedRecipients] = useState<SavedRecipient[]>([]);
  const [isLoadingSavedRecipients, setIsLoadingSavedRecipients] = useState(true);
  
  // Form data
  const [formData, setFormData] = useState<PaymentOutFormData>({
    selectedCurrency: PAYMENT_CURRENCIES[0], // Default to USD
    amount: '',
    recipientName: '',
    recipientCountry: null,
    recipientAddress: '',
    bankName: '',
    bankCountry: null,
    bankAddress: '',
    saveRecipient: false,
    recipientNickname: '',
    accountNumber: '',
    sortCode: '',
    iban: '',
    swiftCode: '',
    paymentPurpose: '',
    reference: '',
    additionalInfo: '',
    attachments: [],
  });
  
  // UI state
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  const [showRecipientCountrySelector, setShowRecipientCountrySelector] = useState(false);
  const [showBankCountrySelector, setShowBankCountrySelector] = useState(false);
  const [showPaymentPurposeSelector, setShowPaymentPurposeSelector] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [validation, setValidation] = useState<PaymentOutValidation>({
    recipientName: null,
    recipientCountry: null,
    amount: null,
    bankCountry: null,
    recipientNickname: null,
    paymentPurpose: null,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await Promise.all([
      loadFiatBalances(),
      loadClientFee(formData.selectedCurrency.code),
      loadCountries(),
      loadSavedRecipients()
    ]);
  };

  const loadSavedRecipients = async () => {
    setIsLoadingSavedRecipients(true);
    try {
      const response = await getClientRecipients();
      setSavedRecipients(response);
      
      // Smart tab selection: if recipients exist, default to saved accounts
      if (response.length > 0) {
        setActiveTab('saved');
      }
    } catch (error) {
      console.error('Error loading saved recipients:', error);
      if (error instanceof TokenExpiredError) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [{ text: 'OK', onPress: () => router.replace('/(public)/login') }]
        );
      } else {
        // Don't show error for saved recipients - just continue with new recipient
        console.log('No saved recipients or API error - defaulting to new recipient');
      }
    } finally {
      setIsLoadingSavedRecipients(false);
    }
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

  const loadCountries = async () => {
    setIsLoadingCountries(true);
    try {
      const response = await getCountries(true);
      setCountries(response.allCountries);
    } catch (error) {
      console.error('Error loading countries:', error);
      if (error instanceof TokenExpiredError) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [{ text: 'OK', onPress: () => router.replace('/(public)/login') }]
        );
      } else {
        showError('Failed to load countries. Please try again.', 'Network Error');
      }
    } finally {
      setIsLoadingCountries(false);
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
        setValidation(prev => ({ ...prev, amount: 'Insufficient balance including fees' }));
      } else {
        setValidation(prev => ({ ...prev, amount: null }));
      }
    } else {
      setValidation(prev => ({ ...prev, amount: null }));
    }
  };

  const handleInputChange = (field: keyof PaymentOutFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (field === 'recipientName' && validation.recipientName) {
      setValidation(prev => ({ ...prev, recipientName: null }));
    }
    if (field === 'paymentPurpose' && validation.paymentPurpose) {
      setValidation(prev => ({ ...prev, paymentPurpose: null }));
    }
  };

  const handleCountrySelect = (country: Country, field: 'recipientCountry' | 'bankCountry') => {
    setFormData(prev => ({ ...prev, [field]: country }));
    
    if (field === 'recipientCountry') {
      setShowRecipientCountrySelector(false);
      if (validation.recipientCountry) {
        setValidation(prev => ({ ...prev, recipientCountry: null }));
      }
    } else {
      setShowBankCountrySelector(false);
      if (validation.bankCountry) {
        setValidation(prev => ({ ...prev, bankCountry: null }));
      }
    }
  };

  const handlePaymentPurposeSelect = (purpose: string) => {
    setFormData(prev => ({ ...prev, paymentPurpose: purpose }));
    setShowPaymentPurposeSelector(false);
    if (validation.paymentPurpose) {
      setValidation(prev => ({ ...prev, paymentPurpose: null }));
    }
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
    const errors: PaymentOutValidation = {
      recipientName: null,
      recipientCountry: null,
      amount: null,
      bankCountry: null,
      recipientNickname: null,
      paymentPurpose: null,
    };

    if (!formData.recipientName.trim()) {
      errors.recipientName = 'Recipient name is required';
    }

    if (!formData.recipientCountry) {
      errors.recipientCountry = 'Recipient country is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = 'Please enter a valid amount';
    } else {
      const amount = parseFloat(formData.amount);
      const feeAmount = amount * fee / 100;
      const totalRequired = amount + feeAmount;
      if (totalRequired > getAvailableBalance()) {
        errors.amount = 'Insufficient balance including fees';
      }
    }

    if (!formData.bankCountry) {
      errors.bankCountry = 'Bank country is required';
    }

    // Validate recipient nickname if save recipient is checked
    if (formData.saveRecipient && !formData.recipientNickname.trim()) {
      errors.recipientNickname = 'Recipient nickname is required when saving recipient';
    }

    setValidation(errors);
    console.log(errors)

    return !Object.values(errors).some(error => error !== null);
  };

  const handleContinue = async () => {
    if (!validateForm()) {
      showError('Please fill in all required fields correctly.', 'Validation Error');
      return;
    }

    try {
      setIsAuthenticating(true);
      
      // Mandatory biometric authentication (same as crypto transactions)
      const authResult = await authenticateForCryptoTransaction();
      
      if (authResult.success) {
        // Authentication successful - proceed to confirmation
        router.push({
          pathname: '/(auth)/payment-out-confirm',
          params: {
            formData: JSON.stringify(formData),
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

  const handleClose = () => {
    router.back();
  };

  const handleSavedRecipientSelect = (recipient: SavedRecipient) => {
    // Navigate to saved recipient form screen
    console.log('Selected recipient:', recipient);
    router.push({
      pathname: '/(auth)/payment-saved-recipient',
      params: {
        recipientData: JSON.stringify(recipient)
      }
    });
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
          <Text style={styles.headerTitle}>PAYMENT OUT</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={styles.headerTitle.color} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'new' && styles.activeTab]}
            onPress={() => setActiveTab('new')}
          >
            <Text style={[styles.tabText, activeTab === 'new' && styles.activeTabText]}>
              NEW RECIPIENT
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'saved' && styles.activeTab]}
            onPress={() => setActiveTab('saved')}
          >
            <Text style={[styles.tabText, activeTab === 'saved' && styles.activeTabText]}>
              SAVED RECIPIENTS
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Currency and Amount Section - Only show for New Recipient tab */}
          {activeTab === 'new' && (
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
              
              {validation.amount && (
                <Text style={styles.errorText}>{validation.amount}</Text>
              )}
            </View>
          )}

          {activeTab === 'new' ? (
            // Form Fields
            <View style={styles.formContainer}>
            {/* Recipient Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>RECIPIENT NAME</Text>
              <TextInput
                style={[styles.textInput, validation.recipientName && styles.inputError]}
                value={formData.recipientName}
                onChangeText={(value) => handleInputChange('recipientName', value)}
                placeholder="Enter recipient name"
                placeholderTextColor="#666666"
              />
              {validation.recipientName && (
                <Text style={styles.errorText}>{validation.recipientName}</Text>
              )}
            </View>

            {/* Recipient Country */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>RECIPIENT COUNTRY</Text>
              <TouchableOpacity
                style={[styles.dropdown, validation.recipientCountry && styles.inputError]}
                onPress={() => setShowRecipientCountrySelector(!showRecipientCountrySelector)}
              >
                <Text style={styles.dropdownText}>
                  {formData.recipientCountry 
                    ? formData.recipientCountry.name
                    : 'Select country'
                  }
                </Text>
                <Ionicons name="chevron-down" size={16} color="#8E8E93" />
              </TouchableOpacity>
              {validation.recipientCountry && (
                <Text style={styles.errorText}>{validation.recipientCountry}</Text>
              )}
            </View>

            {/* Recipient Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>RECIPIENT ADDRESS</Text>
              <TextInput
                style={styles.textInput}
                value={formData.recipientAddress}
                onChangeText={(value) => handleInputChange('recipientAddress', value)}
                placeholder="Enter recipient address"
                placeholderTextColor="#666666"
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Bank Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>BANK NAME</Text>
              <TextInput
                style={styles.textInput}
                value={formData.bankName}
                onChangeText={(value) => handleInputChange('bankName', value)}
                placeholder="Enter bank name"
                placeholderTextColor="#666666"
              />
            </View>

            {/* Bank Country */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>BANK COUNTRY</Text>
              <TouchableOpacity
                style={[styles.dropdown, validation.bankCountry && styles.inputError]}
                onPress={() => setShowBankCountrySelector(!showBankCountrySelector)}
              >
                <Text style={styles.dropdownText}>
                  {formData.bankCountry 
                    ? formData.bankCountry.name
                    : 'Select country'
                  }
                </Text>
                <Ionicons name="chevron-down" size={16} color="#8E8E93" />
              </TouchableOpacity>
              {validation.bankCountry && (
                <Text style={styles.errorText}>{validation.bankCountry}</Text>
              )}
            </View>

            {/* Bank Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>BANK ADDRESS</Text>
              <TextInput
                style={styles.textInput}
                value={formData.bankAddress}
                onChangeText={(value) => handleInputChange('bankAddress', value)}
                placeholder="Enter bank address"
                placeholderTextColor="#666666"
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Save Recipient Checkbox */}
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => {
                  setFormData(prev => ({ 
                    ...prev, 
                    saveRecipient: !prev.saveRecipient,
                    recipientNickname: !prev.saveRecipient ? prev.recipientNickname : '' // Clear nickname when unchecking
                  }));
                  // Clear validation error when unchecking
                  if (formData.saveRecipient && validation.recipientNickname) {
                    setValidation(prev => ({ ...prev, recipientNickname: null }));
                  }
                }}
              >
                <View style={[styles.checkboxBox, formData.saveRecipient && styles.checkboxChecked]}>
                  {formData.saveRecipient && (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>SAVE THIS RECIPIENT</Text>
              </TouchableOpacity>
            </View>

            {/* Recipient Nickname - Conditional Field */}
            {formData.saveRecipient && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>RECIPIENT NICKNAME *</Text>
                <TextInput
                  style={[styles.textInput, validation.recipientNickname && styles.inputError]}
                  value={formData.recipientNickname}
                  onChangeText={(value) => {
                    handleInputChange('recipientNickname', value);
                    // Clear validation error when user starts typing
                    if (validation.recipientNickname) {
                      setValidation(prev => ({ ...prev, recipientNickname: null }));
                    }
                  }}
                  placeholder="Enter recipient nickname"
                  placeholderTextColor="#666666"
                />
                {validation.recipientNickname && (
                  <Text style={styles.errorText}>{validation.recipientNickname}</Text>
                )}
              </View>
            )}

            {/* Account Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ACCOUNT NUMBER</Text>
              <TextInput
                style={styles.textInput}
                value={formData.accountNumber}
                onChangeText={(value) => handleInputChange('accountNumber', value)}
                placeholder="Enter account number"
                placeholderTextColor="#666666"
              />
            </View>

            {/* Sort Code */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>SORT CODE</Text>
              <TextInput
                style={styles.textInput}
                value={formData.sortCode}
                onChangeText={(value) => handleInputChange('sortCode', value)}
                placeholder="Enter sort code"
                placeholderTextColor="#666666"
              />
            </View>

            {/* IBAN */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>IBAN</Text>
              <TextInput
                style={styles.textInput}
                value={formData.iban}
                onChangeText={(value) => handleInputChange('iban', value)}
                placeholder="Enter IBAN"
                placeholderTextColor="#666666"
              />
            </View>

            {/* Swift Code */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>SWIFT CODE</Text>
              <TextInput
                style={styles.textInput}
                value={formData.swiftCode}
                onChangeText={(value) => handleInputChange('swiftCode', value)}
                placeholder="Enter Swift code"
                placeholderTextColor="#666666"
              />
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
          ) : (
            // Saved Recipients List
            <View style={styles.savedRecipientsContainer}>
              {isLoadingSavedRecipients ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#00D4AA" />
                  <Text style={styles.loadingText}>Loading saved recipients...</Text>
                </View>
              ) : savedRecipients.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="folder-open-outline" size={48} color="#8E8E93" />
                  <Text style={styles.emptyTitle}>No Saved Recipients</Text>
                  <Text style={styles.emptySubtitle}>You haven't saved any recipients yet. Use the "NEW RECIPIENT" tab to add one.</Text>
                </View>
              ) : (
                savedRecipients.map((recipient) => (
                  <TouchableOpacity 
                    key={recipient._id} 
                    style={styles.savedRecipientCard}
                    onPress={() => handleSavedRecipientSelect(recipient)}
                  >
                    <View style={styles.savedRecipientHeader}>
                      <View style={styles.savedRecipientIcon}>
                        <Ionicons name="person" size={20} color="#FFFFFF" />
                      </View>
                      <View style={styles.savedRecipientInfo}>
                        <Text style={styles.savedRecipientName}>{recipient.accountNickName}</Text>
                        <Text style={styles.savedRecipientBeneficiary}>{recipient.beneficiaryName}</Text>
                        <Text style={styles.savedRecipientDetails}>
                          {recipient.bankName} • {recipient.beneficiaryCountry}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </ScrollView>

        {/* Continue Button - Only show for New Recipient tab */}
        {activeTab === 'new' && (
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
        )}
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

      {/* Recipient Country Selector Modal */}
      <Modal
        visible={showRecipientCountrySelector}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRecipientCountrySelector(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Recipient Country</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowRecipientCountrySelector(false)}
            >
              <Ionicons name="close" size={24} color={styles.modalTitle.color} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={countries}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => handleCountrySelect(item, 'recipientCountry')}
              >
                <View style={styles.modalItemInfo}>
                  <View style={styles.modalItemDetails}>
                    <Text style={styles.modalItemCode}>{item.name}</Text>
                    <Text style={styles.modalItemName}>{item.code}</Text>
                  </View>
                </View>
                {formData.recipientCountry?.code === item.code && (
                  <Ionicons name="checkmark" size={20} color="#00D4AA" />
                )}
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item._id}
            style={styles.modalList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>

      {/* Bank Country Selector Modal */}
      <Modal
        visible={showBankCountrySelector}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBankCountrySelector(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Bank Country</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowBankCountrySelector(false)}
            >
              <Ionicons name="close" size={24} color={styles.modalTitle.color} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={countries}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => handleCountrySelect(item, 'bankCountry')}
              >
                <View style={styles.modalItemInfo}>
                  <View style={styles.modalItemDetails}>
                    <Text style={styles.modalItemCode}>{item.name}</Text>
                    <Text style={styles.modalItemName}>{item.code}</Text>
                  </View>
                </View>
                {formData.bankCountry?.code === item.code && (
                  <Ionicons name="checkmark" size={20} color="#00D4AA" />
                )}
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item._id}
            style={styles.modalList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>

      {/* Payment Purpose Selector Modal */}
      <Modal
        visible={showPaymentPurposeSelector}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPaymentPurposeSelector(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Payment Purpose</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowPaymentPurposeSelector(false)}
            >
              <Ionicons name="close" size={24} color={styles.modalTitle.color} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={PAYMENT_PURPOSES}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => handlePaymentPurposeSelect(item)}
              >
                <View style={styles.modalItemInfo}>
                  <View style={styles.modalItemDetails}>
                    <Text style={styles.modalItemCode}>{item}</Text>
                  </View>
                </View>
                {formData.paymentPurpose === item && (
                  <Ionicons name="checkmark" size={20} color="#00D4AA" />
                )}
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item}
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  closeButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: theme.colors.surface,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  activeTabText: {
    color: '#000000',
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
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    minHeight: 56,
  },
  dropdownText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  checkboxContainer: {
    marginBottom: 20,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#00D4AA',
    borderColor: '#00D4AA',
  },
  checkboxLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
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
  inputError: {
    borderWidth: 1,
    borderColor: '#FF3B30',
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
  // Saved Recipients styles
  savedRecipientsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  savedRecipientCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  savedRecipientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savedRecipientIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00D4AA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  savedRecipientInfo: {
    flex: 1,
  },
  savedRecipientName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  savedRecipientBeneficiary: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  savedRecipientDetails: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '400',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
