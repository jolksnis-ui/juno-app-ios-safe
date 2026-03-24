import React from 'react';
import { SafeAreaView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { CryptoTransactionForm } from '../../src/components/CryptoTransactionForm';
import { useStyles } from '../../src/hooks/useTheme';
import { Theme } from '../../src/types/theme';

export default function BuyCryptoScreen() {
  const styles = useStyles((theme: Theme) => createStyles(theme));
  
  const handleContinue = (data: any) => {
    // Navigate to confirmation screen with the data
    router.push({
      pathname: '/buy-crypto-confirm',
      params: {
        transactionType: data.transactionType,
        fromCurrency: JSON.stringify(data.fromCurrency),
        toCurrency: JSON.stringify(data.toCurrency),
        fromAmount: data.fromAmount,
        toAmount: data.toAmount,
        exchangeRate: data.exchangeRate.toString(),
        feePercent: data.feePercent.toString(),
        fromBalance: data.fromBalance.toString(),
        toBalance: data.toBalance.toString(),
        lastEditedField: data.lastEditedField,
        userEmail: data.userEmail,
        clientId: data.clientId,
        accountNumber: data.accountNumber,
        originalFromAmount: data.originalFromAmount,
        originalToAmount: data.originalToAmount,
      }
    });
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <CryptoTransactionForm 
          transactionType="buy"
          onContinue={handleContinue}
          onClose={handleClose}
        />
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
});
