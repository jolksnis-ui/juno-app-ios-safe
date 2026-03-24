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
import { TransferFormData } from '../../src/types/transfer';
import { getClientBalances, TokenExpiredError } from '../../src/services/balanceService';
import { createTransferTransaction } from '../../src/services/transferService';
import { FiatBalance } from '../../src/types/balance';
import { useAuthContext } from '../../src/contexts/AuthContext';
import { useToast } from '../../src/contexts/ToastContext';

export default function TransferFiatConfirmScreen() {
  const params = useLocalSearchParams();
  const styles = useStyles((theme: Theme) => createStyles(theme));
  const { user } = useAuthContext();
  const { showError } = useToast();
  
  // Parse form data from params
  const formData: TransferFormData = JSON.parse(params.formData as string);
  const fee = parseFloat(params.fee as string) || 0;
  const recipientName = params.recipientName as string;
  
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
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [{ text: 'OK', onPress: () => router.replace('/(public)/login') }]
        );
      } else {
        showError('Failed to load balance. Please try again.', 'Network Error');
      }
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const getAvailableBalance = () => {
    const balance = fiatBalances.find(
      b => b.currencyShortName === formData.selectedCurrency.code
    );
    return balance?.balanceAmount || 0;
  };

  const calculateAmounts = () => {
    const amount = parseFloat(formData.amount) || 0;
    const feeAmount = amount * fee / 100;
    const totalDeducted = amount + feeAmount;
    const balanceAfter = getAvailableBalance() - totalDeducted;
    
    return {
      amount,
      feeAmount,
      totalDeducted,
      balanceAfter
    };
  };

  const { amount: transferAmount, feeAmount, totalDeducted, balanceAfter } = calculateAmounts();

  const handleConfirm = async () => {
    try {
      setIsAuthenticating(true);
      
      // Simulate biometric authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsAuthenticating(false);
      setIsSubmitting(true);
      
      // Build the API request
      const transferRequest = {
        currencyType: "fiat" as const,
        type: "Transfer" as const,
        currency: formData.selectedCurrency.code,
        transactionDetails: {
          email: formData.email,
          amount: formData.amount,
          reference: formData.reference,
          currency: formData.selectedCurrency.code,
        },
        transactionEmail: user?.clientEmail || "",
        balance: {
          balanceAmount: formData.amount,
          updated: new Date().toISOString()
        }
      };

      console.log('Submitting transfer request:', transferRequest);

      // Make the real API call
      const response = await createTransferTransaction(transferRequest);
      
      console.log('Transfer response:', response);
      
      // Success response - show success message
      Alert.alert(
        'Success',
        'Amount has been transferred successfully',
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
      console.error('Transfer error:', error);
      
      if (error instanceof TokenExpiredError) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [{ text: 'OK', onPress: () => router.replace('/(public)/login') }]
        );
      } else {
        Alert.alert(
          'Transfer Failed',
          'Failed to submit transfer request. Please try again.',
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
        <Text style={styles.headerTitle}>CONFIRM TRANSFER</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Transfer Amount Section */}
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>TRANSFER AMOUNT</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>{formData.selectedCurrency.symbol}</Text>
            <Text style={styles.amountText}>
              {transferAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <Text style={styles.balanceText}>
            BALANCE: {isLoadingBalance ? 'Loading...' : 
              `${formData.selectedCurrency.symbol}${balanceAfter.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            }
          </Text>
        </View>

        {/* Details Container */}
        <View style={styles.detailsContainer}>
          {/* Recipient Email */}
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>RECIPIENT EMAIL</Text>
            <Text style={styles.detailValue}>{formData.email}</Text>
          </View>

          {/* Recipient Name */}
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>RECIPIENT NAME</Text>
            <Text style={styles.detailValue}>{recipientName}</Text>
          </View>

          {/* Reference */}
          {formData.reference && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>REFERENCE</Text>
              <Text style={styles.detailValue}>{formData.reference}</Text>
            </View>
          )}

          {/* Fee Information */}
          {fee > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>TRANSACTION FEE ({fee}%)</Text>
              <Text style={styles.detailValue}>
                {formData.selectedCurrency.symbol}{feeAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          )}

          {/* Total Amount */}
          <View style={[styles.detailSection, styles.totalSection]}>
            <Text style={styles.detailLabel}>TOTAL AMOUNT (INCLUDING FEES)</Text>
            <Text style={[styles.detailValue, styles.totalValue]}>
              {formData.selectedCurrency.symbol}{totalDeducted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Confirm Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[
            styles.confirmButton,
            (isSubmitting || isAuthenticating) && styles.confirmButtonDisabled
          ]}
          onPress={handleConfirm}
          disabled={isSubmitting || isAuthenticating}
        >
          {isSubmitting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#000000" />
              <Text style={[styles.confirmButtonText, { marginLeft: 8 }]}>SUBMITTING...</Text>
            </View>
          ) : (
            <Text style={styles.confirmButtonText}>CONFIRM</Text>
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
  amountSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.accent,
    marginRight: 8,
  },
  amountText: {
    fontSize: 28,
    fontWeight: '600',
    color: theme.colors.text,
  },
  balanceText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  detailsContainer: {
    flex: 1,
  },
  detailSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    lineHeight: 22,
  },
  totalSection: {
    backgroundColor: theme.colors.surface,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.accent,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  confirmButton: {
    backgroundColor: theme.colors.buttonPrimary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.buttonText,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
