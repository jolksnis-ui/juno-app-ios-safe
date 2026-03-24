import { APIClient, TokenExpiredError } from '../utils/apiClient';
import { getUserData } from './secureStorage';

// Re-export TokenExpiredError for backward compatibility
export { TokenExpiredError };

// Buy/Sell quotation request (involves fiat currency)
export interface BuySellQuotationRequest {
  userId: string;
  crypto: string;
  blockchain: string;
  fiatAmount?: string;
  cryptoAmount?: string;
  side: 'Buy' | 'Sell';
  fiat: string;
  email: string;
  isWebUI: boolean;
}

// Exchange quotation request (crypto to crypto)
export interface ExchangeQuotationRequest {
  userId: string;
  fromCrypto: string;
  blockchain: string;
  fromCryptoAmount?: string;
  toCryptoAmount?: string;
  side: 'Buy' | 'Sell';
  toCrypto: string;
  email: string;
  isWebUI: boolean;
}

// Union type for all quotation requests
export type QuotationRequest = BuySellQuotationRequest | ExchangeQuotationRequest;

export interface QuotationResponse {
  error: boolean;
  data: {
    quantity: string;
    accountId: string;
    symbol: string;
    side: string;
    receiveCurrency: string;
    deliverCurrency: string;
    quoteTime: number;
    expireTime: number;
    price: string;
    deliverQuantity: string;
    receiveQuantity: string;
    quotationId1: string;
    quotationId2: string;
    quotationId11Details: {
      type: string;
      data: {
        accountId: string;
        quoteId: string;
        symbol: string;
        side: string;
        receiveCurrency: string;
        deliverCurrency: string;
        quoteTime: number;
        expireTime: number;
        price: string;
        deliverQuantity: string;
        receiveQuantity: string;
      };
    };
  };
  message: string;
}

const BASE_URL = 'https://dev.junomoney.org';

/**
 * Get blockchain name for crypto currency
 */
export const getBlockchainForCrypto = (crypto: string): string => {
  const blockchainMap: { [key: string]: string } = {
    'ETH': 'Ethereum',
    'BTC': 'Bitcoin',
    'LTC': 'Litecoin',
    'BCH': 'Bitcoin Cash',
    'XRP': 'Ripple',
    'ADA': 'Cardano',
    'DOT': 'Polkadot',
    'LINK': 'Chainlink',
    'UNI': 'Uniswap',
    'USDT': 'Ethereum', // USDT typically runs on Ethereum
    'USDC': 'Ethereum', // USDC typically runs on Ethereum
  };
  return blockchainMap[crypto] || 'Ethereum';
};

/**
 * Request for quotation from the API
 */
export const requestForQuotation = async (
  requestData: QuotationRequest
): Promise<QuotationResponse> => {
  try {

    console.log(requestData)
    const response = await APIClient.post<QuotationResponse>('/request-for-quotation', requestData);
    
    if (response.data.error) {
      throw new Error(response.data.message || 'Quotation API returned error');
    }

    return response.data;
  } catch (error) {
    console.error('Error requesting quotation:', error);
    throw error;
  }
};
