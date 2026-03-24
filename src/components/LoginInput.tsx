import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LoginInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  isPassword?: boolean;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  autoComplete?: 'email' | 'password' | 'new-password' | 'off';
  textContentType?: 'emailAddress' | 'password' | 'newPassword' | 'none';
  /** Override container style (e.g. marginBottom for spacing) */
  containerStyle?: ViewStyle;
}

/**
 * Login input matching Figma: label above, Gray iron 700 bg, 8px radius, no border
 */
export const LoginInput: React.FC<LoginInputProps> = ({
  label,
  value,
  onChangeText,
  error,
  isPassword = false,
  placeholder,
  keyboardType = 'default',
  autoComplete = 'off',
  textContentType = 'none',
  containerStyle,
}) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, error && styles.inputWrapperError]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A0A0AB"
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoComplete={autoComplete}
          textContentType={textContentType}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#E4E4E7"
            />
          </TouchableOpacity>
        )}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#D1D1D6',
    textTransform: 'uppercase',
  },
  inputWrapper: {
    backgroundColor: '#3F3F46',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 0,
    minHeight: 48,
  },
  inputWrapperError: {
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    paddingVertical: 14,
    paddingRight: 8,
  },
  eyeButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
});
