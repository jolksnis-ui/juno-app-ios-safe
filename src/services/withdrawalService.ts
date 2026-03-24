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

export interface CountriesRequest {
  fetchAll: boolean;
}

export interface CountriesResponse {
  allCountries: Array<{
    _id: string;
    name: string;
    enabled: boolean;
    __v: number;
    code: string;
  }>;
}

export interface CreateWithdrawalTransactionRequest {
  currencyType: "fiat";
  type: "Withdrawal";
  transactionDetails: {
    beneficiaryName: string;
    beneficiaryCountry: string;
    beneficiaryAddress: string;
    bankName: string;
    bankAddress: string;
    beneficiaryAccountNumber: string;
    sortCode: string;
    iban: string;
    swift: string;
    reference: string;
    additionalBankDetails: string;
    bankCountry: string;
    save: boolean;
    nickname: string;
    accountNickName: string;
    amount: string;
    currency: string;
  };
  currency: string;
  transactionEmail: string;
  balance: {
    balanceAmount: string;
  };
}

export interface CreateWithdrawalTransactionResponse {
  success: boolean;
  message: string;
  transactionId?: string;
}

export interface SavedBeneficiary {
  _id: string;
  client: string;
  accountNickName: string;
  beneficiaryName: string;
  beneficiaryAddress: string;
  bankName: string;
  bankAddress: string;
  sortCode: string;
  iban: string;
  reference: string;
  bankCountry: string;
  beneficiaryCountry: string;
  currency: string;
  createdAt: string;
  __v: number;
}

/**
 * Get client fee for withdrawal transaction
 */
export const getClientFee = async (
  transactionType: string,
  currencyType: string,
  fromCurrency: string
): Promise<ClientFeeResponse> => {
  console.log("get client fee");
  
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
 * Get saved client beneficiaries
 */
export const getClientBeneficiary = async (): Promise<SavedBeneficiary[]> => {
  console.log("get client beneficiary");
  
  const userData = await getUserData();
  if (!userData) {
    throw new TokenExpiredError('Authentication required. Please login again.');
  }
  
  const response = await APIClient.post<SavedBeneficiary[]>('/get-client-beneficiary', {});

  return response.data;
};

/**
 * Create withdrawal transaction
 */
export const createWithdrawalTransaction = async (
  request: CreateWithdrawalTransactionRequest
): Promise<CreateWithdrawalTransactionResponse> => {
  console.log("create withdrawal transaction");
  
  const userData = await getUserData();
  if (!userData) {
    throw new TokenExpiredError('Authentication required. Please login again.');
  }
  
  const response = await APIClient.post<CreateWithdrawalTransactionResponse>('/create-client-transaction-merchant', request);

  return response.data;
};

/**
 * Get list of countries
 */
export const getCountries = async (fetchAll: boolean = true): Promise<CountriesResponse> => {
  console.log("get countries");
  
  const userData = await getUserData();
  if (!userData) {
    throw new TokenExpiredError('Authentication required. Please login again.');
  }
  
  const response = await APIClient.post<CountriesResponse>('/get-countries', {
    fetchAll
  });

  return response.data;
};
