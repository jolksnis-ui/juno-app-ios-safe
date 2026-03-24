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
import { Statement, StatementType } from '../types/statement';
import { getClientStatements, downloadStatement } from '../services/statementService';
import { TokenExpiredError } from '../utils/apiClient';
import { useStyles } from '../hooks/useTheme';
import { Theme } from '../types/theme';
import { useToast } from '../contexts/ToastContext';

interface StatementListScreenProps {
  onBack?: () => void;
  onLogout?: () => void;
  initialTab?: StatementType;
}

export default function StatementListScreen({ 
  onBack, 
  onLogout, 
  initialTab = 'fiat' 
}: StatementListScreenProps) {
  const styles = useStyles((theme: Theme) => createStyles(theme));
  const { showError, showSuccess } = useToast();
  const [activeTab, setActiveTab] = useState<StatementType>(initialTab);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch statements from API
  const fetchStatements = useCallback(async (isRefresh: boolean = false) => {
    try {
      setIsLoading(!isRefresh);
      setError(null);
      
      const fetchedStatements = await getClientStatements(activeTab);
      setStatements(fetchedStatements);
      
    } catch (error) {
      console.error('Failed to fetch statements:', error);
      
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
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch statements';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab, onLogout]);

  // Initial load and tab change
  useEffect(() => {
    fetchStatements();
  }, [activeTab, fetchStatements]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchStatements(true);
  }, [fetchStatements]);

  // Handle download statement
  const handleDownloadStatement = async (statement: Statement) => {
    if (statement.status !== 'generated') {
      Alert.alert('Download Error', 'Statement is not ready for download');
      return;
    }
    
    try {
      await downloadStatement(statement);
      showSuccess(`${statement.fileName} has been downloaded and saved to your device.`, 'Download Complete');
    } catch (error) {
      console.error('Download error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to download statement';
      showError(errorMessage, 'Download Error');
    }
  };

  // Handle create statement
  const handleCreateStatement = () => {
    router.push({
      pathname: '/(auth)/create-statement',
      params: { type: activeTab }
    });
  };

  // Format date range from timePeriod
  const formatTimePeriod = (timePeriod: { fromDate: string; endDate: string }) => {
    const fromDate = new Date(timePeriod.fromDate);
    const endDate = new Date(timePeriod.endDate);
    
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const fromMonth = monthNames[fromDate.getMonth()];
    const fromYear = fromDate.getFullYear();
    
    return `${fromMonth} ${fromYear}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get status color
  const getStatusColor = (status: Statement['status']) => {
    switch (status) {
      case 'generated':
        return '#4CAF50';
      case 'processing':
        return '#FF9800';
      case 'failed':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  // Render statement item
  const renderStatement = ({ item }: { item: Statement }) => (
    <View style={styles.statementCard}>
      <View style={styles.statementHeader}>
        <View style={styles.statementInfo}>
          <Text style={styles.statementCurrency}>{item.currencyShortName}</Text>
          <Text style={styles.statementPeriod}>{formatTimePeriod(item.timePeriod)}</Text>
        </View>
        <View style={styles.statementMeta}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.statementDetails}>
        <Text style={styles.fileName}>{item.fileName}</Text>
        <Text style={styles.generatedDate}>Generated: {formatDate(item.generatedDate)}</Text>
        <View style={styles.balanceInfo}>
          <Text style={styles.balanceText}>Opening: {item.openingBalance}</Text>
          <Text style={styles.balanceText}>Closing: {item.closingBalance}</Text>
        </View>
      </View>
      
      <View style={styles.statementActions}>
        <TouchableOpacity
          style={[
            styles.downloadButton,
            item.status !== 'generated' && styles.downloadButtonDisabled
          ]}
          onPress={() => handleDownloadStatement(item)}
          disabled={item.status !== 'generated'}
        >
          <Ionicons 
            name="download-outline" 
            size={16} 
            color={item.status === 'generated' ? '#FFFFFF' : '#999999'} 
          />
          <Text style={[
            styles.downloadButtonText,
            item.status !== 'generated' && styles.downloadButtonTextDisabled
          ]}>
            Download
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-outline" size={64} color="#666666" />
      <Text style={styles.emptyTitle}>No Statements Found</Text>
      <Text style={styles.emptySubtitle}>
        No {activeTab} statements have been generated yet.
      </Text>
      <TouchableOpacity style={styles.createButton} onPress={handleCreateStatement}>
        <Text style={styles.createButtonText}>Create First Statement</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={styles.headerTitle.color} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>STATEMENTS</Text>
        
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

      {/* Create Statement Button */}
      <View style={styles.createStatementContainer}>
        <TouchableOpacity style={styles.createStatementButton} onPress={handleCreateStatement}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.createStatementButtonText}>Create Statement</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={styles.loadingText.color} />
          <Text style={styles.loadingText}>Loading statements...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchStatements()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={statements}
          renderItem={renderStatement}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContainer,
            statements.length === 0 && styles.emptyListContainer
          ]}
          ListEmptyComponent={renderEmptyState}
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
  createStatementContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  createStatementButton: {
    backgroundColor: theme.colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  createStatementButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  listContainer: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  emptyListContainer: {
    flex: 1,
  },
  statementCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statementInfo: {
    flex: 1,
  },
  statementCurrency: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  statementPeriod: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  statementMeta: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statementDetails: {
    marginBottom: 16,
  },
  fileName: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 4,
  },
  generatedDate: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    marginBottom: 8,
  },
  balanceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  statementActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  downloadButton: {
    backgroundColor: theme.colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  downloadButtonDisabled: {
    backgroundColor: theme.colors.surfaceSecondary,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  downloadButtonTextDisabled: {
    color: '#999999',
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
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});