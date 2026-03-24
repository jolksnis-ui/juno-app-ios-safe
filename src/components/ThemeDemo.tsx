import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, useStyles, useCommonStyles } from '../hooks/useTheme';
import { Theme } from '../types/theme';

export const ThemeDemo: React.FC = () => {
  const { theme, isDark, toggleTheme, themeName } = useTheme();
  const commonStyles = useCommonStyles();
  
  const styles = useStyles((theme: Theme) => StyleSheet.create({
    demoContainer: {
      padding: 20,
      margin: 20,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    themeInfo: {
      marginBottom: 16,
    },
    colorDemo: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 16,
    },
    colorBox: {
      width: 40,
      height: 40,
      margin: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    colorLabel: {
      fontSize: 10,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 2,
    },
  }));

  const colorSamples = [
    { name: 'Background', color: theme.colors.background },
    { name: 'Surface', color: theme.colors.surface },
    { name: 'Text', color: theme.colors.text },
    { name: 'Accent', color: theme.colors.accent },
    { name: 'Success', color: theme.colors.success },
    { name: 'Error', color: theme.colors.error },
  ];

  return (
    <View style={styles.demoContainer}>
      <View style={styles.themeInfo}>
        <Text style={commonStyles.text}>Theme System Demo</Text>
        <Text style={commonStyles.textSecondary}>
          Current Theme: {themeName} ({isDark ? 'Dark' : 'Light'})
        </Text>
      </View>

      <View style={styles.colorDemo}>
        {colorSamples.map((sample, index) => (
          <View key={index} style={{ alignItems: 'center' }}>
            <View 
              style={[
                styles.colorBox, 
                { backgroundColor: sample.color }
              ]} 
            />
            <Text style={styles.colorLabel}>{sample.name}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity 
        style={commonStyles.button} 
        onPress={toggleTheme}
      >
        <Text style={commonStyles.buttonText}>
          Switch to {isDark ? 'Light' : 'Dark'} Theme
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[commonStyles.buttonSecondary, { marginTop: 12 }]} 
        onPress={() => {}}
      >
        <Text style={commonStyles.buttonTextSecondary}>
          Secondary Button
        </Text>
      </TouchableOpacity>
    </View>
  );
};
