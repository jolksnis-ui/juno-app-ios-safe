import { APIClient, TokenExpiredError } from '../utils/apiClient';
import { getUserData } from './secureStorage';

// Re-export TokenExpiredError for backward compatibility
export { TokenExpiredError };

export interface CryptoPriceTrend {
  coin: string;
  trend: [number, number][]; // [timestamp, price]
}

export interface CryptoPriceTrendResponse {
  data: CryptoPriceTrend[];
  lastUpdated: string;
  cached: boolean;
}

export interface CryptoPriceData {
  current_price: number;
  market_cap: string;  // Already formatted like "2.36T"
  name: string;
  price_change_percentage_24h: number;
  symbol: string;
}

export interface CryptoPricesResponse {
  data: CryptoPriceData[];  // Array, not object
  cached: boolean;
  lastUpdated: string;
}

// Time period mapping
const TIME_PERIOD_DAYS: Record<string, number> = {
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365
};

/**
 * Get crypto price trend data for chart
 */
export const getCryptoPriceTrend = async (
  coinName: string, 
  timePeriod: '1W' | '1M' | '3M' | '6M' | '1Y'
): Promise<CryptoPriceTrendResponse> => {
  console.log(`Getting crypto price trend for ${coinName}, period: ${timePeriod}`);
  
  const userData = await getUserData();
  if (!userData) {
    throw new TokenExpiredError('Authentication required. Please login again.');
  }

  const response = await APIClient.post<CryptoPriceTrendResponse>('/get-crypto-price', {
    clientEmail: userData.clientEmail,
    REQUEST_TYPE: 'coingecko-trend-coin',
    coinName: coinName.toLowerCase(),
    range: TIME_PERIOD_DAYS[timePeriod]
  });

  return response.data;
};

/**
 * Get current crypto prices and statistics
 */
export const getCryptoPrices = async (): Promise<CryptoPricesResponse> => {
  console.log('Getting current crypto prices');
  
  const userData = await getUserData();
  if (!userData) {
    throw new TokenExpiredError('Authentication required. Please login again.');
  }

  const response = await APIClient.post<CryptoPricesResponse>('/get-crypto-price', {
    clientEmail: userData.clientEmail,
    REQUEST_TYPE: 'coingecko-prices'
  });

  return response.data;
};

/**
 * Format market cap value for display
 */
export const formatMarketCap = (value: number): string => {
  if (value >= 1000000000000) {
    return `${(value / 1000000000000).toFixed(1)}T`;
  } else if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`;
  } else if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  return value.toLocaleString();
};

/**
 * Get coin name mapping for API calls
 */
export const getCoinNameForAPI = (symbol: string): string => {
  const coinMapping: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'LTC': 'litecoin',
    'TRX': 'tron',
    'USDT': 'tether',
    'USDC': 'usd-coin',
    'TRC20-USDT': 'tether'
  };
  
  return coinMapping[symbol.toUpperCase()] || symbol.toLowerCase();
};
