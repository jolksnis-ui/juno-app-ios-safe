import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useStyles } from '../../src/hooks/useTheme';
import { Theme } from '../../src/types/theme';
import { FXFormData } from '../../src/types/fx';
import { getClientBalances, TokenExpiredError } from '../../src/services/balanceService';
import { createFXTransaction } from '../../src/services/fxService';
import { FiatBalance } from '../../src/types/balance';
import { useAuthContext } from '../../src/contexts/AuthContext';
import { useToast } from '../../src/contexts/ToastContext';

export default function FXFiatConfirmScreen() {
  const params = useLocalSearchParams();
  const styles = useStyles((theme: Theme) => createStyles(theme));
  const { user } = useAuthContext();
  const { showError } = useToast();
  
  // Parse form data from params
  const formData: FXFormData = JSON.parse(params.formData as string);
  const fee = parseFloat(params.fee as string) || 0;
  const exchangeRate = parseFloat(params.exchangeRate as string) || 0;
  const adjustedRate = parseFloat(params.adjustedRate as string) || 0;
  
  // State management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [fiatBalances, setFiatBalances] = useState<FiatBalance[]>([]);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  useEffect(() => {
    loadFiatBalances();
  }, []);

  const loadFiatBalances = async () => {
    setIsLoadingBalance(true);
    try {
      const response = await getClientBalances();
      setFiatBalances(response.clientBalanceList);
    } catch (error) {
      console.error('Error loading fiat balances:', error);
      if (error instanceof TokenExpiredError) {
        showError(
          'Your session has expired. Please login again.',
          'Session Expired'
        );
        // Immediately redirect to login
        router.replace('/(public)/login');
      } else {
        Alert.alert('Error', 'Failed to load balance. Please try again.');
      }
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const getAvailableBalance = (currencyCode: string) => {
    const balance = fiatBalances.find(
      b => b.currencyShortName === currencyCode
    );
    return balance?.balanceAmount || 0;
  };

  const handleConfirm = async () => {
    try {
      setIsAuthenticating(true);
      
      // Simulate biometric authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsAuthenticating(false);
      setIsSubmitting(true);
      
      // Build the API request
      const fxRequest = {
        currencyType: "fiat" as const,
        type: "FX" as const,
        transactionEmail: user?.clientEmail || "",
        balance: {
          balanceAmount: getAvailableBalance(formData.fromCurrency.code)
        },
        transactionDetails: {
          fromCurrency: formData.fromCurrency.code,
          toCurrency: formData.toCurrency.code,
          fromAmount: formData.fromAmount,
          toAmount: formData.toAmount,
          fxrate: adjustedRate,
          fxFee: fee,
          exchangeRate: exchangeRate,
          calculationMethod: formData.calculationMethod
        }
      };

      console.log('Submitting FX request:', fxRequest);

      // Make the real API call
      const response = await createFXTransaction(fxRequest);
      
      console.log('FX response:', response);
      
      // Success response - show success message
      Alert.alert(
        'Success',
        'Amount Has Been Exchanged Successfully',
        [
          {
            text: 'View Transactions',
            onPress: () => {
              router.dismissAll();
              router.push({
                pathname: '/(auth)/transactions',
                params: { tab: 'fiat' }
              });
            }
          },
          {
            text: 'Dashboard',
            onPress: () => {
              router.dismissAll();
              router.push('/(auth)/dashboard');
            }
          }
        ]
      );
    } catch (error) {
      console.error('FX error:', error);
      
      if (error instanceof TokenExpiredError) {
        showError(
          'Your session has expired. Please login again.',
          'Session Expired'
        );
        // Immediately redirect to login
        router.replace('/(public)/login');
      } else {
        Alert.alert(
          'Exchange Failed',
          'Failed to submit FX request. Please try again.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } finally {
      setIsSubmitting(false);
      setIsAuthenticating(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={styles.headerTitle.color} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CONFIRM FX EXCHANGE</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* From Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FROM</Text>
          <View style={styles.currencyRow}>
            <View style={styles.currencyInfo}>
              <Text style={styles.currencyFlag}>{formData.fromCurrency.flag}</Text>
              <Text style={styles.currencySymbol}>{formData.fromCurrency.symbol}</Text>
              <Text style={styles.currencyCode}>{formData.fromCurrency.code}</Text>
            </View>
            <Text style={styles.amountText}>
              {parseFloat(formData.fromAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <Text style={styles.currencyName}>{formData.fromCurrency.name.toUpperCase()}</Text>
        </View>

        {/* To Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TO</Text>
          <View style={styles.currencyRow}>
            <View style={styles.currencyInfo}>
              <Text style={styles.currencyFlag}>{formData.toCurrency.flag}</Text>
              <Text style={styles.currencySymbol}>{formData.toCurrency.symbol}</Text>
              <Text style={styles.currencyCode}>{formData.toCurrency.code}</Text>
            </View>
            <Text style={styles.amountText}>
              {parseFloat(formData.toAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <Text style={styles.currencyName}>{formData.toCurrency.name.toUpperCase()}</Text>
        </View>

        {/* Exchange Rate Details */}
        {/* <View style={styles.rateSection}>
          <Text style={styles.sectionTitle}>EXCHANGE RATE DETAILS</Text>
          
          <View style={styles.rateRow}>
            <Text style={styles.rateLabel}>Original Rate</Text>
            <Text style={styles.rateValue}>
              1 {formData.fromCurrency.code} = {exchangeRate.toFixed(6)} {formData.toCurrency.code}
            </Text>
          </View>
          
          <View style={styles.rateRow}>
            <Text style={styles.rateLabel}>Fee ({fee}%)</Text>
            <Text style={styles.rateValue}>Applied to rate</Text>
          </View>
          
          <View style={styles.rateRow}>
            <Text style={styles.rateLabel}>Net Rate</Text>
            <Text style={[styles.rateValue, styles.netRateValue]}>
              1 {formData.fromCurrency.code} = {adjustedRate.toFixed(6)} {formData.toCurrency.code}
            </Text>
          </View>
        </View> */}

        {/* Balance Information */}
        {/* <View style={styles.balanceSection}>
          <Text style={styles.sectionTitle}>BALANCE AFTER EXCHANGE</Text>
          
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>{formData.fromCurrency.code} Balance</Text>
            <Text style={styles.balanceValue}>
              {isLoadingBalance ? 'Loading...' : 
                `${formData.fromCurrency.symbol}${(getAvailableBalance(formData.fromCurrency.code) - parseFloat(formData.fromAmount)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              }
            </Text>
          </View>
          
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>{formData.toCurrency.code} Balance</Text>
            <Text style={styles.balanceValue}>
              {isLoadingBalance ? 'Loading...' : 
                `${formData.toCurrency.symbol}${(getAvailableBalance(formData.toCurrency.code) + parseFloat(formData.toAmount)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              }
            </Text>
          </View>
        </View> */}
      </ScrollView>

      {/* Exchange Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[
            styles.exchangeButton,
            (isSubmitting || isAuthenticating) && styles.exchangeButtonDisabled
          ]}
          onPress={handleConfirm}
          disabled={isSubmitting || isAuthenticating}
        >
          {isSubmitting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#000000" />
              <Text style={[styles.exchangeButtonText, { marginLeft: 8 }]}>EXCHANGING...</Text>
            </View>
          ) : (
            <Text style={styles.exchangeButtonText}>EXCHANGE NOW</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
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
    marginBottom: 8,
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyFlag: {
    fontSize: 24,
    marginRight: 12,
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
  },
  amountText: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text,
  },
  currencyName: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  rateSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rateLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  rateValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600',
  },
  netRateValue: {
    color: '#00D4AA',
  },
  balanceSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  balanceValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  exchangeButton: {
    backgroundColor: theme.colors.buttonPrimary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  exchangeButtonDisabled: {
    opacity: 0.6,
  },
  exchangeButtonText: {
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
});
