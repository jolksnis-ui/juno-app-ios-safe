import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Currency, SUPPORTED_CURRENCIES } from '../types/exchange';
import { useStyles } from '../hooks/useTheme';
import { Theme } from '../types/theme';

interface CurrencySelectorProps {
  selectedCurrency: Currency;
  onCurrencySelect: (currency: Currency) => void;
  filterType?: 'fiat' | 'crypto' | 'all';
  style?: any;
  showNetwork?: boolean;
  networkText?: string;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  selectedCurrency,
  onCurrencySelect,
  filterType = 'all',
  style,
  showNetwork = false,
  networkText = ''
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const styles = useStyles((theme: Theme) => createStyles(theme));

  // Crypto colors matching dashboard
  const cryptoColors: { [key: string]: string } = {
    'BTC': '#F7931A',
    'ETH': '#627EEA',
    'LTC': '#BFBBBB',
    'XRP': '#23292F',
    'TRX': '#FF060A',
    'USDT': '#26A17B',
    'USDC': '#2775CA',
  };

  const getFilteredCurrencies = () => {
    const currencies = Object.values(SUPPORTED_CURRENCIES);
    if (filterType === 'all') return currencies;
    return currencies.filter(currency => currency.type === filterType);
  };

  const getCryptoIconStyle = (currency: Currency) => {
    if (currency.type === 'crypto') {
      return {
        backgroundColor: cryptoColors[currency.code] || '#8E8E93',
        color: '#FFFFFF'
      };
    }
    return {};
  };

  const renderCurrencyItem = ({ item }: { item: Currency }) => (
    <TouchableOpacity
      style={styles.currencyItem}
      onPress={() => {
        onCurrencySelect(item);
        setIsModalVisible(false);
      }}
    >
      <View style={styles.currencyInfo}>
        {item.type === 'crypto' ? (
          <View style={[styles.iconContainer, getCryptoIconStyle(item)]}>
            <Text style={[styles.cryptoIcon, { color: '#FFFFFF' }]}>{item.icon}</Text>
          </View>
        ) : (
          <Text style={styles.fiatIcon}>{item.icon}</Text>
        )}
        <View style={styles.currencyDetails}>
          <Text style={styles.currencyCode}>{item.code}</Text>
          <Text style={styles.currencyName}>{item.name}</Text>
        </View>
      </View>
      {selectedCurrency.code === item.code && (
        <Ionicons name="checkmark" size={20} color="#00D4AA" />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity
        style={[styles.selector, style]}
        onPress={() => setIsModalVisible(true)}
      >
        <View style={styles.selectedCurrency}>
          <View style={[styles.iconContainer, getCryptoIconStyle(selectedCurrency)]}>
            <Text style={[styles.cryptoIcon, { color: '#FFFFFF' }]}>{selectedCurrency.icon}</Text>
          </View>
          <View style={styles.selectedCurrencyDetails}>
            <Text style={styles.selectedCode}>
              {selectedCurrency.code}
              {showNetwork && networkText && ` (${networkText})`}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-down" size={16} color="#8E8E93" />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Currency</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={styles.modalTitle.color} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={getFilteredCurrencies()}
            renderItem={renderCurrencyItem}
            keyExtractor={(item) => item.code}
            style={styles.currencyList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
    </>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  selectedCurrency: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCurrencyDetails: {
    flex: 1,
    marginLeft: 8,
  },
  selectedIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  selectedCode: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
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
  closeButton: {
    padding: 4,
  },
  currencyList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cryptoIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  fiatIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  currencyIcon: {
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
});
