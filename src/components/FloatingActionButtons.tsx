import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';

const { width } = Dimensions.get('window');

interface ActionButtonProps {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
  index: number;
  isLoading?: boolean;
}

const FloatingActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  color,
  onPress,
  index,
  isLoading = false,
}) => {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Staggered entry animation
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
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();

      // Subtle glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, index * 150);
  }, []);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Press animation
    Animated.sequence([
      Animated.timing(pressAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(pressAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Icon rotation on press
    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      rotateAnim.setValue(0);
    });

    onPress();
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '15deg'],
  });

  return (
    <Animated.View
      style={[
        styles.actionButtonContainer,
        {
          transform: [
            { translateY: slideAnim },
            { scale: Animated.multiply(scaleAnim, pressAnim) },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.actionButton}
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={isLoading}
      >
        {/* Glass morphism background */}
        <BlurView
          intensity={theme.isDark ? 15 : 35}
          tint={theme.isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFillObject}
        />
        
        {/* Gradient border and glow */}
        <Animated.View
          style={[
            styles.gradientBorder,
            {
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.8],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={[`${color}60`, `${color}30`, `${color}10`]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        {/* Button content */}
        <View style={styles.buttonContent}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={[color, `${color}CC`]}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
                <Ionicons 
                  name={icon as any} 
                  size={24} 
                  color="#FFFFFF"
                />
              </Animated.View>
            )}
          </View>
          
          <Text style={[styles.buttonLabel, { color: theme.colors.text }]}>
            {label}
          </Text>
        </View>

        {/* Floating particles */}
        <Animated.View
          style={[
            styles.floatingParticle,
            styles.particle1,
            {
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.2, 0.6],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={[color, `${color}80`]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
        
        <Animated.View
          style={[
            styles.floatingParticle,
            styles.particle2,
            {
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.1, 0.4],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={[color, `${color}60`]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

interface FloatingActionButtonsProps {
  type: 'crypto' | 'fiat';
  actions: {
    [key: string]: () => void;
  };
  loadingStates?: {
    [key: string]: boolean;
  };
}

export const FloatingActionButtons: React.FC<FloatingActionButtonsProps> = ({
  type,
  actions,
  loadingStates = {},
}) => {
  const cryptoButtons = [
    { key: 'onBuy', icon: 'add-circle-outline', label: 'Buy', color: '#00D4AA' },
    { key: 'onSell', icon: 'remove-circle-outline', label: 'Sell', color: '#FF6B6B' },
    { key: 'onReceive', icon: 'arrow-down-outline', label: 'Receive', color: '#4ECDC4' },
    { key: 'onExchange', icon: 'swap-horizontal-outline', label: 'Exchange', color: '#627EEA' },
    { key: 'onSend', icon: 'arrow-up-outline', label: 'Send', color: '#9945FF' },
  ];

  const fiatButtons = [
    { key: 'onDeposit', icon: 'add-outline', label: 'Deposit', color: '#00D4AA' },
    { key: 'onWithdrawal', icon: 'remove-outline', label: 'Withdraw', color: '#FF6B6B' },
    { key: 'onPaymentOut', icon: 'card-outline', label: 'Pay', color: '#F7931A' },
    { key: 'onFX', icon: 'swap-horizontal-outline', label: 'Exchange', color: '#627EEA' },
    { key: 'onTransfer', icon: 'arrow-forward-outline', label: 'Transfer', color: '#4ECDC4' },
  ];

  const buttons = type === 'crypto' ? cryptoButtons : fiatButtons;

  return (
    <View style={styles.container}>
      <View style={styles.buttonsRow}>
        {buttons.map((button, index) => {
          const action = actions[button.key];
          if (!action) return null;

          return (
            <FloatingActionButton
              key={button.key}
              icon={button.icon}
              label={button.label}
              color={button.color}
              onPress={action}
              index={index}
              isLoading={loadingStates[button.key]}
            />
          );
        })}
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
    gap: 12,
  },
  actionButtonContainer: {
    flex: 1,
    aspectRatio: 0.85, // Slightly taller
    maxWidth: (width - 100) / 5, // More spacing
    minHeight: 80,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  gradientBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    padding: 1,
  },
  buttonContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    padding: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  buttonLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
    marginTop: 2,

    fontFamily: 'StagnanMedium',

  },
  floatingParticle: {
    position: 'absolute',
    borderRadius: 10,
  },
  particle1: {
    width: 4,
    height: 4,
    top: 15,
    right: 15,
  },
  particle2: {
    width: 3,
    height: 3,
    bottom: 20,
    left: 12,
  },
});