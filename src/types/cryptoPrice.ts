export interface PricePoint {
  timestamp: number;
  price: number;
}

export interface CryptoStatistics {
  price: string;
  marketCap: string;
  change24h: number;
  changeDirection: 'up' | 'down';
}

export interface CryptoPriceTrend {
  coin: string;
  trend: [number, number][];
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

export type TimePeriod = '1W' | '1M' | '3M' | '6M' | '1Y';
