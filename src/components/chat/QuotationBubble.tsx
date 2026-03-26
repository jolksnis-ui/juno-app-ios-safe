import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { QuotationData } from '../../types/chat';
import { useStyles } from '../../hooks/useTheme';
import { Theme } from '../../types/theme';

interface QuotationBubbleProps {
  quotation: QuotationData;
  onConfirm: () => void;
  onCancel: () => void;
  onRefresh?: () => void;
  isAuthenticating?: boolean;
}

export function QuotationBubble({ 
  quotation, 
  onConfirm, 
  onCancel,
  onRefresh,
  isAuthenticating = false 
}: QuotationBubbleProps) {
  const styles = useStyles((theme: Theme) => createStyles(theme));
  const [timeRemaining, setTimeRemaining] = useState(25);

  useEffect(() => {
    // Calculate time remaining based on refresh count
    const baseTime = 25;
    const elapsed = quotation.refreshCount * 5;
    const remaining = Math.max(0, baseTime - elapsed);
    setTimeRemaining(remaining);

    // Update countdown every second
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [quotation.refreshCount]);

  const feeAmount = quotation.fiatAmount * (quotation.feePercent / 100);
  const fiatBeforeFee = quotation.fiatAmount - feeAmount;
  const isExpired = timeRemaining === 0 || quotation.status === 'expired';
  const isCancelled = quotation.status === 'cancelled';
  const isExecuted = quotation.status === 'executed';

  return (
    <LinearGradient
      colors={isExpired ? ['#2a2a2a', '#1f1f1f'] : ['#1a2f4b', '#0f1f35']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>💰 Buy {quotation.cryptoCurrency}</Text>
        {!isExpired && (
          <View style={styles.timerContainer}>
            <Text style={[
              styles.timer,
              timeRemaining <= 5 && styles.timerWarning
            ]}>
              ⏱ {timeRemaining}s
            </Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.label}>You Pay</Text>
        <Text style={styles.amount}>
          {quotation.fiatCurrency} {quotation.fiatAmount.toFixed(2)}
        </Text>
        <Text style={styles.feeText}>
          Fee ({quotation.feePercent}%): {quotation.fiatCurrency} {feeAmount.toFixed(2)}
        </Text>
      </View>

      <View style={styles.separator} />

      <View style={styles.section}>
        <Text style={styles.label}>You Get</Text>
        <Text style={styles.cryptoAmount}>
          {quotation.cryptoAmount.toFixed(8)} {quotation.cryptoCurrency}
        </Text>
      </View>

      <View style={styles.rateContainer}>
        <Text style={styles.rateText}>
          Rate: 1 {quotation.cryptoCurrency} = {quotation.fiatCurrency} {parseFloat(quotation.price).toLocaleString()}
        </Text>
      </View>

      {isExpired ? (
        <View style={styles.expiredContainer}>
          <Text style={styles.expiredText}>Quote Expired</Text>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={onRefresh || onCancel}
          >
            <Text style={styles.refreshButtonText}>Get New Quote</Text>
          </TouchableOpacity>
        </View>
      ) : isCancelled ? (
        <View style={styles.cancelledContainer}>
          <Text style={styles.cancelledText}>Transaction Cancelled</Text>
        </View>
      ) : isExecuted ? (
        <View style={styles.executedContainer}>
          <Text style={styles.executedText}>Transaction Completed</Text>
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.confirmButton, (isAuthenticating || isCancelled || isExecuted) && styles.buttonDisabled]}
            onPress={onConfirm}
            disabled={isAuthenticating || isCancelled || isExecuted}
            activeOpacity={0.8}
          >
            {isAuthenticating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirm</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton, (isAuthenticating || isCancelled || isExecuted) && styles.buttonDisabled]}
            onPress={onCancel}
            disabled={isAuthenticating || isCancelled || isExecuted}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  timerContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timer: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  timerWarning: {
    color: '#ff9500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  amount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  feeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 12,
    marginHorizontal: -8,
  },
  cryptoAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00D4AA',
    letterSpacing: 0.5,
  },
  rateContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 20,
  },
  rateText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    minHeight: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  confirmButton: {
    backgroundColor: '#00D4AA',
    shadowColor: '#00D4AA',
    shadowOpacity: 0.3,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,

    fontFamily: 'StagnanMedium',

  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cancelButtonText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,

    fontFamily: 'StagnanMedium',

  },
  buttonDisabled: {
    opacity: 0.6,
  },
  expiredContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  expiredText: {
    fontSize: 16,
    color: '#ff6b6b',
    marginBottom: 12,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',

    fontFamily: 'StagnanMedium',

  },
  cancelledContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(255,59,48,0.1)',
    borderRadius: 12,
  },
  cancelledText: {
    fontSize: 16,
    color: '#ff6b6b',
    fontWeight: '600',
  },
  executedContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(76,175,80,0.1)',
    borderRadius: 12,
  },
  executedText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
});