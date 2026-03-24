import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrimeEyeIcon, PrimeEyeSlashIcon } from '@/components/icons/LoginIcons';
import { useTheme } from '../hooks/useTheme';

interface FloatingLabelInputProps extends Omit<TextInputProps, 'placeholder'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  isPassword?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  onIconPress?: () => void;
  forceDarkTheme?: boolean;
  /** Override bottom margin (default 24). Use 0 for last field before footer. */
  marginBottom?: number;
}

export const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  value,
  onChangeText,
  error,
  isPassword = false,
  icon,
  onIconPress,
  forceDarkTheme = false,
  marginBottom,
  ...props
}) => {
  const { theme } = useTheme();
  const darkTheme = {
    colors: {
      surface: '#3F3F46',
      border: '#51525C',
      text: '#FFFFFF',
      textSecondary: '#A0A0AB',
    }
  };
  const activeTheme = forceDarkTheme ? darkTheme : theme;
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const animatedLabel = useRef(new Animated.Value(value ? 1 : 0)).current;
  const animatedBorder = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedLabel, {
        toValue: isFocused || value ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(animatedBorder, {
        toValue: isFocused ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isFocused, value]);

  const labelStyle = {
    position: 'absolute' as const,
    left: 16,
    top: animatedLabel.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 8],
    }),
    fontSize: animatedLabel.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedLabel.interpolate({
      inputRange: [0, 1],
      outputRange: [activeTheme.colors.textSecondary, error ? '#EF4444' : activeTheme.colors.textSecondary],
    }),
    fontWeight: '500' as const,
  };

  const borderColor = animatedBorder.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', error ? '#EF4444' : '#FFFFFF'],
  });

  return (
    <View style={[styles.container, marginBottom !== undefined && { marginBottom }]}>
      <Animated.View
        style={[
          styles.inputContainer,
          {
            backgroundColor: activeTheme.colors.surface,
            borderColor: error ? '#EF4444' : borderColor,
            borderWidth: 1,
          },
        ]}
      >
        <Animated.Text style={labelStyle}>{label}</Animated.Text>
        <TextInput
          style={[
            styles.input,
            {
              color: activeTheme.colors.text,
              paddingTop: value || isFocused ? 24 : 16,
            },
          ]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize="none"
          placeholderTextColor={activeTheme.colors.textSecondary}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <PrimeEyeSlashIcon size={24} color="#E4E4E7" />
            ) : (
              <PrimeEyeIcon size={24} color="#E4E4E7" />
            )}
          </TouchableOpacity>
        )}
        {icon && !isPassword && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onIconPress}
            disabled={!onIconPress}
          >
            <Ionicons name={icon} size={20} color={activeTheme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </Animated.View>
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  inputContainer: {
    borderRadius: 8,
    position: 'relative',
    height: 56,
    minHeight: 56,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    fontWeight: '500',
  },
  iconButton: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginLeft: 4,
    fontWeight: '500',
  },
});