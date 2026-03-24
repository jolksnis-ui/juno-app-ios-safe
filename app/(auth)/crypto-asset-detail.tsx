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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useStyles, useTheme } from '../../src/hooks/useTheme';
import { Theme } from '../../src/types/theme';
import { Transaction } from '../../src/types/transaction';
import { PricePoint, CryptoStatistics, TimePeriod } from '../../src/types/cryptoPrice';
import { CryptoBalance } from '../../src/types/balance';
import { getCryptoTransactions, TokenExpiredError } from '../../src/services/transactionService';
import { getCryptoPriceTrend, getCryptoPrices, formatMarketCap, getCoinNameForAPI } from '../../src/services/cryptoPriceService';
import { getCryptoBalances } from '../../src/services/balanceService';
import TransactionCard from '../../src/components/TransactionCard';
import UnifiedActionButtons from '../../src/components/UnifiedActionButtons';
import ProgressBar from '../../src/components/ProgressBar';

const { width } = Dimensions.get('window');

interface CryptoAssetDetailData {
  symbol: string;
  name: string;
  icon: string;
  price: string;
  balance: string;
  usdValue: string;
  percentage: string;
  color: string;
}

const TimePeriodSelector: React.FC<{
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  isLoading: boolean;
}> = ({ selectedPeriod, onPeriodChange, isLoading }) => {
  const { theme } = useTheme();
  const styles = useStyles((theme: Theme) => createStyles(theme));
  const periods: TimePeriod[] = ['1W', '1M', '3M', '6M', '1Y'];
  
  return (
    <View style={styles.periodSelector}>
      {periods.map(period => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive,
            isLoading && styles.periodButtonDisabled
          ]}
          onPress={() => !isLoading && onPeriodChange(period)}
          disabled={isLoading}
        >
          <Text style={[
            styles.periodText,
            selectedPeriod === period && styles.periodTextActive,
            isLoading && styles.periodTextDisabled
          ]}>
            {period}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const CryptoStatisticsSection: React.FC<{
  statistics: CryptoStatistics | null;
  cryptoName: string;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}> = ({ statistics, cryptoName, isLoading, error, onRetry }) => {
  const { theme } = useTheme();
  const styles = useStyles((theme: Theme) => createStyles(theme));
  
  if (isLoading) {
    return (
      <View style={styles.statisticsSection}>
        <Text style={styles.statisticsTitle}>
          {cryptoName.toUpperCase()} STATISTICS
        </Text>
        <View style={styles.statisticsLoadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={styles.loadingText}>Loading statistics...</Text>
        </View>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.statisticsSection}>
        <Text style={styles.statisticsTitle}>
          {cryptoName.toUpperCase()} STATISTICS
        </Text>
        <View style={styles.statisticsErrorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  if (!statistics) return null;
  
  return (
    <View style={styles.statisticsSection}>
      <Text style={styles.statisticsTitle}>
        {cryptoName.toUpperCase()} STATISTICS
      </Text>
      
      {/* Top Row - Price and Market Cap */}
      <View style={styles.statisticsTopRow}>
        <View style={styles.statisticsCard}>
          <Text style={styles.statisticsLabel}>PRICE</Text>
          <Text style={styles.statisticsValue}>{statistics.price}</Text>
        </View>
        
        <View style={styles.statisticsCard}>
          <Text style={styles.statisticsLabel}>MARKET CAP</Text>
          <Text style={styles.statisticsValue}>{statistics.marketCap}</Text>
        </View>
      </View>
      
      {/* Bottom Row - 24H Change */}
      <View style={styles.statisticsBottomRow}>
        <View style={styles.statisticsCardFull}>
          <Text style={styles.statisticsLabel}>CHANGE 24H</Text>
          <Text style={[
            styles.statisticsChangeValue,
            { color: statistics.changeDirection === 'up' ? '#00D4AA' : '#FF453A' }
          ]}>
            {statistics.changeDirection === 'up' ? '▲' : '▼'} {statistics.change24h.toFixed(1)}%
          </Text>
        </View>
      </View>
    </View>
  );
};

const ProfessionalPriceChart: React.FC<{
  data: PricePoint[];
  color: string;
  height: number;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}> = ({ data, color, height, isLoading, error, onRetry }) => {
  const { theme } = useTheme();
  const styles = useStyles((theme: Theme) => createStyles(theme));
  
  if (isLoading) {
    return (
      <View style={[styles.chartContainer, { height, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={color} />
        <Text style={styles.loadingText}>Loading chart...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={[styles.chartContainer, { height, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (data.length === 0) {
    return (
      <View style={[styles.chartContainer, { height, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.emptyText}>No chart data available</Text>
      </View>
    );
  }
  
  const minPrice = Math.min(...data.map(p => p.price));
  const maxPrice = Math.max(...data.map(p => p.price));
  const priceRange = maxPrice - minPrice || 1; // Avoid division by zero
  
  // Generate Y-axis labels
  const yLabels = [];
  const yPositions = [];
  for (let i = 0; i < 6; i++) {
    const price = maxPrice - (priceRange * i / 5);
    yLabels.push(`$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`);
    yPositions.push(10 + (i * (height - 20) / 5));
  }
  
  // Create chart path points
  const chartWidth = width - 80;
  const chartHeight = height - 20;
  
  const pathPoints = data.map((point, index) => {
    const x = (index / (data.length - 1)) * chartWidth;
    const y = chartHeight - ((point.price - minPrice) / priceRange) * chartHeight;
    return { x, y };
  });
  
  // Create smooth SVG path
  const createSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      
      if (i === 1) {
        // First curve
        const controlX = prev.x + (curr.x - prev.x) * 0.3;
        path += ` Q ${controlX} ${prev.y}, ${curr.x} ${curr.y}`;
      } else {
        // Smooth curves using quadratic bezier
        const controlX = prev.x + (curr.x - prev.x) * 0.5;
        const controlY = prev.y + (curr.y - prev.y) * 0.5;
        path += ` Q ${controlX} ${controlY}, ${curr.x} ${curr.y}`;
      }
    }
    
    return path;
  };
  
  // Create area fill path
  const createAreaPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';
    
    const linePath = createSmoothPath(points);
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    
    return `${linePath} L ${lastPoint.x} ${chartHeight} L ${firstPoint.x} ${chartHeight} Z`;
  };
  
  return (
    <View style={styles.chartContainer}>
      {/* Y-axis labels */}
      <View style={styles.yAxisLabels}>
        {yLabels.map((label, index) => (
          <Text key={index} style={styles.yAxisLabel}>{label}</Text>
        ))}
      </View>
      
      {/* SVG Chart */}
      <View style={[styles.chartArea, { height }]}>
        <Svg height={height} width={chartWidth} style={styles.svgChart}>
          {/* Gradient definition */}
          <Defs>
            <LinearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </LinearGradient>
          </Defs>
          
          {/* Area fill */}
          <Path
            d={createAreaPath(pathPoints)}
            fill="url(#gradient)"
          />
          
          {/* Price line */}
          <Path
            d={createSmoothPath(pathPoints)}
            stroke={color}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {pathPoints.map((point, index) => (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="3"
              fill={color}
              stroke={theme.colors.surface}
              strokeWidth="2"
            />
          ))}
        </Svg>
      </View>
    </View>
  );
};

export default function CryptoAssetDetailScreen() {
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const styles = useStyles((theme: Theme) => createStyles(theme));
  
  // Parse crypto data from route parameters
  const cryptoData: CryptoAssetDetailData = JSON.parse(params.cryptoData as string);
  
  // State management
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1M');
  const [priceData, setPriceData] = useState<PricePoint[]>([]);
  const [cryptoStatistics, setCryptoStatistics] = useState<CryptoStatistics | null>(null);
  const [realBalance, setRealBalance] = useState<CryptoBalance | null>(null);
  
  // Loading states
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [isLoadingStatistics, setIsLoadingStatistics] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  
  // Error states
  const [chartError, setChartError] = useState<string | null>(null);
  const [statisticsError, setStatisticsError] = useState<string | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  useEffect(() => {
    loadRealBalance();
    loadStatistics();
    loadPriceTrend('1M');
    loadTransactions();
  }, []);

  const loadRealBalance = async () => {
    setIsLoadingBalance(true);
    setBalanceError(null);
    
    try {
      const response = await getCryptoBalances();
      const balance = response.clientBalanceList.find(
        b => b.currencyShortName === cryptoData.symbol
      );
      setRealBalance(balance || null);
    } catch (error) {
      console.error('Failed to load balance:', error);
      setBalanceError('Failed to load balance');
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const loadPriceTrend = async (timePeriod: TimePeriod) => {
    setIsLoadingChart(true);
    setChartError(null);
    
    try {
      const coinName = getCoinNameForAPI(cryptoData.symbol);
      const response = await getCryptoPriceTrend(coinName, timePeriod);
      const trendData = response.data[0]?.trend || [];
      
      // Convert API data to chart format
      const chartData: PricePoint[] = trendData.map(([timestamp, price]) => ({
        timestamp,
        price
      }));
      
      setPriceData(chartData);
    } catch (error) {
      console.error('Failed to load price trend:', error);
      if (error instanceof TokenExpiredError) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [{ text: 'OK', onPress: () => router.replace('/(public)/login') }]
        );
      } else {
        setChartError('Failed to load price chart');
      }
    } finally {
      setIsLoadingChart(false);
    }
  };

  const loadStatistics = async () => {
    setIsLoadingStatistics(true);
    setStatisticsError(null);
    
    try {
      const response = await getCryptoPrices();
      
      // Find crypto by symbol instead of coin name
      const coinData = response.data.find(
        crypto => crypto.symbol.toLowerCase() === cryptoData.symbol.toLowerCase()
      );
      
      if (coinData) {
        const statistics: CryptoStatistics = {
          price: `$${coinData.current_price.toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          })}`,
          marketCap: coinData.market_cap, // Already formatted as "2.36T"
          change24h: Math.abs(coinData.price_change_percentage_24h),
          changeDirection: coinData.price_change_percentage_24h >= 0 ? 'up' : 'down'
        };
        
        setCryptoStatistics(statistics);
      } else {
        setStatisticsError(`Price data not available for ${cryptoData.symbol}`);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
      if (error instanceof TokenExpiredError) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [{ text: 'OK', onPress: () => router.replace('/(public)/login') }]
        );
      } else {
        setStatisticsError('Failed to load statistics');
      }
    } finally {
      setIsLoadingStatistics(false);
    }
  };

  const loadTransactions = async () => {
    setIsLoadingTransactions(true);
    setTransactionError(null);
    
    try {
      const response = await getCryptoTransactions(1, 20);
      
      // Filter transactions by currency code
      const currencyTransactions = response.transactions
        .filter(transaction => transaction.currency === cryptoData.symbol)
        .slice(0, 5);
      
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
        tab: 'crypto'
      }
    });
  };

  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period);
    loadPriceTrend(period);
  };

  const renderTransactionItem = (transaction: Transaction) => (
    <TransactionCard
      key={transaction.id}
      transaction={transaction}
      onPress={() => handleTransactionPress(transaction)}
    />
  );

  // Get display data (real balance if available, fallback to passed data)
  const balanceDisplay = realBalance ? {
    usdValue: `$${Number(realBalance.convertedUSDAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    cryptoAmount: `${realBalance.balanceAmount} ${realBalance.currencyShortName}`,
    percentage: realBalance.holdingPercentage.toString()
  } : {
    usdValue: cryptoData.usdValue,
    cryptoAmount: `${cryptoData.balance} ${cryptoData.symbol}`,
    percentage: cryptoData.percentage
  };

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
          <Text style={styles.headerTitle}>{cryptoData.name}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Market Price Section */}
          <View style={styles.priceSection}>
            {/* Crypto Header */}
            <View style={styles.cryptoHeader}>
              <View style={[styles.cryptoIconContainer, { backgroundColor: cryptoData.color }]}>
                <Text style={styles.cryptoIcon}>{cryptoData.icon}</Text>
              </View>
              <Text style={styles.cryptoName}>{cryptoData.name} ({cryptoData.symbol})</Text>
            </View>
            
            {/* Price Display - Use real price from statistics if available */}
            <Text style={styles.priceAmount}>
              {cryptoStatistics?.price || cryptoData.price}
            </Text>
            
            {/* Time Period Selector */}
            <TimePeriodSelector
              selectedPeriod={selectedPeriod}
              onPeriodChange={handlePeriodChange}
              isLoading={isLoadingChart}
            />
            
            {/* Price Chart */}
            <ProfessionalPriceChart
              data={priceData}
              color={cryptoData.color}
              height={200}
              isLoading={isLoadingChart}
              error={chartError}
              onRetry={() => loadPriceTrend(selectedPeriod)}
            />
          </View>

          {/* Balance Section */}
          <View style={styles.balanceSection}>
            <Text style={styles.balanceLabel}>YOUR BALANCE</Text>
            {isLoadingBalance ? (
              <View style={styles.balanceLoadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.accent} />
                <Text style={styles.loadingText}>Loading balance...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.balanceAmount}>
                  {balanceDisplay.usdValue} <Text style={styles.cryptoAmount}>{balanceDisplay.cryptoAmount}</Text>
                </Text>
                <Text style={styles.balancePercentage}>{balanceDisplay.percentage}%</Text>
                <View style={styles.progressBarContainer}>
                  <ProgressBar 
                    percentage={parseFloat(balanceDisplay.percentage)} 
                    color={cryptoData.color}
                  />
                </View>
              </>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsSection}>
            <UnifiedActionButtons
              type="crypto"
              actions={{
                onBuy: () => router.push('/(auth)/buy-crypto'),
                onSell: () => router.push('/(auth)/sell-crypto'),
                onReceive: () => router.push('/(auth)/receive-crypto'),
                onExchange: () => router.push('/(auth)/exchange-crypto'),
                onSend: () => router.push('/(auth)/send-crypto'),
              }}
            />
          </View>

          {/* Crypto Statistics Section */}
          <CryptoStatisticsSection
            statistics={cryptoStatistics}
            cryptoName={cryptoData.name}
            isLoading={isLoadingStatistics}
            error={statisticsError}
            onRetry={loadStatistics}
          />

          {/* Transactions Section */}
          <View style={styles.transactionsSection}>
            <View style={styles.transactionsSectionHeader}>
              <Text style={styles.transactionsTitle}>
                {cryptoData.name} TRANSACTIONS
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
                <Text style={styles.emptyText}>No {cryptoData.symbol} transactions found</Text>
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
  priceSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  cryptoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cryptoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cryptoIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  cryptoName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  periodButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  periodButtonActive: {
    backgroundColor: theme.colors.accent,
  },
  periodButtonDisabled: {
    opacity: 0.6,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  periodTextActive: {
    color: theme.isDark ? '#000000' : '#FFFFFF',
  },
  periodTextDisabled: {
    opacity: 0.6,
  },
  chartContainer: {
    height: 200,
    flexDirection: 'row',
    marginBottom: 20,
  },
  yAxisLabels: {
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginRight: 10,
    width: 60,
  },
  yAxisLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  chartArea: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  svgChart: {
    backgroundColor: 'transparent',
  },
  chartLine: {
    position: 'absolute',
    height: 2,
    borderRadius: 1,
  },
  chartPoint: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
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
  balanceLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  cryptoAmount: {
    fontSize: 16,
    fontWeight: '400',
    color: theme.colors.textSecondary,
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
    paddingHorizontal: 3,
    marginBottom: 32,
  },
  // Statistics section styles
  statisticsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  statisticsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  statisticsLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  statisticsErrorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  statisticsTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statisticsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    flex: 0.48,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statisticsBottomRow: {
    width: '100%',
  },
  statisticsCardFull: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statisticsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  statisticsValue: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  statisticsChangeValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  transactionsSection: {
    paddingHorizontal:3,
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
    gap: 0,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: theme.colors.text,
    marginTop: 16,
    fontSize: 16,
    marginLeft: 8,
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
