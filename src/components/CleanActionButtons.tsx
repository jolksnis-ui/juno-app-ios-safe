import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';

const { width } = Dimensions.get('window');

interface ActionButton {
  id: string;
  icon: string;
  label: string;
  onPress: () => void;
}

interface CleanActionButtonsProps {
  type: 'crypto' | 'fiat';
  actions: {
    onSend?: () => void;
    onReceive?: () => void;
    onSwap?: () => void;
    onMore?: () => void;
    // Fiat equivalents
    onTransfer?: () => void;
    onDeposit?: () => void;
    onExchange?: () => void;
  };
}

const ActionButtonItem: React.FC<{
  button: ActionButton;
  index: number;
  theme: any;
}> = ({ button, index, theme }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, index * 100);
  }, []);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    button.onPress();
  };

  return (
    <Animated.View
      style={[
        styles.buttonContainer,
        {
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          { 
            backgroundColor: theme.isDark 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(0, 0, 0, 0.05)',
            borderColor: theme.isDark 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(0, 0, 0, 0.1)',
          }
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: getIconColor(button.id) }]}>
          <Ionicons 
            name={button.icon as any} 
            size={24} 
            color="#FFFFFF" 
          />
        </View>
      </TouchableOpacity>
      <Text style={[styles.buttonLabel, { color: theme.colors.text }]}>
        {button.label}
      </Text>
    </Animated.View>
  );
};

const getIconColor = (buttonId: string): string => {
  const colors: { [key: string]: string } = {
    send: '#FF6B6B',
    receive: '#4ECDC4', 
    swap: '#9945FF',
    more: '#6C757D',
    transfer: '#FF6B6B',
    deposit: '#00D4AA',
    exchange: '#627EEA',
  };
  return colors[buttonId] || '#6C757D';
};

export const CleanActionButtons: React.FC<CleanActionButtonsProps> = ({
  type,
  actions,
}) => {
  const { theme } = useTheme();

  const cryptoButtons: ActionButton[] = [
    { 
      id: 'send', 
      icon: 'arrow-up-outline', 
      label: 'Send', 
      onPress: actions.onSend || (() => {}) 
    },
    { 
      id: 'receive', 
      icon: 'arrow-down-outline', 
      label: 'Receive', 
      onPress: actions.onReceive || (() => {}) 
    },
    { 
      id: 'swap', 
      icon: 'swap-horizontal-outline', 
      label: 'Swap', 
      onPress: actions.onSwap || (() => {}) 
    },
    { 
      id: 'more', 
      icon: 'grid-outline', 
      label: 'More', 
      onPress: actions.onMore || (() => {}) 
    },
  ];

  const fiatButtons: ActionButton[] = [
    { 
      id: 'transfer', 
      icon: 'arrow-forward-outline', 
      label: 'Send', 
      onPress: actions.onTransfer || (() => {}) 
    },
    { 
      id: 'deposit', 
      icon: 'add-outline', 
      label: 'Receive', 
      onPress: actions.onDeposit || (() => {}) 
    },
    { 
      id: 'exchange', 
      icon: 'swap-horizontal-outline', 
      label: 'Swap', 
      onPress: actions.onExchange || (() => {}) 
    },
    { 
      id: 'more', 
      icon: 'grid-outline', 
      label: 'More', 
      onPress: actions.onMore || (() => {}) 
    },
  ];

  const buttons = type === 'crypto' ? cryptoButtons : fiatButtons;

  return (
    <View style={styles.container}>
      <View style={styles.buttonsRow}>
        {buttons.map((button, index) => (
          <ActionButtonItem
            key={button.id}
            button={button}
            index={index}
            theme={theme}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    flex: 1,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,

    fontFamily: 'StagnanMedium',

  },
});