import { 
  CryptoFeeResponse, 
  SavedCryptoAddress, 
  CreateCryptoTransactionRequest, 
  CreateCryptoTransactionResponse,
  ValidateWalletAddressRequest,
  ValidateWalletAddressResponse,
  SaveCryptoAddressRequest,
  SaveCryptoAddressResponse
} from '../types/cryptoSend';
import { APIClient, TokenExpiredError } from '../utils/apiClient';
import { getUserData } from './secureStorage';

// Re-export TokenExpiredError for backward compatibility
export { TokenExpiredError };

/**
 * Get transaction fee for a specific cryptocurrency
 * @param crypto Cryptocurrency code (e.g., 'ETH', 'BTC')
 * @returns Promise<CryptoFeeResponse>
 */
export const getCryptoFee = async (crypto: string): Promise<CryptoFeeResponse> => {
  console.log('Getting crypto fee for:', crypto);
  
  const userData = await getUserData();
  if (!userData) {
    throw new TokenExpiredError('Authentication required. Please login again.');
  }
  
  const response = await APIClient.post<CryptoFeeResponse>('/get-crypto-fee', {
    crypto,
    profile: "Standard",
    transactionType: "Send",
    clientId: userData.clientId,
    email: userData.clientEmail,
    isWebUI: true
  });

  console.log('Get crypto fee response:', response.data);
  return response.data;
};

/**
 * Get user's saved cryptocurrency addresses
 * @returns Promise<SavedCryptoAddress[]>
 */
export const getSavedCryptoAddresses = async (): Promise<SavedCryptoAddress[]> => {
  console.log('Getting saved crypto addresses');
  
  const userData = await getUserData();
  if (!userData) {
    throw new TokenExpiredError('Authentication required. Please login again.');
  }
  
  const response = await APIClient.post<SavedCryptoAddress[]>('/get-crypto-address', {
    clientId: userData.clientId,
    email: userData.clientEmail,
    isWebUI: true
  });

  console.log('Get saved addresses response:', response.data);
  return response.data;
};

/**
 * Create a new cryptocurrency transaction
 * @param transactionData Transaction details
 * @returns Promise<CreateCryptoTransactionResponse>
 */
export const createCryptoTransaction = async (
  transactionData: CreateCryptoTransactionRequest
): Promise<CreateCryptoTransactionResponse> => {
  console.log('Creating crypto transaction:', transactionData);
  
  const response = await APIClient.post<CreateCryptoTransactionResponse>(
    '/create-client-transaction-crypto', 
    transactionData
  );

  console.log('Create transaction response:', response.data);
  return response.data;
};

/**
 * Validate wallet address for a specific cryptocurrency and blockchain
 * @param requestData Validation request data
 * @returns Promise<ValidateWalletAddressResponse>
 */
export const validateWalletAddress = async (
  requestData: ValidateWalletAddressRequest
): Promise<ValidateWalletAddressResponse> => {
  console.log('Validating wallet address:', requestData);
  
  const response = await APIClient.post<ValidateWalletAddressResponse>(
    '/validate-wallet-address', 
    requestData
  );

  console.log('Validate address response:', response.data);
  return response.data;
};

/**
 * Save a new cryptocurrency address
 * @param requestData Save address request data
 * @returns Promise<SaveCryptoAddressResponse>
 */
export const saveCryptoAddress = async (
  requestData: SaveCryptoAddressRequest
): Promise<SaveCryptoAddressResponse> => {
  console.log('Saving crypto address:', requestData);
  
  const response = await APIClient.post<SaveCryptoAddressResponse>(
    '/save-crypto-address', 
    requestData
  );

  console.log('Save address response:', response.data);
  return response.data;
};
