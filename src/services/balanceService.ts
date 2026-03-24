import { BalanceResponse, CryptoBalanceResponse } from '../types/balance';
import { APIClient, TokenExpiredError } from '../utils/apiClient';
import { getUserData } from './secureStorage';

// Re-export TokenExpiredError for backward compatibility
export { TokenExpiredError };

export const getClientBalances = async (): Promise<BalanceResponse> => {
  console.log("get client balance");
  
  const userData = await getUserData();
  if (!userData) {
    throw new TokenExpiredError('Authentication required. Please login again.');
  }
  
  const response = await APIClient.post<BalanceResponse>('/get-client-balances', {
    clientId: userData.clientId,
    email: userData.clientEmail,
    isWebUI: true
  });

  return response.data;
};

export const getCryptoBalances = async (): Promise<CryptoBalanceResponse> => {
  console.log("get crypto balance")
  const userData = await getUserData();
  if (!userData) {
    throw new TokenExpiredError('Authentication required. Please login again.');
  }

  const response = await APIClient.post<CryptoBalanceResponse>('/get-crypto-balance', {
    clientId: userData.clientId,
    email: userData.clientEmail
  });

  return response.data;
};
