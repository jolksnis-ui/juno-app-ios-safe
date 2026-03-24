import { StatusBar } from 'expo-status-bar';
import { Theme } from '../types/theme';

/**
 * Get the appropriate status bar style based on theme
 */
export const getStatusBarStyle = (theme: Theme): 'light' | 'dark' => {
  return theme.isDark ? 'light' : 'dark';
};

/**
 * Get themed shadow styles for iOS/Android compatibility
 */
export const getThemedShadow = (theme: Theme, elevation: number = 4) => {
  const shadowColor = theme.isDark ? '#000000' : '#000000';
  const shadowOpacity = theme.isDark ? 0.3 : 0.1;
  
  return {
    // iOS shadow
    shadowColor,
    shadowOffset: { width: 0, height: elevation / 2 },
    shadowOpacity,
    shadowRadius: elevation,
    // Android elevation
    elevation,
  };
};

/**
 * Get themed border styles
 */
export const getThemedBorder = (theme: Theme, width: number = 1) => ({
  borderWidth: width,
  borderColor: theme.colors.border,
});

/**
 * Get themed input styles
 */
export const getThemedInputStyles = (theme: Theme) => ({
  backgroundColor: theme.colors.inputBackground,
  borderColor: theme.colors.inputBorder,
  color: theme.colors.inputText,
});

/**
 * Get themed card styles with shadow
 */
export const getThemedCardStyles = (theme: Theme) => ({
  backgroundColor: theme.colors.surface,
  borderRadius: 12,
  ...getThemedShadow(theme, 4),
  ...getThemedBorder(theme, 1),
});

/**
 * Get themed button styles
 */
export const getThemedButtonStyles = (theme: Theme, variant: 'primary' | 'secondary' = 'primary') => {
  if (variant === 'primary') {
    return {
      backgroundColor: theme.colors.buttonPrimary,
      color: theme.colors.buttonText,
    };
  }
  
  return {
    backgroundColor: theme.colors.buttonSecondary,
    color: theme.colors.buttonTextSecondary,
    ...getThemedBorder(theme),
  };
};

/**
 * Get opacity for disabled states
 */
export const getDisabledOpacity = (disabled: boolean): number => {
  return disabled ? 0.6 : 1.0;
};

/**
 * Get themed overlay color with opacity
 */
export const getThemedOverlay = (theme: Theme, opacity: number = 0.5): string => {
  const baseColor = theme.isDark ? '0, 0, 0' : '0, 0, 0';
  return `rgba(${baseColor}, ${opacity})`;
};

/**
 * Interpolate between two colors based on theme
 */
export const getThemedColor = (theme: Theme, lightColor: string, darkColor: string): string => {
  return theme.isDark ? darkColor : lightColor;
};

/**
 * Get themed text color with opacity
 */
export const getThemedTextColor = (theme: Theme, opacity: number = 1): string => {
  if (opacity === 1) return theme.colors.text;
  
  const baseColor = theme.isDark ? '255, 255, 255' : '0, 0, 0';
  return `rgba(${baseColor}, ${opacity})`;
};

/**
 * Get themed background with opacity
 */
export const getThemedBackground = (theme: Theme, opacity: number = 1): string => {
  if (opacity === 1) return theme.colors.background;
  
  const rgb = theme.colors.background.replace('#', '');
  const r = parseInt(rgb.substr(0, 2), 16);
  const g = parseInt(rgb.substr(2, 2), 16);
  const b = parseInt(rgb.substr(4, 2), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
