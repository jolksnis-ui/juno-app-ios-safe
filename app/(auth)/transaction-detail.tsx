import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useStyles, useTheme } from '../../src/hooks/useTheme';
import { Theme } from '../../src/types/theme';
import { APITransaction, TransactionStatus, mapTransactionStatus } from '../../src/types/transaction';

interface TransactionDetail {
  label: string;
  value: string;
  copyable: boolean;
}

// Simplified transaction type configurations for status messages only
const TRANSACTION_STATUS_MESSAGES: Record<string, Record<TransactionStatus, string>> = {
  'Buy': {
    COMPLETED: 'PURCHASE COMPLETED SUCCESSFULLY.',
    PENDING: 'PURCHASE IS BEING PROCESSED. PLEASE WAIT.',
    FAILED: 'PURCHASE FAILED. THE TRANSACTION COULD NOT BE PROCESSED. PLEASE CHECK YOUR BANK DETAILS AND TRY AGAIN OR CONTACT SUPPORT FOR ASSISTANCE.',
    REJECTED: 'PURCHASE WAS REJECTED. PLEASE CONTACT SUPPORT FOR ASSISTANCE.'
  },
  'Sell': {
    COMPLETED: 'SALE COMPLETED SUCCESSFULLY.',
    PENDING: 'SALE IS BEING PROCESSED. PLEASE WAIT.',
    FAILED: 'SALE FAILED. THE TRANSACTION COULD NOT BE PROCESSED. PLEASE TRY AGAIN OR CONTACT SUPPORT FOR ASSISTANCE.',
    REJECTED: 'SALE WAS REJECTED. PLEASE CONTACT SUPPORT FOR ASSISTANCE.'
  },
  'Exchange': {
    COMPLETED: 'EXCHANGE COMPLETED SUCCESSFULLY.',
    PENDING: 'EXCHANGE IS BEING PROCESSED. PLEASE WAIT.',
    FAILED: 'EXCHANGE FAILED. THE TRANSACTION COULD NOT BE PROCESSED. PLEASE TRY AGAIN OR CONTACT SUPPORT FOR ASSISTANCE.',
    REJECTED: 'EXCHANGE WAS REJECTED. PLEASE CONTACT SUPPORT FOR ASSISTANCE.'
  },
  'Send': {
    COMPLETED: 'CRYPTOCURRENCY SENT SUCCESSFULLY.',
    PENDING: 'CRYPTOCURRENCY SEND IS BEING PROCESSED. PLEASE WAIT.',
    FAILED: 'CRYPTOCURRENCY SEND FAILED. PLEASE CHECK THE RECIPIENT ADDRESS AND TRY AGAIN OR CONTACT SUPPORT.',
    REJECTED: 'CRYPTOCURRENCY SEND WAS REJECTED. PLEASE CONTACT SUPPORT FOR ASSISTANCE.'
  },
  'Receive': {
    COMPLETED: 'CRYPTOCURRENCY RECEIVED SUCCESSFULLY.',
    PENDING: 'CRYPTOCURRENCY RECEIVE IS BEING PROCESSED. PLEASE WAIT.',
    FAILED: 'CRYPTOCURRENCY RECEIVE FAILED. PLEASE CHECK THE TRANSACTION DETAILS OR CONTACT SUPPORT.',
    REJECTED: 'CRYPTOCURRENCY RECEIVE WAS REJECTED. PLEASE CONTACT SUPPORT FOR ASSISTANCE.'
  },
  'Deposit': {
    COMPLETED: 'DEPOSIT COMPLETED SUCCESSFULLY.',
    PENDING: 'DEPOSIT IS BEING PROCESSED. PLEASE WAIT.',
    FAILED: 'DEPOSIT FAILED. THE TRANSACTION COULD NOT BE PROCESSED. PLEASE CHECK YOUR BANK DETAILS AND TRY AGAIN OR CONTACT SUPPORT FOR ASSISTANCE.',
    REJECTED: 'DEPOSIT WAS REJECTED. PLEASE CONTACT SUPPORT FOR ASSISTANCE.'
  },
  'Withdrawal': {
    COMPLETED: 'WITHDRAWAL COMPLETED SUCCESSFULLY.',
    PENDING: 'WITHDRAWAL IS BEING PROCESSED. PLEASE WAIT.',
    FAILED: 'WITHDRAWAL FAILED. THE TRANSACTION COULD NOT BE PROCESSED. PLEASE CHECK YOUR BANK DETAILS AND TRY AGAIN OR CONTACT SUPPORT FOR ASSISTANCE.',
    REJECTED: 'WITHDRAWAL WAS REJECTED. PLEASE CONTACT SUPPORT FOR ASSISTANCE.'
  },
  'Payment Out': {
    COMPLETED: 'PAYMENT COMPLETED SUCCESSFULLY.',
    PENDING: 'PAYMENT IS BEING PROCESSED. PLEASE WAIT.',
    FAILED: 'PAYMENT FAILED. THE TRANSACTION COULD NOT BE PROCESSED. PLEASE CHECK YOUR BANK DETAILS AND TRY AGAIN OR CONTACT SUPPORT FOR ASSISTANCE.',
    REJECTED: 'PAYMENT WAS REJECTED. PLEASE CONTACT SUPPORT FOR ASSISTANCE.'
  },
  'Transfer': {
    COMPLETED: 'TRANSFER COMPLETED SUCCESSFULLY.',
    PENDING: 'TRANSFER IS BEING PROCESSED. PLEASE WAIT.',
    FAILED: 'TRANSFER FAILED. THE TRANSACTION COULD NOT BE PROCESSED. PLEASE CHECK YOUR ACCOUNT DETAILS AND TRY AGAIN OR CONTACT SUPPORT FOR ASSISTANCE.',
    REJECTED: 'TRANSFER WAS REJECTED. PLEASE CONTACT SUPPORT FOR ASSISTANCE.'
  },
  'FX': {
    COMPLETED: 'FOREIGN EXCHANGE COMPLETED SUCCESSFULLY.',
    PENDING: 'FOREIGN EXCHANGE IS BEING PROCESSED. PLEASE WAIT.',
    FAILED: 'FOREIGN EXCHANGE FAILED. THE TRANSACTION COULD NOT BE PROCESSED. PLEASE TRY AGAIN OR CONTACT SUPPORT FOR ASSISTANCE.',
    REJECTED: 'FOREIGN EXCHANGE WAS REJECTED. PLEASE CONTACT SUPPORT FOR ASSISTANCE.'
  }
};

const formatTransactionDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  }) + ' ' + date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Generate details for Buy/Sell transactions
const generateBuySellDetails = (transaction: APITransaction) => {
  const details = transaction.transactionDetails[0];
  const exchangeRate = details?.quotationPrice || details?.exchangeRate || 'N/A';
  
  return [
    { label: 'Date', value: formatTransactionDate(transaction.createdDate), copyable: false },
    { label: 'Transaction Id', value: transaction.transactionId, copyable: true },
    { label: 'Crypto', value: `${details?.cryptoAmount || '0'} ${details?.cryptoId}`, copyable: false },
    { label: 'Fiat', value: `${details?.fiatAmount || '0'} ${details?.fiatCurrency || 'USD'}`, copyable: false },
    { label: 'Exchange Rate', value: exchangeRate.toString(), copyable: false },
  ];
};

// Generate details for Exchange transactions
const generateExchangeDetails = (transaction: APITransaction) => {
  const details = transaction.transactionDetails[0];
  const exchangeRate = details?.quotationPrice || details?.exchangeRate || 'N/A';
  
  return [
    { label: 'Date', value: formatTransactionDate(transaction.createdDate), copyable: false },
    { label: 'Transaction Id', value: transaction.transactionId, copyable: true },
    { label: 'From Crypto', value: `${details?.fromCryptoAmount || '0'} ${details?.fromCryptoId || ''}`, copyable: false },
    { label: 'To Crypto', value: `${details?.toCryptoAmount || '0'} ${details?.toCryptoId || ''}`, copyable: false },
    { label: 'Exchange Rate', value: exchangeRate.toString(), copyable: false },
  ];
};

// Generate details for Send/Receive transactions
const generateSendReceiveDetails = (transaction: APITransaction) => {
  const details = transaction.transactionDetails[0] as any;
  
  return [
    { label: 'Date', value: formatTransactionDate(transaction.createdDate), copyable: false },
    { label: 'Transaction Id', value: transaction.transactionId, copyable: true },
    { label: 'Crypto', value: `${details?.amount || '0'} ${transaction.currency}`, copyable: false },
    { label: 'From wallet address', value: details?.senderAddress || 'N/A', copyable: true },
    { label: 'To wallet address', value: details?.receiverAddress || 'N/A', copyable: true },
  ];
};

// Generate details for Deposit transactions
const generateDepositDetails = (transaction: APITransaction) => {
  const details = transaction.transactionDetails[0] as any;
  const amount = details?.amount || details?.fiatAmount || '0';
  const currency = details?.currency || details?.fiatCurrency || transaction.currency || 'USD';
  
  return [
    { label: 'Date', value: formatTransactionDate(transaction.createdDate), copyable: false },
    { label: 'Transaction Type', value: transaction.type, copyable: false },
    { label: 'Transaction ID', value: transaction.transactionId, copyable: true },
    { label: 'Amount', value: `${amount} ${currency}`, copyable: false },
  ];
};

// Generate details for Withdrawal/Payment Out transactions
const generateWithdrawalPaymentDetails = (transaction: APITransaction) => {
  const details = transaction.transactionDetails[0] as any;
  const amount = details?.amount || details?.fiatAmount || '0';
  const currency = details?.currency || details?.fiatCurrency || transaction.currency || 'USD';
  
  return [
    { label: 'Date', value: formatTransactionDate(transaction.createdDate), copyable: false },
    { label: 'Transaction Type', value: transaction.type, copyable: false },
    { label: 'Transaction ID', value: transaction.transactionId, copyable: true },
    { label: 'Amount', value: `${amount} ${currency}`, copyable: false },
    { label: 'Beneficiary Name', value: details?.beneficiaryName || details?.recipientName || 'N/A', copyable: false },
    { label: 'Beneficiary Country', value: details?.beneficiaryCountry || details?.recipientCountry || 'N/A', copyable: false },
    { label: 'Bank Country', value: details?.bankCountry || details?.beneficiaryCountry || 'N/A', copyable: false },
  ];
};

// Generate details for Transfer transactions
const generateTransferDetails = (transaction: APITransaction) => {
  const details = transaction.transactionDetails[0] as any;
  const amount = details?.amount || details?.fiatAmount || '0';
  const currency = details?.currency || details?.fiatCurrency || transaction.currency || 'USD';
  
  return [
    { label: 'Date', value: formatTransactionDate(transaction.createdDate), copyable: false },
    { label: 'Transaction Type', value: transaction.type, copyable: false },
    { label: 'Transaction ID', value: transaction.transactionId, copyable: true },
    { label: 'Amount', value: `${amount} ${currency}`, copyable: false },
    { label: 'Account Name', value: details?.accountName || details?.recipientName || details?.beneficiaryName || 'N/A', copyable: false },
  ];
};

// Generate details for FX transactions
const generateFXDetails = (transaction: APITransaction) => {
  const details = transaction.transactionDetails[0] as any;
  const fromAmount = details?.fromAmount || details?.sellAmount || '0';
  const fromCurrency = details?.fromCurrency || details?.sellCurrency || 'USD';
  const toAmount = details?.toAmount || details?.buyAmount || '0';
  const toCurrency = details?.toCurrency || details?.buyCurrency || 'USD';
  const fxRate = details?.fxRate || details?.exchangeRate || details?.quotationPrice || 'N/A';
  
  return [
    { label: 'Date', value: formatTransactionDate(transaction.createdDate), copyable: false },
    { label: 'Transaction Type', value: transaction.type, copyable: false },
    { label: 'Transaction ID', value: transaction.transactionId, copyable: true },
    { label: 'From Amount', value: `${fromAmount} ${fromCurrency}`, copyable: false },
    { label: 'To Amount', value: `${toAmount} ${toCurrency}`, copyable: false },
    { label: 'FX Rate', value: fxRate.toString(), copyable: false },
  ];
};

// Main function to generate transaction details based on type
const generateTransactionDetails = (transaction: APITransaction) => {
  switch (transaction.type) {
    case 'Buy':
    case 'Sell':
      return generateBuySellDetails(transaction);
    
    case 'Exchange':
      return generateExchangeDetails(transaction);
    
    case 'Send':
    case 'Receive':
      return generateSendReceiveDetails(transaction);
    
    case 'Deposit':
      return generateDepositDetails(transaction);
    
    case 'Withdrawal':
    case 'Payment Out':
      return generateWithdrawalPaymentDetails(transaction);
    
    case 'Transfer':
      return generateTransferDetails(transaction);
    
    case 'FX':
      return generateFXDetails(transaction);
    
    default:
      // Fallback for other transaction types
      return [
        { label: 'Date', value: formatTransactionDate(transaction.createdDate), copyable: false },
        { label: 'Transaction Id', value: transaction.transactionId, copyable: true },
        { label: 'Type', value: transaction.type, copyable: false },
        { label: 'Amount', value: `${transaction.transactionDetails[0]?.amount || '0'} ${transaction.currency}`, copyable: false },
      ];
  }
};

interface TransactionDetailRowProps {
  label: string;
  value: string;
  copyable?: boolean;
}

const TransactionDetailRow: React.FC<TransactionDetailRowProps> = ({
  label, value, copyable = false
}) => {
  const styles = useStyles((theme: Theme) => createStyles(theme));
  
  const handleCopy = () => {
    Clipboard.setString(value);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.detailValueContainer}>
        <Text style={styles.detailValue}>{value}</Text>
        {copyable && (
          <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
            <Text style={styles.copyText}>COPY</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const TransactionStatusBanner: React.FC<{ transaction: APITransaction }> = ({ transaction }) => {
  const styles = useStyles((theme: Theme) => createStyles(theme));
  const status = mapTransactionStatus(transaction.status.code);
  
  const getStatusConfig = (status: TransactionStatus) => {
    const statusMessages = TRANSACTION_STATUS_MESSAGES[transaction.type];
    const message = statusMessages?.[status] || `TRANSACTION ${status}.`;
    
    switch (status) {
      case 'FAILED':
        return {
          backgroundColor: '#8B0000',
          icon: 'close-circle-outline' as const,
          message
        };
      case 'COMPLETED':
        return {
          backgroundColor: '#006400',
          icon: 'checkmark-circle-outline' as const,
          message
        };
      case 'PENDING':
        return {
          backgroundColor: '#FF8C00',
          icon: 'time-outline' as const,
          message
        };
      case 'REJECTED':
        return {
          backgroundColor: '#8B0000',
          icon: 'ban-outline' as const,
          message
        };
      default:
        return null;
    }
  };

  const statusConfig = getStatusConfig(status);
  if (!statusConfig) return null;

  return (
    <View style={[styles.statusBanner, { backgroundColor: statusConfig.backgroundColor }]}>
      <Ionicons name={statusConfig.icon} size={24} color="#FFFFFF" />
      <Text style={styles.statusMessage}>{statusConfig.message}</Text>
    </View>
  );
};

export default function TransactionDetailScreen() {
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const styles = useStyles((theme: Theme) => createStyles(theme));
  
  // Parse transaction data from route parameters
  const transaction: APITransaction = JSON.parse(params.transactionData as string);
  
  const transactionDetails = generateTransactionDetails(transaction);
  
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
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {transaction.type.toUpperCase()}
          </Text>
          <Text style={styles.headerSubtitle}>
            {formatTransactionDate(transaction.createdDate)}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Status Banner */}
      <TransactionStatusBanner transaction={transaction} />

      {/* Transaction Details */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {transactionDetails.map((detail: TransactionDetail, index: number) => (
          <TransactionDetailRow
            key={`${detail.label}-${index}`}
            label={detail.label}
            value={detail.value}
            copyable={detail.copyable}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

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
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  headerSpacer: {
    width: 32,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  statusMessage: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
  content: {
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
    flex: 1,
  },
  detailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginRight: 12,
    textAlign: 'right',
    flex: 1,
  },
  copyButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  copyText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.accent,
    letterSpacing: 0.5,
  },
});
