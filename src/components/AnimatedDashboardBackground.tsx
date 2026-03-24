import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../hooks/useTheme';

const { width, height } = Dimensions.get('window');

interface CryptoSymbolProps {
  symbol: string;
  size: number;
  color: string;
  animatedValue: Animated.ValueXY;
  opacity: Animated.Value;
  rotation: Animated.Value;
}

const CryptoSymbol: React.FC<CryptoSymbolProps> = ({ 
  symbol, 
  size, 
  color, 
  animatedValue, 
  opacity, 
  rotation 
}) => {
  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.cryptoSymbol,
        {
          transform: [
            { translateX: animatedValue.x },
            { translateY: animatedValue.y },
            { rotate: rotateInterpolate },
          ],
          opacity,
        },
      ]}
    >
      <View style={[styles.symbolContainer, { width: size, height: size }]}>
        <LinearGradient
          colors={[color + '40', color + '20']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Animated.Text 
          style={[
            styles.symbolText, 
            { 
              fontSize: size * 0.4,
              color: color,
            }
          ]}
        >
          {symbol}
        </Animated.Text>
      </View>
    </Animated.View>
  );
};

interface ParticleProps {
  animatedValue: Animated.ValueXY;
  opacity: Animated.Value;
  scale: Animated.Value;
}

const TransactionParticle: React.FC<ParticleProps> = ({ 
  animatedValue, 
  opacity, 
  scale 
}) => {
  return (
    <Animated.View
      style={[
        styles.particle,
        {
          transform: [
            { translateX: animatedValue.x },
            { translateY: animatedValue.y },
            { scale },
          ],
          opacity,
        },
      ]}
    >
      <LinearGradient
        colors={['#00D4AA80', '#00B89460']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </Animated.View>
  );
};

export const AnimatedDashboardBackground: React.FC<{ 
  children: React.ReactNode;
  isCryptoTab?: boolean;
}> = ({ children, isCryptoTab = false }) => {
  const { theme } = useTheme();
  
  // Reduce crypto symbols to just 2 subtle ones
  const btcPosition = useRef(new Animated.ValueXY({ x: width * 0.85, y: height * 0.15 })).current;
  const ethPosition = useRef(new Animated.ValueXY({ x: width * 0.1, y: height * 0.8 })).current;
  
  const btcOpacity = useRef(new Animated.Value(isCryptoTab ? 0.1 : 0.05)).current;
  const ethOpacity = useRef(new Animated.Value(isCryptoTab ? 0.08 : 0.03)).current;
  
  const globalRotation = useRef(new Animated.Value(0)).current;
  
  // Particle system for transactions
  const particles = useRef(
    Array.from({ length: 8 }, (_, i) => ({
      position: new Animated.ValueXY({ 
        x: Math.random() * width, 
        y: height + 20 
      }),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.5),
    }))
  ).current;

  useEffect(() => {
    // Animate crypto symbols opacity based on tab - much more subtle
    const opacityAnimations = [
      Animated.timing(btcOpacity, {
        toValue: isCryptoTab ? 0.1 : 0.05,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(ethOpacity, {
        toValue: isCryptoTab ? 0.08 : 0.03,
        duration: 800,
        useNativeDriver: true,
      }),
    ];

    Animated.parallel(opacityAnimations).start();
  }, [isCryptoTab]);

  useEffect(() => {
    // Very subtle BTC floating animation
    const btcFloat = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(btcPosition.x, {
            toValue: width * 0.9,
            duration: 15000,
            useNativeDriver: true,
          }),
          Animated.timing(btcPosition.x, {
            toValue: width * 0.85,
            duration: 15000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(btcPosition.y, {
            toValue: height * 0.2,
            duration: 12000,
            useNativeDriver: true,
          }),
          Animated.timing(btcPosition.y, {
            toValue: height * 0.15,
            duration: 12000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // Very subtle ETH floating animation  
    const ethFloat = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(ethPosition.x, {
            toValue: width * 0.05,
            duration: 18000,
            useNativeDriver: true,
          }),
          Animated.timing(ethPosition.x, {
            toValue: width * 0.1,
            duration: 18000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(ethPosition.y, {
            toValue: height * 0.75,
            duration: 14000,
            useNativeDriver: true,
          }),
          Animated.timing(ethPosition.y, {
            toValue: height * 0.8,
            duration: 14000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // Start animations
    btcFloat.start();
    ethFloat.start();

    return () => {
      btcFloat.stop();
      ethFloat.stop();
    };
  }, []);

  useEffect(() => {
    // Much more subtle particle system - only when crypto tab is active
    if (!isCryptoTab) return;

    const animateParticles = () => {
      particles.slice(0, 4).forEach((particle, index) => { // Use only 4 particles instead of 8
        // Reset particle to bottom
        particle.position.setValue({ 
          x: Math.random() * width, 
          y: height + 20 
        });
        particle.opacity.setValue(0);
        particle.scale.setValue(0.3);

        // Animate particle upward with delay - much more subtle
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(particle.position.y, {
              toValue: -20,
              duration: 12000, // Slower movement
              useNativeDriver: true,
            }),
            Animated.timing(particle.position.x, {
              toValue: (particle.position.x as any)._value + (Math.random() - 0.5) * 50,
              duration: 12000,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(particle.opacity, {
                toValue: 0.15, // Much more subtle
                duration: 2000,
                useNativeDriver: true,
              }),
              Animated.timing(particle.opacity, {
                toValue: 0,
                duration: 4000,
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(particle.scale, {
                toValue: 0.6,
                duration: 2000,
                useNativeDriver: true,
              }),
              Animated.timing(particle.scale, {
                toValue: 0.2,
                duration: 10000,
                useNativeDriver: true,
              }),
            ]),
          ]).start();
        }, index * 2000); // Longer delay between particles
      });
    };

    animateParticles();
    const interval = setInterval(animateParticles, 15000); // Less frequent

    return () => clearInterval(interval);
  }, [isCryptoTab]);

  const gradientColors = theme.isDark
    ? ['#0A0E27', '#1A1F3A', '#0A0E27'] as const
    : ['#F8FAFB', '#FFFFFF', '#F8FAFB'] as const;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradientColors}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Subtle Crypto Symbols - Only 2 */}
      <CryptoSymbol
        symbol="₿"
        size={60}
        color={theme.isDark ? "#F7931A" : "#F7931A40"}
        animatedValue={btcPosition}
        opacity={btcOpacity}
        rotation={new Animated.Value(0)}
      />
      
      <CryptoSymbol
        symbol="Ξ"
        size={55}
        color={theme.isDark ? "#627EEA" : "#627EEA40"}
        animatedValue={ethPosition}
        opacity={ethOpacity}
        rotation={new Animated.Value(0)}
      />

      {/* Particle System - Transaction Effects - Only first 4 */}
      {isCryptoTab && particles.slice(0, 4).map((particle, index) => (
        <TransactionParticle
          key={index}
          animatedValue={particle.position}
          opacity={particle.opacity}
          scale={particle.scale}
        />
      ))}

      {/* Subtle Grid Pattern */}
      <View style={styles.gridPattern} pointerEvents="none">
        {Array.from({ length: 15 }).map((_, i) => (
          <View
            key={`h-${i}`}
            style={[
              styles.gridLine,
              styles.horizontalLine,
              { 
                top: `${i * 6.67}%`, 
                opacity: theme.isDark ? 0.02 : 0.03 
              },
            ]}
          />
        ))}
        {Array.from({ length: 15 }).map((_, i) => (
          <View
            key={`v-${i}`}
            style={[
              styles.gridLine,
              styles.verticalLine,
              { 
                left: `${i * 6.67}%`, 
                opacity: theme.isDark ? 0.02 : 0.03 
              },
            ]}
          />
        ))}
      </View>

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cryptoSymbol: {
    position: 'absolute',
  },
  symbolContainer: {
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  symbolText: {
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  gridPattern: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: '#00D4AA',
  },
  horizontalLine: {
    width: '100%',
    height: 0.5,
  },
  verticalLine: {
    height: '100%',
    width: 0.5,
  },
});