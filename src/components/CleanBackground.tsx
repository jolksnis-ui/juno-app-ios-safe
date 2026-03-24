import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';

interface CleanBackgroundProps {
  children: React.ReactNode;
}

export const CleanBackground: React.FC<CleanBackgroundProps> = ({ children }) => {
  const { theme } = useTheme();

  const gradientColors = theme.isDark
    ? ['#0f1419', '#1a1f2e', '#0f1419'] as const
    : ['#ffffff', '#f8f9fa', '#ffffff'] as const;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradientColors}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});