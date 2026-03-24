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
  FlatList,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStyles } from '../../src/hooks/useTheme';
import { Theme } from '../../src/types/theme';
import { TokenExpiredError } from '../../src/services/balanceService';
import { IBANAccount, DepositCurrency } from '../../src/types/deposit';
import { DepositService } from '../../src/services/depositService';
import { useToast } from '../../src/contexts/ToastContext';

// Currency mapping for common currencies
const CURRENCY_MAPPING: { [key: string]: { name: string; symbol: string; flag: string } } = {
  'USD': { name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  'EUR': { name: 'Euro', symbol: '€', flag: '🇪🇺' },
  'GBP': { name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  'CAD': { name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  'AUD': { name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  'CHF': { name: 'Swiss Franc', symbol: '₣', flag: '🇨🇭' },
  'JPY': { name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  'CNY': { name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  'AED': { name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  'TRY': { name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
  'HKD': { name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
  'SGD': { name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
};

export default function DepositFiatScreen() {
  const styles = useStyles((theme: Theme) => createStyles(theme));
  const { showError } = useToast();
  
  // State
  const [selectedCurrency, setSelectedCurrency] = useState<DepositCurrency | null>(null);
  const [availableCurrencies, setAvailableCurrencies] = useState<DepositCurrency[]>([]);
  const [ibanAccounts, setIbanAccounts] = useState<IBANAccount[]>([]);
  const [isLoadingIban, setIsLoadingIban] = useState(true);
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);

  useEffect(() => {
    loadIBANAccountDetails();
  }, []);

  // Extract unique currencies from IBAN accounts and create currency objects
  const extractAvailableCurrencies = (accounts: IBANAccount[]): DepositCurrency[] => {
    const uniqueCurrencies = [...new Set(accounts.map(account => account.currency))];
    
    return uniqueCurrencies.map(currencyCode => {
      const mapping = CURRENCY_MAPPING[currencyCode];
      return {
        code: currencyCode,
        name: mapping?.name || `${currencyCode} Currency`,
        symbol: mapping?.symbol || currencyCode,
        flag: mapping?.flag || '🏳️',
      };
    });
  };

  const loadIBANAccountDetails = async () => {
    setIsLoadingIban(true);
    try {
      const response = await DepositService.getIBANAccountDetails();
      setIbanAccounts(response);
      
      // Extract available currencies from the response
      const currencies = extractAvailableCurrencies(response);
      setAvailableCurrencies(currencies);
      
      // Set the first available currency as default
      if (currencies.length > 0 && !selectedCurrency) {
        setSelectedCurrency(currencies[0]);
      }
    } catch (error) {
      console.error('Error loading IBAN account details:', error);
      if (error instanceof TokenExpiredError) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [{ text: 'OK', onPress: () => router.replace('/(public)/login') }]
        );
      } else {
        showError('Failed to load deposit account details. Please try again.', 'Network Error');
      }
    } finally {
      setIsLoadingIban(false);
    }
  };

  const handleCurrencyChange = (currency: DepositCurrency) => {
    setSelectedCurrency(currency);
    setShowCurrencySelector(false);
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  const handleClose = () => {
    router.back();
  };

  const getFilteredIbanAccounts = () => {
    if (!selectedCurrency) return [];
    return ibanAccounts.filter(account => 
      account.currency === selectedCurrency.code
    );
  };

  // Don't render anything if still loading or no currency selected
  if (isLoadingIban || !selectedCurrency) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>DEPOSIT</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={styles.headerTitle.color} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00D4AA" />
          <Text style={styles.loadingText}>Loading account details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DEPOSIT</Text>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={24} color={styles.headerTitle.color} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Currency Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DEPOSIT CURRENCY</Text>
          <TouchableOpacity
            style={styles.currencySelector}
            onPress={() => setShowCurrencySelector(true)}
          >
            <View style={styles.currencyInfo}>
              <Text style={styles.currencyFlag}>{selectedCurrency.flag}</Text>
              <View style={styles.currencyDetails}>
                <Text style={styles.currencyCode}>{selectedCurrency.code}</Text>
                <Text style={styles.currencyName}>{selectedCurrency.name}</Text>
              </View>
            </View>
            <Ionicons name="chevron-down" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* IBAN Account Details */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>BANK ACCOUNT DETAILS</Text>
          
          {getFilteredIbanAccounts().length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="card-outline" size={48} color="#8E8E93" />
              <Text style={styles.emptyTitle}>No Account Available</Text>
              <Text style={styles.emptySubtitle}>
                No deposit account is available for {selectedCurrency.name}. Please try a different currency or contact support.
              </Text>
            </View>
          ) : (
            getFilteredIbanAccounts().map((account, index) => (
              <View key={index} style={styles.accountCard}>
                <View style={styles.accountHeader}>
                  <View style={styles.accountIcon}>
                    <Ionicons name="business" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>{account.name}</Text>
                    <Text style={styles.bankName}>{account.countryName}</Text>
                  </View>
                </View>

                <View style={styles.accountDetails}>
                  {/* Account Number */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>ACCOUNT NUMBER</Text>
                    <TouchableOpacity
                      style={styles.detailValueContainer}
                      onPress={() => handleCopyToClipboard(account.account_number, 'Account number')}
                    >
                      <Text style={styles.detailValue}>{account.account_number}</Text>
                      <Ionicons name="copy-outline" size={16} color="#00D4AA" />
                    </TouchableOpacity>
                  </View>

                  {/* Sort Code */}
                  {account.sort_code && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>SORT CODE</Text>
                      <TouchableOpacity
                        style={styles.detailValueContainer}
                        onPress={() => handleCopyToClipboard(account.sort_code!, 'Sort code')}
                      >
                        <Text style={styles.detailValue}>{account.sort_code}</Text>
                        <Ionicons name="copy-outline" size={16} color="#00D4AA" />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* IBAN */}
                  {account.iban_number && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>IBAN</Text>
                      <TouchableOpacity
                        style={styles.detailValueContainer}
                        onPress={() => handleCopyToClipboard(account.iban_number!, 'IBAN')}
                      >
                        <Text style={styles.detailValue}>{account.iban_number}</Text>
                        <Ionicons name="copy-outline" size={16} color="#00D4AA" />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Swift Code */}
                  {account.bic_number && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>SWIFT CODE</Text>
                      <TouchableOpacity
                        style={styles.detailValueContainer}
                        onPress={() => handleCopyToClipboard(account.bic_number!, 'Swift code')}
                      >
                        <Text style={styles.detailValue}>{account.bic_number}</Text>
                        <Ionicons name="copy-outline" size={16} color="#00D4AA" />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Bank Address */}
                  {(account.addressLine1 || account.city) && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>BANK ADDRESS</Text>
                      <TouchableOpacity
                        style={styles.detailValueContainer}
                        onPress={() => {
                          const address = [account.addressLine1, account.addressLine2, account.city, account.postcode].filter(Boolean).join(', ');
                          handleCopyToClipboard(address, 'Bank address');
                        }}
                      >
                        <Text style={[styles.detailValue, styles.addressValue]}>
                          {[account.addressLine1, account.addressLine2, account.city, account.postcode].filter(Boolean).join(', ')}
                        </Text>
                        <Ionicons name="copy-outline" size={16} color="#00D4AA" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DEPOSIT INSTRUCTIONS</Text>
          <View style={styles.instructionsCard}>
            <View style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>1</Text>
              </View>
              <Text style={styles.instructionText}>
                Use the bank account details above to transfer funds from your bank account.
              </Text>
            </View>
            
            <View style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>2</Text>
              </View>
              <Text style={styles.instructionText}>
                Include your account reference or name in the transfer description.
              </Text>
            </View>
            
            <View style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>3</Text>
              </View>
              <Text style={styles.instructionText}>
                Funds will be credited to your Juno account within 1-3 business days.
              </Text>
            </View>
          </View>
        </View>

        {/* Important Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>IMPORTANT NOTES</Text>
          <View style={styles.notesCard}>
            <View style={styles.noteItem}>
              <Ionicons name="information-circle" size={16} color="#FF9500" />
              <Text style={styles.noteText}>
                Only send {selectedCurrency.code} to this account. Other currencies will not be credited.
              </Text>
            </View>
            
            <View style={styles.noteItem}>
              <Ionicons name="time" size={16} color="#FF9500" />
              <Text style={styles.noteText}>
                Processing times may vary depending on your bank and transfer method.
              </Text>
            </View>
            
            <View style={styles.noteItem}>
              <Ionicons name="shield-checkmark" size={16} color="#FF9500" />
              <Text style={styles.noteText}>
                Ensure all details are correct before initiating the transfer.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Currency Selector Modal */}
      <Modal
        visible={showCurrencySelector}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCurrencySelector(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Currency</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCurrencySelector(false)}
            >
              <Ionicons name="close" size={24} color={styles.modalTitle.color} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={availableCurrencies}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => handleCurrencyChange(item)}
              >
                <View style={styles.modalItemInfo}>
                  <Text style={styles.modalItemFlag}>{item.flag}</Text>
                  <View style={styles.modalItemDetails}>
                    <Text style={styles.modalItemCode}>{item.code} - {item.name}</Text>
                    <Text style={styles.modalItemSymbol}>{item.symbol}</Text>
                  </View>
                </View>
                {selectedCurrency?.code === item.code && (
                  <Ionicons name="checkmark" size={20} color="#00D4AA" />
                )}
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.code}
            style={styles.modalList}
            showsVerticalScrollIndicator={false}
          />
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
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  currencyDetails: {
    flex: 1,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  currencyName: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  accountCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00D4AA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  bankName: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  accountDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
    flex: 1,
  },
  detailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginRight: 8,
    textAlign: 'right',
  },
  addressValue: {
    fontSize: 12,
    lineHeight: 16,
  },
  instructionsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00D4AA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  instructionNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  instructionText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
    flex: 1,
  },
  notesCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  noteText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
    flex: 1,
    marginLeft: 8,
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
  modalList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalItemFlag: {
    fontSize: 24,
    marginRight: 12,
    minWidth: 32,
  },
  modalItemDetails: {
    flex: 1,
  },
  modalItemCode: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  modalItemSymbol: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});
