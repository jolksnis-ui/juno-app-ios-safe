import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CryptoTransactionSummary } from '../../src/components/CryptoTransactionSummary';
import { requestForQuotation, getBlockchainForCrypto, QuotationResponse, ExchangeQuotationRequest } from '../../src/services/quotationService';
import { createCryptoTransaction, CreateBuyExchangeTransactionRequest, TokenExpiredError } from '../../src/services/transactionService';
import { useToast } from '../../src/contexts/ToastContext';
import { useStyles } from '../../src/hooks/useTheme';
import { Theme } from '../../src/types/theme';

export default function ExchangeCryptoConfirmScreen() {
  const params = useLocalSearchParams();
  const styles = useStyles((theme: Theme) => createStyles(theme));
  const { showError } = useToast();
  
  // Parse transaction data
  const transactionData = JSON.parse(params.transactionData as string);
  
  // State for quotation management
  const [quotationData, setQuotationData] = useState<QuotationResponse | null>(null);
  const [quotationCallCount, setQuotationCallCount] = useState(0);
  const [isLoadingQuotation, setIsLoadingQuotation] = useState(false);
  const [isSubmittingTransaction, setIsSubmittingTransaction] = useState(false);
  const [shouldStopQuotation, setShouldStopQuotation] = useState(false);
  const [finalFromAmount, setFinalFromAmount] = useState(transactionData.fromAmount);
  const [finalToAmount, setFinalToAmount] = useState(transactionData.toAmount);
  
  // Track latest quotation IDs
  const [latestQuotationIds, setLatestQuotationIds] = useState<{
    quotationId1: string;
    quotationId2?: string;
  }>({ quotationId1: '' });
  
  // Refs for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Extract data from transactionData
  const {
    transactionType,
    fromCurrency,
    toCurrency,
    exchangeRate,
    feePercent,
    fromBalance,
    toBalance,
    lastEditedField,
    userEmail,
    clientId,
    accountNumber,
    originalFromAmount,
    originalToAmount
  } = transactionData;

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
    console.log("Fetching quotation for exchange", shouldStopQuotation);
    
    setIsLoadingQuotation(true);
    
    try {
      let quotationRequest: ExchangeQuotationRequest;
      
      if (lastEditedField === 'from') {
        // User entered from crypto amount - deduct fee before sending to API
        const fromAfterFee = parseFloat(originalFromAmount) - (parseFloat(originalFromAmount) * feePercent / 100);
        
        quotationRequest = {
          userId: accountNumber,
          fromCrypto: fromCurrency.code,
          blockchain: getBlockchainForCrypto(toCurrency.code),
          fromCryptoAmount: fromAfterFee.toFixed(8),
          side: 'Buy' as const, // Exchange is treated as buying the target crypto
          toCrypto: toCurrency.code,
          email: userEmail,
          isWebUI: true
        };
      } else {
        // User entered to crypto amount - no fee deduction needed
        quotationRequest = {
          userId: accountNumber,
          fromCrypto: fromCurrency.code,
          blockchain: getBlockchainForCrypto(toCurrency.code),
          toCryptoAmount: originalToAmount,
          side: 'Buy' as const,
          toCrypto: toCurrency.code,
          email: userEmail,
          isWebUI: true
        };
      }

      const response = await requestForQuotation(quotationRequest);
      
      if (!isMountedRef.current) return;

      // Update final amounts based on quotation response
      if (lastEditedField === 'from') {
        // User entered from crypto - use receiveQuantity from API for to crypto amount
        setFinalFromAmount(originalFromAmount); // Keep original from amount
        setFinalToAmount(parseFloat(response.data.receiveQuantity).toFixed(8));
      } else {
        // User entered to crypto - calculate from crypto with fee from deliverQuantity
        const deliverAmount = parseFloat(response.data.deliverQuantity);
        const fromWithFee = deliverAmount + (deliverAmount * feePercent / 100);
        setFinalFromAmount(fromWithFee.toFixed(8));
        setFinalToAmount(originalToAmount); // Keep original to amount
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

  const handleExchangeNow = async () => {
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

      // Calculate fee amount (in from crypto)
      const feeAmount = lastEditedField === 'from' ? parseFloat(originalFromAmount) * feePercent / 100
                                                    : parseFloat(quotationData.data.deliverQuantity) * feePercent / 100;

      const netExchangeAmount = lastEditedField === 'from' ? parseFloat(originalFromAmount) - (parseFloat(originalFromAmount) * feePercent / 100)
                                                         : parseFloat(finalFromAmount) - (parseFloat(finalFromAmount) * feePercent / 100);

      // Build exchange transaction request
      const transactionRequest: CreateBuyExchangeTransactionRequest = {
        currencyType: 'crypto',
        type: 'Exchange', // Exchange is treated as a buy transaction in the API
        clientId: clientId,
        transactionEmail: userEmail,
        transactionFee: feeAmount,
        transactionDetails: {
          quotationId1: latestQuotationIds.quotationId1,
          ...(latestQuotationIds.quotationId2 && { 
            quotationId2: latestQuotationIds.quotationId2 
          }),
          fromCryptoAmount: parseFloat(finalFromAmount),
          toCryptoAmount: parseFloat(finalToAmount),
          fromCryptoId: fromCurrency.code, // Source crypto acts as "fiat" in API
          toCryptoId: toCurrency.code,
          blockchain: getBlockchainForCrypto(toCurrency.code),
          quotationPrice: parseFloat(quotationData.data.price),
          fee: feePercent,
          calculationMethod: lastEditedField === 'from' ? 'fromAmount' : 'toAmount',
          netExchangeAmount
        },
        email: userEmail,
        isWebUI: true
      };

      console.log('Submitting exchange transaction:', transactionRequest);

      const response = await createCryptoTransaction(transactionRequest);
      
      // Success - show options for next action
      Alert.alert(
        'Exchange Successful',
        response.msg || 'Your crypto exchange has been completed successfully!',
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
      console.error('Exchange transaction error:', error);
      
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
        'Exchange Failed',
        error instanceof Error ? error.message : 'Failed to complete exchange. Please try again.',
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
        transactionType="exchange"
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
        onExecute={handleExchangeNow}
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
