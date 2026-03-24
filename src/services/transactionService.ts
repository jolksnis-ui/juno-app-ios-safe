import { Transaction, APITransaction, APITransactionResponse, transformAPITransaction } from '../types/transaction';
import { APIClient, TokenExpiredError } from '../utils/apiClient';
import { getUserData } from './secureStorage';

// Re-export TokenExpiredError for backward compatibility
export { TokenExpiredError };

// Get transaction types for filtering
export const getCryptoTransactionTypes = (): string[] => {
  return ['Buy', 'Sell', 'Exchange', 'Send', 'Receive'];
};

export const getFiatTransactionTypes = (): string[] => {
  return ['Deposit', 'Withdrawal', 'Payment Out', 'Transfer', 'FX'];
};

// Interface for creating crypto transactions
export interface CreateBuySellCryptoTransactionRequest {
  currencyType: 'crypto';
  type: 'Buy' | 'Sell' | 'Exchange';
  clientId: string;
  transactionEmail: string;
  transactionFee: number;
  transactionDetails: {
    quotationId1: string;
    quotationId2?: string;
    fiatAmount: number;
    cryptoAmount: number;
    fiatCurrency: string;
    cryptoId: string;
    blockchain: string;
    // exchangeRate: number;
    quotationPrice: number;
    fee: number;
    calculationMethod: 'fiat' | 'crypto';
    netCryptoAmount: number;
  };
  email: string;
  isWebUI: boolean;
}

export interface CreateBuyExchangeTransactionRequest {
  currencyType: 'crypto';
  type: 'Buy' | 'Sell' | 'Exchange';
  clientId: string;
  transactionEmail: string;
  transactionFee: number;
  transactionDetails: {
    quotationId1: string;
    quotationId2?: string;
    fromCryptoAmount: number;
    toCryptoAmount: number;
    fromCryptoId: string;
    toCryptoId: string;
    blockchain: string;
    // exchangeRate: number;
    quotationPrice: number;
    fee: number;
    calculationMethod: 'fromAmount' | 'toAmount';
    netExchangeAmount: number;
  };
  email: string;
  isWebUI: boolean;
}

export interface CreateCryptoTransactionResponse {
  msg: string;
  status: string;
}

/**
 * Get crypto transactions
 */
export const getCryptoTransactions = async (
  page: number = 1,
  pageSize: number = 10,
  type: string = '',
  status: string = ''
): Promise<{ transactions: Transaction[]; apiTransactions: APITransaction[]; totalCount: number }> => {
  try {
    const userData = await getUserData();
    if (!userData) {
      throw new TokenExpiredError('Authentication required. Please login again.');
    }
    
    const requestBody = {
      client: userData.clientId,
      currencyType: 'crypto',
      from: '',
      to: '',
      currency: '',
      status: status,
      type: type,
      page: page,
      pageSize: pageSize,
      email: userData.clientEmail,
      isWebUI: true
    };

    const response = await APIClient.post<APITransactionResponse>('/get-client-transactions', requestBody);
    
    const apiTransactions = response.data.clientsTransactionData;
    const transactions = apiTransactions.map(transformAPITransaction);

    return {
      transactions,
      apiTransactions,
      totalCount: response.data.totalCount
    };
  } catch (error) {
    console.error('Error fetching crypto transactions:', error);
    throw error;
  }
};

/**
 * Get fiat transactions
 */
export const getFiatTransactions = async (
  page: number = 1,
  pageSize: number = 10,
  type: string = '',
  status: string = ''
): Promise<{ transactions: Transaction[]; apiTransactions: APITransaction[]; totalCount: number }> => {
  try {
    const userData = await getUserData();
    if (!userData) {
      throw new TokenExpiredError('Authentication required. Please login again.');
    }
    
    const fiatTypes = ['Deposit', 'Withdrawal', 'Payment Out', 'Transfer', 'FX', 'Bulk Payment'];
    const typeFilter = type ? [type] : fiatTypes;

    const requestBody = {
      client: userData.clientId,
      currencyType: 'all',
      from: '',
      to: '',
      currency: '',
      status: status,
      type: typeFilter,
      page: page,
      pageSize: pageSize,
      email: userData.clientEmail,
      isWebUI: true
    };
    
    const response = await APIClient.post<APITransactionResponse>('/get-client-transactions', requestBody);
    
    // Filter out crypto transactions to get only fiat ones
    const fiatApiTransactions = response.data.clientsTransactionData
      .filter(transaction => 
        fiatTypes.includes(transaction.type) || 
        (transaction.currencyType === 'fiat')
      );
    
    const fiatTransactions = fiatApiTransactions.map(transformAPITransaction);

    return {
      transactions: fiatTransactions,
      apiTransactions: fiatApiTransactions,
      totalCount: fiatTransactions.length
    };
  } catch (error) {
    console.error('Error fetching fiat transactions:', error);
    throw error;
  }
};

/**
 * Create a crypto transaction
 */
export const createCryptoTransaction = async (
  requestData: CreateBuySellCryptoTransactionRequest 
  | CreateBuyExchangeTransactionRequest
): Promise<CreateCryptoTransactionResponse> => {
  try {
    console.log('Creating crypto transaction:', requestData);

    const response = await APIClient.post<CreateCryptoTransactionResponse>('/create-client-transaction-crypto', requestData);
    
    console.log('Transaction created successfully:', response.data);
    
    if (response.data.status !== 'success') {
      throw new Error(response.data.msg || 'Transaction creation failed');
    }

    return response.data;
  } catch (error) {
    console.error('Error creating crypto transaction:', error);
    throw error;
  }
};
