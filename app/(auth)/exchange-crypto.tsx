import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { CryptoTransactionForm } from '../../src/components/CryptoTransactionForm';
import { useStyles } from '../../src/hooks/useTheme';
import { Theme } from '../../src/types/theme';

export default function ExchangeCryptoScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const styles = useStyles((theme: Theme) => createStyles(theme));

  const handleContinue = (data: any) => {
    try {
      setIsLoading(true);
      
      // Navigate to confirmation screen with the transaction data
      router.push({
        pathname: '/(auth)/exchange-crypto-confirm',
        params: {
          transactionData: JSON.stringify(data)
        }
      });
    } catch (error) {
      console.error('Error navigating to confirmation:', error);
      Alert.alert('Error', 'Failed to proceed to confirmation. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
          transactionType="exchange"
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
