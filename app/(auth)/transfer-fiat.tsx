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
import { useStyles } from '../../src/hooks/useTheme';
import { Theme } from '../../src/types/theme';
import { getClientBalances, TokenExpiredError } from '../../src/services/balanceService';
import { FiatBalance } from '../../src/types/balance';
import {
  TransferFormData,
  TransferValidation,
  TRANSFER_CURRENCIES,
} from '../../src/types/transfer';
import { getClientFee, validateEmail } from '../../src/services/transferService';
import { authenticateForCryptoTransaction } from '../../src/services/biometricService';
import { useToast } from '../../src/contexts/ToastContext';

export default function TransferFiatScreen() {
  const styles = useStyles((theme: Theme) => createStyles(theme));
  const { showError } = useToast();
  
  // Balance data
  const [fiatBalances, setFiatBalances] = useState<FiatBalance[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState(true);
  
  // API data
  const [fee, setFee] = useState<number>(0);
  const [isLoadingFee, setIsLoadingFee] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState<TransferFormData>({
    selectedCurrency: TRANSFER_CURRENCIES[0], // Default to USD
    amount: '',
    email: '',
    reference: '',
  });
  
  // UI state
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [validation, setValidation] = useState<TransferValidation>({
    email: null,
    amount: null,
  });

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
      const response = await getClientFee('Transfer', 'fiat', currency);
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

  const handleCurrencyChange = async (currency: typeof TRANSFER_CURRENCIES[0]) => {
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
    
    // Validate amount including fee
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

  const handleInputChange = (field: keyof TransferFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (field === 'email' && validation.email) {
      setValidation(prev => ({ ...prev, email: null }));
    }
  };

  const validateForm = (): boolean => {
    const errors: TransferValidation = {
      email: null,
      amount: null,
    };

    // Validate email
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Validate amount including fee
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

    setValidation(errors);

    return !Object.values(errors).some(error => error !== null);
  };

  const handleContinue = async () => {
    if (!validateForm()) {
      showError('Please fill in all required fields correctly.', 'Validation Error');
      return;
    }

    try {
      // Validate email with API first
      const emailValidation = await validateEmail(formData.email);
      
      if (!emailValidation.emailExist) {
        Alert.alert('Invalid Email', 'No user found with this mail id');
        return;
      }

      // Now proceed with biometric authentication
      setIsAuthenticating(true);
      
      const authResult = await authenticateForCryptoTransaction();
      
      if (authResult.success) {
        // Authentication successful - proceed to confirmation
        router.push({
          pathname: '/(auth)/transfer-fiat-confirm',
          params: {
            formData: JSON.stringify(formData),
            fee: fee.toString(),
            recipientName: emailValidation.username || 'Unknown User'
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
      console.error('Error:', error);
      if (error instanceof TokenExpiredError) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [{ text: 'OK', onPress: () => router.replace('/(public)/login') }]
        );
      } else {
        Alert.alert(
          'Error',
          'An unexpected error occurred. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>TRANSFER</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={styles.headerTitle.color} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Currency and Amount Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TRANSFER WITH</Text>
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

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Email Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS *</Text>
              <TextInput
                style={[styles.textInput, validation.email && styles.inputError]}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="Enter recipient email address"
                placeholderTextColor="#666666"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {validation.email && (
                <Text style={styles.errorText}>{validation.email}</Text>
              )}
            </View>

            {/* Reference */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>REFERENCE</Text>
              <TextInput
                style={styles.textInput}
                value={formData.reference}
                onChangeText={(value) => handleInputChange('reference', value)}
                placeholder="Enter reference (optional)"
                placeholderTextColor="#666666"
              />
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
            data={TRANSFER_CURRENCIES}
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  closeButton: {
    padding: 4,
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
});
