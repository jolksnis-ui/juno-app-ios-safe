import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useStyles } from '../../src/hooks/useTheme';
import { Theme } from '../../src/types/theme';
import { WithdrawalFormData } from '../../src/types/withdrawal';
import { getClientBalances, TokenExpiredError } from '../../src/services/balanceService';
import { createWithdrawalTransaction, CreateWithdrawalTransactionRequest } from '../../src/services/withdrawalService';
import { saveClientBeneficiary } from '../../src/services/paymentService';
import { getUserData } from '../../src/services/secureStorage';
import { FiatBalance } from '../../src/types/balance';
import { useAuthContext } from '../../src/contexts/AuthContext';
import { useToast } from '../../src/contexts/ToastContext';
import { uploadAttachmentsForTransaction } from '../../src/services/storageService';

export default function WithdrawFiatConfirmScreen() {
  const params = useLocalSearchParams();
  const styles = useStyles((theme: Theme) => createStyles(theme));
  const { user } = useAuthContext();
  const { showError } = useToast();
  
  // State management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [fiatBalances, setFiatBalances] = useState<FiatBalance[]>([]);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  
  // Parse form data from params
  const formData: WithdrawalFormData = JSON.parse(params.formData as string);
  const fee = parseFloat(params.fee as string) || 0;
  
  useEffect(() => {
    loadFiatBalances();
  }, []);

  const loadFiatBalances = async () => {
    setIsLoadingBalance(true);
    try {
      const response = await getClientBalances();
      setFiatBalances(response.clientBalanceList);
    } catch (error) {
      console.error('Error loading fiat balances:', error);
      if (error instanceof TokenExpiredError) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [{ text: 'OK', onPress: () => router.replace('/(public)/login') }]
        );
      } else {
        showError('Failed to load balance. Please try again.', 'Network Error');
      }
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const getAvailableBalance = () => {
    const balance = fiatBalances.find(
      b => b.currencyShortName === formData.selectedCurrency.code
    );
    return balance?.balanceAmount || 0;
  };

  const calculateAmounts = () => {
    const amount = parseFloat(formData.amount) || 0;
    const feeAmount = amount * fee / 100;
    const totalDeducted = amount + feeAmount;
    const balanceAfter = getAvailableBalance() - totalDeducted;
    
    return {
      amount,
      feeAmount,
      totalDeducted,
      balanceAfter
    };
  };

  const { amount, feeAmount, totalDeducted, balanceAfter } = calculateAmounts();

  const handleConfirm = async () => {
    try {
      setIsAuthenticating(true);
      
      // Simulate biometric authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsAuthenticating(false);
      
      // Upload attachments if present
      let attachmentUrls: string[] = [];
      if (formData.attachments && formData.attachments.length > 0) {
        setIsUploadingFiles(true);
        setUploadProgress({ current: 0, total: formData.attachments.length });
        
        try {
          console.log(`Uploading ${formData.attachments.length} attachment(s)...`);
          attachmentUrls = await uploadAttachmentsForTransaction(
            formData.attachments,
            'client-withdrawal',  // Try with hyphen for consistency
            (current, total) => {
              setUploadProgress({ current, total });
            }
          );
          console.log('Attachments uploaded successfully:', attachmentUrls);
        } catch (uploadError) {
          console.error('Failed to upload attachments:', uploadError);
          showError('Failed to upload attachments. Please try again.', 'Upload Error');
          return;
        } finally {
          setIsUploadingFiles(false);
        }
      }
      
      setIsSubmitting(true);
      
      // Build the API request
      const withdrawalRequest: CreateWithdrawalTransactionRequest = {
        currencyType: "fiat",
        type: "Withdrawal",
        transactionDetails: {
          beneficiaryName: formData.beneficiaryName || "",
          beneficiaryCountry: formData.beneficiaryCountry?.name || "",
          beneficiaryAddress: formData.beneficiaryAddress || "",
          bankName: formData.bankName || "",
          bankAddress: formData.bankAddress || "",
          beneficiaryAccountNumber: formData.accountNumber || "",
          sortCode: formData.sortCode || "",
          iban: formData.iban || "",
          swift: formData.swiftCode || "",
          reference: formData.reference || "",
          additionalBankDetails: formData.additionalInfo || "",
          bankCountry: formData.bankCountry?.name || "",
          save: formData.saveBankAccount,
          nickname: "",
          accountNickName: formData.saveBankAccount ? formData.accountNickname : formData.beneficiaryName || "",
          amount: formData.amount,
          currency: formData.selectedCurrency.code
        },
        currency: formData.selectedCurrency.code,
        transactionEmail: user?.clientEmail || "",
        balance: {
          balanceAmount: formData.amount
        }
      };
      
      // Add attachment URLs if any were uploaded
      if (attachmentUrls.length > 0) {
        (withdrawalRequest.transactionDetails as any).attachment = attachmentUrls;
      }

      console.log('Submitting withdrawal request:', withdrawalRequest);

      // Make the real API call
      const response = await createWithdrawalTransaction(withdrawalRequest);
      
      console.log('Withdrawal response:', response);
      
      // If transaction was successful and user wants to save bank account, call save beneficiary API
      if (response.success && formData.saveBankAccount && formData.accountNickname) {
        try {
          const userData = await getUserData();
          if (userData && userData.clientId) {
            const saveBeneficiaryRequest = {
              clientIdObj: userData.clientId,
              accountNickName: formData.accountNickname,
              beneficiaryName: formData.beneficiaryName || '',
              currency: formData.selectedCurrency.code,
              bankCountry: formData.bankCountry?.name || '',
              beneficiaryCountry: formData.beneficiaryCountry?.name || ''
            };
            
            console.log('Saving beneficiary:', saveBeneficiaryRequest);
            saveClientBeneficiary(saveBeneficiaryRequest);
            console.log('Beneficiary saved successfully');
          }
        } catch (error) {
          // Silent failure as requested - don't worry about success/failure
          console.log('Save beneficiary failed (silent):', error);
        }
      }
      
      // Success response - show "Pending" alert
      Alert.alert(
        'Pending',
        'Amount has been withdrawn. Link to transaction and dashboard pages',
        [
          {
            text: 'View Transactions',
            onPress: () => {
              router.dismissAll();
              router.push({
                pathname: '/(auth)/transactions',
                params: { tab: 'fiat' }
              });
            }
          },
          {
            text: 'Dashboard',
            onPress: () => {
              router.dismissAll();
              router.push('/(auth)/dashboard');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Withdrawal error:', error);
      
      if (error instanceof TokenExpiredError) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [{ text: 'OK', onPress: () => router.replace('/(public)/login') }]
        );
      } else {
        Alert.alert(
          'Withdrawal Failed',
          'Failed to submit withdrawal request. Please try again.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } finally {
      setIsSubmitting(false);
      setIsAuthenticating(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={styles.headerTitle.color} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>WITHDRAWAL CONFIRMATION</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Withdrawal Amount Section */}
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>WITHDRAW AMOUNT</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>{formData.selectedCurrency.symbol}</Text>
            <Text style={styles.amountText}>
              {amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <Text style={styles.balanceText}>
            BALANCE: {isLoadingBalance ? 'Loading...' : 
              `${formData.selectedCurrency.symbol}${balanceAfter.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            }
          </Text>
        </View>

        {/* Details Container */}
        <View style={styles.detailsContainer}>
          {/* Beneficiary Name */}
          {formData.beneficiaryName && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>BENEFICIARY NAME</Text>
              <Text style={styles.detailValue}>{formData.beneficiaryName}</Text>
            </View>
          )}

          {/* Beneficiary Country */}
          {formData.beneficiaryCountry && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>BENEFICIARY COUNTRY</Text>
              <Text style={styles.detailValue}>{formData.beneficiaryCountry.name}</Text>
            </View>
          )}

          {/* Beneficiary Address */}
          {formData.beneficiaryAddress && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>BENEFICIARY ADDRESS</Text>
              <Text style={styles.detailValue}>{formData.beneficiaryAddress}</Text>
            </View>
          )}

          {/* Bank Name */}
          {formData.bankName && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>BANK NAME</Text>
              <Text style={styles.detailValue}>{formData.bankName}</Text>
            </View>
          )}

          {/* Bank Country */}
          {formData.bankCountry && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>BANK COUNTRY</Text>
              <Text style={styles.detailValue}>{formData.bankCountry.name}</Text>
            </View>
          )}

          {/* Bank Address */}
          {formData.bankAddress && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>BANK ADDRESS</Text>
              <Text style={styles.detailValue}>{formData.bankAddress}</Text>
            </View>
          )}

          {/* Account Number */}
          {formData.accountNumber && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>ACCOUNT NUMBER</Text>
              <Text style={styles.detailValue}>{formData.accountNumber}</Text>
            </View>
          )}

          {/* Sort Code */}
          {formData.sortCode && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>SORT CODE</Text>
              <Text style={styles.detailValue}>{formData.sortCode}</Text>
            </View>
          )}

          {/* IBAN */}
          {formData.iban && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>IBAN</Text>
              <Text style={styles.detailValue}>{formData.iban}</Text>
            </View>
          )}

          {/* Swift Code */}
          {formData.swiftCode && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>SWIFT CODE</Text>
              <Text style={styles.detailValue}>{formData.swiftCode}</Text>
            </View>
          )}

          {/* Reference */}
          {formData.reference && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>REFERENCE</Text>
              <Text style={styles.detailValue}>{formData.reference}</Text>
            </View>
          )}

          {/* Additional Info */}
          {formData.additionalInfo && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>ADDITIONAL INFO</Text>
              <Text style={styles.detailValue}>{formData.additionalInfo}</Text>
            </View>
          )}

          {/* Account Nickname - Only show if saving account */}
          {formData.saveBankAccount && formData.accountNickname && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>ACCOUNT NICKNAME</Text>
              <Text style={styles.detailValue}>{formData.accountNickname}</Text>
            </View>
          )}

          {/* Attachments */}
          {formData.attachments && formData.attachments.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>ATTACHMENTS</Text>
              {formData.attachments.map((attachment, index) => (
                <View key={attachment.id} style={styles.attachmentItem}>
                  <View style={styles.attachmentInfo}>
                    <Text style={styles.attachmentName}>{attachment.name}</Text>
                    <Text style={styles.attachmentSize}>{formatFileSize(attachment.size)}</Text>
                  </View>
                  <Ionicons name="document-outline" size={20} color="#8E8E93" />
                </View>
              ))}
            </View>
          )}

          {/* Fee Information */}
          {/* {fee > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>TRANSACTION FEE ({fee}%)</Text>
              <Text style={styles.detailValue}>
                {formData.selectedCurrency.symbol}{feeAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          )} */}

          {/* Total Amount */}
          {/* <View style={[styles.detailSection, styles.totalSection]}>
            <Text style={styles.detailLabel}>TOTAL AMOUNT (INCLUDING FEES)</Text>
            <Text style={[styles.detailValue, styles.totalValue]}>
              {formData.selectedCurrency.symbol}{totalDeducted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View> */}
        </View>

        {/* Confirm Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.confirmButton,
              (isSubmitting || isAuthenticating) && styles.confirmButtonDisabled
            ]}
            onPress={handleConfirm}
            disabled={isSubmitting || isAuthenticating}
          >
            {isSubmitting ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#000000" />
                <Text style={[styles.confirmButtonText, { marginLeft: 8 }]}>SUBMITTING...</Text>
              </View>
            ) : (
              <Text style={styles.confirmButtonText}>CONFIRM</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Upload Progress Modal */}
      <Modal
        visible={isUploadingFiles}
        transparent
        animationType="fade"
      >
        <View style={styles.uploadModal}>
          <View style={styles.uploadModalContent}>
            <ActivityIndicator size="large" color={styles.uploadTitle.color} />
            <Text style={styles.uploadTitle}>Uploading Files</Text>
            <Text style={styles.uploadProgressText}>
              Uploading file {uploadProgress.current} of {uploadProgress.total}
            </Text>
            <View style={styles.uploadProgressBar}>
              <View 
                style={[
                  styles.uploadProgressFill,
                  { width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }
                ]}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  headerSpacer: {
    width: 32,
  },
  amountSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.accent,
    marginRight: 8,
  },
  amountText: {
    fontSize: 28,
    fontWeight: '600',
    color: theme.colors.text,
  },
  balanceText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  detailsContainer: {
    flex: 1,
  },
  detailSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    lineHeight: 22,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
    marginBottom: 2,
  },
  attachmentSize: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  totalSection: {
    backgroundColor: theme.colors.surface,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.accent,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  confirmButton: {
    backgroundColor: theme.colors.buttonPrimary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.buttonText,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadModalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  uploadProgressText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 12,
  },
  uploadProgressBar: {
    width: '100%',
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  uploadProgressFill: {
    height: '100%',
    backgroundColor: theme.colors.accent,
    borderRadius: 3,
  },
});
