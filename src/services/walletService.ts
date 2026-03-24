import { WalletResponse, GenerateWalletResponse } from '../types/wallet';
import { APIClient, TokenExpiredError } from '../utils/apiClient';
import { getUserData } from './secureStorage';

// Re-export TokenExpiredError for backward compatibility
export { TokenExpiredError };

/**
 * Get wallet address for specified blockchains
 * @param blockchainList Array of blockchain names (e.g., ['Ethereum', 'Bitcoin'])
 * @returns Promise<WalletResponse>
 */
export const getWalletAddress = async (blockchainList: string[]): Promise<WalletResponse> => {
  console.log('Getting wallet address for blockchains:', blockchainList);
  
  const userData = await getUserData();
  if (!userData) {
    throw new TokenExpiredError('Authentication required. Please login again.');
  }
  
  const response = await APIClient.post<WalletResponse>('/get-wallet-address', {
    blockchainList,
    accountNumber: userData.accountNumber,
    email: userData.clientEmail,
    isWebUI: true
  });

  console.log('Get wallet address response:', response.data);
  return response.data;
};

/**
 * Generate new wallet address for specified blockchain
 * @param blockchain Blockchain name (e.g., 'Ethereum', 'Bitcoin')
 * @returns Promise<GenerateWalletResponse>
 */
export const generateWalletAddress = async (blockchain: string): Promise<GenerateWalletResponse> => {
  console.log('Generating wallet address for blockchain:', blockchain);
  
  const userData = await getUserData();
  if (!userData) {
    throw new TokenExpiredError('Authentication required. Please login again.');
  }

  const response = await APIClient.post<GenerateWalletResponse>('/generate-wallet-address', {
    blockchain,
    accountNumber: userData.accountNumber,
    email: userData.clientEmail,
    isWebUI: true
  });

  console.log('Generate wallet address response:', response.data);
  return response.data;
};
