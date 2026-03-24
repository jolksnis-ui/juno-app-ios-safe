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
import { router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { CurrencySelector } from '../../src/components/CurrencySelector';
import { Currency, SUPPORTED_CURRENCIES } from '../../src/types/exchange';
import { useStyles } from '../../src/hooks/useTheme';
import { Theme } from '../../src/types/theme';
import { WalletAddressState, CRYPTO_TO_BLOCKCHAIN } from '../../src/types/wallet';
import { getWalletAddress, generateWalletAddress, TokenExpiredError } from '../../src/services/walletService';
import { useToast } from '../../src/contexts/ToastContext';

export default function ReceiveCryptoScreen() {
  // State management
  const [selectedCrypto, setSelectedCrypto] = useState<Currency>(SUPPORTED_CURRENCIES.ETH);
  const [walletAddress, setWalletAddress] = useState<WalletAddressState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Theme hooks
  const styles = useStyles((theme: Theme) => createStyles(theme));
  const { showError } = useToast();

  // Load wallet address when crypto changes
  useEffect(() => {
    loadWalletAddress();
  }, [selectedCrypto]);

  const loadWalletAddress = async () => {
    setIsLoading(true);
    
    try {
      // Get blockchain name for selected crypto
      const blockchain = CRYPTO_TO_BLOCKCHAIN[selectedCrypto.code];
      if (!blockchain) {
        throw new Error(`Unsupported cryptocurrency: ${selectedCrypto.code}`);
      }

      // Call API to get wallet address
      const response = await getWalletAddress([blockchain]);
      
      if (response.data && response.data.length > 0) {
        // Address exists - show QR code
        const walletData = response.data[0];
        setWalletAddress({
          address: walletData.address.key,
          network: walletData.network.toUpperCase(),
          cryptoType: selectedCrypto.code,
          exists: true
        });
      } else {
        // No address found - show generate button
        setWalletAddress({
          address: '',
          network: 'testnet',
          cryptoType: selectedCrypto.code,
          exists: false
        });
      }
    } catch (error) {
      console.error('Error loading wallet address:', error);
      handleAPIError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateWallet = async () => {
    setIsGenerating(true);
    
    try {
      // Get blockchain name for selected crypto
      const blockchain = CRYPTO_TO_BLOCKCHAIN[selectedCrypto.code];
      if (!blockchain) {
        throw new Error(`Unsupported cryptocurrency: ${selectedCrypto.code}`);
      }

      // Call API to generate wallet address
      const response = await generateWalletAddress(blockchain);
      
      if (response.data && response.data.address) {
        // Address generated successfully - show QR code
        setWalletAddress({
          address: response.data.address.key,
          network: response.data.network.toUpperCase(),
          cryptoType: selectedCrypto.code,
          exists: true
        });
        
        Alert.alert('Success', 'Wallet address generated successfully!');
      } else {
        throw new Error('Failed to generate wallet address');
      }
    } catch (error) {
      console.error('Error generating wallet address:', error);
      handleAPIError(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAPIError = (error: any) => {
    if (error instanceof TokenExpiredError) {
      Alert.alert(
        'Session Expired',
        'Your session has expired. Please login again.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(public)/login')
          }
        ]
      );
    } else if (error.message?.includes('network') || error.message?.includes('Network')) {
      showError('Please check your internet connection and try again.', 'Network Error');
    } else if (error.message?.includes('Unsupported cryptocurrency')) {
      Alert.alert('Error', error.message);
    } else {
      showError('Failed to load wallet address. Please try again.', 'Network Error');
    }
  };

  const getNetworkForCrypto = (cryptoCode: string): string => {
    const networks: Record<string, string> = {
      ETH: 'ETHEREUM',
      USDT: 'ETHEREUM',
      USDC: 'ETHEREUM',
      BTC: 'BITCOIN',
      LTC: 'LITECOIN',
      XRP: 'RIPPLE',
      TRX: 'TRON'
    };
    return networks[cryptoCode] || 'UNKNOWN';
  };

  const copyAddressToClipboard = () => {
    if (walletAddress?.address) {
      Clipboard.setString(walletAddress.address);
      Alert.alert('Copied', 'Address copied to clipboard');
    }
  };

  const handleCryptoChange = (crypto: Currency) => {
    setSelectedCrypto(crypto);
    setWalletAddress(null);
  };

  const handleClose = () => {
    router.back();
  };

  const getWarningText = () => {
    return `ONLY SEND ${selectedCrypto.name.toUpperCase()} (${selectedCrypto.code}) TO THIS ADDRESS`;
  };

  const getSubWarningText = () => {
    return `SENDING ANY OTHER ASSET, INCLUDING USD COIN (USDC), WILL RESULT IN PERMANENT LOSS. RECIPIENT WALLET`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>RECEIVE CRYPTO</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={styles.headerTitle.color} />
          </TouchableOpacity>
        </View>

        {/* QR Code Section */}
        <View style={styles.qrSection}>
          {isLoading ? (
            <View style={styles.qrPlaceholder}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : walletAddress?.exists && walletAddress.address ? (
            <View style={styles.qrContainer}>
              <QRCode
                value={walletAddress.address}
                size={200}
                backgroundColor="white"
                color="black"
              />
            </View>
          ) : (
            <View style={styles.qrPlaceholder}>
              <View style={styles.qrPlaceholderBox}>
                <Ionicons name="qr-code-outline" size={80} color="#666666" />
                <Text style={styles.qrPlaceholderText}>QR Code will appear here</Text>
              </View>
            </View>
          )}
        </View>

        {/* Warning Text */}
        <View style={styles.warningSection}>
          <Text style={styles.warningTitle}>{getWarningText()}</Text>
          <Text style={styles.warningSubtitle}>{getSubWarningText()}</Text>
        </View>

        {/* Crypto Selector */}
        <View style={styles.selectorSection}>
          <CurrencySelector
            selectedCurrency={selectedCrypto}
            onCurrencySelect={handleCryptoChange}
            filterType="crypto"
            style={styles.cryptoSelector}
            showNetwork={true}
            networkText={getNetworkForCrypto(selectedCrypto.code)}
          />
        </View>

        {/* Address Section */}
        <View style={styles.addressSection}>
          <Text style={styles.addressLabel}>RECEIVING ADDRESS</Text>
          
          {isLoading ? (
            <View style={styles.addressLoading}>
              <ActivityIndicator size="small" color="#666666" />
              <Text style={styles.addressLoadingText}>Loading address...</Text>
            </View>
          ) : walletAddress?.exists && walletAddress.address ? (
            <TouchableOpacity 
              style={styles.addressContainer}
              onPress={copyAddressToClipboard}
            >
              <Text style={styles.addressText}>{walletAddress.address}</Text>
              <Ionicons name="copy-outline" size={16} color="#666666" />
            </TouchableOpacity>
          ) : (
            <Text style={styles.addressNotGenerated}>NOT GENERATED</Text>
          )}
        </View>

        {/* Generate Button */}
        <View style={styles.buttonSection}>
          {/* {!walletAddress?.exists && !isLoading && (
            <TouchableOpacity 
              style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
              onPress={handleGenerateWallet}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <View style={styles.buttonLoadingContainer}>
                  <ActivityIndicator size="small" color="#000000" />
                  <Text style={[styles.generateButtonText, { marginLeft: 8 }]}>GENERATING...</Text>
                </View>
              ) : (
                <Text style={styles.generateButtonText}>GENERATE</Text>
              )}
            </TouchableOpacity>
          )} */}
          
          {(!walletAddress?.exists || !walletAddress.address) && (
            <TouchableOpacity 
              style={styles.regenerateButton}
              onPress={handleGenerateWallet}
              disabled={isGenerating}
            >
              <Ionicons name="refresh-outline" size={16} color="#FFFFFF" />
              <Text style={styles.regenerateButtonText}>GENERATE NEW ADDRESS</Text>
            </TouchableOpacity>
          )}
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  closeButton: {
    padding: 4,
  },
  qrSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF', // Keep white for QR code readability
    borderRadius: 12,
  },
  qrPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 240,
  },
  qrPlaceholderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: theme.colors.textSecondary,
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  qrPlaceholderText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 8,
  },
  loadingText: {
    color: theme.colors.text,
    fontSize: 14,
    marginTop: 12,
  },
  warningSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  warningSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  selectorSection: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cryptoSelector: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  addressSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
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
    fontSize: 12,
    color: theme.colors.text,
    fontFamily: 'monospace',
    marginRight: 8,
  },
  addressNotGenerated: {
    fontSize: 14,
    color: theme.colors.error,
    fontWeight: '500',
  },
  addressLoading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressLoadingText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  buttonSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  generateButton: {
    backgroundColor: theme.colors.buttonPrimary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.buttonText,
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
  },
  regenerateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginLeft: 8,
  },
  buttonLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
