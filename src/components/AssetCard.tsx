import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CryptoAsset, FiatAsset } from '../types/portfolio';
import { useStyles } from '../hooks/useTheme';
import { Theme } from '../types/theme';

interface AssetCardProps {
  asset: CryptoAsset | FiatAsset;
  type: 'crypto' | 'fiat';
  onPress?: () => void;
}

export default function AssetCard({ asset, type, onPress }: AssetCardProps) {
  const styles = useStyles((theme: Theme) => createStyles(theme));
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatBalance = (balance: number, symbol: string) => {
    if (type === 'crypto') {
      return `${balance.toFixed(5)} ${symbol}`;
    } else {
      return formatCurrency(balance);
    }
  };

  const renderCryptoAsset = (cryptoAsset: CryptoAsset) => (
    <>
      <View style={styles.assetInfo}>
        <View style={styles.iconContainer}>
          <Text style={[styles.assetIcon, { color: cryptoAsset.color }]}>
            {cryptoAsset.icon}
          </Text>
        </View>
        <View style={styles.assetDetails}>
          <Text style={styles.assetName}>{cryptoAsset.name}</Text>
          <Text style={styles.assetSymbol}>{cryptoAsset.symbol}</Text>
        </View>
      </View>
      <View style={styles.assetValues}>
        <Text style={styles.assetBalance}>
          {formatBalance(cryptoAsset.balance, cryptoAsset.symbol)}
        </Text>
        <View style={styles.valueRow}>
          <Text style={styles.assetValue}>
            {formatCurrency(cryptoAsset.usdValue)}
          </Text>
          <Text style={[styles.changePercent, { color: styles.assetSymbol.color }]}>
            {cryptoAsset.changePercent24h?.toFixed(1)}%
          </Text>
        </View>
      </View>
    </>
  );

  const renderFiatAsset = (fiatAsset: any) => (
    <>
      <View style={styles.assetInfo}>
        <View style={styles.iconContainer}>
          <Text style={[styles.assetIcon, { color: fiatAsset.color || '#FFFFFF' }]}>
            {fiatAsset.icon}
          </Text>
        </View>
        <View style={styles.assetDetails}>
          <Text style={styles.assetName}>{fiatAsset.name}</Text>
          <Text style={styles.assetSymbol}>{fiatAsset.symbol}</Text>
        </View>
      </View>
      <View style={styles.assetValues}>
        <Text style={styles.assetBalance}>
          {fiatAsset.balance.toLocaleString()} {fiatAsset.symbol}
        </Text>
        <View style={styles.valueRow}>
          <Text style={styles.assetValue}>
            {formatCurrency(fiatAsset.usdValue)}
          </Text>
          <Text style={[styles.changePercent, { color: styles.assetSymbol.color }]}>
            {fiatAsset.changePercent24h?.toFixed(1)}%
          </Text>
        </View>
      </View>
    </>
  );

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {type === 'crypto' 
        ? renderCryptoAsset(asset as CryptoAsset)
        : renderFiatAsset(asset as FiatAsset)
      }
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
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
  },
  assetInfo: {
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
  },
  assetIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  fiatIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  assetDetails: {
    flex: 1,
  },
  assetName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  assetSymbol: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  assetValues: {
    alignItems: 'flex-end',
  },
  assetBalance: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetValue: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginRight: 8,
  },
  changePercent: {
    fontSize: 14,
    fontWeight: '600',
  },
});
