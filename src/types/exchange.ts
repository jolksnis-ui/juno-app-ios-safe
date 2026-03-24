export interface Currency {
  code: string;
  name: string;
  symbol: string;
  icon: string;
  type: 'fiat' | 'crypto';
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: number;
}

export interface BuyCryptoData {
  fromCurrency: Currency;
  toCurrency: Currency;
  fromAmount: string;
  toAmount: string;
  exchangeRate: number;
  fromBalance: number;
  toBalance: number;
}

export const SUPPORTED_CURRENCIES: Record<string, Currency> = {
  // Fiat currencies
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    icon: '🇺🇸',
    type: 'fiat'
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    icon: '🇪🇺',
    type: 'fiat'
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    icon: '🇬🇧',
    type: 'fiat'
  },
  
  // Crypto currencies
  BTC: {
    code: 'BTC',
    name: 'Bitcoin',
    symbol: '₿',
    icon: '₿',
    type: 'crypto'
  },
  ETH: {
    code: 'ETH',
    name: 'Ethereum',
    symbol: 'Ξ',
    icon: 'Ξ',
    type: 'crypto'
  },
  XRP: {
    code: 'XRP',
    name: 'Ripple',
    symbol: 'XRP',
    icon: '◊',
    type: 'crypto'
  },
  USDT: {
    code: 'USDT',
    name: 'Tether',
    symbol: '₮',
    icon: '₮',
    type: 'crypto'
  },
  USDC: {
    code: 'USDC',
    name: 'USD Coin',
    symbol: 'USDC',
    icon: '◎',
    type: 'crypto'
  },
  LTC: {
    code: 'LTC',
    name: 'Litecoin',
    symbol: 'Ł',
    icon: 'Ł',
    type: 'crypto'
  },
  TRX: {
    code: 'TRX',
    name: 'Tron',
    symbol: 'TRX',
    icon: '▲',
    type: 'crypto'
  }
};
