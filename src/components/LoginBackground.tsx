import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GuidelineColors } from '@/constants/guidelineColors';

/**
 * Login/onboarding background - clean gradient.
 * Dark theme: Gray Iron 800 → Gray Iron 900.
 */
export const LoginBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[GuidelineColors.grayIron800, GuidelineColors.grayIron900]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
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
