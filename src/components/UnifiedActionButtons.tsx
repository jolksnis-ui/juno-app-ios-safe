import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStyles } from '../hooks/useTheme';
import { Theme } from '../types/theme';

interface ActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onPress }) => {
  const styles = useStyles((theme: Theme) => createStyles(theme));
  
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={24} color={styles.actionLabel.color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

interface CryptoActions {
  onBuy: () => void;
  onSell: () => void;
  onReceive: () => void;
  onExchange: () => void;
  onSend: () => void;
}

interface FiatActions {
  onDeposit: () => void;
  onWithdrawal: () => void;
  onPaymentOut: () => void;
  onFX: () => void;
  onTransfer: () => void;
}

interface UnifiedActionButtonsProps {
  type: 'crypto' | 'fiat';
  actions: CryptoActions | FiatActions;
}

// Action configurations for different types
const actionConfigs = {
  crypto: [
    { icon: 'trending-up' as keyof typeof Ionicons.glyphMap, label: 'BUY' },
    { icon: 'trending-down' as keyof typeof Ionicons.glyphMap, label: 'SELL' },
    { icon: 'qr-code' as keyof typeof Ionicons.glyphMap, label: 'RECEIVE' },
    { icon: 'swap-horizontal' as keyof typeof Ionicons.glyphMap, label: 'EXCHANGE' },
    { icon: 'paper-plane' as keyof typeof Ionicons.glyphMap, label: 'SEND' }
  ],
  fiat: [
    { icon: 'add-circle' as keyof typeof Ionicons.glyphMap, label: 'DEPOSIT' },
    { icon: 'remove-circle' as keyof typeof Ionicons.glyphMap, label: 'W/D' },
    { icon: 'card' as keyof typeof Ionicons.glyphMap, label: 'TPP' },
    { icon: 'globe' as keyof typeof Ionicons.glyphMap, label: 'FX' },
    { icon: 'swap-vertical' as keyof typeof Ionicons.glyphMap, label: 'TRANSFER' }
  ]
};

export default function UnifiedActionButtons({ type, actions }: UnifiedActionButtonsProps) {
  const config = actionConfigs[type];
  const callbacks = Object.values(actions);
  const styles = useStyles((theme: Theme) => createStyles(theme));

  return (
    <View style={styles.container}>
      {config.map((action, index) => (
        <ActionButton
          key={action.label}
          icon={action.icon}
          label={action.label}
          onPress={callbacks[index]}
        />
      ))}
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 5,
    paddingVertical: 5,
    marginHorizontal: 5,
    marginBottom: 5,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginHorizontal: 4,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 30,
    borderRadius: 12,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
});
