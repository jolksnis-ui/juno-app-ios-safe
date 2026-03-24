import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CryptoAsset } from '../types/portfolio';
import { FiatBalance, CryptoBalance } from '../types/balance';
import CircularProgressChart from './CircularProgressChart';

interface AssetBreakdownItem {
  id: string;
  name: string;
  symbol: string;
  value: number;
  usdValue: number;
  percentage: number;
  color: string;
  icon: string;
}

interface PortfolioDashboardProps {
  totalValue: number | undefined;
  assets: CryptoAsset[] | FiatBalance[] | CryptoBalance[];
  type: 'crypto' | 'fiat';
  onAssetPress?: (assetId: string) => void;
}

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
  'XRP': 'XRP',
  'TRX': 'TRX',
  'DAI': 'DAI',
  'USDT': '₮',
  'USDC': 'USDC',
  'TRC20-USDT': '₮',
};

export default function PortfolioDashboard({ 
  totalValue, 
  assets, 
  type,
  onAssetPress 
}: PortfolioDashboardProps) {
  
  const formatCurrency = (value: number | undefined | null | string) => {
    const numValue = Number(value);
    const safeValue = Number.isFinite(numValue) ? numValue : 0;
    if (safeValue >= 1000000) {
      return `$${(safeValue / 1000000).toFixed(2)}M`;
    } else if (safeValue >= 1000) {
      return `$${(safeValue / 1000).toFixed(0)}K`;
    }
    return `$${safeValue.toFixed(2)}`;
  };

  const formatLargeCurrency = (value: number | undefined | null | string) => {
    const numValue = Number(value);
    const safeValue = Number.isFinite(numValue) ? numValue : 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeValue);
  };

  // Convert assets to unified format for breakdown display
  const getAssetBreakdown = (): AssetBreakdownItem[] => {
    if (!assets || assets.length === 0) {
      return [];
    }
    
    if (type === 'crypto') {
      // Check if it's CryptoBalance[] or CryptoAsset[]
      const firstAsset = assets[0];
      if (firstAsset && 'currencyShortName' in firstAsset) {
        // Handle CryptoBalance[]
        const cryptoBalances = assets as CryptoBalance[];
        const totalAssetValue = cryptoBalances.reduce((sum, asset) => sum + (Number(asset.convertedUSDAmount) || 0), 0);
        
        return cryptoBalances
          .filter(asset => (Number(asset.balanceAmount) || 0) > 0)
          .sort((a, b) => (Number(b.convertedUSDAmount) || 0) - (Number(a.convertedUSDAmount) || 0))
          .slice(0, 4)
          .map((asset) => {
            const safeBalance = Number(asset.balanceAmount) || 0;
            const safeUsdValue = Number(asset.convertedUSDAmount) || 0;
            const safePercentage = totalAssetValue > 0 ? (safeUsdValue / totalAssetValue) * 100 : 0;
            
            return {
              id: asset.currencyShortName,
              name: asset.currencyShortName,
              symbol: asset.currencyShortName,
              value: safeBalance,
              usdValue: safeUsdValue,
              percentage: safePercentage,
              color: cryptoColors[asset.currencyShortName] || '#FFFFFF',
              icon: cryptoIcons[asset.currencyShortName] || asset.currencyShortName,
            };
          });
      } else {
        // Handle CryptoAsset[]
        const cryptoAssets = assets as CryptoAsset[];
        const totalAssetValue = cryptoAssets.reduce((sum, asset) => sum + asset.usdValue, 0);
        
        return cryptoAssets
          .sort((a, b) => b.usdValue - a.usdValue)
          .slice(0, 4)
          .map((asset) => ({
            id: asset.id,
            name: asset.name,
            symbol: asset.symbol,
            value: asset.balance,
            usdValue: asset.usdValue,
            percentage: (asset.usdValue / totalAssetValue) * 100,
            color: asset.color,
            icon: asset.icon,
          }));
      }
    } else {
      const fiatAssets = assets as FiatBalance[];
      const totalAssetValue = fiatAssets.reduce((sum, asset) => sum + asset.convertedUSDAmount, 0);
      
      return fiatAssets
        .filter(asset => asset.balanceAmount > 0)
        .sort((a, b) => b.convertedUSDAmount - a.convertedUSDAmount)
        .slice(0, 4)
        .map((asset) => ({
          id: asset.currencyShortName,
          name: asset.currencyFullName,
          symbol: asset.currencyShortName,
          value: asset.balanceAmount,
          usdValue: asset.convertedUSDAmount,
          percentage: (asset.convertedUSDAmount / totalAssetValue) * 100,
          color: fiatColors[asset.currencyShortName] || '#FFFFFF',
          icon: fiatIcons[asset.currencyShortName] || asset.currencyShortName,
        }));
    }
  };

  const assetBreakdown = getAssetBreakdown();
  const totalAssets = !assets || assets.length === 0 
    ? 0
    : type === 'crypto' 
      ? (() => {
          const firstAsset = assets[0];
          if (firstAsset && 'currencyShortName' in firstAsset) {
            // CryptoBalance[]
            return (assets as CryptoBalance[]).filter(asset => asset.balanceAmount > 0).length;
          } else {
            // CryptoAsset[]
            return (assets as CryptoAsset[]).length;
          }
        })()
      : (assets as FiatBalance[]).filter(asset => asset.balanceAmount > 0).length;

  const renderProgressBar = (percentage: number, color: string) => (
    <View style={styles.progressBarContainer}>
      <View style={styles.progressBarBackground}>
        <View 
          style={[
            styles.progressBarFill, 
            { width: `${percentage}%`, backgroundColor: color }
          ]} 
        />
      </View>
    </View>
  );

  const renderAssetBreakdownItem = (item: AssetBreakdownItem) => (
    <TouchableOpacity 
      key={item.id}
      style={styles.breakdownItem}
      onPress={() => onAssetPress?.(item.id)}
    >
      <View style={styles.assetInfo}>
        <View style={[styles.assetIconContainer, { backgroundColor: item.color + '20' }]}>
          <Text style={[styles.assetIcon, { color: item.color }]}>
            {item.icon}
          </Text>
        </View>
        <Text style={styles.assetSymbol}>{item.symbol}</Text>
      </View>
      
      {renderProgressBar(item.percentage, item.color)}
      
      <View style={styles.assetValues}>
        <Text style={styles.assetPercentage}>{(item.percentage || 0).toFixed(1)}%</Text>
        <Text style={styles.assetValue}>{formatCurrency(item.usdValue)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View >
      {/* Circular Progress Chart */}
      <CircularProgressChart
        totalValue={totalValue || 0}
        assets={assetBreakdown}
        size={380}
      />

      {/* Asset Breakdown
      <View style={styles.breakdownSection}>
        <Text style={styles.breakdownTitle}>
          {type === 'crypto' ? 'ASSET' : 'CURRENCY'} BREAKDOWN
        </Text>
        <View style={styles.breakdownList}>
          {assetBreakdown.map(renderAssetBreakdownItem)}
        </View>
      </View> */}

      {/* Stats Cards
      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalAssets}</Text>
          <Text style={styles.statLabel}>
            TOTAL {type === 'crypto' ? 'ASSETS' : 'CURRENCIES'}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {type === 'crypto' ? '24' : '12'}
          </Text>
          <Text style={styles.statLabel}>
            {type === 'crypto' ? 'SUPPORTED' : 'AVAILABLE'}
          </Text>
        </View>
      </View> */}
    </View>
  );
}

const styles = StyleSheet.create({
  // container: {
  //   paddingHorizontal: 20,
  //   paddingVertical: 24,
  // },
  totalValueSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  totalValueLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
    marginBottom: 8,
    letterSpacing: 1,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  breakdownSection: {
    marginBottom: 24,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  breakdownList: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  assetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  assetIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  assetIcon: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  assetSymbol: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressBarContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#2A2A2A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  assetValues: {
    alignItems: 'flex-end',
    width: 80,
  },
  assetPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  assetValue: {
    fontSize: 10,
    color: '#888888',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 0.48,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#888888',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
