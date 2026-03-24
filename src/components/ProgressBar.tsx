import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface ProgressBarProps {
  percentage: number;
  color: string;
  height?: number;
}

export default function ProgressBar({ 
  percentage, 
  color, 
  height = 4 
}: ProgressBarProps) {
  const { theme } = useTheme();
  const safePercentage = Math.min(Math.max(percentage, 0), 100);
  
  const styles = createStyles(theme);
  
  return (
    <View style={[styles.progressContainer, { height }]}>
      <View style={styles.progressBackground}>
        <View 
          style={[
            styles.progressFill, 
            { 
              width: `${safePercentage}%`, 
              backgroundColor: color 
            }
          ]} 
        />
      </View>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  progressContainer: {
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
