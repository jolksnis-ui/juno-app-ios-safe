import React, { useState, useEffect, useCallback } from 'react';
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
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { CurrencySelector } from '../../src/components/CurrencySelector';
import { Currency, SUPPORTED_CURRENCIES } from '../../src/types/exchange';
import { useStyles } from '../../src/hooks/useTheme';
import { Theme } from '../../src/types/theme';
import { SavedCryptoAddress, SEND_CRYPTO_TO_BLOCKCHAIN } from '../../src/types/cryptoSend';
import { getCryptoFee, getSavedCryptoAddresses, TokenExpiredError } from '../../src/services/cryptoSendService';
import { getCryptoBalances } from '../../src/services/balanceService';
import { getWalletAddress } from '../../src/services/walletService';
import { authenticateForCryptoTransaction } from '../../src/services/biometricService';
import { useToast } from '../../src/contexts/ToastContext';

interface Blockchain {
  id: string;
  name: string;
  network: string;
  displayName: string;
}


export default function SendCryptoScreen() {
  // State management
  const [selectedCrypto, setSelectedCrypto] = useState<Currency>(SUPPORTED_CURRENCIES.ETH);
  const [selectedBlockchain, setSelectedBlockchain] = useState<Blockchain | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<SavedCryptoAddress | null>(null);
  const [amount, setAmount] = useState('');
  const [savedAddresses, setSavedAddresses] = useState<SavedCryptoAddress[]>([]);
  const [availableBlockchains, setAvailableBlockchains] = useState<Blockchain[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [showBlockchainSelector, setShowBlockchainSelector] = useState(false);
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [showAddNewAddress, setShowAddNewAddress] = useState(false);
  
  // New state for real API data
  const [cryptoBalance, setCryptoBalance] = useState<number>(0);
  const [transactionFee, setTransactionFee] = useState<number>(0);
  const [senderWallet, setSenderWallet] = useState<string>('');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isLoadingFee, setIsLoadingFee] = useState(false);
  
  // Balance validation state
  const [balanceError, setBalanceError] = useState<string>('');
  
  // Theme hooks
  const styles = useStyles((theme: Theme) => createStyles(theme));
  const { showError } = useToast();

  // Mock data for demonstration - using real API structure
  const mockAddresses: Record<string, SavedCryptoAddress[]> = {
    'ETH-ethereum': [
      {
        _id: '689045941e5b0f6076369636',
        clientId: 'client9201566370',
        cryptoId: 'ETH',
        address: '0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4',
        nickName: 'ETHEREUM MAIN',
        blockchain: 'Ethereum',
        createdDate: '2025-08-04T05:31:00.435Z',
        updatedDate: '2025-08-04T05:31:00.435Z'
      },
      {
        _id: '689045b21e5b0f6076369717',
        clientId: 'client9201566370',
        cryptoId: 'ETH',
        address: '0x123456789abcdef123456789abcdef123456789a',
        nickName: 'ETHEREUM WALLET 2',
        blockchain: 'Ethereum',
        createdDate: '2025-08-04T05:31:30.080Z',
        updatedDate: '2025-08-04T05:31:30.080Z'
      }
    ],
    'USDT-ethereum': [
      {
        _id: '689045c31e5b0f6076369718',
        clientId: 'client9201566370',
        cryptoId: 'USDT',
        address: 'bc1mV2zCh9LQuNz3cxZ',
        nickName: 'TETHER MAIN',
        blockchain: 'Ethereum',
        createdDate: '2025-08-04T05:32:00.435Z',
        updatedDate: '2025-08-04T05:32:00.435Z'
      }
    ],
    'USDT-tron': [
      {
        _id: '689045d41e5b0f6076369719',
        clientId: 'client9201566370',
        cryptoId: 'USDT',
        address: 'TRX1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        nickName: 'TRON WALLET',
        blockchain: 'Tron',
        createdDate: '2025-08-04T05:33:00.435Z',
        updatedDate: '2025-08-04T05:33:00.435Z'
      }
    ]
  };

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
      displayName: 'TRON - 20'
    }
  ];

  // Load all crypto data when crypto changes
  useEffect(() => {
    loadCryptoData();
  }, [selectedCrypto]);

  // Load addresses when blockchain changes (for USDT)
  useEffect(() => {
    if (selectedCrypto.code === 'USDT') {
      loadSavedAddresses();
    }
  }, [selectedBlockchain]);

  // Set blockchain options when crypto changes
  useEffect(() => {
    if (selectedCrypto.code === 'USDT') {
      setAvailableBlockchains(blockchainOptions);
      if (!selectedBlockchain) {
        setSelectedBlockchain(blockchainOptions[0]); // Default to Ethereum
      }
    } else {
      setAvailableBlockchains([]);
      setSelectedBlockchain(null);
    }
  }, [selectedCrypto]);

  // Reload addresses when screen comes back into focus (after adding new address)
  useFocusEffect(
    useCallback(() => {
      // Reload addresses when screen comes back into focus
      loadSavedAddresses();
    }, [selectedCrypto, selectedBlockchain])
  );

  // Add error handling function
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
    } else if (error.message?.includes('Insufficient balance')) {
      Alert.alert('Insufficient Balance', 'You don\'t have enough balance for this transaction.');
    } else {
      showError('Failed to load data. Please try again.', 'Network Error');
    }
  };

  // Load all crypto-related data
  const loadCryptoData = async () => {
    setIsLoadingBalance(true);
    setIsLoadingFee(true);
    
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
      
      // Get sender wallet
      const blockchain = SEND_CRYPTO_TO_BLOCKCHAIN[selectedCrypto.code];
      if (blockchain) {
        const walletResponse = await getWalletAddress([blockchain]);
        if (walletResponse.data.length > 0) {
          setSenderWallet(walletResponse.data[0].address.key);
        }
      }
      
      // Load saved addresses
      await loadSavedAddresses();
      
    } catch (error) {
      console.error('Error loading crypto data:', error);
      handleAPIError(error);
    } finally {
      setIsLoadingBalance(false);
      setIsLoadingFee(false);
    }
  };

  const loadSavedAddresses = async () => {
    setIsLoadingAddresses(true);
    
    try {
      // Get all saved addresses from API
      const addressesResponse = await getSavedCryptoAddresses();
      
      // Filter addresses for the selected crypto
      const filteredAddresses = addressesResponse.filter(
        addr => addr.cryptoId === selectedCrypto.code
      );
      
      setSavedAddresses(filteredAddresses);
      
      // Auto-select first address if available
      if (filteredAddresses.length > 0 && !selectedAddress) {
        setSelectedAddress(filteredAddresses[0]);
      } else if (filteredAddresses.length === 0) {
        setSelectedAddress(null);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      handleAPIError(error);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const handleCryptoChange = (crypto: Currency) => {
    setSelectedCrypto(crypto);
    setSelectedAddress(null);
    setAmount('');
    setBalanceError('');
  };

  const handleBlockchainChange = (blockchain: Blockchain) => {
    setSelectedBlockchain(blockchain);
    setSelectedAddress(null);
    setShowBlockchainSelector(false);
  };

  const handleAddressChange = (address: SavedCryptoAddress) => {
    setSelectedAddress(address);
    setShowAddressSelector(false);
  };

  const handleAddNewAddress = () => {
    setShowAddNewAddress(true);
    setShowAddressSelector(false);
    
    // Navigate to add address screen with current selections
    router.push({
      pathname: '/(auth)/add-crypto-address',
      params: {
        selectedCrypto: JSON.stringify(selectedCrypto),
        selectedBlockchain: selectedBlockchain ? JSON.stringify(selectedBlockchain) : null
      }
    });
  };

  // Balance validation function
  const validateAmountBalance = (amount: string): boolean => {
    if (!amount || amount === '0') {
      setBalanceError('');
      return true;
    }
    
    const numAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
      setBalanceError('');
      return true;
    }
    
    // Check if amount + fee exceeds available balance
    const totalRequired = numAmount + transactionFee;
    if (totalRequired > cryptoBalance) {
      if (transactionFee > 0) {
        setBalanceError(`Amount + fee (${totalRequired.toFixed(8)} ${selectedCrypto.code}) exceeds available balance`);
      } else {
        setBalanceError('Amount entered exceeds available balance');
      }
      return false;
    }
    
    setBalanceError('');
    return true;
  };

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      return;
    }
    
    setAmount(cleanValue);
    
    // Validate amount against balance
    validateAmountBalance(cleanValue);
  };

  const handleContinue = async () => {
    // Validation
    if (!selectedCrypto) {
      Alert.alert('Error', 'Please select a cryptocurrency');
      return;
    }
    
    if (selectedCrypto.code === 'USDT' && !selectedBlockchain) {
      Alert.alert('Error', 'Please select a blockchain');
      return;
    }
    
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select a destination address');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    // Authenticate user before proceeding
    try {
      const authResult = await authenticateForCryptoTransaction();
      if (!authResult.success) {
        showError(authResult.error || 'Authentication is required to continue', 'Authentication Failed');
        return;
      }
    } catch (error) {
      console.error('Authentication error:', error);
      showError('Failed to authenticate. Please try again.', 'Authentication Error');
      return;
    }
    
    // Prepare transaction data for confirmation screen
    const transactionData = {
      selectedCrypto,
      selectedBlockchain,
      selectedAddress,
      amount,
      senderWallet,
      userEmail: 'user@example.com', // This would come from user context
      clientId: 'client123', // This would come from user context
      accountNumber: 'ACC123' // This would come from user context
    };
    
    // Navigate to confirmation screen
    router.push({
      pathname: '/(auth)/send-crypto-confirm',
      params: {
        transactionData: JSON.stringify(transactionData)
      }
    });
  };

  const handleClose = () => {
    router.back();
  };

  const getBalance = () => {
    // Use real balance data
    const exchangeRates: Record<string, number> = {
      ETH: 250000, // 1 ETH = ₹2,50,000
      USDT: 83,    // 1 USDT = ₹83
      BTC: 8500000 // 1 BTC = ₹85,00,000
    };
    
    const rate = exchangeRates[selectedCrypto.code] || 0;
    const fiatValue = cryptoBalance * rate;
    
    return {
      crypto: cryptoBalance,
      fiat: `₹${fiatValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    };
  };

  // Validate amount against available balance
  const validateAmount = () => {
    if (!amount) return true;
    
    const enteredAmount = parseFloat(amount);
    const totalRequired = enteredAmount + transactionFee;
    
    return totalRequired <= cryptoBalance;
  };

  // Check if continue button should be enabled
  const canContinue = () => {
    return (
      selectedCrypto &&
      selectedAddress &&
      amount &&
      parseFloat(amount) > 0 &&
      validateAmount() &&
      !isLoadingBalance &&
      !isLoadingFee
    );
  };

  const formatAddress = (address: string) => {
    if (address.length > 20) {
      return `${address.substring(0, 10)}...${address.substring(address.length - 6)}`;
    }
    return address;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SEND CRYPTO</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={styles.headerTitle.color} />
          </TouchableOpacity>
        </View>

        {/* FROM Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>FROM</Text>
          
          <View style={styles.fromContainer}>
            <View style={styles.cryptoSelectorContainer}>
              <CurrencySelector
                selectedCurrency={selectedCrypto}
                onCurrencySelect={handleCryptoChange}
                filterType="crypto"
                style={styles.cryptoSelector}
              />
            </View>
            
            <View style={styles.amountContainer}>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0.00"
                placeholderTextColor="#666666"
                keyboardType="numeric"
              />
            </View>
          </View>
          
          <View style={styles.balanceRow}>
            <Text style={styles.cryptoName}>{selectedCrypto.name.toUpperCase()}</Text>
            <Text style={styles.balanceText}>
              {cryptoBalance.toFixed(8)} {selectedCrypto.code}
            </Text>
          </View>
          
          {/* Balance Error Message */}
          {balanceError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{balanceError}</Text>
            </View>
          ) : null}
        </View>

        {/* BLOCKCHAIN Section - Only show for USDT */}
        {selectedCrypto.code === 'USDT' && (
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

        {/* TO Section */}
        <View style={styles.section}>
          <View style={styles.toHeader}>
            <Text style={styles.sectionLabel}>TO</Text>
            <TouchableOpacity onPress={handleAddNewAddress}>
              <Text style={styles.addNewAddressText}>ADD NEW ADDRESS</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowAddressSelector(!showAddressSelector)}
          >
            {isLoadingAddresses ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#666666" />
                <Text style={styles.loadingText}>Loading addresses...</Text>
              </View>
            ) : selectedAddress ? (
              <View style={styles.addressContainer}>
                <Text style={styles.addressLabel}>{selectedAddress.nickName}:</Text>
                <Text style={styles.addressText}>{formatAddress(selectedAddress.address)}</Text>
              </View>
            ) : (
              <Text style={styles.dropdownText}>Select Address</Text>
            )}
            <Ionicons 
              name={showAddressSelector ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#8E8E93" 
            />
          </TouchableOpacity>
          
          {showAddressSelector && !isLoadingAddresses && (
            <View style={styles.dropdownOptions}>
              {savedAddresses.map((address) => (
                <TouchableOpacity
                  key={address._id}
                  style={styles.dropdownOption}
                  onPress={() => handleAddressChange(address)}
                >
                  <View style={styles.addressOptionContainer}>
                    <Text style={styles.addressOptionLabel}>{address.nickName}</Text>
                    <Text style={styles.addressOptionText}>{formatAddress(address.address)}</Text>
                  </View>
                  {selectedAddress?._id === address._id && (
                    <Ionicons name="checkmark" size={16} color="#00D4AA" />
                  )}
                </TouchableOpacity>
              ))}
              
              {savedAddresses.length === 0 && (
                <View style={styles.emptyAddresses}>
                  <Text style={styles.emptyAddressesText}>No saved addresses</Text>
                  <TouchableOpacity onPress={handleAddNewAddress}>
                    <Text style={styles.addFirstAddressText}>Add your first address</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          {/* Show fee information if available */}
          {/* {transactionFee > 0 && amount && (
            <View style={styles.feeContainer}>
              <Text style={styles.feeLabel}>Transaction Fee: {transactionFee} {selectedCrypto.code}</Text>
              <Text style={styles.totalLabel}>
                Total: {(parseFloat(amount || '0') + transactionFee).toFixed(8)} {selectedCrypto.code}
              </Text>
              {!validateAmount() && (
                <Text style={styles.errorText}>Insufficient balance for transaction + fee</Text>
              )}
            </View>
          )} */}
          
          <TouchableOpacity 
            style={[
              styles.continueButton,
              !canContinue() && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={!canContinue()}
          >
            {isLoadingBalance || isLoadingFee ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#000000" />
                <Text style={[styles.continueButtonText, { marginLeft: 8 }]}>LOADING...</Text>
              </View>
            ) : (
              <Text style={styles.continueButtonText}>CONTINUE</Text>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  closeButton: {
    padding: 4,
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
  fromContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cryptoSelectorContainer: {
    flex: 1,
  },
  cryptoSelector: {
    backgroundColor: 'transparent',
  },
  amountContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  amountInput: {
    fontSize: 32,
    fontWeight: '300',
    color: theme.colors.text,
    textAlign: 'right',
    minWidth: 100,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cryptoName: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  balanceText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  toHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addNewAddressText: {
    fontSize: 12,
    color: theme.colors.accent,
    fontWeight: '600',
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
  addressContainer: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontFamily: 'monospace',
  },
  addressOptionContainer: {
    flex: 1,
  },
  addressOptionLabel: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  addressOptionText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontFamily: 'monospace',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  emptyAddresses: {
    padding: 16,
    alignItems: 'center',
  },
  emptyAddressesText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  addFirstAddressText: {
    fontSize: 14,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  feeContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  feeLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: 8,
  },
  continueButton: {
    backgroundColor: theme.colors.buttonPrimary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.buttonText,

    fontFamily: 'StagnanMedium',

  },
  errorContainer: {
    marginTop: 8,
    paddingHorizontal: 0,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '500',
  },
});
