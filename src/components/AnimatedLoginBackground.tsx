import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';

const { width, height } = Dimensions.get('window');

export const AnimatedLoginBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always use dark mode for login background
  const isDarkMode = true;
  
  // Animated values for floating shapes
  const shape1 = useRef(new Animated.ValueXY({ x: width * 0.1, y: height * 0.2 })).current;
  const shape2 = useRef(new Animated.ValueXY({ x: width * 0.7, y: height * 0.4 })).current;
  const shape3 = useRef(new Animated.ValueXY({ x: width * 0.4, y: height * 0.7 })).current;
  const opacity1 = useRef(new Animated.Value(0.3)).current;
  const opacity2 = useRef(new Animated.Value(0.2)).current;
  const opacity3 = useRef(new Animated.Value(0.25)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Floating animation for shape 1
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(shape1.x, {
            toValue: width * 0.3,
            duration: 8000,
            useNativeDriver: true,
          }),
          Animated.timing(shape1.x, {
            toValue: width * 0.1,
            duration: 8000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(shape1.y, {
            toValue: height * 0.3,
            duration: 6000,
            useNativeDriver: true,
          }),
          Animated.timing(shape1.y, {
            toValue: height * 0.2,
            duration: 6000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity1, {
            toValue: 0.5,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity1, {
            toValue: 0.3,
            duration: 4000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Floating animation for shape 2
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(shape2.x, {
            toValue: width * 0.5,
            duration: 10000,
            useNativeDriver: true,
          }),
          Animated.timing(shape2.x, {
            toValue: width * 0.7,
            duration: 10000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(shape2.y, {
            toValue: height * 0.5,
            duration: 7000,
            useNativeDriver: true,
          }),
          Animated.timing(shape2.y, {
            toValue: height * 0.4,
            duration: 7000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity2, {
            toValue: 0.4,
            duration: 5000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity2, {
            toValue: 0.2,
            duration: 5000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Floating animation for shape 3
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(shape3.x, {
            toValue: width * 0.6,
            duration: 9000,
            useNativeDriver: true,
          }),
          Animated.timing(shape3.x, {
            toValue: width * 0.4,
            duration: 9000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(shape3.y, {
            toValue: height * 0.6,
            duration: 8000,
            useNativeDriver: true,
          }),
          Animated.timing(shape3.y, {
            toValue: height * 0.7,
            duration: 8000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity3, {
            toValue: 0.45,
            duration: 6000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity3, {
            toValue: 0.25,
            duration: 6000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Rotation animation
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const gradientColors: readonly [string, string, ...string[]] = isDarkMode
    ? ['#26272B', '#18181B'] as const
    : ['#FFFFFF', '#F0FFFE', '#E6FFFC'] as const;

  const shapeGradient: readonly [string, string, ...string[]] = isDarkMode
    ? ['#00D4AA', '#00B894'] as const
    : ['#00D4AA', '#00E5BB'] as const;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradientColors}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      
      {/* Animated Shape 1 - Circle */}
      <Animated.View
        style={[
          styles.shape,
          styles.circle,
          {
            transform: [
              { translateX: shape1.x },
              { translateY: shape1.y },
              { rotate: rotateInterpolate },
            ],
            opacity: opacity1,
          },
        ]}
      >
        <LinearGradient
          colors={shapeGradient}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Animated Shape 2 - Hexagon */}
      <Animated.View
        style={[
          styles.shape,
          styles.hexagon,
          {
            transform: [
              { translateX: shape2.x },
              { translateY: shape2.y },
              { rotate: rotateInterpolate },
            ],
            opacity: opacity2,
          },
        ]}
      >
        <LinearGradient
          colors={shapeGradient}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Animated Shape 3 - Square */}
      <Animated.View
        style={[
          styles.shape,
          styles.square,
          {
            transform: [
              { translateX: shape3.x },
              { translateY: shape3.y },
              { rotate: rotateInterpolate },
            ],
            opacity: opacity3,
          },
        ]}
      >
        <LinearGradient
          colors={shapeGradient}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Grid Pattern Overlay */}
      <View style={styles.gridPattern} pointerEvents="none">
        {Array.from({ length: 20 }).map((_, i) => (
          <View
            key={`h-${i}`}
            style={[
              styles.gridLine,
              styles.horizontalLine,
              { top: `${i * 5}%`, opacity: isDarkMode ? 0.02 : 0.01 },
            ]}
          />
        ))}
        {Array.from({ length: 20 }).map((_, i) => (
          <View
            key={`v-${i}`}
            style={[
              styles.gridLine,
              styles.verticalLine,
              { left: `${i * 5}%`, opacity: isDarkMode ? 0.02 : 0.01 },
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
  shape: {
    position: 'absolute',
    overflow: 'hidden',
  },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  hexagon: {
    width: 150,
    height: 150,
    borderRadius: 30,
    transform: [{ rotate: '45deg' }],
  },
  square: {
    width: 180,
    height: 180,
    borderRadius: 40,
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
    height: 1,
  },
  verticalLine: {
    height: '100%',
    width: 1,
  },
});