export interface ThemeColors {
  // Background colors
  background: string;
  surface: string;
  surfaceSecondary: string;
  surfaceTertiary: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  
  // Border colors
  border: string;
  borderSecondary: string;
  
  // Brand colors (consistent across themes)
  accent: string;
  accentSecondary: string;
  
  // Status colors
  success: string;
  error: string;
  warning: string;
  info: string;
  
  // Interactive colors
  buttonPrimary: string;
  buttonSecondary: string;
  buttonText: string;
  buttonTextSecondary: string;
  
  // Overlay colors
  overlay: string;
  modalBackground: string;
  
  // Input colors
  inputBackground: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
}

export interface Theme {
  colors: ThemeColors;
  isDark: boolean;
  name: 'light' | 'dark';
}

export const lightTheme: Theme = {
  colors: {
    // Background colors
    background: '#FFFFFF',
    surface: '#F8F9FA',
    surfaceSecondary: '#E9ECEF',
    surfaceTertiary: '#DEE2E6',
    
    // Text colors
    text: '#000000',
    textSecondary: '#6C757D',
    textTertiary: '#ADB5BD',
    textInverse: '#FFFFFF',
    
    // Border colors
    border: '#E9ECEF',
    borderSecondary: '#DEE2E6',
    
    // Brand colors (consistent)
    accent: '#00D4AA',
    accentSecondary: '#00B894',
    
    // Status colors
    success: '#28A745',
    error: '#DC3545',
    warning: '#FFC107',
    info: '#17A2B8',
    
    // Interactive colors
    buttonPrimary: '#000000',
    buttonSecondary: '#F8F9FA',
    buttonText: '#FFFFFF',
    buttonTextSecondary: '#000000',
    
    // Overlay colors
    overlay: 'rgba(0, 0, 0, 0.5)',
    modalBackground: '#FFFFFF',
    
    // Input colors
    inputBackground: '#FFFFFF',
    inputBorder: '#E9ECEF',
    inputText: '#000000',
    inputPlaceholder: '#6C757D',
  },
  isDark: false,
  name: 'light',
};

export const darkTheme: Theme = {
  colors: {
    // Background colors
    background: '#1C1C1E',
    surface: '#2C2C2E',
    surfaceSecondary: '#3C3C3E',
    surfaceTertiary: '#48484A',
    
    // Text colors
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    textTertiary: '#6D6D70',
    textInverse: '#000000',
    
    // Border colors
    border: '#2C2C2E',
    borderSecondary: '#3C3C3E',
    
    // Brand colors (consistent)
    accent: '#00D4AA',
    accentSecondary: '#00B894',
    
    // Status colors
    success: '#00D4AA',
    error: '#FF6B6B',
    warning: '#FFD93D',
    info: '#5AC8FA',
    
    // Interactive colors
    buttonPrimary: '#FFFFFF',
    buttonSecondary: '#2C2C2E',
    buttonText: '#000000',
    buttonTextSecondary: '#FFFFFF',
    
    // Overlay colors
    overlay: 'rgba(0, 0, 0, 0.7)',
    modalBackground: '#1C1C1E',
    
    // Input colors
    inputBackground: '#2C2C2E',
    inputBorder: '#3C3C3E',
    inputText: '#FFFFFF',
    inputPlaceholder: '#8E8E93',
  },
  isDark: true,
  name: 'dark',
};

export type ThemeName = 'light' | 'dark' | 'system';
