import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Theme, ThemeName, lightTheme, darkTheme } from '../types/theme';

interface ThemeContextType {
  theme: Theme;
  themeName: ThemeName;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (themeName: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

const THEME_STORAGE_KEY = 'app_theme_preference';

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeName, setThemeName] = useState<ThemeName>('dark');
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  // Get the actual theme based on preference and system setting
  const getActiveTheme = (themePreference: ThemeName, systemScheme: ColorSchemeName): Theme => {
    if (themePreference === 'system') {
      return systemScheme === 'dark' ? darkTheme : lightTheme;
    }
    return themePreference === 'dark' ? darkTheme : lightTheme;
  };

  const [theme, setTheme] = useState<Theme>(
    getActiveTheme(themeName, systemColorScheme)
  );

  // Load saved theme preference on app start
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  // Update theme when preference or system theme changes
  useEffect(() => {
    const newTheme = getActiveTheme(themeName, systemColorScheme);
    setTheme(newTheme);
  }, [themeName, systemColorScheme]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeName(savedTheme as ThemeName);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
      // Default to dark theme if loading fails
      setThemeName('dark');
    }
  };

  const saveThemePreference = async (newThemeName: ThemeName) => {
    try {
      await SecureStore.setItemAsync(THEME_STORAGE_KEY, newThemeName);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const setThemePreference = (newThemeName: ThemeName) => {
    setThemeName(newThemeName);
    saveThemePreference(newThemeName);
  };

  const toggleTheme = () => {
    const newTheme = theme.isDark ? 'light' : 'dark';
    setThemePreference(newTheme);
  };

  const contextValue: ThemeContextType = {
    theme,
    themeName,
    isDark: theme.isDark,
    toggleTheme,
    setTheme: setThemePreference,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Helper hook for creating themed styles
export const useThemedStyles = <T extends Record<string, any>>(
  createStyles: (theme: Theme) => T
): T => {
  const { theme } = useTheme();
  return createStyles(theme);
};
