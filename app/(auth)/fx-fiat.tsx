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
  FXFormData,
  FXValidation,
  FX_CURRENCIES,
} from '../../src/types/fx';
import { getFXClientFee, getFiatExchangeRate } from '../../src/services/fxService';
import { useAuthContext } from '../../src/contexts/AuthContext';
import { authenticateForCryptoTransaction } from '../../src/services/biometricService';
import { useToast } from '../../src/contexts/ToastContext';

export default function FXFiatScreen() {
  const styles = useStyles((theme: Theme) => createStyles(theme));
  const { user } = useAuthContext();
  const { showError } = useToast();
  
  // Balance data
  const [fiatBalances, setFiatBalances] = useState<FiatBalance[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState(true);
  
  // API data
  const [fee, setFee] = useState<number>(0);
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [isLoadingFee, setIsLoadingFee] = useState(false);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState<FXFormData>({
    fromCurrency: FX_CURRENCIES[0], // Default to USD
    toCurrency: FX_CURRENCIES[1], // Default to EUR
    fromAmount: '',
    toAmount: '',
    calculationMethod: 'fromAmount',
  });
  
  // UI state
  const [showFromCurrencySelector, setShowFromCurrencySelector] = useState(false);
  const [showToCurrencySelector, setShowToCurrencySelector] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [validation, setValidation] = useState<FXValidation>({
    fromAmount: null,
    toAmount: null,
  });
  const [lastEditedField, setLastEditedField] = useState<'from' | 'to'>('from');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    // Load exchange rate when currencies change
    if (formData.fromCurrency.code !== formData.toCurrency.code) {
      loadExchangeRate();
    }
  }, [formData.fromCurrency, formData.toCurrency]);

  const loadInitialData = async () => {
    await Promise.all([
      loadFiatBalances(),
      loadClientFee(),
      loadExchangeRate()
    ]);
  };

  const loadClientFee = async () => {
    setIsLoadingFee(true);
    try {
      const response = await getFXClientFee(
        'FX', 
        'fiat', 
        formData.fromCurrency.code, 
        formData.toCurrency.code
      );
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

  const loadExchangeRate = async () => {
    if (formData.fromCurrency.code === formData.toCurrency.code) {
      setExchangeRate(1);
      return;
    }

    setIsLoadingRate(true);
    try {
      const response = await getFiatExchangeRate(
        formData.fromCurrency.code,
        formData.toCurrency.code
      );
      setExchangeRate(response.fixedRate);
    } catch (error) {
      console.error('Error loading exchange rate:', error);
      if (error instanceof TokenExpiredError) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [{ text: 'OK', onPress: () => router.replace('/(public)/login') }]
        );
      } else {
        showError('Failed to load exchange rate. Please try again.', 'Network Error');
      }
    } finally {
      setIsLoadingRate(false);
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

  const getAvailableBalance = (currencyCode: string) => {
    const balance = fiatBalances.find(
      b => b.currencyShortName === currencyCode
    );
    return balance?.balanceAmount || 0;
  };

  const calculateWithFee = (rate: number, feePercent: number) => {
    return rate - (rate * feePercent / 100);
  };

  const calculateToAmount = (fromAmountValue: string) => {
    if (!fromAmountValue || !exchangeRate) return '';
    
    const fromAmountNum = parseFloat(fromAmountValue);
    if (isNaN(fromAmountNum) || fromAmountNum <= 0) return '';
    
    const adjustedRate = calculateWithFee(exchangeRate, fee);
    const toAmountNum = fromAmountNum * adjustedRate;
    return toAmountNum.toFixed(2);
  };

  const calculateFromAmount = (toAmountValue: string) => {
    if (!toAmountValue || !exchangeRate) return '';
    
    const toAmountNum = parseFloat(toAmountValue);
    if (isNaN(toAmountNum) || toAmountNum <= 0) return '';
    
    const adjustedRate = calculateWithFee(exchangeRate, fee);
    const fromAmountNum = toAmountNum / adjustedRate;
    return fromAmountNum.toFixed(2);
  };

  const handleFromCurrencyChange = async (currency: typeof FX_CURRENCIES[0]) => {
    setFormData(prev => ({ 
      ...prev, 
      fromCurrency: currency, 
      fromAmount: '', 
      toAmount: '' 
    }));
    setShowFromCurrencySelector(false);
    
    // Reload fee and exchange rate for new currency
    await Promise.all([
      loadClientFee(),
      loadExchangeRate()
    ]);
  };

  const handleToCurrencyChange = async (currency: typeof FX_CURRENCIES[0]) => {
    setFormData(prev => ({ 
      ...prev, 
      toCurrency: currency, 
      fromAmount: '', 
      toAmount: '' 
    }));
    setShowToCurrencySelector(false);
    
    // Reload fee and exchange rate for new currency pair
    await Promise.all([
      loadClientFee(),
      loadExchangeRate()
    ]);
  };

  const handleFromAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      return;
    }
    
    setLastEditedField('from');
    setFormData(prev => ({ 
      ...prev, 
      fromAmount: cleanValue, 
      calculationMethod: 'fromAmount' 
    }));
    
    // Calculate to amount
    const calculatedToAmount = calculateToAmount(cleanValue);
    setFormData(prev => ({ ...prev, toAmount: calculatedToAmount }));
    
    // Validate amount
    if (cleanValue && parseFloat(cleanValue) > getAvailableBalance(formData.fromCurrency.code)) {
      setValidation(prev => ({ ...prev, fromAmount: 'Insufficient balance' }));
    } else {
      setValidation(prev => ({ ...prev, fromAmount: null }));
    }
  };

  const handleToAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      return;
    }
    
    setLastEditedField('to');
    setFormData(prev => ({ 
      ...prev, 
      toAmount: cleanValue, 
      calculationMethod: 'toAmount' 
    }));
    
    // Calculate from amount
    const calculatedFromAmount = calculateFromAmount(cleanValue);
    setFormData(prev => ({ ...prev, fromAmount: calculatedFromAmount }));
    
    // Validate calculated from amount
    if (calculatedFromAmount && parseFloat(calculatedFromAmount) > getAvailableBalance(formData.fromCurrency.code)) {
      setValidation(prev => ({ ...prev, fromAmount: 'Insufficient balance' }));
    } else {
      setValidation(prev => ({ ...prev, fromAmount: null }));
    }
  };

  const validateForm = (): boolean => {
    const errors: FXValidation = {
      fromAmount: null,
      toAmount: null,
    };

    if (!formData.fromAmount || parseFloat(formData.fromAmount) <= 0) {
      errors.fromAmount = 'Please enter a valid amount';
    } else if (parseFloat(formData.fromAmount) > getAvailableBalance(formData.fromCurrency.code)) {
      errors.fromAmount = 'Insufficient balance';
    }

    if (!formData.toAmount || parseFloat(formData.toAmount) <= 0) {
      errors.toAmount = 'Please enter a valid amount';
    }

    if (formData.fromCurrency.code === formData.toCurrency.code) {
      errors.fromAmount = 'Please select different currencies';
    }

    setValidation(errors);

    return !Object.values(errors).some(error => error !== null);
  };

  const handleContinue = async () => {
    if (!validateForm()) {
      showError('Please check your input and try again.', 'Validation Error');
      return;
    }

    try {
      setIsAuthenticating(true);
      
      // Mandatory biometric authentication (same as crypto transactions)
      const authResult = await authenticateForCryptoTransaction();
      
      if (authResult.success) {
        // Authentication successful - proceed to confirmation
        router.push({
          pathname: '/(auth)/fx-fiat-confirm',
          params: {
            formData: JSON.stringify(formData),
            fee: fee.toString(),
            exchangeRate: exchangeRate.toString(),
            adjustedRate: calculateWithFee(exchangeRate, fee).toString()
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

  const getDisplayRate = () => {
    if (isLoadingRate) return 'Loading rate...';
    if (!exchangeRate) return 'Select currencies to see rate';
    
    const adjustedRate = calculateWithFee(exchangeRate, fee);
    return `1 ${formData.fromCurrency.code} = ${adjustedRate.toFixed(6)} ${formData.toCurrency.code}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>FX EXCHANGE</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={styles.headerTitle.color} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* From Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FROM</Text>
            <View style={styles.currencyRow}>
              <TouchableOpacity
                style={styles.currencySelector}
                onPress={() => setShowFromCurrencySelector(true)}
              >
                <Text style={styles.currencyFlag}>{formData.fromCurrency.flag}</Text>
                <View style={styles.currencyInfo}>
                  <Text style={styles.currencySymbol}>{formData.fromCurrency.symbol}</Text>
                  <Text style={styles.currencyCode}>{formData.fromCurrency.code}</Text>
                </View>
                <Ionicons name="chevron-down" size={16} color="#8E8E93" />
              </TouchableOpacity>
              
              <TextInput
                style={styles.amountInput}
                value={formData.fromAmount}
                onChangeText={handleFromAmountChange}
                placeholder="0.00"
                placeholderTextColor="#666666"
                keyboardType="numeric"
                editable={!isLoadingRate}
              />
            </View>
            
            <View style={styles.balanceRow}>
              <Text style={styles.currencyName}>{formData.fromCurrency.name.toUpperCase()}</Text>
              <Text style={styles.balanceText}>
                {isLoadingBalances ? 'Loading...' : 
                  `${formData.fromCurrency.symbol}${getAvailableBalance(formData.fromCurrency.code).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                }
              </Text>
            </View>
            
            {validation.fromAmount && (
              <Text style={styles.errorText}>{validation.fromAmount}</Text>
            )}
          </View>

          {/* To Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TO</Text>
            <View style={styles.currencyRow}>
              <TouchableOpacity
                style={styles.currencySelector}
                onPress={() => setShowToCurrencySelector(true)}
              >
                <Text style={styles.currencyFlag}>{formData.toCurrency.flag}</Text>
                <View style={styles.currencyInfo}>
                  <Text style={styles.currencySymbol}>{formData.toCurrency.symbol}</Text>
                  <Text style={styles.currencyCode}>{formData.toCurrency.code}</Text>
                </View>
                <Ionicons name="chevron-down" size={16} color="#8E8E93" />
              </TouchableOpacity>
              
              <TextInput
                style={styles.amountInput}
                value={formData.toAmount}
                onChangeText={handleToAmountChange}
                placeholder="0.00"
                placeholderTextColor="#666666"
                keyboardType="numeric"
                editable={!isLoadingRate}
              />
            </View>
            
            <View style={styles.balanceRow}>
              <Text style={styles.currencyName}>{formData.toCurrency.name.toUpperCase()}</Text>
              <Text style={styles.balanceText}>
                {isLoadingBalances ? 'Loading...' : 
                  `${formData.toCurrency.symbol}${getAvailableBalance(formData.toCurrency.code).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                }
              </Text>
            </View>
            
            {validation.toAmount && (
              <Text style={styles.errorText}>{validation.toAmount}</Text>
            )}
          </View>

          {/* Exchange Rate */}
          <View style={styles.exchangeRateContainer}>
            <Text style={styles.exchangeRateText}>{getDisplayRate()}</Text>
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.continueButton,
              (isLoadingRate || isLoadingFee || isAuthenticating) && styles.continueButtonDisabled
            ]} 
            onPress={handleContinue}
            disabled={isLoadingRate || isLoadingFee || isAuthenticating}
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

      {/* From Currency Selector Modal */}
      <Modal
        visible={showFromCurrencySelector}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFromCurrencySelector(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select From Currency</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowFromCurrencySelector(false)}
            >
              <Ionicons name="close" size={24} color={styles.modalTitle.color} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={FX_CURRENCIES.filter(c => c.code !== formData.toCurrency.code)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => handleFromCurrencyChange(item)}
              >
                <View style={styles.modalItemInfo}>
                  <Text style={styles.modalItemFlag}>{item.flag}</Text>
                  <View style={styles.modalItemDetails}>
                    <Text style={styles.modalItemCode}>{item.code} - {item.name}</Text>
                    <Text style={styles.modalItemName}>{item.symbol}</Text>
                  </View>
                </View>
                {formData.fromCurrency.code === item.code && (
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

      {/* To Currency Selector Modal */}
      <Modal
        visible={showToCurrencySelector}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowToCurrencySelector(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select To Currency</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowToCurrencySelector(false)}
            >
              <Ionicons name="close" size={24} color={styles.modalTitle.color} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={FX_CURRENCIES.filter(c => c.code !== formData.fromCurrency.code)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => handleToCurrencyChange(item)}
              >
                <View style={styles.modalItemInfo}>
                  <Text style={styles.modalItemFlag}>{item.flag}</Text>
                  <View style={styles.modalItemDetails}>
                    <Text style={styles.modalItemCode}>{item.code} - {item.name}</Text>
                    <Text style={styles.modalItemName}>{item.symbol}</Text>
                  </View>
                </View>
                {formData.toCurrency.code === item.code && (
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
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currencyFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
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
  amountInput: {
    fontSize: 32,
    fontWeight: '300',
    color: theme.colors.text,
    textAlign: 'right',
    flex: 1,
    marginLeft: 20,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currencyName: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  balanceText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  exchangeRateContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  exchangeRateText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
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
