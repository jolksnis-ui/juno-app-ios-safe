import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';

const { width } = Dimensions.get('window');

interface StaggeredBalanceCardProps {
  symbol: string;
  name: string;
  balance: string;
  usdValue: string;
  percentage: string;
  icon: string;
  color: string;
  index: number;
  onPress?: () => void;
  isLoading?: boolean;
}

export const StaggeredBalanceCard: React.FC<StaggeredBalanceCardProps> = ({
  symbol,
  name,
  balance,
  usdValue,
  percentage,
  icon,
  color,
  index,
  onPress,
  isLoading = false,
}) => {
  const { theme } = useTheme();
  const slideAnim = useRef(new Animated.Value(100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Staggered entry animation
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Shimmer effect for loading state or value updates
      if (isLoading) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(shimmerAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(shimmerAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    }, index * 100); // Staggered delay
  }, [index, isLoading]);

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Press animation
      Animated.sequence([
        Animated.timing(pressAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(pressAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      onPress();
    }
  };

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateX: slideAnim },
            { scale: Animated.multiply(scaleAnim, pressAnim) },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={!onPress || isLoading}
      >
        {/* Glass morphism background */}
        <BlurView
          intensity={theme.isDark ? 10 : 30}
          tint={theme.isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFillObject}
        />
        
        {/* Gradient border */}
        <View style={styles.gradientBorder}>
          <LinearGradient
            colors={[`${color}30`, `${color}15`, 'transparent']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </View>

        {/* Shimmer overlay for loading */}
        {isLoading && (
          <Animated.View
            style={[
              styles.shimmerOverlay,
              {
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(255, 255, 255, 0.2)', 'transparent']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        )}

        <View style={styles.content}>
          {/* Left section - Icon and symbol */}
          <View style={styles.leftSection}>
            <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
              <Text style={[styles.iconText, { color }]}>
                {icon}
              </Text>
            </View>
            <View style={styles.symbolInfo}>
              <Text style={[styles.symbol, { color: theme.colors.text }]}>
                {symbol}
              </Text>
              <Text style={[styles.name, { color: theme.colors.textSecondary }]}>
                {name}
              </Text>
            </View>
          </View>

          {/* Middle section - Balance */}
          <View style={styles.middleSection}>
            <Text style={[styles.balance, { color: theme.colors.text }]}>
              {balance}
            </Text>
            <Text style={[styles.usdValue, { color: theme.colors.textSecondary }]}>
              ${usdValue}
            </Text>
          </View>

          {/* Right section - Percentage and arrow */}
          <View style={styles.rightSection}>
            <View style={styles.percentageContainer}>
              <Text style={[styles.percentage, { color }]}>
                {percentage}%
              </Text>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={18} 
              color={theme.colors.textSecondary} 
            />
          </View>
        </View>

        {/* Floating indicators */}
        <View style={styles.floatingElements}>
          <Animated.View
            style={[
              styles.floatingDot,
              {
                backgroundColor: `${color}60`,
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.6],
                }),
              },
            ]}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 6,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  gradientBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: -100,
    right: -100,
    bottom: 0,
    width: width + 200,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 20,
    fontWeight: '600',
  },
  symbolInfo: {
    flex: 1,
  },
  symbol: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  name: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
    marginTop: 2,
  },
  middleSection: {
    alignItems: 'flex-end',
    gap: 2,
  },
  balance: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  usdValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  rightSection: {
    alignItems: 'center',
    gap: 8,
    minWidth: 60,
  },
  percentageContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
  },
  percentage: {
    fontSize: 12,
    fontWeight: '600',
  },
  floatingElements: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  floatingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});