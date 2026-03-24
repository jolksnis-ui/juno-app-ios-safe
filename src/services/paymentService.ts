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

export interface CreatePaymentTransactionRequest {
  currencyType: "fiat";
  type: "Payment Out";
  transactionDetails: {
    beneficiaryName: string;
    beneficiaryCountry: string;
    beneficiaryAddress: string;
    bankName: string;
    bankAddress: string;
    accountNumber: string;
    sortCode: string;
    iban: string;
    swiftCode: string;
    reference: string;
    additionalInfo: string;
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

export interface CreatePaymentTransactionResponse {
  success: boolean;
  message: string;
  transactionId?: string;
}

export interface SavedRecipient {
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

export interface SaveBeneficiaryRequest {
  clientIdObj: string;
  accountNickName: string;
  beneficiaryName: string;
  currency: string;
  bankCountry: string;
  beneficiaryCountry: string;
}

export interface SaveBeneficiaryResponse {
  success: boolean;
  message: string;
}

/**
 * Get client fee for payment transaction
 */
export const getClientFee = async (
  transactionType: string,
  currencyType: string,
  fromCurrency: string
): Promise<ClientFeeResponse> => {
  console.log("get client fee for payment");
  
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
 * Get saved client recipients (same as beneficiaries)
 */
export const getClientRecipients = async (): Promise<SavedRecipient[]> => {
  console.log("get client recipients");
  
  const userData = await getUserData();
  if (!userData) {
    throw new TokenExpiredError('Authentication required. Please login again.');
  }
  
  const response = await APIClient.post<SavedRecipient[]>('/get-client-beneficiary', {});

  return response.data;
};

/**
 * Create payment transaction
 */
export const createPaymentTransaction = async (
  request: CreatePaymentTransactionRequest
): Promise<CreatePaymentTransactionResponse> => {
  console.log("create payment transaction");
  
  const userData = await getUserData();
  if (!userData) {
    throw new TokenExpiredError('Authentication required. Please login again.');
  }
  
  const response = await APIClient.post<CreatePaymentTransactionResponse>('/create-client-transaction-merchant', request);

  return response.data;
};

/**
 * Save client beneficiary
 */
export const saveClientBeneficiary = async (
  request: SaveBeneficiaryRequest
): Promise<SaveBeneficiaryResponse> => {
  console.log("save client beneficiary");
  
  const userData = await getUserData();
  if (!userData) {
    throw new TokenExpiredError('Authentication required. Please login again.');
  }
  
  const response = await APIClient.post<SaveBeneficiaryResponse>('/save-client-beneficiary', request);

  return response.data;
};

/**
 * Get list of countries
 */
export const getCountries = async (fetchAll: boolean = true): Promise<CountriesResponse> => {
  console.log("get countries for payment");
  
  const userData = await getUserData();
  if (!userData) {
    throw new TokenExpiredError('Authentication required. Please login again.');
  }
  
  const response = await APIClient.post<CountriesResponse>('/get-countries', {
    fetchAll
  });

  return response.data;
};
