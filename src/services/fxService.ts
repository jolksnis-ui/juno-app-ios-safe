import { APIClient, TokenExpiredError } from '../utils/apiClient';
import { getUserData } from './secureStorage';

// Re-export TokenExpiredError for backward compatibility
export { TokenExpiredError };

export interface ClientFeeRequest {
  transactionType: string;
  currencyType: string;
  fromCurrency: string;
  toCurrency?: string;
}

export interface ClientFeeResponse {
  clientId: string;
  transactionType: string;
  currencyType: string;
  fromCurrency: string;
  percentFee: number;
}

export interface FiatExchangeRateRequest {
  fromCurrency: string;
  toCurrency: string;
}

export interface FiatExchangeRateResponse {
  fixedRate: number;
  convertedAmount: number;
}

export interface CreateFXTransactionRequest {
  currencyType: "fiat";
  type: "FX";
  transactionEmail: string;
  balance: {
    balanceAmount: number;
  };
  transactionDetails: {
    fromCurrency: string;
    toCurrency: string;
    fromAmount: string;
    toAmount: string;
    fxrate: number;
    fxFee: number;
    exchangeRate: number;
    calculationMethod: string;
  };
}

export interface CreateFXTransactionResponse {
  success: boolean;
  message: string;
  transactionId?: string;
}

/**
 * Get client fee for FX transaction
 */
export const getClientFee = async (
  transactionType: string,
  currencyType: string,
  fromCurrency: string
): Promise<ClientFeeResponse> => {
  console.log("get client fee for FX");
  
  const userData = await getUserData();
  if (!userData) {
    throw new TokenExpiredError('Authentication required. Please login again.');
  }
  
  const response = await APIClient.post<ClientFeeResponse>('/get-client-fee', {
    transactionType,
    currencyType,
    fromCurrency
  });

  return response.data;
};

/**
 * Get client fee for FX transaction with both currencies
 */
export const getFXClientFee = async (
  transactionType: string,
  currencyType: string,
  fromCurrency: string,
  toCurrency: string
): Promise<ClientFeeResponse> => {
  console.log("get FX client fee with both currencies");
  
  const userData = await getUserData();
  if (!userData) {
    throw new TokenExpiredError('Authentication required. Please login again.');
  }
  
  const response = await APIClient.post<ClientFeeResponse>('/get-client-fee', {
    transactionType,
    currencyType,
    fromCurrency,
    toCurrency
  });

  return response.data;
};

/**
 * Get fiat exchange rate
 */
export const getFiatExchangeRate = async (
  fromCurrency: string,
  toCurrency: string
): Promise<FiatExchangeRateResponse> => {
  console.log("get fiat exchange rate");
  
  const userData = await getUserData();
  if (!userData) {
    throw new TokenExpiredError('Authentication required. Please login again.');
  }
  
  const response = await APIClient.post<FiatExchangeRateResponse>('/get-fiat-exchange-rate', {
    fromCurrency,
    toCurrency
  });

  return response.data;
};

/**
 * Create FX transaction
 */
export const createFXTransaction = async (
  request: CreateFXTransactionRequest
): Promise<CreateFXTransactionResponse> => {
  console.log("create FX transaction");
  
  const userData = await getUserData();
  if (!userData) {
    throw new TokenExpiredError('Authentication required. Please login again.');
  }
  
  const response = await APIClient.post<CreateFXTransactionResponse>('/create-client-transaction-merchant', request);

  return response.data;
};
