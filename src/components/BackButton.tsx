import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStyles } from '@/hooks/useTheme';
import { Theme } from '@/types/theme';

interface BackButtonProps {
  onPress?: () => void;
  color?: string;
  size?: number;
}

export const BackButton: React.FC<BackButtonProps> = ({ 
  onPress, 
  color,
  size = 24 
}) => {
  const styles = useStyles(createStyles);
  
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <TouchableOpacity
      style={styles.backButton}
      onPress={handlePress}
      activeOpacity={0.7}
      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
    >
      <Ionicons 
        name="arrow-back" 
        size={size} 
        color={color || styles.backIcon.color} 
      />
    </TouchableOpacity>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  backButton: {
    padding: 4,
  },
  backIcon: {
    color: theme.colors.text,
  },
});