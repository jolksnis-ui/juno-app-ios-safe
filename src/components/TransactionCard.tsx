import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction, formatTransactionDate } from '../types/transaction';
import { useStyles, useTheme } from '../hooks/useTheme';
import { Theme } from '../types/theme';

interface TransactionCardProps {
  transaction: Transaction;
  onPress?: () => void;
}

const getTransactionIcon = (type: string): keyof typeof Ionicons.glyphMap => {
  switch (type.toLowerCase()) {
    case 'buy':
      return 'trending-up';
    case 'sell':
      return 'trending-down';
    case 'exchange':
      return 'swap-horizontal';
    case 'send':
      return 'paper-plane';
    case 'receive':
      return 'qr-code';
    case 'deposit':
      return 'add-circle';
    case 'withdrawal':
      return 'remove-circle';
    case 'payment out':
      return 'card';
    case 'transfer':
      return 'swap-vertical';
    case 'fx':
      return 'globe';
    default:
      return 'help-circle';
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'COMPLETED':
      return '#00D4AA'; // Green
    case 'FAILED':
    case 'REJECTED':
      return '#FF4444'; // Red
    case 'PENDING':
    default:
      return '#888888'; // Gray
  }
};

export default function TransactionCard({ transaction, onPress }: TransactionCardProps) {
  const { theme } = useTheme();
  const styles = useStyles((theme: Theme) => createStyles(theme));
  const icon = getTransactionIcon(transaction.type);
  const statusColor = getStatusColor(transaction.status);
  const formattedDate = formatTransactionDate(transaction.timestamp.toISOString());

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.leftSection}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color={styles.transactionType.color} />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionType}>{transaction.type.toUpperCase()}</Text>
          <Text style={styles.transactionDate}>{formattedDate}</Text>
        </View>
      </View>
      
      <View style={styles.rightSection}>
        <Text style={styles.amount}>
          {(transaction.type === 'Exchange' || transaction.type === 'FX') 
            ? transaction.amount 
            : `${transaction.amount} ${transaction.currency}`}
        </Text>
        <Text style={[styles.status, { color: statusColor }]}>
          {transaction.status}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  status: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
