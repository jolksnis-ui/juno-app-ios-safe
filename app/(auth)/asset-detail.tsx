import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useStyles, useTheme } from '../../src/hooks/useTheme';
import { Theme } from '../../src/types/theme';
import { Transaction } from '../../src/types/transaction';
import { getFiatTransactions, TokenExpiredError } from '../../src/services/transactionService';
import TransactionCard from '../../src/components/TransactionCard';
import UnifiedActionButtons from '../../src/components/UnifiedActionButtons';
import ProgressBar from '../../src/components/ProgressBar';

interface AssetDetailData {
  currencyCode: string;
  currencyName: string;
  balance: string;
  percentage: string;
  usdValue: string;
  symbol: string;
  flag: string;
  color: string;
}

export default function AssetDetailScreen() {
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const styles = useStyles((theme: Theme) => createStyles(theme));
  
  // Parse currency data from route parameters
  const currencyData: AssetDetailData = JSON.parse(params.currencyData as string);
  
  // State management
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [transactionError, setTransactionError] = useState<string | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setIsLoadingTransactions(true);
    setTransactionError(null);
    
    try {
      // Fetch last 5 fiat transactions (we'll filter by currency on the client side for now)
      const response = await getFiatTransactions(1, 20); // Get more to filter
      
      // Filter transactions by currency code
      const currencyTransactions = response.transactions
        .filter(transaction => transaction.currency === currencyData.currencyCode)
        .slice(0, 5); // Take only the first 5
      
      setTransactions(currencyTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
      
      if (error instanceof TokenExpiredError) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [{ text: 'OK', onPress: () => router.replace('/(public)/login') }]
        );
      } else {
        setTransactionError('Failed to load transactions');
      }
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleTransactionPress = (transaction: Transaction) => {
    Alert.alert('Transaction Details', `Transaction ID: ${transaction.id}`);
  };

  const handleSeeAll = () => {
    router.push({
      pathname: '/(auth)/transactions',
      params: { 
        tab: 'fiat'
      }
    });
  };

  const handleDepositActionPress = () => {
    Alert.alert("Deposit", `Please contact ADMIN for details of how to deposit funds into your Juno Money account.`);
  };

  const handlePaymentOutPress = () => {
    router.push('/(auth)/payment-out');
  };

  const handleTransferPress = () => {
    router.push('/(auth)/transfer-fiat');
  };

  const handleFXPress = () => {
    router.push('/(auth)/fx-fiat');
  };

  const renderTransactionItem = (transaction: Transaction) => (
    <TransactionCard
      key={transaction.id}
      transaction={transaction}
      onPress={() => handleTransactionPress(transaction)}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={{ 
          uri: theme.isDark 
            ? 'https://junomoney.com/images/common/overviewBg.png'
            : 'https://dev.junomoney.org/images/common/light-overviewBg.png'
        }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={styles.headerTitle.color} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{currencyData.currencyName.toUpperCase()}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Balance Section */}
          <View style={styles.balanceSection}>
            <Text style={styles.balanceLabel}>YOUR BALANCE</Text>
            <Text style={styles.balanceAmount}>
              {currencyData.symbol}{parseFloat(currencyData.balance).toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </Text>
            <Text style={styles.balancePercentage}>{currencyData.percentage}%</Text>
            <View style={styles.progressBarContainer}>
              <ProgressBar 
                percentage={parseFloat(currencyData.percentage)} 
                color={currencyData.color}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsSection}>
            <UnifiedActionButtons
              type="fiat"
              actions={{
                onDeposit: () => handleDepositActionPress(),
                onWithdrawal: () => router.push('/(auth)/withdraw-fiat'),
                onPaymentOut: () => handlePaymentOutPress(),
                onFX: () => handleFXPress(),
                onTransfer: () => handleTransferPress(),
              }}
            />
          </View>

          {/* Transactions Section */}
          <View style={styles.transactionsSection}>
            <View style={styles.transactionsSectionHeader}>
              <Text style={styles.transactionsTitle}>
                {currencyData.currencyName.toUpperCase()} TRANSACTIONS
              </Text>
            </View>
            
            {isLoadingTransactions ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={styles.loadingText.color} />
                <Text style={styles.loadingText}>Loading transactions...</Text>
              </View>
            ) : transactionError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{transactionError}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadTransactions}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : transactions.length > 0 ? (
              <View style={styles.transactionsList}>
                {transactions.map(renderTransactionItem)}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={48} color={theme.colors.textSecondary} />
                <Text style={styles.emptyTitle}>No Transactions Found</Text>
                <Text style={styles.emptyText}>No {currencyData.currencyCode} transactions found</Text>
              </View>
            )}
          </View>

          {/* See All Button */}
          {transactions.length > 0 && (
            <View style={styles.seeAllContainer}>
              <TouchableOpacity style={styles.seeAllButton} onPress={handleSeeAll}>
                <Text style={styles.seeAllButtonText}>SEE ALL</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
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
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  balanceSection: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: 'flex-start',
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  balancePercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: 8,
  },
  actionButtonsSection: {
    paddingHorizontal: 5,
    marginBottom: 32,
  },
  transactionsSection: {
    paddingHorizontal: 5,
    marginBottom: 32,
  },
  transactionsSectionHeader: {
    marginBottom: 20,
  },
  transactionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
    paddingLeft: 20
  },
  transactionsList: {
    gap: 0, // TransactionCard has its own margin
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: theme.colors.text,
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  retryButtonText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  seeAllContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  seeAllButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  seeAllButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.isDark ? '#000000' : '#FFFFFF',
  },
});
