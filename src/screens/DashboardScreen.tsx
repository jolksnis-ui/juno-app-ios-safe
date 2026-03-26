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
  RefreshControl,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStyles, useTheme } from '../hooks/useTheme';
import { Theme } from '../types/theme';
import { AssetType } from '../types/portfolio';
import { getClientBalances, getCryptoBalances, TokenExpiredError } from '../services/balanceService';
import { logout } from '../services/authService';
import { FiatBalance, CryptoBalance } from '../types/balance';
import { useToast } from '../contexts/ToastContext';
import { CleanBackground } from '../components/CleanBackground';
import { CleanPortfolioHeader } from '../components/CleanPortfolioHeader';
import { CleanAssetCard } from '../components/CleanAssetCard';

interface DashboardScreenProps {
  userEmail?: string;
  onLogout?: () => void;
  onNavigateToTransactions?: (activeTab: AssetType) => void;
}

export default function DashboardScreen({ userEmail, onLogout, onNavigateToTransactions }: DashboardScreenProps) {
  const [activeTab, setActiveTab] = useState<AssetType>('fiat');
  const [fiatBalances, setFiatBalances] = useState<FiatBalance[]>([]);
  const [totalFiatAmount, setTotalFiatAmount] = useState<number>(0);
  const [cryptoBalances, setCryptoBalances] = useState<CryptoBalance[]>([]);
  const [totalCryptoAmount, setTotalCryptoAmount] = useState<number>(0);
  const [isLoadingFiatBalances, setIsLoadingFiatBalances] = useState<boolean>(false);
  const [isLoadingCryptoBalances, setIsLoadingCryptoBalances] = useState<boolean>(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // Theme hooks
  const { theme } = useTheme();
  const styles = useStyles((theme: Theme) => createStyles(theme));
  const { showError, showSuccess, showWarning, showInfo } = useToast();

  // Fetch balances on component mount
  useEffect(() => {
    fetchFiatBalances();
    fetchCryptoBalances();
  }, []);

  const fetchFiatBalances = async () => {
    setIsLoadingFiatBalances(true);
    setBalanceError(null);
    
    try {
      const response = await getClientBalances();
      setFiatBalances(response.clientBalanceList);
      setTotalFiatAmount(response.totalFiatAmount);
    } catch (error) {
      console.error('Failed to fetch fiat balances:', error);
      
      // Handle token expiration - automatically log out user
      if (error instanceof TokenExpiredError) {
        showError(
          'Your session has expired. Please login again.',
          'Session Expired'
        );
        // Immediately logout without waiting for user interaction
        if (onLogout) {
          onLogout();
        }
        return; // Don't set balance error, just logout
      }
      
      // Handle other errors normally
      setBalanceError(error instanceof Error ? error.message : 'Failed to fetch balances');
    } finally {
      setIsLoadingFiatBalances(false);
    }
  };

  const fetchCryptoBalances = async () => {
    setIsLoadingCryptoBalances(true);
    
    try {
      const response = await getCryptoBalances();
      setCryptoBalances(response.clientBalanceList);
      setTotalCryptoAmount(response.totalCryptoAmount);
    } catch (error) {
      console.error('Failed to fetch crypto balances:', error);
      
      // Handle token expiration - automatically log out user
      if (error instanceof TokenExpiredError) {
        showError(
          'Your session has expired. Please login again.',
          'Session Expired'
        );
        // Immediately logout without waiting for user interaction
        if (onLogout) {
          onLogout();
        }
        return; // Don't set balance error, just logout
      }
      
      // Handle other errors normally - for crypto we'll just log the error
      console.error('Crypto balance fetch failed:', error);
    } finally {
      setIsLoadingCryptoBalances(false);
    }
  };

  const handleActionPress = (action: string) => {
    Alert.alert(action, `${action} functionality will be implemented next`);
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

  const handleDepositActionPress = async () => {
    try {
      // Import DepositService at the top of the file
      const { DepositService } = await import('../services/depositService');
      
      // Check if IBAN data exists before navigating
      const ibanAccounts = await DepositService.getIBANAccountDetails();
      
      if (ibanAccounts && ibanAccounts.length > 0) {
        // Data exists, navigate to deposit screen
        router.push('/(auth)/deposit-fiat');
      } else {
        // No data, show admin contact message
        Alert.alert(
          "Deposit", 
          "Please contact ADMIN for details of how to deposit funds into your Juno Money account."
        );
      }
    } catch (error) {
      console.error('Error checking IBAN account details:', error);
      
      // Handle token expiration
      if (error instanceof TokenExpiredError) {
        showError(
          'Your session has expired. Please login again.',
          'Session Expired',
          {
            label: 'Login',
            onPress: () => {
              if (onLogout) {
                onLogout();
              }
            }
          }
        );
      } else {
        // For other errors, show admin contact message as fallback
        Alert.alert(
          "Deposit", 
          "Please contact ADMIN for details of how to deposit funds into your Juno Money account."
        );
      }
    }
  }

  const handleAssetPress = (assetName: string, balance?: any) => {
    if (activeTab === 'fiat' && balance) {
      // Navigate to fiat asset detail screen
      router.push({
        pathname: '/(auth)/asset-detail',
        params: {
          currencyData: JSON.stringify({
            currencyCode: balance.currencyShortName,
            currencyName: balance.currencyFullName,
            balance: balance.balanceAmount.toString(),
            percentage: balance.holdingPercentage.toString(),
            usdValue: balance.convertedUSDAmount.toString(),
            symbol: fiatIcons[balance.currencyShortName] || '$',
            flag: fiatFlags[balance.currencyShortName] || '🏳️',
            color: fiatColors[balance.currencyShortName] || '#007AFF'
          })
        }
      });
    } else if (activeTab === 'crypto' && balance) {
      // Navigate to crypto asset detail screen
      router.push({
        pathname: '/(auth)/crypto-asset-detail',
        params: {
          cryptoData: JSON.stringify({
            symbol: balance.currencyShortName,
            name: balance.currencyShortName,
            icon: cryptoIcons[balance.currencyShortName] || '◎',
            price: `$${(Number(balance.convertedUSDAmount) / Number(balance.balanceAmount)).toFixed(2)}`, // Calculate price per unit
            balance: balance.balanceAmount.toString(),
            usdValue: `$${Number(balance.convertedUSDAmount).toLocaleString()}`,
            percentage: balance.holdingPercentage.toString(),
            color: cryptoColors[balance.currencyShortName] || '#007AFF'
          })
        }
      });
    } else {
      // Fallback for when balance data is not available
      Alert.alert('Asset Details', `View details for ${assetName}`);
    }
  };

  const handleTabSwitch = (tab: AssetType) => {
    setActiveTab(tab);
    
    // Fetch fresh data when switching tabs
    if (tab === 'fiat') {
      fetchFiatBalances();
    } else if (tab === 'crypto') {
      fetchCryptoBalances();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'crypto') {
        await fetchCryptoBalances();
      } else {
        await fetchFiatBalances();
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout(); // Clear storage
              if (onLogout) {
                onLogout(); // Navigate to login screen
              }
            } catch (error) {
              console.error('Logout error:', error);
              // Even if logout fails, still navigate to login
              if (onLogout) {
                onLogout();
              }
            }
          },
        },
      ]
    );
  };

  // Currency colors for fiat assets
  const fiatColors: { [key: string]: string } = {
    'USD': '#00D4AA',
    'EUR': '#627EEA',
    'GBP': '#9945FF',
    'JPY': '#FF6B6B',
    'CAD': '#4ECDC4',
    'AUD': '#45B7D1',
    'CHF': '#F7931A',
    'CNY': '#FF9500',
    'AED': '#34C759',
    'TRY': '#AF52DE',
  };

  // Currency icons for fiat assets
  const fiatIcons: { [key: string]: string } = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CAD': 'C$',
    'AUD': 'A$',
    'CHF': '₣',
    'CNY': '¥',
    'AED': 'د.إ',
  };

  // Currency flags for fiat assets
  const fiatFlags: { [key: string]: string } = {
    'USD': '🇺🇸',
    'EUR': '🇪🇺',
    'GBP': '🇬🇧',
    'AED': '🇦🇪',
    'CAD': '🇨🇦',
    'AUD': '🇦🇺',
    'CHF': '🇨🇭',
    'TRY': '🇹🇷',
    'HKD': '🇭🇰',
    'SGD': '🇸🇬',
    'JPY': '🇯🇵',
    'CNY': '🇨🇳',
  };

  // Crypto colors for crypto assets
  const cryptoColors: { [key: string]: string } = {
    'BTC': '#F7931A',
    'ETH': '#627EEA',
    'LTC': '#BFBBBB',
    'XRP': '#23292F',
    'TRX': '#FF060A',
    'DAI': '#F5AC37',
    'USDT': '#26A17B',
    'USDC': '#2775CA',
    'TRC20-USDT': '#26A17B',
  };

  // Crypto icons for crypto assets
  const cryptoIcons: { [key: string]: string } = {
    'BTC': '₿',
    'ETH': 'Ξ',
    'LTC': 'Ł',
    'XRP': '◊',
    'TRX': '▲',
    'DAI': '◈',
    'USDT': '₮',
    'USDC': '◎',
    'TRC20-USDT': '₮',
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
        {/* Header with Tabs */}
        <View style={styles.header}>
          <View style={styles.brandContainer}>
            <Text style={styles.brandText}>juno</Text>
          </View>
          <View style={styles.headerTabs}>
            <TouchableOpacity
              style={[styles.headerTab, activeTab === 'fiat' && styles.activeHeaderTab]}
              onPress={() => handleTabSwitch('fiat')}
            >
              <Text style={[styles.headerTabText, activeTab === 'fiat' && styles.activeHeaderTabText]}>
                FIAT
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerTab, activeTab === 'crypto' && styles.activeHeaderTab]}
              onPress={() => handleTabSwitch('crypto')}
            >
              <Text style={[styles.headerTabText, activeTab === 'crypto' && styles.activeHeaderTabText]}>
                CRYPTO
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/(auth)/profile')}
          >
            <Ionicons name="person-circle-outline" size={28} color={styles.brandText.color} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#00D4AA']}
              tintColor="#00D4AA"
            />
          }
        >
          {/* Clean Portfolio Header with Integrated Action Buttons */}
          <CleanPortfolioHeader
            totalValue={activeTab === 'crypto' ? totalCryptoAmount : totalFiatAmount}
            type={activeTab}
            actions={activeTab === 'crypto' ? {
              onBuy: () => router.push('/(auth)/buy-crypto'),
              onSell: () => router.push('/(auth)/sell-crypto'),
              onReceive: () => router.push('/(auth)/receive-crypto'),
              onExchange: () => router.push('/(auth)/exchange-crypto'),
              onSend: () => router.push('/(auth)/send-crypto'),
            } : {
              onDeposit: () => handleDepositActionPress(),
              onWithdrawal: () => router.push('/(auth)/withdraw-fiat'),
              onPaymentOut: () => handlePaymentOutPress(),
              onFX: () => handleFXPress(),
              onTransfer: () => handleTransferPress(),
            }}
          />

          {/* Assets List */}
          <View style={styles.assetsSection}>
            <View style={styles.assetsHeader}>
              <Text style={styles.assetsTitle}>Assets</Text>
              <TouchableOpacity onPress={activeTab === 'crypto' ? fetchCryptoBalances : fetchFiatBalances}>
                <Ionicons name="refresh-outline" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {(activeTab === 'crypto' ? isLoadingCryptoBalances : isLoadingFiatBalances) && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00D4AA" />
                <Text style={styles.loadingText}>Loading {activeTab} assets...</Text>
              </View>
            )}
            
            {balanceError && activeTab === 'fiat' && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{balanceError}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchFiatBalances}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {activeTab === 'crypto' && !isLoadingCryptoBalances && (
              <>
                {cryptoBalances
                  .filter(balance => Number(balance.balanceAmount) > 0)
                  .map((balance, index) => (
                    <CleanAssetCard
                      key={balance.currencyShortName}
                      symbol={balance.currencyShortName}
                      name={balance.currencyShortName}
                      icon={cryptoIcons[balance.currencyShortName] || '◎'}
                      balance={Number(balance.balanceAmount).toFixed(4)}
                      usdValue={Number(balance.convertedUSDAmount).toLocaleString()}
                      changePercent={Number(balance.holdingPercentage) || 0}
                      index={index}
                      onPress={() => handleAssetPress(balance.currencyShortName, balance)}
                    />
                  ))}
                
                {cryptoBalances.filter(balance => Number(balance.balanceAmount) > 0).length === 0 && (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No crypto balances found</Text>
                  </View>
                )}
              </>
            )}

            {activeTab === 'fiat' && !isLoadingFiatBalances && !balanceError && (
              <>
                {fiatBalances
                  .filter(balance => balance.balanceAmount > 0)
                  .map((balance, index) => (
                    <CleanAssetCard
                      key={balance.currencyShortName}
                      symbol={balance.currencyShortName}
                      name={balance.currencyFullName}
                      icon={fiatIcons[balance.currencyShortName] || '$'}
                      balance={balance.balanceAmount.toFixed(2)}
                      usdValue={balance.convertedUSDAmount.toLocaleString()}
                      changePercent={balance.holdingPercentage || 0}
                      index={index}
                      onPress={() => handleAssetPress(balance.currencyFullName, balance)}
                    />
                  ))}
                
                {fiatBalances.filter(balance => balance.balanceAmount > 0).length === 0 && (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No fiat balances found</Text>
                  </View>
                )}
              </>
            )}
          </View>
          
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="home" size={24} color={theme.colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => onNavigateToTransactions && onNavigateToTransactions(activeTab)}
          >
            <Ionicons name="time-outline" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => router.push('/(auth)/chat')}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  brandContainer: {
    flex: 1,
  },
  brandText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.isDark ? '#FFFFFF' : '#000000',
  },
  headerTabs: {
    flexDirection: 'row',
    backgroundColor: theme.isDark ? '#2A2A2A' : 'rgba(0, 0, 0, 0.15)',
    borderRadius: 8,
    padding: 2,
  },
  headerTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  activeHeaderTab: {
    backgroundColor: '#FFFFFF',
  },
  headerTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.isDark ? '#888888' : '#000000',
  },
  activeHeaderTabText: {
    color: '#000000',
  },
  profileButton: {
    marginLeft: 16,
  },
  content: {
    flex: 1,
  },
  assetsSection: {
    marginTop: 20,
  },
  assetsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  assetsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.isDark ? '#FFFFFF' : '#000000',
    letterSpacing: 0.5,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: theme.isDark ? 'rgba(26, 26, 26, 0.95)' : 'rgba(248, 249, 250, 0.95)',
    paddingVertical: 10,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
  },
  navItem: {
    padding: 8,
  },
  // Loading and error states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: theme.isDark ? '#FFFFFF' : '#000000',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: theme.colors.surfaceSecondary,
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
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: theme.isDark ? '#FFFFFF' : '#000000',
    fontSize: 16,
  },
});