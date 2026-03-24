import { useContext } from 'react';
import { StyleSheet } from 'react-native';
import { Theme } from '../types/theme';
import { useTheme as useThemeContext, useThemedStyles } from '../contexts/ThemeContext';

// Re-export the main theme hook
export { useTheme, useThemedStyles } from '../contexts/ThemeContext';

// Additional utility hooks

/**
 * Hook for creating dynamic styles based on theme
 * Usage: const styles = useStyles(createStyles);
 */
export const useStyles = <T extends Record<string, any>>(
  createStyles: (theme: Theme) => T
): T => {
  return useThemedStyles(createStyles);
};

/**
 * Hook for getting theme colors directly
 * Usage: const colors = useThemeColors();
 */
export const useThemeColors = () => {
  const { theme } = useThemeContext();
  return theme.colors;
};

/**
 * Hook for getting theme state
 * Usage: const { isDark, themeName } = useThemeState();
 */
export const useThemeState = () => {
  const { isDark, themeName, toggleTheme, setTheme } = useThemeContext();
  return { isDark, themeName, toggleTheme, setTheme };
};

/**
 * Hook for conditional theme values
 * Usage: const color = useThemeValue('#000', '#fff');
 */
export const useThemeValue = <T>(lightValue: T, darkValue: T): T => {
  const { isDark } = useThemeContext();
  return isDark ? darkValue : lightValue;
};

/**
 * Hook for getting common themed style patterns
 */
export const useCommonStyles = () => {
  const { theme } = useThemeContext();
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    surface: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    text: {
      color: theme.colors.text,
    },
    textSecondary: {
      color: theme.colors.textSecondary,
    },
    textTertiary: {
      color: theme.colors.textTertiary,
    },
    button: {
      backgroundColor: theme.colors.buttonPrimary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
    },
    buttonText: {
      color: theme.colors.buttonText,
      fontSize: 16,
      fontWeight: '600',
    },
    buttonSecondary: {
      backgroundColor: theme.colors.buttonSecondary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    buttonTextSecondary: {
      color: theme.colors.buttonTextSecondary,
      fontSize: 16,
      fontWeight: '600',
    },
    input: {
      backgroundColor: theme.colors.inputBackground,
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      color: theme.colors.inputText,
      fontSize: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    section: {
      paddingHorizontal: 20,
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 12,
      letterSpacing: 0.5,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.isDark ? '#000000' : '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    separator: {
      height: 1,
      backgroundColor: theme.colors.border,
    },
    overlay: {
      backgroundColor: theme.colors.overlay,
    },
    modal: {
      backgroundColor: theme.colors.modalBackground,
      borderRadius: 12,
      margin: 20,
      padding: 20,
    },
  });
};
