import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../hooks/useTheme';
import { AnimatedValueCounter } from './AnimatedValueCounter';

const { width } = Dimensions.get('window');

interface ProgressRingProps {
  percentage: number;
  color: string;
  size: number;
  strokeWidth: number;
}

const ProgressRing: React.FC<ProgressRingProps> = ({ 
  percentage, 
  color, 
  size, 
  strokeWidth 
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: percentage,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size }}>
      {/* Background Ring */}
      <View
        style={[
          styles.progressRingBackground,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: `${color}20`,
          },
        ]}
      />
      {/* Progress Ring */}
      <Animated.View
        style={[
          styles.progressRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: color,
            borderTopColor: 'transparent',
            transform: [{ rotate: '-90deg' }],
          },
        ]}
      />
      <View style={[styles.progressRingContent, { width: size, height: size }]}>
        <Text style={[styles.progressRingText, { color }]}>
          {Math.round(percentage)}%
        </Text>
      </View>
    </View>
  );
};

interface GlassMorphismPortfolioCardProps {
  totalValue: number;
  assets: any[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const GlassMorphismPortfolioCard: React.FC<GlassMorphismPortfolioCardProps> = ({
  totalValue,
  assets,
  isLoading = false,
  onRefresh,
}) => {
  const { theme } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for active values
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();

    return () => pulse.stop();
  }, []);

  // Calculate asset allocation for progress rings
  const topAssets = assets
    .filter(asset => Number(asset.convertedUSDAmount || asset.usdValue || 0) > 0)
    .sort((a, b) => 
      Number(b.convertedUSDAmount || b.usdValue || 0) - 
      Number(a.convertedUSDAmount || a.usdValue || 0)
    )
    .slice(0, 3);

  const assetColors = ['#F7931A', '#627EEA', '#26A17B'];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            })},
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      {/* Glass Morphism Background */}
      <View style={styles.glassContainer}>
        <BlurView
          intensity={theme.isDark ? 20 : 50}
          tint={theme.isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFillObject}
        />
        
        {/* Gradient Border */}
        <View style={styles.gradientBorder}>
          <LinearGradient
            colors={theme.isDark 
              ? ['#00D4AA40', '#00B89420', '#00D4AA10'] 
              : ['#00D4AA60', '#00B89440', '#00D4AA20']
            }
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Portfolio Value
            </Text>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <View style={styles.valueIndicator}>
                <LinearGradient
                  colors={['#00D4AA', '#00B894']}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
            </Animated.View>
          </View>

          {/* Main Value */}
          <View style={styles.valueSection}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <AnimatedValueCounter
                value={totalValue}
                prefix="$"
                style={[styles.mainValue, { color: theme.colors.text }] as any}
                duration={2000}
              />
            </Animated.View>
          </View>

          {/* Asset Allocation Rings */}
          {topAssets.length > 0 && (
            <View style={styles.allocationSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Asset Allocation
              </Text>
              <View style={styles.ringsContainer}>
                {topAssets.map((asset, index) => {
                  const percentage = totalValue > 0 
                    ? (Number(asset.convertedUSDAmount || asset.usdValue || 0) / totalValue) * 100 
                    : 0;
                  
                  return (
                    <View key={asset.currencyShortName || asset.symbol} style={styles.ringItem}>
                      <ProgressRing
                        percentage={percentage}
                        color={assetColors[index]}
                        size={80}
                        strokeWidth={6}
                      />
                      <Text style={[styles.assetLabel, { color: theme.colors.textSecondary }]}>
                        {asset.currencyShortName || asset.symbol}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Statistics Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {assets.filter(a => Number(a.convertedUSDAmount || a.usdValue || 0) > 0).length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Active Assets
              </Text>
            </View>
          </View>
        </View>

        {/* Floating Elements */}
        <View style={styles.floatingElements}>
          <Animated.View
            style={[
              styles.floatingDot,
              styles.dot1,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <LinearGradient
              colors={['#00D4AA', '#00B894']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>
          
          <Animated.View
            style={[
              styles.floatingDot,
              styles.dot2,
              { 
                transform: [{ 
                  scale: pulseAnim.interpolate({
                    inputRange: [1, 1.02],
                    outputRange: [0.8, 1],
                  })
                }] 
              },
            ]}
          >
            <LinearGradient
              colors={['#627EEA40', '#627EEA20']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
  glassContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
  },
  gradientBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    padding: 1,
  },
  content: {
    padding: 24,
    minHeight: 200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  valueIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  valueSection: {
    marginBottom: 20,
  },
  mainValue: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changeIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  positiveChange: {
    backgroundColor: '#00D4AA20',
  },
  changeText: {
    color: '#00D4AA',
    fontSize: 12,
    fontWeight: '600',
  },
  changeLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  allocationSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  ringsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  ringItem: {
    alignItems: 'center',
    gap: 8,
  },
  progressRingBackground: {
    position: 'absolute',
  },
  progressRing: {
    position: 'absolute',
  },
  progressRingContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingText: {
    fontSize: 12,
    fontWeight: '700',
  },
  assetLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  floatingElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingDot: {
    position: 'absolute',
    borderRadius: 50,
  },
  dot1: {
    width: 8,
    height: 8,
    top: 20,
    right: 30,
  },
  dot2: {
    width: 6,
    height: 6,
    bottom: 30,
    left: 25,
  },
});