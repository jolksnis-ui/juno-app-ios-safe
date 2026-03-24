import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';

interface CleanAssetCardProps {
  symbol: string;
  name: string;
  icon: string;
  balance: string;
  usdValue: string;
  changePercent: number;
  index: number;
  onPress?: () => void;
}

export const CleanAssetCard: React.FC<CleanAssetCardProps> = ({
  symbol,
  name,
  icon,
  balance,
  usdValue,
  changePercent,
  index,
  onPress,
}) => {
  const { theme } = useTheme();
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }, index * 100);
  }, []);

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.96,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      onPress();
    }
  };

  const isPositive = changePercent >= 0;
  const changeColor = isPositive ? '#00D4AA' : '#FF6B6B';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: theme.isDark 
              ? 'rgba(255, 255, 255, 0.05)' 
              : '#FFFFFF',
            borderColor: theme.isDark 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(0, 0, 0, 0.1)',
          }
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
        disabled={!onPress}
      >
        {/* Main Content Row */}
        <View style={styles.mainRow}>
          {/* Left Section - Icon and Info */}
          <View style={styles.leftSection}>
            <View style={[styles.iconContainer, { backgroundColor: getCoinColor(symbol) }]}>
              <Text style={styles.iconText}>{icon}</Text>
            </View>
            
            <View style={styles.coinInfo}>
              <Text style={[styles.coinSymbol, { color: theme.colors.text }]}>
                {symbol}
              </Text>
              <Text style={[styles.coinName, { color: theme.colors.textSecondary }]}>
                {name}
              </Text>
            </View>
          </View>

          {/* Right Section - Balance and Change */}
          <View style={styles.rightSection}>
            <Text style={[styles.balance, { color: theme.colors.text }]}>
              {balance}
            </Text>
            <View style={styles.priceRow}>
              <Text style={[styles.usdValue, { color: theme.colors.textSecondary }]}>
                ${usdValue}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Progress Section - Bottom */}
        <View style={styles.progressSection}>
          <View style={styles.progressRow}>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: `${Math.min(Math.abs(changePercent) || 25, 100)}%`,
                    backgroundColor: getCoinColor(symbol)
                  }
                ]} 
              />
            </View>
            <Text style={[styles.percentageText, { color: theme.colors.textSecondary }]}>
              {changePercent.toFixed(1)}%
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const getCoinColor = (symbol: string): string => {
  const colors: { [key: string]: string } = {
    'BTC': '#F7931A',
    'ETH': '#627EEA', 
    'LTC': '#BFBBBB',
    'XRP': '#23292F',
    'TRX': '#FF060A',
    'DAI': '#F5AC37',
    'USDT': '#26A17B',
    'USDC': '#2775CA',
    'TRC20-USDT': '#26A17B',
    'USD': '#00D4AA',
    'EUR': '#627EEA',
    'GBP': '#9945FF',
    'JPY': '#FF6B6B',
  };
  return colors[symbol] || '#6C757D';
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 4,
  },
  card: {
    flexDirection: 'column',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  coinInfo: {
    flex: 1,
  },
  coinSymbol: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  coinName: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  balance: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  usdValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  changeContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  progressSection: {
    width: '100%',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  percentageText: {
    fontSize: 11,
    fontWeight: '500',
    minWidth: 32,
    textAlign: 'right',
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});