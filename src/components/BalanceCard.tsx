import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import ProgressBar from './ProgressBar';
import { useStyles } from '../hooks/useTheme';
import { Theme } from '../types/theme';

interface BalanceCardProps {
  type: 'crypto' | 'fiat';
  icon: string;
  iconColor: string;
  name: string;
  code: string;
  percentage: number;
  primaryAmount: string;
  secondaryAmount: string;
  progressColor: string;
  onPress?: () => void;
}

// Fiat currency mappings
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
};

const fiatNames: { [key: string]: string } = {
  'USD': 'US DOLLAR',
  'EUR': 'EURO',
  'GBP': 'BRITISH POUND',
  'AED': 'UAE DIRHAM',
  'CAD': 'CANADIAN DOLLAR',
  'AUD': 'AUSTRALIAN DOLLAR',
  'CHF': 'SWISS FRANC',
  'TRY': 'TURKISH LIRA',
  'HKD': 'HONG KONG DOLLAR',
  'SGD': 'SINGAPORE DOLLAR',
};

// Crypto currency mappings
const cryptoIcons: { [key: string]: string } = {
  'BTC': '₿',
  'ETH': 'Ξ',
  'LTC': 'Ł',
  'TRX': '▲',
  'USDC': '$',
  'USDT': '₮',
};

const cryptoNames: { [key: string]: string } = {
  'BTC': 'BITCOIN',
  'ETH': 'ETHEREUM',
  'LTC': 'LITECOIN',
  'TRX': 'TRON',
  'USDC': 'USD COIN',
  'USDT': 'TETHER',
};

const cryptoProgressColors: { [key: string]: string } = {
  'BTC': '#F7931A',
  'ETH': '#627EEA',
  'LTC': '#345D9D',
  'TRX': '#FF060A',
  'USDC': '#2775CA',
  'USDT': '#26A17B',
};

// Crypto icon colors (same as progress colors for brand consistency)
const cryptoIconColors: { [key: string]: string } = {
  'BTC': '#F7931A', // Bitcoin Orange
  'ETH': '#627EEA', // Ethereum Blue
  'LTC': '#345D9D', // Litecoin Blue
  'TRX': '#FF060A', // Tron Red
  'USDC': '#2775CA', // USDC Blue
  'USDT': '#26A17B', // Tether Green
};

// Fiat currency colors for container backgrounds
const fiatColors: { [key: string]: string } = {
  'USD': '#00D4AA', // US Dollar Green
  'EUR': '#627EEA', // Euro Blue
  'GBP': '#9945FF', // British Pound Purple
  'AED': '#34C759', // UAE Dirham Green
  'CAD': '#4ECDC4', // Canadian Dollar Teal
  'AUD': '#45B7D1', // Australian Dollar Blue
  'CHF': '#F7931A', // Swiss Franc Orange
  'TRY': '#AF52DE', // Turkish Lira Purple
  'HKD': '#FF9500', // Hong Kong Dollar Orange
  'SGD': '#007AFF', // Singapore Dollar Blue
};

export default function BalanceCard({ 
  type, 
  icon, 
  iconColor,
  name, 
  code, 
  percentage, 
  primaryAmount, 
  secondaryAmount, 
  progressColor, 
  onPress 
}: BalanceCardProps) {
  
  const styles = useStyles((theme: Theme) => createStyles(theme));
  
  // Create dynamic styles for glow effect based on icon color
  const glowColor = iconColor;
  
  const dynamicIconGlowOuter = {
    ...Platform.select({
      ios: {
        shadowColor: glowColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  };
  
  const dynamicIconGlowInner = {
    ...Platform.select({
      ios: {
        shadowColor: glowColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  };
  
  const dynamicIconStyle = {
    ...styles.icon,
    color: '#FFFFFF', // Always white for icons
  };
  
  const dynamicIconContainer = {
    ...styles.iconContainer,
    backgroundColor: iconColor, // Use brand color for both crypto and fiat
  };
  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardShadowLayer}>
        <TouchableOpacity style={styles.balanceCard} onPress={onPress}>
          {/* Subtle highlight overlay for glass effect */}
          
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.leftSection}>
                {/* Icon with glow effect */}
                <View style={dynamicIconGlowOuter}>
                  <View style={dynamicIconGlowInner}>
                    <View style={dynamicIconContainer}>
                      <Text style={dynamicIconStyle}>{icon}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.nameSection}>
                  <Text style={styles.name}>{name}</Text>
                  <Text style={styles.code}>{code}</Text>
                </View>
              </View>
              <View style={styles.rightSection}>
                <Text style={styles.primaryAmount}>{primaryAmount}</Text>
                <Text style={styles.secondaryAmount}>{secondaryAmount}</Text>
              </View>
            </View>
            
            <View style={styles.progressSection}>
              <Text style={styles.percentage}>{percentage.toFixed(1)}%</Text>
              <ProgressBar percentage={percentage} color={progressColor} />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Helper functions to create BalanceCard props from API data
export const createCryptoBalanceCard = (balance: any) => {
  const code = balance.currencyShortName;
  return {
    type: 'crypto' as const,
    icon: cryptoIcons[code] || '◎',
    iconColor: cryptoIconColors[code] || '#FFFFFF',
    name: cryptoNames[code] || code,
    code: code,
    percentage: Number(balance.holdingPercentage) || 0,
    primaryAmount: `${Number(balance.balanceAmount).toFixed(5)} ${code}`,
    secondaryAmount: `$${Number(balance.convertedUSDAmount).toLocaleString()}`,
    progressColor: cryptoProgressColors[code] || '#007AFF',
  };
};

export const createFiatBalanceCard = (balance: any) => {
  const code = balance.currencyShortName;
  return {
    type: 'fiat' as const,
    icon: fiatFlags[code] || '🏳️',
    iconColor: fiatColors[code] || '#007AFF', // Use fiat color for container background
    name: fiatNames[code] || balance.currencyFullName,
    code: code,
    percentage: Number(balance.holdingPercentage) || 0,
    primaryAmount: `${Number(balance.balanceAmount).toLocaleString()} ${code}`,
    secondaryAmount: `$${Number(balance.convertedUSDAmount).toLocaleString()}`,
    progressColor: fiatColors[code] || '#007AFF', // Use fiat color for progress bar
  };
};

const createStyles = (theme: Theme) => StyleSheet.create({
  cardContainer: {
    marginHorizontal: 5,
    marginBottom: 5,
  },
  cardShadowLayer: {
    ...Platform.select({
      ios: {
        shadowColor: theme.isDark ? '#000000' : '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: theme.isDark ? 0.4 : 0.15,
        shadowRadius: 26,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  balanceCard: {
    backgroundColor: theme.isDark ? 'rgba(44, 44, 46, 0.95)' : 'rgba(248, 249, 250, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: theme.isDark ? '#000000' : '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: theme.isDark ? 0.3 : 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  cardHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconGlowOuter: {
    ...Platform.select({
      ios: {
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  iconGlowInner: {
    ...Platform.select({
      ios: {
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
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
  icon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  nameSection: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
    letterSpacing: 0.5,
    textShadowColor: theme.isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  code: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textShadowColor: theme.isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  primaryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
    textShadowColor: theme.isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  secondaryAmount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textShadowColor: theme.isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  progressSection: {
    marginTop: 8,
  },
  percentage: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 8,
    textShadowColor: theme.isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
