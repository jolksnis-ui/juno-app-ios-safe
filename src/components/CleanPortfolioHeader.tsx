import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { AnimatedValueCounter } from './AnimatedValueCounter';
import { AssetType } from '../types/portfolio';

interface ActionButton {
  id: string;
  icon: string;
  label: string;
  onPress: () => void;
}

interface CleanPortfolioHeaderProps {
  totalValue: number;
  type: 'crypto' | 'fiat';
  actions: {
    // Crypto actions
    onBuy?: () => void;
    onSell?: () => void;
    onReceive?: () => void;
    onExchange?: () => void;
    onSend?: () => void;
    // Fiat actions
    onDeposit?: () => void;
    onWithdrawal?: () => void;
    onPaymentOut?: () => void;
    onFX?: () => void;
    onTransfer?: () => void;
  };
}

export const CleanPortfolioHeader: React.FC<CleanPortfolioHeaderProps> = ({
  totalValue,
  type,
  actions,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Calculate fake percentage gain for demo
  const gainPercentage = 24.2;
  const gainAmount = totalValue * (gainPercentage / 100);

  const cryptoButtons: ActionButton[] = [
    { 
      id: 'buy', 
      icon: 'add-circle-outline', 
      label: 'Buy', 
      onPress: actions.onBuy || (() => {}) 
    },
    { 
      id: 'sell', 
      icon: 'remove-circle-outline', 
      label: 'Sell', 
      onPress: actions.onSell || (() => {}) 
    },
    { 
      id: 'receive', 
      icon: 'arrow-down-outline', 
      label: 'Receive', 
      onPress: actions.onReceive || (() => {}) 
    },
    { 
      id: 'exchange', 
      icon: 'swap-horizontal-outline', 
      label: 'Exchange', 
      onPress: actions.onExchange || (() => {}) 
    },
    { 
      id: 'send', 
      icon: 'arrow-up-outline', 
      label: 'Send', 
      onPress: actions.onSend || (() => {}) 
    },
  ];

  const fiatButtons: ActionButton[] = [
    { 
      id: 'deposit', 
      icon: 'add-outline', 
      label: 'Deposit', 
      onPress: actions.onDeposit || (() => {}) 
    },
    { 
      id: 'withdrawal', 
      icon: 'remove-outline', 
      label: 'W/D', 
      onPress: actions.onWithdrawal || (() => {}) 
    },
    { 
      id: 'paymentout', 
      icon: 'card-outline', 
      label: 'TPP', 
      onPress: actions.onPaymentOut || (() => {}) 
    },
    { 
      id: 'fx', 
      icon: 'swap-horizontal-outline', 
      label: 'FX', 
      onPress: actions.onFX || (() => {}) 
    },
    { 
      id: 'transfer', 
      icon: 'arrow-forward-outline', 
      label: 'Transfer', 
      onPress: actions.onTransfer || (() => {}) 
    },
  ];

  const buttons = type === 'crypto' ? cryptoButtons : fiatButtons;

  const handleActionPress = (button: ActionButton) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    button.onPress();
  };

  const getIconColor = (buttonId: string): string => {
    const colors: { [key: string]: string } = {
      buy: '#00D4AA',
      sell: '#FF6B6B',
      receive: '#4ECDC4', 
      exchange: '#9945FF',
      send: '#FF9500',
      deposit: '#00D4AA',
      withdrawal: '#FF6B6B',
      paymentout: '#9945FF',
      fx: '#627EEA',
      transfer: '#FF9500',
    };
    return colors[buttonId] || '#6C757D';
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={theme.isDark 
          ? ['#1a1d29', '#252a3d', '#1a1d29'] 
          : ['#f8f9fa', '#ffffff', '#f8f9fa']
        }
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />


      {/* Balance Section */}
      <View style={styles.balanceSection}>
        <Text style={[styles.balanceLabel, { color: theme.colors.textSecondary }]}>
          Current balance USD
        </Text>
        
        <AnimatedValueCounter
          value={totalValue}
          prefix="$"
          style={[styles.balanceAmount, { color: theme.colors.text }] as any}
          duration={2000}
          decimals={2}
        />

        {/* <View style={styles.gainContainer}>
          <View style={styles.gainBadge}>
            <Ionicons name="trending-up" size={12} color="#00D4AA" />
            <Text style={styles.gainText}>
              +${gainAmount.toFixed(2)} (+{gainPercentage}%)
            </Text>
          </View>
        </View> */}

        {/* Integrated Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          {buttons.map((button, index) => (
            <TouchableOpacity
              key={button.id}
              style={styles.actionButton}
              onPress={() => handleActionPress(button)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionButtonIcon, { backgroundColor: getIconColor(button.id) }]}>
                <Ionicons 
                  name={button.icon as any} 
                  size={20} 
                  color="#FFFFFF" 
                />
              </View>
              <Text style={[styles.actionButtonLabel, { color: theme.colors.text }]}>
                {button.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionButtonIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButtonLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  balanceSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'flex-start',
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 12,
  },
  gainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  gainText: {
    color: '#00D4AA',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});