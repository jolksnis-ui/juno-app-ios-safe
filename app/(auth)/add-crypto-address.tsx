import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { CurrencySelector } from '../../src/components/CurrencySelector';
import { Currency, SUPPORTED_CURRENCIES } from '../../src/types/exchange';
import { useStyles } from '../../src/hooks/useTheme';
import { Theme } from '../../src/types/theme';
import { SEND_CRYPTO_TO_BLOCKCHAIN } from '../../src/types/cryptoSend';
import { validateWalletAddress, saveCryptoAddress, TokenExpiredError } from '../../src/services/cryptoSendService';
import { useToast } from '../../src/contexts/ToastContext';

interface Blockchain {
  id: string;
  name: string;
  network: string;
  displayName: string;
}

export default function AddCryptoAddressScreen() {
  const params = useLocalSearchParams();
  
  // Parse initial data from params
  const initialCrypto = params.selectedCrypto ? JSON.parse(params.selectedCrypto as string) : SUPPORTED_CURRENCIES.ETH;
  const initialBlockchain = params.selectedBlockchain ? JSON.parse(params.selectedBlockchain as string) : null;
  
  // State management
  const [selectedCrypto, setSelectedCrypto] = useState<Currency>(initialCrypto);
  const [selectedBlockchain, setSelectedBlockchain] = useState<Blockchain | null>(initialBlockchain);
  const [nickname, setNickname] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [availableBlockchains, setAvailableBlockchains] = useState<Blockchain[]>([]);
  const [showBlockchainSelector, setShowBlockchainSelector] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Theme hooks
  const styles = useStyles((theme: Theme) => createStyles(theme));
  const { showError } = useToast();

  const blockchainOptions: Blockchain[] = [
    {
      id: 'ethereum',
      name: 'ETHEREUM',
      network: 'ERC20',
      displayName: 'ETHEREUM - ERC20'
    },
    {
      id: 'tron',
      name: 'TRON',
      network: 'TRC20',
      displayName: 'TRON - TRC20'
    }
  ];

  // Set blockchain options when crypto changes
  useEffect(() => {
    if (selectedCrypto.code === 'USDT' || selectedCrypto.code === 'USDC') {
      setAvailableBlockchains(blockchainOptions);
      if (!selectedBlockchain) {
        setSelectedBlockchain(blockchainOptions[0]); // Default to Ethereum
      }
    } else {
      setAvailableBlockchains([]);
      setSelectedBlockchain(null);
    }
  }, [selectedCrypto]);

  // Add error handling function following app pattern
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
    } else {
      showError('Failed to process request. Please try again.', 'General Error');
    }
  };

  const handleCryptoChange = (crypto: Currency) => {
    setSelectedCrypto(crypto);
  };

  const handleBlockchainChange = (blockchain: Blockchain) => {
    setSelectedBlockchain(blockchain);
    setShowBlockchainSelector(false);
  };

  const getBlockchainName = () => {
    if (selectedCrypto.code === 'USDT' || selectedCrypto.code === 'USDC') {
      return selectedBlockchain?.name || 'ETHEREUM'; // Use selected blockchain
    }
    return SEND_CRYPTO_TO_BLOCKCHAIN[selectedCrypto.code] || 'Ethereum';
  };

  const getErrorMessage = (message: string | { error: boolean; message: string }): string => {
    if (typeof message === 'string') {
      return message;
    }
    return message.message || 'Invalid wallet address format';
  };

  const validateForm = () => {
    if (!selectedCrypto) {
      Alert.alert('Error', 'Please select a cryptocurrency');
      return false;
    }
    
    if ((selectedCrypto.code === 'USDT' || selectedCrypto.code === 'USDC') && !selectedBlockchain) {
      Alert.alert('Error', 'Please select a blockchain');
      return false;
    }
    
    if (!nickname.trim()) {
      Alert.alert('Error', 'Please enter a nickname');
      return false;
    }
    
    if (!walletAddress.trim()) {
      Alert.alert('Error', 'Please enter a wallet address');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Step 1: Validate wallet address
      const validateResponse = await validateWalletAddress({
        crypto: selectedCrypto.code,
        blockchain: getBlockchainName(),
        walletAddress: walletAddress.trim(),
        nickname: nickname.trim()
      });
      
      if (validateResponse.error) {
        // Show validation error
        Alert.alert('Invalid Address', getErrorMessage(validateResponse.message));
        return;
      }
      
      // Step 2: Save the address
      const saveResponse = await saveCryptoAddress({
        nickName: nickname.trim(),
        cryptoId: selectedCrypto.code,
        blockchain: getBlockchainName(),
        address: walletAddress.trim()
      });
      
      // Step 3: Success - go back and reload
      Alert.alert('Success', 'Address added successfully!', [
        {
          text: 'OK',
          onPress: () => {
            router.back();
          }
        }
      ]);
      
    } catch (error) {
      console.error('Add address error:', error);
      handleAPIError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const canSubmit = () => {
    return (
      selectedCrypto &&
      nickname.trim() &&
      walletAddress.trim() &&
      ((selectedCrypto.code === 'USDT' || selectedCrypto.code === 'USDC') ? selectedBlockchain : true) &&
      !isSubmitting
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={styles.headerTitle.color} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ADD NEW ADDRESS</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* SELECT CRYPTO Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SELECT CRYPTO</Text>
          
          <View style={styles.cryptoSelectorContainer}>
            <CurrencySelector
              selectedCurrency={selectedCrypto}
              onCurrencySelect={handleCryptoChange}
              filterType="crypto"
              style={styles.cryptoSelector}
            />
          </View>
        </View>

        {/* BLOCKCHAIN Section - Only show for USDT/USDC */}
        {(selectedCrypto.code === 'USDT' || selectedCrypto.code === 'USDC') && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>BLOCKCHAIN</Text>
            
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowBlockchainSelector(!showBlockchainSelector)}
            >
              <Text style={styles.dropdownText}>
                {selectedBlockchain ? selectedBlockchain.displayName : 'Select Blockchain'}
              </Text>
              <Ionicons 
                name={showBlockchainSelector ? "chevron-up" : "chevron-down"} 
                size={16} 
                color="#8E8E93" 
              />
            </TouchableOpacity>
            
            {showBlockchainSelector && (
              <View style={styles.dropdownOptions}>
                {availableBlockchains.map((blockchain) => (
                  <TouchableOpacity
                    key={blockchain.id}
                    style={styles.dropdownOption}
                    onPress={() => handleBlockchainChange(blockchain)}
                  >
                    <Text style={styles.dropdownOptionText}>{blockchain.displayName}</Text>
                    {selectedBlockchain?.id === blockchain.id && (
                      <Ionicons name="checkmark" size={16} color="#00D4AA" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* NICKNAME Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NICKNAME</Text>
          
          <TextInput
            style={styles.textInput}
            value={nickname}
            onChangeText={setNickname}
            placeholder="ENTER ADDRESS NAME"
            placeholderTextColor="#666666"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* WALLET ADDRESS Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WALLET ADDRESS</Text>
          
          <TextInput
            style={styles.textInput}
            value={walletAddress}
            onChangeText={setWalletAddress}
            placeholder="ENTER WALLET ADDRESS"
            placeholderTextColor="#666666"
            autoCapitalize="none"
            autoCorrect={false}
            multiline={true}
            numberOfLines={3}
          />
        </View>

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.submitButton,
              !canSubmit() && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit()}
          >
            {isSubmitting ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#000000" />
                <Text style={[styles.submitButtonText, { marginLeft: 8 }]}>ADDING...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>ADD NEW ADDRESS</Text>
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
  cryptoSelectorContainer: {
    flex: 1,
  },
  cryptoSelector: {
    backgroundColor: 'transparent',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    minHeight: 56,
  },
  dropdownText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  dropdownOptions: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginTop: 8,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSecondary,
  },
  dropdownOptionText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text,
    minHeight: 56,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
