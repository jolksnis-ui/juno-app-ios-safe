import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthContext } from '@/contexts/AuthContext';
import { useStyles, useTheme } from '../../src/hooks/useTheme';
import { Theme } from '../../src/types/theme';
import { getLoggedInClient, changePassword } from '../../src/services/authService';
import { GetLoggedInClientResponse, ChangePasswordRequest } from '../../src/types/auth';
import { TokenExpiredError } from '../../src/utils/apiClient';

type TabType = 'personal' | 'password';

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function PersonalInfoScreen() {
  const { user } = useAuthContext();
  const styles = useStyles((theme: Theme) => createStyles(theme));
  
  const [personalInfo, setPersonalInfo] = useState<GetLoggedInClientResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    loadPersonalInfo();
  }, []);

  const loadPersonalInfo = async () => {
    setIsLoading(true);
    try {
      const response = await getLoggedInClient();
      setPersonalInfo(response);
    } catch (error) {
      console.error('Error loading personal info:', error);
      if (error instanceof TokenExpiredError) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [{ text: 'OK', onPress: () => router.replace('/(public)/login') }]
        );
      } else {
        Alert.alert('Error', 'Failed to load personal information. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleEdit = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setActiveTab('personal');
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordErrors({});
  };

  const validatePasswordForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!passwordForm.currentPassword.trim()) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordForm.newPassword.trim()) {
      errors.newPassword = 'New password is required';
    }

    if (!passwordForm.confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = async () => {
    if (!validatePasswordForm() || !user?.clientEmail) {
      return;
    }

    setIsChangingPassword(true);
    try {
      const request: ChangePasswordRequest = {
        clientEmail: user.clientEmail,
        oldPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      };

      await changePassword(request);
      
      Alert.alert(
        'Success',
        'Your password has been changed successfully. Please login again.',
        [{ text: 'OK', onPress: () => router.replace('/(public)/login') }]
      );
    } catch (error) {
      console.error('Password change error:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to change password. Please try again.'
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const renderPersonalInfoField = (label: string, value: string | undefined) => {
    if (!value) return null;
    
    return (
      <View style={styles.infoField}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
    );
  };

  const renderPasswordInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    error?: string
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.textInput, error && styles.textInputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor="#666666"
        secureTextEntry
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={styles.title.color} />
          </TouchableOpacity>
          <Text style={styles.title}>Personal Information</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00D4AA" />
          <Text style={styles.loadingText}>Loading personal information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={styles.title.color} />
        </TouchableOpacity>
        <Text style={styles.title}>Personal Information</Text>
        <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          {renderPersonalInfoField('Full Name', personalInfo?.fullName || user?.name)}
          {renderPersonalInfoField('Email', personalInfo?.email || user?.clientEmail)}
          {renderPersonalInfoField('Phone Number', personalInfo?.phoneNumber)}
          {renderPersonalInfoField('Date of Birth', personalInfo?.dateOfBirth)}
          {renderPersonalInfoField('Country', personalInfo?.country)}
          {renderPersonalInfoField('Address', personalInfo?.address)}
          {renderPersonalInfoField('City', personalInfo?.city)}
          {renderPersonalInfoField('State', personalInfo?.state)}
          {renderPersonalInfoField('Zip Code', personalInfo?.zipCode)}
          {renderPersonalInfoField('Account Number', user?.accountNumber)}
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Information</Text>
            <TouchableOpacity style={styles.modalCloseButton} onPress={closeModal}>
              <Ionicons name="close" size={24} color={styles.modalTitle.color} />
            </TouchableOpacity>
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'personal' && styles.activeTab]}
              onPress={() => setActiveTab('personal')}
            >
              <Text style={[styles.tabText, activeTab === 'personal' && styles.activeTabText]}>
                Personal Info
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'password' && styles.activeTab]}
              onPress={() => setActiveTab('password')}
            >
              <Text style={[styles.tabText, activeTab === 'password' && styles.activeTabText]}>
                Change Password
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <ScrollView style={styles.modalContent}>
            {activeTab === 'personal' ? (
              <View style={styles.messageContainer}>
                <Ionicons name="information-circle-outline" size={48} color="#00D4AA" />
                <Text style={styles.messageTitle}>Contact Support</Text>
                <Text style={styles.messageText}>
                  To update your personal information, please contact our support team. 
                  They will help you verify and update your details securely.
                </Text>
                <Text style={styles.emailText}>support@junomoney.com</Text>
              </View>
            ) : (
              <View style={styles.passwordForm}>
                {renderPasswordInput(
                  'Current Password',
                  passwordForm.currentPassword,
                  (text) => setPasswordForm(prev => ({ ...prev, currentPassword: text })),
                  passwordErrors.currentPassword
                )}
                
                {renderPasswordInput(
                  'New Password',
                  passwordForm.newPassword,
                  (text) => setPasswordForm(prev => ({ ...prev, newPassword: text })),
                  passwordErrors.newPassword
                )}
                
                {renderPasswordInput(
                  'Confirm New Password',
                  passwordForm.confirmPassword,
                  (text) => setPasswordForm(prev => ({ ...prev, confirmPassword: text })),
                  passwordErrors.confirmPassword
                )}

                <TouchableOpacity
                  style={[styles.changePasswordButton, isChangingPassword && styles.buttonDisabled]}
                  onPress={handlePasswordChange}
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color="#000000" />
                      <Text style={[styles.changePasswordButtonText, { marginLeft: 8 }]}>
                        Changing Password...
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.changePasswordButtonText}>Change Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00D4AA',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  infoField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceSecondary,
    margin: 16,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: theme.colors.background,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  activeTabText: {
    color: theme.colors.text,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messageContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  messageTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emailText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00D4AA',
    textAlign: 'center',
  },
  passwordForm: {
    paddingTop: 20,
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
  textInputError: {
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: 4,
    fontWeight: '500',
  },
  changePasswordButton: {
    backgroundColor: '#00D4AA',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  changePasswordButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});