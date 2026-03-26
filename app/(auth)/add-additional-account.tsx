import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStyles } from '../../src/hooks/useTheme';
import { Theme } from '../../src/types/theme';
import { createClientAssociatedUser } from '../../src/services/additionalAccountsService';
import { AddAdditionalAccountFormData } from '../../src/types/additionalAccounts';
import { useAuthContext } from '../../src/contexts/AuthContext';
import { useToast } from '../../src/contexts/ToastContext';

interface ValidationErrors {
  clientEmail: string | null;
  password: string | null;
  confirmPassword: string | null;
}

export default function AddAdditionalAccount() {
  const styles = useStyles((theme: Theme) => createStyles(theme));
  const { user } = useAuthContext();
  const { showSuccess, showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<AddAdditionalAccountFormData>({
    clientEmail: '',
    password: '',
    confirmPassword: '',
    readOnly: true,
  });

  const [validation, setValidation] = useState<ValidationErrors>({
    clientEmail: null,
    password: null,
    confirmPassword: null,
  });

  const handleClose = () => {
    router.back();
  };

  const handleInputChange = (field: keyof AddAdditionalAccountFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (typeof value === 'string' && field in validation) {
      setValidation(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {
      clientEmail: null,
      password: null,
      confirmPassword: null,
    };

    // Validate email
    if (!formData.clientEmail.trim()) {
      errors.clientEmail = 'Client account email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
      errors.clientEmail = 'Please enter a valid email address';
    }

    // Validate password
    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    // Validate confirm password
    if (!formData.confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidation(errors);
    return !Object.values(errors).some(error => error !== null);
  };

  const handleContinue = async () => {
    if (!validateForm()) {
      showError('Please fill in all required fields correctly.', 'Validation Error');
      return;
    }

    if (!user?.clientObjId) {
      showError('Missing parent client information', 'Error');
      return;
    }

    try {
      setIsSubmitting(true);
      
      await createClientAssociatedUser({
        clientEmail: formData.clientEmail,
        password: formData.password,
        readOnly: formData.readOnly,
        parentClient: user.clientObjId,
      });

      showSuccess('Additional account created successfully', 'Success');
      router.back();
    } catch (error) {
      console.error('Failed to create additional account:', error);
      showError('Failed to create additional account', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.title}>ADD ADDITIONAL ACCOUNT</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={styles.title.color} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            {/* Client Account Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CLIENT ACCOUNT EMAIL</Text>
              <TextInput
                style={[styles.textInput, validation.clientEmail && styles.inputError]}
                value={formData.clientEmail}
                onChangeText={(value) => handleInputChange('clientEmail', value)}
                placeholder="Enter account email"
                placeholderTextColor="#666666"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {validation.clientEmail && (
                <Text style={styles.errorText}>{validation.clientEmail}</Text>
              )}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <TextInput
                style={[styles.textInput, validation.password && styles.inputError]}
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                placeholder="Create password"
                placeholderTextColor="#666666"
                secureTextEntry
              />
              {validation.password && (
                <Text style={styles.errorText}>{validation.password}</Text>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
              <TextInput
                style={[styles.textInput, validation.confirmPassword && styles.inputError]}
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                placeholder="Confirm password"
                placeholderTextColor="#666666"
                secureTextEntry
              />
              {validation.confirmPassword && (
                <Text style={styles.errorText}>{validation.confirmPassword}</Text>
              )}
            </View>

            {/* Read Only Toggle */}
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>READ ONLY</Text>
              <Switch
                value={formData.readOnly}
                onValueChange={(value) => handleInputChange('readOnly', value)}
                trackColor={{ false: '#767577', true: '#00D4AA' }}
                thumbColor={formData.readOnly ? '#ffffff' : '#f4f3f4'}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#000000" />
                <Text style={[styles.submitButtonText, { marginLeft: 8 }]}>CREATING...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>ADD ADDITIONAL ACCOUNT</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text,
    minHeight: 56,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  submitButton: {
    backgroundColor: theme.colors.buttonPrimary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.buttonText,

    fontFamily: 'StagnanMedium',

  },
  inputError: {
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94949C',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  accountCard: {
    backgroundColor: '#2D3451',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A1F3A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  accountDetails: {
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  accountEmail: {
    fontSize: 16,
    color: '#E4E4E7',
    fontWeight: '500',
  },
});