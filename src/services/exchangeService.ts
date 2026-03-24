import { APIClient, TokenExpiredError } from '../utils/apiClient';
import { getUserData } from './secureStorage';

// Re-export TokenExpiredError for backward compatibility
export { TokenExpiredError };

export interface ExchangeRateRequest {
  cryptoList: string[];
  // For fiat-to-crypto (buy/sell)
  fiatAmount?: number;
  fiatCurrency?: string;
  // For crypto-to-crypto (exchange)
  cryptoAmount?: number;
  cryptoCurrency?: string;
  exchangeConversionType: string;
  email: string;
  isWebUI: boolean;
}

export interface ExchangeRateResponse {
  success: boolean;
  fiatAmount: number;
  fiatCurrency: string;
  cryptoAmounts: { [key: string]: string };
}

export interface CryptoFeeRequest {
  crypto: string;
  profile: 'Standard';
  transactionType: 'Buy';
  clientId: string;
  email: string;
  isWebUI: boolean;
}

export interface CryptoFeeResponse {
  error: boolean;
  data: {
    fromCrypto: string;
    toCrypto: string;
    profile: string;
    transactionType: string;
    fee: number; // percentage
    fromCryptoId: string;
  };
  message: string;
}

export interface ExchangeCalculation {
  fiatAmount: number;
  feePercent: number;
  fiatAfterFee: number;
  exchangeRate: number;
  cryptoAmount: number;
  displayRate: string;
}

const BASE_URL = 'https://dev.junomoney.org';

/**
 * Get crypto exchange rate - handles both fiat-to-crypto and crypto-to-crypto
 */
export const getCryptoExchangeRate = async (
  cryptoList: string[],
  amount: number,
  currency: string,
  email: string,
  transactionType: string
): Promise<ExchangeRateResponse> => {
  try {
    let requestData: ExchangeRateRequest;
    
    if (transactionType === 'exchange') {
      // Crypto-to-crypto exchange
      requestData = {
        cryptoList,
        cryptoAmount: amount,
        cryptoCurrency: currency,
        exchangeConversionType: 'crypto-to-crypto',
        email,
        isWebUI: true
      };
    } else {
      // Fiat-to-crypto (buy/sell)
      requestData = {
        cryptoList,
        fiatAmount: amount,
        fiatCurrency: currency,
        exchangeConversionType: 'fiat-to-crypto',
        email,
        isWebUI: true
      };
    }

    console.log("Fetching exchange rate", requestData);

    const response = await APIClient.post<ExchangeRateResponse>('/crypto-exchange-rate', requestData);
    
    if (!response.data.success) {
      throw new Error('Exchange rate API returned unsuccessful response');
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    throw error;
  }
};

/**
 * Get crypto transaction fee
 */
export const getCryptoFee = async (
  crypto: string,
  clientId: string,
  email: string
): Promise<CryptoFeeResponse> => {
  try {
    const requestData: CryptoFeeRequest = {
      crypto,
      profile: 'Standard',
      transactionType: 'Buy',
      clientId,
      email,
      isWebUI: true
    };

    const response = await APIClient.post<CryptoFeeResponse>('/get-crypto-fee', requestData);
    
    if (response.data.error) {
      throw new Error(response.data.message || 'Crypto fee API returned error');
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching crypto fee:', error);
    throw error;
  }
};

/**
 * Utility function for precise rounding
 */
const roundToDecimals = (num: number, decimals: number): number => {
  if (isNaN(num)) return 0;
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(num * factor) / factor;
  return rounded;
};

/**
 * Calculate bidirectional amounts with precise step-by-step rounding
 */
export const calculateBidirectional = (
  inputAmount: number,
  inputType: 'fiat' | 'crypto',
  exchangeRate: number,
  feePercent: number,
  transactionType: 'buy' | 'sell' | 'exchange' = 'buy'
): { fiatAmount: number; cryptoAmount: number; } => {
          console.log("==============calculateBidirectional")
  
  if (transactionType === 'buy') {
    // BUY CRYPTO LOGIC
    if (inputType === 'fiat') {
      // Fiat → Crypto (Buy: paying fiat, getting crypto)
      // Step 1: Round fiat input
      const roundedFiatInput = roundToDecimals(inputAmount, 2);
      
      // Step 2: Apply fee (deduct from fiat)
      const feeAmount = roundedFiatInput * feePercent / 100;
      const fiatAfterFee = roundedFiatInput - feeAmount;
      
      // Step 3: Round fiat after fee
      const roundedFiatAfterFee = roundToDecimals(fiatAfterFee, 2);
      
      // Step 4: Convert to crypto
      const cryptoAmount = roundedFiatAfterFee * exchangeRate;
      
      // Step 5: Round crypto
      const roundedCrypto = roundToDecimals(cryptoAmount, 8);
      
      return { 
        fiatAmount: roundedFiatInput, 
        cryptoAmount: roundedCrypto 
      };
      
    } else {
      // Crypto → Fiat (Buy: want specific crypto amount, calculate fiat needed)
      // Step 1: Round crypto input
      const roundedCryptoInput = roundToDecimals(inputAmount, 8);
      
      // Step 2: Convert to fiat before fee
      const fiatBeforeFee = roundedCryptoInput / exchangeRate;
      
      // Step 3: Round fiat before fee
      const roundedFiatBeforeFee = roundToDecimals(fiatBeforeFee, 2);
      
      // Step 4: Add fee to get total fiat needed
      const feeAmount = roundedFiatBeforeFee * feePercent / 100;
      const totalFiat = roundedFiatBeforeFee + feeAmount;
      
      // Step 5: Round final fiat
      const roundedFinalFiat = roundToDecimals(totalFiat, 2);
      
      return { 
        fiatAmount: roundedFinalFiat, 
        cryptoAmount: roundedCryptoInput 
      };
    }
  } else if (transactionType === 'sell') {
    // SELL CRYPTO LOGIC
    if (inputType === 'crypto') {
      // Crypto → Fiat (Sell: selling crypto, receiving fiat)
      // Step 1: Round crypto input
      const roundedCryptoInput = roundToDecimals(inputAmount, 8);

      // Step 2: Deduct fee from crypto
      const feeAmount = roundedCryptoInput * feePercent / 100;
      const cryptoAfterFee = roundedCryptoInput - feeAmount;
      
      // Step 3: Convert to fiat
      const fiatBeforeFee = cryptoAfterFee / exchangeRate;
      
      // Step 4: Round fiat before fee
      const roundedFiat = roundToDecimals(fiatBeforeFee, 2);
      
      return { 
        fiatAmount: roundedFiat, 
        cryptoAmount: roundedCryptoInput 
      };
      
    } else {
      // Fiat → Crypto (Sell: want specific fiat amount, calculate crypto needed)
      // Step 1: Round fiat input (desired receive amount)
      const roundedFiatInput = roundToDecimals(inputAmount, 2);

      // Step 2: Convert to crypto amount needed
      const cryptoAmount = roundedFiatInput * exchangeRate;

      // Step 3: Round crypto before fee
      const roundedCryptoBeforeFee = roundToDecimals(cryptoAmount, 8);
      
      // Step 4: Apply fee (add to crypto)
      const feeAmount = roundedCryptoBeforeFee * feePercent / 100;
      const cryptoAfterFee = roundedCryptoBeforeFee + feeAmount;
      
      // Step 5: Round crypto
      const roundedCrypto = roundToDecimals(cryptoAfterFee, 8);
      
      return { 
        fiatAmount: roundedFiatInput, 
        cryptoAmount: roundedCrypto 
      };
    }
  } else {
    return { 
      fiatAmount: 0,
      cryptoAmount: 0
    }
  }
};

export const calculateBidirectionalForExchange = (
  inputAmount: number,
  inputType: 'fromCrypto' | 'toCrypto',
  exchangeRate: number,
  feePercent: number,
  transactionType: 'buy' | 'sell' | 'exchange' = 'buy'
): { fromCryptoAmount: number; toCryptoAmount: number } => {
  if (inputType === 'fromCrypto') {
    // Crypto → Crypto (Exchange: selling crypto, receiving crypto)
    // Step 1: Round crypto input
    const roundedCryptoInput = roundToDecimals(inputAmount, 8);

    // Step 2: Deduct fee from crypto
    const feeAmount = roundedCryptoInput * feePercent / 100;
    const cryptoAfterFee = roundedCryptoInput - feeAmount;
    
    // Step 3: Convert
    const cryptoBeforeFee = cryptoAfterFee * exchangeRate;
    
    // Step 4: Round crypto before fee
    const roundedCrypto = roundToDecimals(cryptoBeforeFee, 8);
    
    return { 
      fromCryptoAmount: roundedCryptoInput, 
      toCryptoAmount: roundedCrypto
    };
    
  } else {
    // Crypto → Crypto (Exchange: selling crypto, receiving crypto)
    // Step 1: Round crypto input
    const roundedCryptoInput = roundToDecimals(inputAmount, 8);

    // Step 2: Convert to crypto amount needed
    const cryptoAmount = roundedCryptoInput / exchangeRate;

    // Step 3: Round crypto before fee
    const roundedCryptoBeforeFee = roundToDecimals(cryptoAmount, 8);
    
    // Step 4: Apply fee (add to crypto)
    const feeAmount = roundedCryptoBeforeFee * feePercent / 100;
    const cryptoAfterFee = roundedCryptoBeforeFee + feeAmount;
    
    // Step 5: Round crypto
    const roundedCrypto = roundToDecimals(cryptoAfterFee, 8);
    
    return { 
      fromCryptoAmount: roundedCrypto, 
      toCryptoAmount: roundedCryptoInput 
    };
  }
}

/**
 * Calculate final crypto amount after fee and exchange rate (legacy function for backward compatibility)
 */
export const calculateCryptoAmount = (
  fiatAmount: number,
  exchangeRate: number,
  feePercent: number
): ExchangeCalculation => {
  const result = calculateBidirectional(fiatAmount, 'fiat', exchangeRate, feePercent);
  
  // Step 1: Calculate fiat amount after fee for display
  const feeAmount = (result.fiatAmount * feePercent) / 100;
  const fiatAfterFee = result.fiatAmount - feeAmount;
  const roundedFiatAfterFee = roundToDecimals(fiatAfterFee, 2);
  
  // Create display rate (1 FIAT = X CRYPTO)
  const displayRate = `1 = ${exchangeRate.toFixed(8)}`;
  
  return {
    fiatAmount: result.fiatAmount,
    feePercent,
    fiatAfterFee: roundedFiatAfterFee,
    exchangeRate,
    cryptoAmount: result.cryptoAmount,
    displayRate
  };
};

/**
 * Get exchange rate and fee data for a currency pair
 */
export const getExchangeDataForPair = async (
  fromCurrency: string,
  toCurrency: string,
  email: string,
  clientId: string,
  transactionType: string
): Promise<{
  exchangeRate: number;
  feePercent: number;
  displayRate: string;
}> => {
  try {
    // Call both APIs in parallel
    const [exchangeRateResponse, feeResponse] = await Promise.all([
      getCryptoExchangeRate([toCurrency], 1, fromCurrency, email, transactionType),
      getCryptoFee(toCurrency, clientId, email)
    ]);

    // Extract exchange rate for the specific crypto
    const exchangeRate = parseFloat(exchangeRateResponse.cryptoAmounts[toCurrency]);
    const feePercent = feeResponse.data.fee;
    
    // Create display rate string
    const displayRate = `1 ${fromCurrency} = ${exchangeRate.toFixed(8)} ${toCurrency}`;

    return {
      exchangeRate,
      feePercent,
      displayRate
    };
  } catch (error) {
    console.error('Error getting exchange data:', error);
    throw error;
  }
};
