import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Clipboard,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Currency } from '../../src/types/exchange';
import { useStyles } from '../../src/hooks/useTheme';
import { Theme } from '../../src/types/theme';
import { getCryptoBalances } from '../../src/services/balanceService';
import { getCryptoFee, createCryptoTransaction, TokenExpiredError } from '../../src/services/cryptoSendService';
import { CreateCryptoTransactionRequest, SEND_CRYPTO_TO_BLOCKCHAIN } from '../../src/types/cryptoSend';
import { useAuthContext } from '../../src/contexts/AuthContext';
import { useToast } from '../../src/contexts/ToastContext';

interface Blockchain {
  id: string;
  name: string;
  network: string;
  displayName: string;
}

interface SavedAddress {
  id: string;
  label: string;
  address: string;
  blockchain: string;
  cryptoType: string;
  isVerified: boolean;
}

interface SendConfirmationData {
  selectedCrypto: Currency;
  selectedBlockchain: Blockchain | null;
  selectedAddress: SavedAddress;
  amount: string;
  senderWallet: string;
  userEmail: string;
  clientId: string;
  accountNumber: string;
}

export default function SendCryptoConfirmScreen() {
  const params = useLocalSearchParams();
  const { user } = useAuthContext();
  
  // State management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [cryptoBalance, setCryptoBalance] = useState<number>(0);
  const [transactionFee, setTransactionFee] = useState<number>(0);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [senderWallet, setSenderWallet] = useState<string>('');
  
  // Theme hooks
  const styles = useStyles((theme: Theme) => createStyles(theme));
  const { showError } = useToast();
  
  // Parse transaction data from params
  const transactionData: SendConfirmationData = JSON.parse(params.transactionData as string);
  
  const {
    selectedCrypto,
    selectedBlockchain,
    selectedAddress,
    amount,
    userEmail,
    clientId,
    accountNumber
  } = transactionData;

  // Load real crypto data on component mount
  useEffect(() => {
    loadTransactionData();
  }, []);

  const loadTransactionData = async () => {
    setIsLoadingData(true);
    
    try {
      // Get crypto balance
      const balanceResponse = await getCryptoBalances();
      const balance = balanceResponse.clientBalanceList.find(
        b => b.currencyShortName === selectedCrypto.code
      );
      setCryptoBalance(balance?.balanceAmount || 0);
      
      // Get transaction fee
      const feeResponse = await getCryptoFee(selectedCrypto.code);
      setTransactionFee(feeResponse.data.fee);
      
      // Set sender wallet from transaction data
      setSenderWallet(transactionData.senderWallet || '');
    } catch (error) {
      console.error('Error loading transaction data:', error);
      showError('Failed to load transaction data. Please try again.', 'Network Error');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Calculate amounts with fee included
  const userAmount = parseFloat(amount);
  const totalSendAmount = userAmount + transactionFee; // Include fee but don't show it separately
  const balanceAfter = cryptoBalance - totalSendAmount;

  const copyAddressToClipboard = () => {
    Clipboard.setString(selectedAddress.address);
    Alert.alert('Copied', 'Address copied to clipboard');
  };

  const handleSendNow = async () => {
    try {
      setIsAuthenticating(true);
      
      // Simulate biometric authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsAuthenticating(false);
      setIsSubmitting(true);
      
      // Get blockchain name for the transaction
      const getBlockchainName = () => {
        if (selectedCrypto.code === 'USDT' || selectedCrypto.code === 'USDC') {
          return selectedBlockchain?.name || 'Ethereum'; // Use selected blockchain
        }
        return SEND_CRYPTO_TO_BLOCKCHAIN[selectedCrypto.code] || 'Ethereum';
      };
      
      // Build the API payload
      const transactionRequest: CreateCryptoTransactionRequest = {
        currencyType: "crypto",
        type: "Send",
        transactionEmail: user?.clientEmail || '',
        transactionFee: transactionFee.toFixed(8), // "0.00100000" format
        transactionDetails: {
          cryptoId: selectedCrypto.code,
          blockchain: getBlockchainName(),
          cryptoAmount: totalSendAmount, // 0.011 (number)
          baseAmount: amount, // "0.01" (string)
          fromAddress: senderWallet || "",
          toAddress: selectedAddress.address
        }
      };
      
      console.log('Sending transaction request:', transactionRequest);
      
      // Make the real API call
      const response = await createCryptoTransaction(transactionRequest);
      
      console.log('Transaction response:', response);
      
      // Handle the pending response
      Alert.alert(
        'Transaction Submitted',
        'Your transaction has been submitted and is pending manual approval.',
        [
          {
            text: 'View Transactions',
            onPress: () => {
              router.dismissAll();
              router.push('/(auth)/transactions?tab=crypto');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Send transaction error:', error);
      
      if (error instanceof TokenExpiredError) {
        showError(
          'Your session has expired. Please login again.',
          'Session Expired'
        );
        // Immediately redirect to login
        router.replace('/(public)/login');
      } else {
        Alert.alert(
          'Transaction Failed',
          error instanceof Error ? error.message : 'Failed to complete transaction. Please try again.',
          [
            { 
              text: 'OK',
              onPress: () => {
                router.back();
              }
            }
          ]
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

  const formatAddress = (address: string) => {
    if (address.length > 30) {
      return `${address.substring(0, 15)}...${address.substring(address.length - 10)}`;
    }
    return address;
  };

  const getWarningMessage = () => {
    const cryptoAmount = isLoadingData ? 'Loading...' : `${totalSendAmount.toFixed(8)} ${selectedCrypto.code}`;
    return `ARE YOU SURE YOU WANT TO SEND ${cryptoAmount} TO THIS ADDRESS? THIS IS A PERMANENT ACTION AND CANNOT BE UNDONE ONCE CONFIRMED.`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={styles.headerTitle.color} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>REVIEW & CONFIRM</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Warning Message */}
        <View style={styles.warningSection}>
          <Text style={styles.warningText}>{getWarningMessage()}</Text>
          <Text style={styles.warningSubtext}>
            PLEASE DOUBLE CHECK THE ADDRESS IN FULL AND CONFIRM TO CONTINUE.
          </Text>
        </View>

        {/* Transaction Details */}
        <View style={styles.detailsContainer}>
          {/* Send Amount */}
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>SEND</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.cryptoSymbol}>{selectedCrypto.symbol}</Text>
              <Text style={styles.amountText}>
                {isLoadingData ? 'Loading...' : `${totalSendAmount.toFixed(8)} ${selectedCrypto.code}`}
              </Text>
            </View>
          </View>

          {/* Balance */}
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>BALANCE</Text>
            <Text style={styles.detailValue}>
              {isLoadingData ? 'Loading...' : `${balanceAfter.toFixed(8)} ${selectedCrypto.code}`}
            </Text>
          </View>

          {/* Blockchain - Only show if USDT */}
          {selectedCrypto.code === 'USDT' && selectedBlockchain && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>BLOCKCHAIN</Text>
              <Text style={styles.detailValue}>{selectedBlockchain.displayName}</Text>
            </View>
          )}

          {/* Name Address */}
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>NAME ADDRESS</Text>
            <Text style={styles.detailValue}>{selectedAddress.label}</Text>
          </View>

          {/* Recipient Address */}
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>RECIPIENT ADDRESS</Text>
            <TouchableOpacity 
              style={styles.addressContainer}
              onPress={copyAddressToClipboard}
            >
              <Text style={styles.addressText}>{formatAddress(selectedAddress.address)}</Text>
              <Ionicons name="copy-outline" size={16} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Send Now Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.sendButton,
              (isSubmitting || isAuthenticating) && styles.sendButtonDisabled
            ]}
            onPress={handleSendNow}
            disabled={isSubmitting || isAuthenticating}
          >
            {isAuthenticating ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#000000" />
                <Text style={[styles.sendButtonText, { marginLeft: 8 }]}>AUTHENTICATING...</Text>
              </View>
            ) : isSubmitting ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#000000" />
                <Text style={[styles.sendButtonText, { marginLeft: 8 }]}>SENDING...</Text>
              </View>
            ) : (
              <Text style={styles.sendButtonText}>SEND NOW</Text>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
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
    width: 32, // Same width as back button for centering
  },
  warningSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  warningSubtext: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
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
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cryptoSymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.accent,
    marginRight: 8,
  },
  amountText: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    fontFamily: 'monospace',
    marginRight: 8,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sendButton: {
    backgroundColor: theme.colors.buttonPrimary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.buttonText,

    fontFamily: 'StagnanMedium',

  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '500',
  },
});
