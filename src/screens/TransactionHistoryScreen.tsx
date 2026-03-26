import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import TransactionCard from '../components/TransactionCard';
import { Transaction, APITransaction } from '../types/transaction';
import { 
  getCryptoTransactions, 
  getFiatTransactions, 
  TokenExpiredError,
  getCryptoTransactionTypes,
  getFiatTransactionTypes
} from '../services/transactionService';
import { AssetType } from '../types/portfolio';
import { useStyles } from '../hooks/useTheme';
import { Theme } from '../types/theme';
import { useToast } from '../contexts/ToastContext';

interface TransactionHistoryScreenProps {
  onBack?: () => void;
  onLogout?: () => void;
  initialTab?: AssetType;
}

export default function TransactionHistoryScreen({ 
  onBack, 
  onLogout, 
  initialTab = 'fiat' 
}: TransactionHistoryScreenProps) {
  const styles = useStyles((theme: Theme) => createStyles(theme));
  const { showError } = useToast();
  const [activeTab, setActiveTab] = useState<AssetType>(initialTab);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [apiTransactions, setApiTransactions] = useState<APITransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMoreData, setHasMoreData] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('');

  // Get transaction types for current tab
  const getTransactionTypes = () => {
    return activeTab === 'crypto' ? getCryptoTransactionTypes() : getFiatTransactionTypes();
  };

  // Fetch transactions
  const fetchTransactions = useCallback(async (
    page: number = 1, 
    isRefresh: boolean = false,
    filter: string = ''
  ) => {
    try {
      if (page === 1) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      // Validate functions exist
      if (typeof getCryptoTransactions !== 'function') {
        throw new Error('getCryptoTransactions is not available');
      }
      if (typeof getFiatTransactions !== 'function') {
        throw new Error('getFiatTransactions is not available');
      }

      const fetchFunction = activeTab === 'crypto' ? getCryptoTransactions : getFiatTransactions;

      if (typeof fetchFunction !== 'function') {
        throw new Error(`fetchFunction is not a function (it is ${typeof fetchFunction})`);
      }

      const response = await fetchFunction(page, 10, filter);

      if (page === 1 || isRefresh) {
        setTransactions(response.transactions);
        setApiTransactions(response.apiTransactions);
      } else {
        setTransactions(prev => [...prev, ...response.transactions]);
        setApiTransactions(prev => [...prev, ...response.apiTransactions]);
      }

      setHasMoreData(response.transactions.length === 10);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      
      if (error instanceof TokenExpiredError) {
        showError(
          'Your session has expired. Please login again.',
          'Session Expired'
        );
        // Immediately logout without waiting for user interaction
        if (onLogout) {
          onLogout();
        }
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch transactions';
      console.error('Transaction fetch error details:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  }, [activeTab, onLogout]);

  // Initial load and tab change
  useEffect(() => {
    setCurrentPage(1);
    setHasMoreData(true);
    setSelectedFilter('');
    fetchTransactions(1, false, '');
  }, [activeTab, fetchTransactions]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setCurrentPage(1);
    setHasMoreData(true);
    fetchTransactions(1, true, selectedFilter);
  }, [fetchTransactions, selectedFilter]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMoreData && transactions.length > 0) {
      fetchTransactions(currentPage + 1, false, selectedFilter);
    }
  }, [isLoadingMore, hasMoreData, transactions.length, currentPage, fetchTransactions, selectedFilter]);

  // Handle filter change
  const handleFilterChange = (filter: string) => {
    const newFilter = selectedFilter === filter ? '' : filter;
    setSelectedFilter(newFilter);
    setCurrentPage(1);
    setHasMoreData(true);
    fetchTransactions(1, false, newFilter);
  };

  // Handle transaction press
  const handleTransactionPress = (transaction: Transaction) => {
    // Find the original API transaction data using the transaction ID
    const originalApiTransaction = apiTransactions.find(
      apiTx => apiTx.transactionId === transaction.id
    );

    if (originalApiTransaction) {
      // Use the original API transaction data with all complete details
      router.push({
        pathname: '/(auth)/transaction-detail',
        params: {
          transactionData: JSON.stringify(originalApiTransaction)
        }
      });
    } else {
      // Fallback: if for some reason we can't find the original data, show an error
      Alert.alert(
        'Error',
        'Unable to load transaction details. Please try refreshing the list.',
        [{ text: 'OK' }]
      );
    }
  };

  // Render transaction item
  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TransactionCard
      transaction={item}
      onPress={() => handleTransactionPress(item)}
    />
  );

  // Render filter chips
  const renderFilterChips = () => {
    const types = getTransactionTypes();
    
    return (
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={types}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedFilter === item && styles.filterChipActive
              ]}
              onPress={() => handleFilterChange(item)}
            >
              <Text style={[
                styles.filterChipText,
                selectedFilter === item && styles.filterChipTextActive
              ]}>
                {item.toUpperCase()}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>
    );
  };

  // Render footer
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={styles.loadingText.color} />
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={64} color="#666666" />
      <Text style={styles.emptyTitle}>No Transactions Found</Text>
      <Text style={styles.emptySubtitle}>
        {selectedFilter 
          ? `No ${selectedFilter.toLowerCase()} transactions found`
          : `No ${activeTab} transactions found`
        }
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={styles.headerTitle.color} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>TRANSACTION HISTORY</Text>
        
        <View style={styles.headerTabs}>
          <TouchableOpacity
            style={[styles.headerTab, activeTab === 'fiat' && styles.activeHeaderTab]}
            onPress={() => setActiveTab('fiat')}
          >
            <Text style={[styles.headerTabText, activeTab === 'fiat' && styles.activeHeaderTabText]}>
              FIAT
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerTab, activeTab === 'crypto' && styles.activeHeaderTab]}
            onPress={() => setActiveTab('crypto')}
          >
            <Text style={[styles.headerTabText, activeTab === 'crypto' && styles.activeHeaderTabText]}>
              CRYPTO
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Chips */}
      {renderFilterChips()}

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={styles.loadingText.color} />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchTransactions(1)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContainer,
            transactions.length === 0 && styles.emptyListContainer
          ]}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={styles.loadingText.color}
              colors={[styles.loadingText.color]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerTabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 2,
  },
  headerTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  activeHeaderTab: {
    backgroundColor: '#FFFFFF',
  },
  headerTabText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  activeHeaderTabText: {
    color: '#000000',
  },
  filterContainer: {
    paddingVertical: 12,
  },
  filterList: {
    paddingHorizontal: 16,
  },
  filterChip: {
    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.accent,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  filterChipTextActive: {
    color: theme.isDark ? '#000000' : '#FFFFFF',
  },
  listContainer: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  emptyListContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.text,
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  },
  retryButtonText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',

    fontFamily: 'StagnanMedium',

  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
