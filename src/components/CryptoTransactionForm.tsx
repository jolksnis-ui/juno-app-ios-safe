import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CurrencySelector } from './CurrencySelector';
import { Currency, SUPPORTED_CURRENCIES } from '../types/exchange';
import { TransactionType, TRANSACTION_CONFIGS } from '../types/transaction';
import { authenticateForCryptoTransaction } from '../services/biometricService';
import { getExchangeDataForPair, calculateBidirectional, calculateBidirectionalForExchange } from '../services/exchangeService';
import { getClientBalances, getCryptoBalances } from '../services/balanceService';
import { getUserData } from '../services/secureStorage';
import { FiatBalance, CryptoBalance } from '../types/balance';
import { useStyles } from '../hooks/useTheme';
import { Theme } from '../types/theme';
import { useToast } from '../contexts/ToastContext';

interface CryptoTransactionFormProps {
  transactionType: TransactionType;
  onContinue: (data: any) => void;
  onClose: () => void;
}

export const CryptoTransactionForm: React.FC<CryptoTransactionFormProps> = ({
  transactionType,
  onContinue,
  onClose
}) => {
  const config = TRANSACTION_CONFIGS[transactionType];
  const styles = useStyles((theme: Theme) => createStyles(theme));
  const { showError } = useToast();
  
  // Initialize currencies based on transaction type
  const getInitialCurrencies = () => {
    if (transactionType === 'buy') {
      return {
        from: SUPPORTED_CURRENCIES.USD,
        to: SUPPORTED_CURRENCIES.ETH
      };
    } else if (transactionType === 'sell') {
      return {
        from: SUPPORTED_CURRENCIES.ETH,
        to: SUPPORTED_CURRENCIES.USD
      };
    } else {
      // exchange
      return {
        from: SUPPORTED_CURRENCIES.ETH,
        to: SUPPORTED_CURRENCIES.BTC
      };
    }
  };

  const initialCurrencies = getInitialCurrencies();
  
  // Currency and amount state
  const [fromCurrency, setFromCurrency] = useState<Currency>(initialCurrencies.from);
  const [toCurrency, setToCurrency] = useState<Currency>(initialCurrencies.to);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  
  // API and calculation state
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [feePercent, setFeePercent] = useState<number | null>(null);
  const [displayRate, setDisplayRate] = useState<string>('');
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [canContinue, setCanContinue] = useState(false);
  const [lastEditedField, setLastEditedField] = useState<'from' | 'to'>('from');
  
  // Balance state
  const [fiatBalances, setFiatBalances] = useState<FiatBalance[]>([]);
  const [cryptoBalances, setCryptoBalances] = useState<CryptoBalance[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  
  // Balance validation state
  const [fromBalanceError, setFromBalanceError] = useState<string>('');
  const [toBalanceError, setToBalanceError] = useState<string>('');
  
  // User data
  const [userEmail, setUserEmail] = useState<string>('');
  const [clientId, setClientId] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');

  // Load user data and balances on mount
  useEffect(() => {
    loadUserDataAndBalances();
  }, []);

  // Load exchange rates when currencies change
  useEffect(() => {
    if (fromCurrency && toCurrency && userEmail && clientId) {
      loadExchangeRates();
    }
  }, [fromCurrency, toCurrency, userEmail, clientId]);


  const loadUserDataAndBalances = async () => {
    try {
      setIsLoadingBalances(true);
      
      // Get user data
      const userData = await getUserData();
      if (userData) {
        setUserEmail(userData.clientEmail);
        setClientId(userData.clientId);
        setAccountNumber(userData.accountNumber);
      }
      
      // Load balances in parallel
      const [fiatResponse, cryptoResponse] = await Promise.all([
        getClientBalances(),
        getCryptoBalances()
      ]);
      
      setFiatBalances(fiatResponse.clientBalanceList);
      setCryptoBalances(cryptoResponse.clientBalanceList);
    } catch (error) {
      console.error('Error loading balances:', error);
      showError('Failed to load account balances', 'Network Error');
    } finally {
      setIsLoadingBalances(false);
    }
  };

  const loadExchangeRates = async () => {
    try {
      setIsLoadingRates(true);
      setCanContinue(false);
      setFromAmount('');
      setToAmount('');
      
      // Handle different transaction types
      let rateCurrency1, rateCurrency2;
      
      if (transactionType === 'sell') {
        // Selling crypto for fiat - need crypto to fiat rate
        rateCurrency1 = toCurrency.code; // fiat
        rateCurrency2 = fromCurrency.code; // crypto
      } else if (transactionType === 'exchange') {
        // Exchanging crypto to crypto - treat as buying target crypto with source crypto
        rateCurrency1 = fromCurrency.code; // source crypto (acts as "fiat")
        rateCurrency2 = toCurrency.code; // target crypto
      } else {
        // Buying crypto with fiat - need fiat to crypto rate
        rateCurrency1 = fromCurrency.code; // fiat
        rateCurrency2 = toCurrency.code; // crypto
      }
      
      const exchangeData = await getExchangeDataForPair(
        rateCurrency1,
        rateCurrency2,
        userEmail,
        clientId,
        transactionType
      );
      
      setExchangeRate(exchangeData.exchangeRate);
      setFeePercent(exchangeData.feePercent);
      setDisplayRate(exchangeData.displayRate);
    } catch (error) {
      console.error('Error loading exchange rates:', error);
      showError('Failed to load exchange rates', 'Network Error');
      setExchangeRate(null);
      setFeePercent(null);
      setDisplayRate('');
    } finally {
      setIsLoadingRates(false);
    }
  };

  const calculateToAmountWithValue = (fromAmountValue: string) => {
    console.log("=============calculateToAmountWithValue================");
    console.log("fromAmountValue:", fromAmountValue);
    
    if (!fromAmountValue || !exchangeRate || feePercent === null) return;
    
    setIsCalculating(true);
    
    try {
      const fromAmountNum = parseFloat(fromAmountValue.replace(/,/g, ''));
      if (isNaN(fromAmountNum) || fromAmountNum <= 0) {
        setToAmount('');
        setCanContinue(false);
        return;
      }
      
      // Determine input type based on transaction type and from currency
      const inputType = fromCurrency.type;
      console.log("transactionType:", transactionType);
      
      if (transactionType === 'buy' || transactionType === 'sell') {
        console.log("Processing buy/sell transaction");
        const result = calculateBidirectional(
          fromAmountNum, 
          inputType, 
          exchangeRate, 
          feePercent, 
          transactionType
        );

        if (transactionType === 'buy') {
          // Buy: from=fiat, to=crypto
          const formattedAmount = result.cryptoAmount.toFixed(8);
          setToAmount(formattedAmount);
        } else {
          // Sell: from=crypto, to=fiat
          const formattedAmount = result.fiatAmount.toFixed(2);
          setToAmount(formattedAmount);
        }
      } else {
        console.log("Processing exchange transaction");
        const result = calculateBidirectionalForExchange(
          fromAmountNum, 
          "fromCrypto",
          exchangeRate, 
          feePercent, 
          transactionType
        );
        const formattedAmount = result.toCryptoAmount.toFixed(8);
        setToAmount(formattedAmount);
      }
      
      setCanContinue(true);
    } catch (error) {
      console.error('Error calculating to amount:', error);
      setToAmount('');
      setCanContinue(false);
    } finally {
      setIsCalculating(false);
    }
  };

  const calculateFromAmountWithValue = (toAmountValue: string) => {
    console.log("=============calculateFromAmountWithValue================");
    console.log("toAmountValue:", toAmountValue);
    
    if (!toAmountValue || !exchangeRate || feePercent === null) return;
    
    setIsCalculating(true);
    
    try {
      const toAmountNum = parseFloat(toAmountValue.replace(/,/g, ''));
      if (isNaN(toAmountNum) || toAmountNum <= 0) {
        setFromAmount('');
        setCanContinue(false);
        return;
      }
      
      // Determine input type based on transaction type and to currency
      const inputType = toCurrency.type;
      console.log("transactionType:", transactionType);
      
      if (transactionType === 'buy' || transactionType === 'sell') {
        console.log("Processing buy/sell reverse calculation");
        const result = calculateBidirectional(
          toAmountNum, 
          inputType, 
          exchangeRate, 
          feePercent, 
          transactionType
        );
        
        // Set the appropriate amount based on transaction type
        if (transactionType === 'buy') {
          // Buy: from=fiat, to=crypto
          const formattedAmount = result.fiatAmount.toFixed(2);
          setFromAmount(formattedAmount);
        } else {
          // Sell: from=crypto, to=fiat
          const formattedAmount = result.cryptoAmount.toFixed(8);
          setFromAmount(formattedAmount);
        }
      } else {
        console.log("Processing exchange reverse calculation");
        const result = calculateBidirectionalForExchange(
          toAmountNum, 
          "toCrypto",
          exchangeRate, 
          feePercent, 
          transactionType
        );
        const formattedAmount = result.fromCryptoAmount.toFixed(8);
        setFromAmount(formattedAmount);
      }
            
      setCanContinue(true);
    } catch (error) {
      console.error('Error calculating from amount:', error);
      setFromAmount('');
      setCanContinue(false);
    } finally {
      setIsCalculating(false);
    }
  };

  const calculateToAmount = () => {
    console.log("=============calculateToAmount (legacy)================");
    console.log("fromAmount:", fromAmount);
    
    // Use the new function with the current state value
    calculateToAmountWithValue(fromAmount);
  };

  const calculateFromAmount = () => {
    console.log("=============calculateFromAmount (legacy)================");
    console.log("toAmount:", toAmount);
    
    // Use the new function with the current state value
    calculateFromAmountWithValue(toAmount);
  };


  const getBalanceForCurrency = (currency: Currency): number => {
    if (currency.type === 'fiat') {
      const balance = fiatBalances.find(b => b.currencyShortName === currency.code);
      return balance ? balance.balanceAmount : 0;
    } else {
      const balance = cryptoBalances.find(b => b.currencyShortName === currency.code);
      return balance ? balance.balanceAmount : 0;
    }
  };

  const formatBalance = (amount: number, currency: Currency) => {
    if (currency.type === 'fiat') {
      return `${currency.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}`;
    }
  };

  const validateFromAmount = (amount: string): boolean => {
    if (!amount || amount === '0') {
      setFromBalanceError('');
      return true;
    }
    
    const numAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
      setFromBalanceError('');
      return true;
    }
    
    const balance = getBalanceForCurrency(fromCurrency);
    if (numAmount > balance) {
      setFromBalanceError('Amount entered exceeds available balance');
      return false;
    }
    
    setFromBalanceError('');
    return true;
  };

  const validateToAmount = (amount: string): boolean => {
    if (!amount || amount === '0') {
      setToBalanceError('');
      return true;
    }
    
    const numAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
      setToBalanceError('');
      return true;
    }
    
    const balance = getBalanceForCurrency(toCurrency);
    if (numAmount > balance) {
      setToBalanceError('Amount entered exceeds available balance');
      return false;
    }
    
    setToBalanceError('');
    return true;
  };

  const handleFromCurrencyChange = (currency: Currency) => {
    setFromCurrency(currency);
    setFromAmount('');
    setToAmount('');
    setFromBalanceError('');
    setToBalanceError('');
    setCanContinue(false);
  };

  const handleToCurrencyChange = (currency: Currency) => {
    setToCurrency(currency);
    setFromAmount('');
    setToAmount('');
    setFromBalanceError('');
    setToBalanceError('');
    setCanContinue(false);
  };

  const handleFromAmountChange = (amount: string) => {
    const cleanAmount = amount.replace(/[^0-9.]/g, '');
    setLastEditedField('from');
    setFromAmount(cleanAmount);
    
    // Validate from amount
    const isFromValid = validateFromAmount(cleanAmount);
    
    // Clear to amount error when editing from amount
    setToBalanceError('');
    
    // Calculate to amount directly with the actual value
    if (cleanAmount && exchangeRate && feePercent !== null) {
      calculateToAmountWithValue(cleanAmount);
      // Update canContinue based on validation
      setCanContinue(isFromValid);
    } else {
      setToAmount('');
      setCanContinue(false);
    }
  };

  const handleToAmountChange = (amount: string) => {
    const cleanAmount = amount.replace(/[^0-9.]/g, '');
    setLastEditedField('to');
    setToAmount(cleanAmount);
    
    // Validate to amount
    const isToValid = validateToAmount(cleanAmount);
    
    // Clear from amount error when editing to amount
    setFromBalanceError('');
    
    // Calculate from amount directly with the actual value
    if (cleanAmount && exchangeRate && feePercent !== null) {
      calculateFromAmountWithValue(cleanAmount);
      // Update canContinue based on validation
      setCanContinue(isToValid);
    } else {
      setFromAmount('');
      setCanContinue(false);
    }
  };

  const handleContinue = async () => {
    if (!canContinue || !exchangeRate || feePercent === null) {
      Alert.alert('Error', 'Please wait for exchange rates to load');
      return;
    }

    // Check for balance validation errors
    if (fromBalanceError || toBalanceError) {
      showError('Please resolve balance validation errors before continuing', 'Validation Error');
      return;
    }

    try {
      setIsAuthenticating(true);
      
      // Mandatory biometric authentication
      const authResult = await authenticateForCryptoTransaction();
      // const authResult = { success: true, error: "" }
      
      if (authResult.success) {
        // Authentication successful - proceed to confirmation
        const data = {
          transactionType,
          fromCurrency,
          toCurrency,
          fromAmount,
          toAmount,
          exchangeRate,
          feePercent,
          fromBalance: getBalanceForCurrency(fromCurrency),
          toBalance: getBalanceForCurrency(toCurrency),
          lastEditedField,
          userEmail,
          clientId,
          accountNumber,
          originalFromAmount: lastEditedField === 'from' ? fromAmount : '',
          originalToAmount: lastEditedField === 'to' ? toAmount : ''
        };
        console.log("lastEditedField", lastEditedField, "originalFromAmount", data.originalFromAmount, "fromAmount", fromAmount)
        onContinue(data);
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{config.headerTitle}</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={styles.headerTitle.color} />
        </TouchableOpacity>
      </View>

      {/* From Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{config.fromLabel}</Text>
        </View>
        
        <View style={styles.currencyRow}>
          <CurrencySelector
            selectedCurrency={fromCurrency}
            onCurrencySelect={handleFromCurrencyChange}
            filterType={config.fromCurrencyType}
            style={styles.currencySelector}
          />
          <TextInput
            style={styles.amountInput}
            value={fromAmount}
            onChangeText={handleFromAmountChange}
            placeholder={"0"}
            placeholderTextColor="#8E8E93"
            keyboardType="numeric"
            editable={!isLoadingRates}
          />
        </View>
        
        <View style={styles.balanceRow}>
          <Text style={styles.currencyName}>{fromCurrency.name.toUpperCase()}</Text>
          {isLoadingBalances ? (
            <ActivityIndicator size="small" color="#8E8E93" />
          ) : (
            <Text style={styles.balanceText}>
              {formatBalance(getBalanceForCurrency(fromCurrency), fromCurrency)}
            </Text>
          )}
        </View>
        
        {/* From Amount Error Message */}
        {fromBalanceError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{fromBalanceError}</Text>
          </View>
        ) : null}
      </View>

      {/* To Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{config.toLabel}</Text>
        </View>
        
        <View style={styles.currencyRow}>
          <CurrencySelector
            selectedCurrency={toCurrency}
            onCurrencySelect={handleToCurrencyChange}
            filterType={config.toCurrencyType}
            style={styles.currencySelector}
          />
          <TextInput
            style={styles.amountInput}
            value={toAmount}
            onChangeText={handleToAmountChange}
            placeholder={"0"}
            placeholderTextColor="#8E8E93"
            keyboardType="numeric"
            editable={!isLoadingRates && !isCalculating}
          />
        </View>
        
        <View style={styles.balanceRow}>
          <Text style={styles.currencyName}>{toCurrency.name.toUpperCase()}</Text>
          {isLoadingBalances ? (
            <ActivityIndicator size="small" color="#8E8E93" />
          ) : (
            <Text style={styles.balanceText}>
              {formatBalance(getBalanceForCurrency(toCurrency), toCurrency)}
            </Text>
          )}
        </View>
        
        {/* To Amount Error Message */}
        {toBalanceError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{toBalanceError}</Text>
          </View>
        ) : null}
      </View>

      {/* Exchange Rate */}
      <View style={styles.exchangeRateContainer}>
        {isLoadingRates ? (
          <View style={styles.loadingRateContainer}>
            <ActivityIndicator size="small" color="#8E8E93" />
            <Text style={styles.loadingRateText}>Loading exchange rate...</Text>
          </View>
        ) : displayRate ? (
          <Text style={styles.exchangeRateText}>{displayRate}</Text>
        ) : (
          <Text style={styles.exchangeRateText}>Select currencies to see rate</Text>
        )}
      </View>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[
            styles.continueButton, 
            (!canContinue || isAuthenticating || isLoadingRates) && styles.continueButtonDisabled
          ]} 
          onPress={handleContinue}
          disabled={!canContinue || isAuthenticating || isLoadingRates}
        >
          {isAuthenticating ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#000000" />
              <Text style={[styles.continueButtonText, { marginLeft: 8 }]}>AUTHENTICATING...</Text>
            </View>
          ) : (
            <Text style={styles.continueButtonText}>{config.buttonText}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  currencySelector: {
    flex: 1,
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
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 34,
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
  loadingRateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingRateText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginLeft: 8,
  },
  errorContainer: {
    marginTop: 8,
    paddingHorizontal: 0,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '500',
  },
});
