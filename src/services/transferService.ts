import { APIClient, TokenExpiredError } from '../utils/apiClient';
import { getUserData } from './secureStorage';

// Re-export TokenExpiredError for backward compatibility
export { TokenExpiredError };

export interface ClientFeeRequest {
  transactionType: string;
  currencyType: string;
  fromCurrency: string;
}

export interface ClientFeeResponse {
  clientId: string;
  transactionType: string;
  currencyType: string;
  fromCurrency: string;
  percentFee: number;
}

export interface ValidateEmailRequest {
  userEmail: string;
}

export interface ValidateEmailResponse {
  emailExist: boolean;
  username: string | null;
}

export interface CreateTransferTransactionRequest {
  currencyType: "fiat";
  type: "Transfer";
  currency: string;
  transactionDetails: {
    email: string;
    amount: string;
    reference: string;
    currency: string;
  };
  transactionEmail: string;
  balance: {
    balanceAmount: string;
    updated: string;
  };
}

export interface CreateTransferTransactionResponse {
  success: boolean;
  message: string;
  transactionId?: string;
}

/**
 * Get client fee for transfer transaction
 */
export const getClientFee = async (
  transactionType: string,
  currencyType: string,
  fromCurrency: string
): Promise<ClientFeeResponse> => {
  console.log("get client fee for transfer");
  
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
 * Validate email address for transfer
 */
export const validateEmail = async (userEmail: string): Promise<ValidateEmailResponse> => {
  console.log("validate email for transfer");
  
  const userData = await getUserData();
  if (!userData) {
    throw new TokenExpiredError('Authentication required. Please login again.');
  }
  
  const response = await APIClient.post<ValidateEmailResponse>('/validate-email', {
    userEmail
  });

  return response.data;
};

/**
 * Create transfer transaction
 */
export const createTransferTransaction = async (
  request: CreateTransferTransactionRequest
): Promise<CreateTransferTransactionResponse> => {
  console.log("create transfer transaction");
  
  const userData = await getUserData();
  if (!userData) {
    throw new TokenExpiredError('Authentication required. Please login again.');
  }
  
  const response = await APIClient.post<CreateTransferTransactionResponse>('/create-client-transaction-merchant', request);

  return response.data;
};
