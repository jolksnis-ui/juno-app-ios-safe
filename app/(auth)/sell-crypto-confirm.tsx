import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CryptoTransactionSummary } from '../../src/components/CryptoTransactionSummary';
import { requestForQuotation, getBlockchainForCrypto, QuotationResponse, BuySellQuotationRequest } from '../../src/services/quotationService';
import { createCryptoTransaction, CreateBuySellCryptoTransactionRequest, TokenExpiredError } from '../../src/services/transactionService';
import { useToast } from '../../src/contexts/ToastContext';
import { useStyles } from '../../src/hooks/useTheme';
import { Theme } from '../../src/types/theme';

export default function SellCryptoConfirmScreen() {
  const params = useLocalSearchParams();
  const styles = useStyles((theme: Theme) => createStyles(theme));
  const { showError } = useToast();
  
  // State for quotation management
  const [quotationData, setQuotationData] = useState<QuotationResponse | null>(null);
  const [quotationCallCount, setQuotationCallCount] = useState(0);
  const [isLoadingQuotation, setIsLoadingQuotation] = useState(false);
  const [isSubmittingTransaction, setIsSubmittingTransaction] = useState(false);
  const [shouldStopQuotation, setShouldStopQuotation] = useState(false);
  const [finalFromAmount, setFinalFromAmount] = useState(params.fromAmount as string);
  const [finalToAmount, setFinalToAmount] = useState(params.toAmount as string);
  
  // Track latest quotation IDs
  const [latestQuotationIds, setLatestQuotationIds] = useState<{
    quotationId1: string;
    quotationId2?: string;
  }>({ quotationId1: '' });
  
  // Refs for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Parse params
  const transactionType = params.transactionType as string;
  const fromCurrency = JSON.parse(params.fromCurrency as string);
  const toCurrency = JSON.parse(params.toCurrency as string);
  const exchangeRate = parseFloat(params.exchangeRate as string);
  const feePercent = parseFloat(params.feePercent as string);
  const fromBalance = parseFloat(params.fromBalance as string);
  const toBalance = parseFloat(params.toBalance as string);
  const lastEditedField = params.lastEditedField as 'from' | 'to';
  const userEmail = params.userEmail as string;
  const clientId = params.clientId as string;
  const accountNumber = params.accountNumber as string;
  const originalFromAmount = params.originalFromAmount as string;
  const originalToAmount = params.originalToAmount as string;

  useEffect(() => {
    // Initial quotation call
    fetchQuotation();
    
    // Set up 5-second interval
    intervalRef.current = setInterval(() => {
      if (quotationCallCount < 4) { // 0,1,2,3,4 = 5 calls total
        fetchQuotation();
      } else {
        // Navigate back after 5 calls
        handleMaxCallsReached();
      }
    }, 5000);

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Clear interval when max calls reached
    if (quotationCallCount >= 5) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        handleMaxCallsReached();
      }
    }
  }, [quotationCallCount]);

  // Stop quotation when shouldStopQuotation flag is set
  useEffect(() => {
    if (shouldStopQuotation && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [shouldStopQuotation]);

  const fetchQuotation = async () => {
    
    if (shouldStopQuotation || !isMountedRef.current) return;
    console.log("Fetching quotation for sell", shouldStopQuotation);
    setIsLoadingQuotation(true);
    
    try {
      let quotationRequest: BuySellQuotationRequest;
      
      if (lastEditedField === 'from') {
        // User entered crypto amount to sell
        const cryptoAfterFee = parseFloat(originalFromAmount) - (parseFloat(originalFromAmount) * feePercent / 100);  
        
        quotationRequest = {
          userId: accountNumber,
          crypto: fromCurrency.code,
          blockchain: getBlockchainForCrypto(fromCurrency.code),
          cryptoAmount: cryptoAfterFee.toFixed(8),
          side: 'Sell' as const,
          fiat: toCurrency.code,
          email: userEmail,
          isWebUI: true
        };
      } else {

        quotationRequest = {
          userId: accountNumber,
          crypto: fromCurrency.code,
          blockchain: getBlockchainForCrypto(fromCurrency.code),
          fiatAmount: originalToAmount,
          side: 'Sell' as const,
          fiat: toCurrency.code,
          email: userEmail,
          isWebUI: true
        };
      }

      const response = await requestForQuotation(quotationRequest);

      console.log("response", response)
      
      if (!isMountedRef.current) return;

      // Update final amounts based on quotation response
      if (lastEditedField === 'from') {
        // User entered crypto - use receiveQuantity from API for fiat amount
        setFinalFromAmount(originalFromAmount); // Keep original crypto amount
        setFinalToAmount(response.data.receiveQuantity);
      } else {
        // User entered fiat - use deliverQuantity from API for crypto amount
        const cryptoBeforeFee = parseFloat(response.data.deliverQuantity);
        const cryptoAfterFee = cryptoBeforeFee + (cryptoBeforeFee * feePercent / 100);
        setFinalFromAmount(cryptoAfterFee.toFixed(8));
        setFinalToAmount(originalToAmount); // Keep original fiat amount
      }

      // Update quotation IDs from the latest response
      setLatestQuotationIds({
        quotationId1: response.data.quotationId1,
        ...(response.data.quotationId2 && { quotationId2: response.data.quotationId2 })
      });

      setQuotationData(response);
      setQuotationCallCount(prev => prev + 1);
      
    } catch (error) {
      console.error('Quotation error:', error);
      // Don't increment counter on error, just continue trying
    } finally {
      if (isMountedRef.current) {
        setIsLoadingQuotation(false);
      }
    }
  };

  const handleMaxCallsReached = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    Alert.alert(
      'Quote Expired',
      'The quotation has expired. Please return to the form to get a new quote.',
      [
        {
          text: 'OK',
          onPress: () => {
            router.back();
          }
        }
      ]
    );
  };

  const handleSellNow = async () => {
    if (!quotationData || !latestQuotationIds.quotationId1) {
      Alert.alert('Error', 'No valid quotation available. Please wait for quotation to load.');
      return;
    }

    try {
      setIsSubmittingTransaction(true);
      
      // Stop quotation updates immediately when user starts transaction
      setShouldStopQuotation(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Calculate fee amount
      const feeAmount = lastEditedField === 'from' ? parseFloat(finalFromAmount) * feePercent / 100
                                                    : parseFloat(quotationData.data.deliverQuantity) * feePercent / 100;
 
      const netCryptoAmount = lastEditedField === 'from' ? parseFloat(originalFromAmount) - (parseFloat(originalFromAmount) * feePercent / 100)
                                                         : parseFloat(finalFromAmount) - (parseFloat(finalFromAmount) * feePercent / 100);

      // Build transaction request
      const transactionRequest: CreateBuySellCryptoTransactionRequest = {
        currencyType: 'crypto',
        type: 'Sell',
        clientId: clientId,
        transactionEmail: userEmail,
        transactionFee: feeAmount,
        transactionDetails: {
          quotationId1: latestQuotationIds.quotationId1,
          ...(latestQuotationIds.quotationId2 && { 
            quotationId2: latestQuotationIds.quotationId2 
          }),
          fiatAmount: parseFloat(finalToAmount),
          cryptoAmount: parseFloat(finalFromAmount),
          fiatCurrency: toCurrency.code,
          cryptoId: fromCurrency.code,
          blockchain: getBlockchainForCrypto(fromCurrency.code),
          // exchangeRate: exchangeRate,
          quotationPrice: parseFloat(quotationData.data.price),
          fee: feePercent,
          calculationMethod: lastEditedField === 'from' ? 'crypto' : 'fiat',
          netCryptoAmount,
        },
        email: userEmail,
        isWebUI: true
      };

      console.log('Submitting sell transaction:', transactionRequest);

      const response = await createCryptoTransaction(transactionRequest);
      
      // Success - show options for next action
      Alert.alert(
        'Sale Successful',
        response.msg || 'Your crypto sale has been completed successfully!',
        [
          {
            text: 'Home',
            onPress: () => {
              router.dismissAll();
              router.push('/(auth)/dashboard?tab=crypto');
            }
          },
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
      console.error('Transaction error:', error);
      
      // Handle token expiry specifically
      if (error instanceof TokenExpiredError) {
        showError(
          'Your session has expired. Please login again.',
          'Session Expired'
        );
        // Immediately redirect to login
        router.dismissAll();
        router.replace('/(public)/login');
        return;
      }
      
      // Handle other errors
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
    } finally {
      setIsSubmittingTransaction(false);
    }
  };

  const handleBack = () => {
    // Clear interval when going back
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <CryptoTransactionSummary
        transactionType="sell"
        fromCurrency={fromCurrency}
        toCurrency={toCurrency}
        fromAmount={finalFromAmount}
        toAmount={finalToAmount}
        exchangeRate={exchangeRate}
        feePercent={feePercent}
        fromBalance={fromBalance}
        toBalance={toBalance}
        isLoadingQuotation={isLoadingQuotation}
        isSubmittingTransaction={isSubmittingTransaction}
        onExecute={handleSellNow}
        onBack={handleBack}
      />
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
