import React, { useState } from 'react';
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
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatementType, FiatCurrency, CryptoCurrency, MonthYear, Currency } from '../types/statement';
import { FX_CURRENCIES } from '../types/fx';
import { generateClientStatement } from '../services/statementService';
import { TokenExpiredError } from '../utils/apiClient';
import { useStyles } from '../hooks/useTheme';
import { Theme } from '../types/theme';

interface CreateStatementScreenProps {
  onBack?: () => void;
  onLogout?: () => void;
  onSuccess?: () => void;
  initialType?: StatementType;
}

export default function CreateStatementScreen({
  onBack,
  onLogout,
  onSuccess,
  initialType = 'fiat'
}: CreateStatementScreenProps) {
  const styles = useStyles((theme: Theme) => createStyles(theme));
  const [selectedType, setSelectedType] = useState<StatementType>(initialType);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [selectedMonthYear, setSelectedMonthYear] = useState<MonthYear | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState<boolean>(false);
  const [showMonthYearDropdown, setShowMonthYearDropdown] = useState<boolean>(false);

  // Currency data from FX_CURRENCIES and supported crypto list
  const fiatCurrencies: FiatCurrency[] = FX_CURRENCIES.map(currency => ({
    code: currency.code,
    name: currency.name,
    symbol: currency.symbol,
    type: 'fiat' as const,
  }));

  const cryptoCurrencies: CryptoCurrency[] = [
    { code: 'BTC', name: 'Bitcoin', symbol: '₿', type: 'crypto' },
    { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', type: 'crypto' },
    { code: 'USDT', name: 'Tether', symbol: '₮', type: 'crypto' },
    { code: 'USDC', name: 'USD Coin', symbol: 'USDC', type: 'crypto' },
    { code: 'LTC', name: 'Litecoin', symbol: 'Ł', type: 'crypto' },
    { code: 'TRX', name: 'TRON', symbol: 'TRX', type: 'crypto' },
  ];

  // Generate month/year options for the last 24 months
  const generateMonthYearOptions = (): MonthYear[] => {
    const options: MonthYear[] = [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
    const currentYear = currentDate.getFullYear();

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    for (let i = 0; i < 24; i++) {
      let month = currentMonth - i;
      let year = currentYear;
      
      if (month <= 0) {
        month += 12;
        year -= 1;
      }
      
      options.push({
        month,
        year,
        displayName: `${monthNames[month - 1]} ${year}`
      });
    }

    return options;
  };

  const monthYearOptions = generateMonthYearOptions();

  const getCurrentCurrencies = (): Currency[] => {
    return selectedType === 'fiat' ? fiatCurrencies : cryptoCurrencies;
  };

  const handleTypeChange = (type: StatementType) => {
    setSelectedType(type);
    setSelectedCurrency(''); // Reset currency selection when type changes
  };

  const handleCurrencySelect = (currency: string) => {
    setSelectedCurrency(currency);
    setShowCurrencyDropdown(false);
  };

  const handleMonthYearSelect = (monthYear: MonthYear) => {
    setSelectedMonthYear(monthYear);
    setShowMonthYearDropdown(false);
  };

  const handleGenerateStatement = async () => {
    if (!selectedCurrency) {
      Alert.alert('Error', 'Please select a currency');
      return;
    }

    if (!selectedMonthYear) {
      Alert.alert('Error', 'Please select a month and year');
      return;
    }

    setIsLoading(true);

    try {
      // Format the date as required by the API (YYYY-MM)
      const fromDate = `${selectedMonthYear.year}-${selectedMonthYear.month.toString().padStart(2, '0')}`;
      
      await generateClientStatement(fromDate, selectedCurrency, selectedType);
      
      Alert.alert(
        'Statement Generated',
        'Statement generated successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (onSuccess) {
                onSuccess();
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Failed to generate statement:', error);
      
      if (error instanceof TokenExpiredError) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [
            {
              text: 'OK',
              onPress: () => {
                if (onLogout) {
                  onLogout();
                }
              }
            }
          ]
        );
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate statement. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = selectedCurrency && selectedMonthYear;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={styles.headerTitle.color} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>CREATE STATEMENT</Text>
        
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statement Type</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeOption, selectedType === 'fiat' && styles.typeOptionActive]}
              onPress={() => handleTypeChange('fiat')}
            >
              <Text style={[styles.typeOptionText, selectedType === 'fiat' && styles.typeOptionTextActive]}>
                FIAT
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeOption, selectedType === 'crypto' && styles.typeOptionActive]}
              onPress={() => handleTypeChange('crypto')}
            >
              <Text style={[styles.typeOptionText, selectedType === 'crypto' && styles.typeOptionTextActive]}>
                CRYPTO
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Currency Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Currency</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowCurrencyDropdown(true)}
          >
            <Text style={[styles.dropdownText, !selectedCurrency && styles.placeholderText]}>
              {selectedCurrency || 'Select Currency'}
            </Text>
            <Ionicons 
              name="chevron-down" 
              size={20} 
              color={styles.dropdownText.color} 
            />
          </TouchableOpacity>
        </View>

        {/* Month/Year Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Period</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowMonthYearDropdown(true)}
          >
            <Text style={[styles.dropdownText, !selectedMonthYear && styles.placeholderText]}>
              {selectedMonthYear ? selectedMonthYear.displayName : 'Select Month & Year'}
            </Text>
            <Ionicons 
              name="chevron-down" 
              size={20} 
              color={styles.dropdownText.color} 
            />
          </TouchableOpacity>
        </View>

        {/* Generate Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.generateButton, !isFormValid && styles.generateButtonDisabled]}
            onPress={handleGenerateStatement}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="document-text" size={20} color="#FFFFFF" />
                <Text style={styles.generateButtonText}>Generate Statement</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            Statements are generated for complete months only. Processing may take a few minutes.
          </Text>
        </View>
      </ScrollView>

      {/* Currency Selection Modal */}
      <Modal
        visible={showCurrencyDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCurrencyDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCurrencyDropdown(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity
                onPress={() => setShowCurrencyDropdown(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={styles.modalTitle.color} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={getCurrentCurrencies()}
              keyExtractor={(item) => item.code}
              style={styles.modalList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => handleCurrencySelect(item.code)}
                >
                  <View style={styles.modalOptionContent}>
                    <Text style={styles.modalOptionTitle}>{item.code}</Text>
                    <Text style={styles.modalOptionSubtitle}>{item.name}</Text>
                  </View>
                  {selectedCurrency === item.code && (
                    <Ionicons name="checkmark" size={20} color={styles.modalOptionTitle.color} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Month/Year Selection Modal */}
      <Modal
        visible={showMonthYearDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMonthYearDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMonthYearDropdown(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Period</Text>
              <TouchableOpacity
                onPress={() => setShowMonthYearDropdown(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={styles.modalTitle.color} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={monthYearOptions}
              keyExtractor={(item) => `${item.month}-${item.year}`}
              style={styles.modalList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => handleMonthYearSelect(item)}
                >
                  <Text style={styles.modalOptionTitle}>{item.displayName}</Text>
                  {selectedMonthYear && 
                   selectedMonthYear.month === item.month && 
                   selectedMonthYear.year === item.year && (
                    <Ionicons name="checkmark" size={20} color={styles.modalOptionTitle.color} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 2,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  typeOptionActive: {
    backgroundColor: theme.colors.accent,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  typeOptionTextActive: {
    color: '#FFFFFF',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  placeholderText: {
    color: theme.colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    maxHeight: '70%',
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    maxHeight: 300,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalOptionContent: {
    flex: 1,
  },
  modalOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 2,
  },
  modalOptionSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  buttonContainer: {
    marginTop: 32,
    marginBottom: 16,
  },
  generateButton: {
    backgroundColor: theme.colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  generateButtonDisabled: {
    backgroundColor: theme.colors.surfaceSecondary,
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  helpContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.accent,
  },
  helpText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});