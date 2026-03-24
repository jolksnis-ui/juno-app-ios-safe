import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Currency } from '../types/exchange';
import { useStyles } from '../hooks/useTheme';
import { Theme } from '../types/theme';
import { TransactionType, TRANSACTION_CONFIGS } from '../types/transaction';

interface CryptoTransactionSummaryProps {
  transactionType: TransactionType;
  fromCurrency: Currency;
  toCurrency: Currency;
  fromAmount: string;
  toAmount: string;
  exchangeRate: number;
  feePercent: number;
  fromBalance: number;
  toBalance: number;
  isLoadingQuotation?: boolean;
  isSubmittingTransaction?: boolean;
  onExecute: () => void;
  onBack: () => void;
}

export const CryptoTransactionSummary: React.FC<CryptoTransactionSummaryProps> = ({
  transactionType,
  fromCurrency,
  toCurrency,
  fromAmount,
  toAmount,
  exchangeRate,
  feePercent,
  fromBalance,
  toBalance,
  isLoadingQuotation = false,
  isSubmittingTransaction = false,
  onExecute,
  onBack
}) => {
  const config = TRANSACTION_CONFIGS[transactionType];
  const styles = useStyles((theme: Theme) => createStyles(theme));

  const formatBalance = (amount: number, currency: Currency) => {
    if (currency.type === 'fiat') {
      return `${currency.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}`;
    }
  };

  const formatAmount = (amount: string, currency: Currency) => {
    const numAmount = parseFloat(amount.replace(/,/g, ''));
    if (currency.type === 'fiat') {
      return `${currency.icon} ${currency.symbol}${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `${currency.icon} ${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}`;
    }
  };

  const formatDisplayRate = () => {
    if (transactionType === 'sell') {
      // For sell, show crypto to fiat rate
      return `1 ${fromCurrency.code} = ${(1/exchangeRate).toFixed(2)} ${toCurrency.code}`;
    } else {
      // For buy, show fiat to crypto rate
      return `1 ${fromCurrency.code} = ${exchangeRate.toFixed(8)} ${toCurrency.code}`;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color={styles.headerTitle.color} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{config.headerTitle}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Warning Message */}
      <View style={styles.warningContainer}>
        <Text style={styles.warningText}>
          PLEASE, DOUBLECHECK THE SUMMARY BELOW, BEFORE MAKING A {transactionType.toUpperCase()}.
        </Text>
      </View>

      {/* From Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{config.fromLabel}</Text>
        <View style={styles.amountRow}>
          <Text style={styles.amountText}>
            {formatAmount(fromAmount, fromCurrency)}
          </Text>
          {isLoadingQuotation && (
            <ActivityIndicator size="small" color={styles.sectionTitle.color} style={styles.loadingIndicator} />
          )}
        </View>
        <Text style={styles.balanceText}>
          BALANCE: {formatBalance(fromBalance, fromCurrency)}
        </Text>
      </View>

      {/* To Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{config.toLabel}</Text>
        <View style={styles.amountRow}>
          <Text style={styles.amountText}>
            {formatAmount(toAmount, toCurrency)}
          </Text>
          {isLoadingQuotation && (
            <ActivityIndicator size="small" color={styles.sectionTitle.color} style={styles.loadingIndicator} />
          )}
        </View>
        <Text style={styles.balanceText}>
          BALANCE: {formatBalance(toBalance, toCurrency)}
        </Text>
      </View>

      {/* Rate Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>RATE</Text>
        <Text style={styles.rateText}>
          {formatDisplayRate()}
        </Text>
        <Text style={styles.feeText}>
          Fee: {feePercent}%
        </Text>
      </View>

      {/* Execute Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[
            styles.executeButton, 
            isSubmittingTransaction && styles.executeButtonDisabled
          ]} 
          onPress={onExecute}
          disabled={isSubmittingTransaction}
        >
          {isSubmittingTransaction ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#000000" />
              <Text style={[styles.executeButtonText, { marginLeft: 8 }]}>PROCESSING...</Text>
            </View>
          ) : (
            <Text style={styles.executeButtonText}>{config.confirmButtonText}</Text>
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  placeholder: {
    width: 32,
  },
  warningContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  warningText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    lineHeight: 16,
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
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountText: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  balanceText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  rateText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginBottom: 8,
  },
  feeText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  executeButton: {
    backgroundColor: theme.colors.buttonPrimary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  executeButtonDisabled: {
    opacity: 0.6,
  },
  executeButtonText: {
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
