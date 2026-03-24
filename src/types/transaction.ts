export type TransactionType = 'buy' | 'sell' | 'exchange';

export interface TransactionConfig {
  type: TransactionType;
  headerTitle: string;
  fromLabel: string;
  toLabel: string;
  fromCurrencyType: 'fiat' | 'crypto';
  toCurrencyType: 'fiat' | 'crypto';
  buttonText: string;
  confirmButtonText: string;
  apiSide: 'Buy' | 'Sell';
}

export const TRANSACTION_CONFIGS: Record<TransactionType, TransactionConfig> = {
  buy: {
    type: 'buy',
    headerTitle: 'BUY CRYPTO',
    fromLabel: 'YOU PAY',
    toLabel: 'YOU GET',
    fromCurrencyType: 'fiat',
    toCurrencyType: 'crypto',
    buttonText: 'CONTINUE',
    confirmButtonText: 'BUY NOW',
    apiSide: 'Buy'
  },
  sell: {
    type: 'sell',
    headerTitle: 'SELL CRYPTO',
    fromLabel: 'SELL',
    toLabel: 'RECEIVE',
    fromCurrencyType: 'crypto',
    toCurrencyType: 'fiat',
    buttonText: 'CONTINUE',
    confirmButtonText: 'SELL NOW',
    apiSide: 'Sell'
  },
  exchange: {
    type: 'exchange',
    headerTitle: 'EXCHANGE CRYPTO',
    fromLabel: 'FROM',
    toLabel: 'TO',
    fromCurrencyType: 'crypto',
    toCurrencyType: 'crypto',
    buttonText: 'CONTINUE',
    confirmButtonText: 'EXCHANGE NOW',
    apiSide: 'Buy' // Will be updated when exchange is implemented
  }
};

export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'FAILED' | 'REJECTED';

export interface Transaction {
  id: string;                    // transactionId from API
  type: string;                  // type from API (Buy, Sell, Exchange, etc.)
  amount: string;                // Original currency amount (e.g., "0.36728192")
  currency: string;              // currency from API (BTC, ETH, USD, etc.)
  status: TransactionStatus;     // mapped from status.code
  timestamp: Date;               // createdDate converted to local timezone
  currencyType: 'crypto' | 'fiat'; // currencyType from API
}

// API Response interfaces (minimal fields we need)
export interface APITransactionResponse {
  clientsTransactionData: APITransaction[];
  totalCount: number;
  tabSettings: {
    fiatTab: string;
    cryptoTab: string;
  };
}

export interface APITransaction {
  _id: string;
  transactionId: string;
  type: string;
  currency: string;
  currencyType: 'crypto' | 'fiat';
  status: {
    code: string;
    message: string;
    updated: string;
  };
  createdDate: string;
  transactionDetails: Array<{
    // Buy/Sell transaction fields
    cryptoAmount?: string;
    fiatAmount?: number;
    cryptoId?: string;
    fiatCurrency?: string;
    amount?: string;
    
    // Exchange transaction fields
    fromCryptoAmount?: string;
    toCryptoAmount?: string;
    fromCryptoId?: string;
    toCryptoId?: string;
    exchangeRate?: number;
    quotationPrice?: number;
    fee?: number;
    netExchangeAmount?: number;
    calculationMethod?: string;
    blockchain?: string;
    network?: string;
    quotationId1?: string;
    quotationId2?: string;
    
    // FX transaction fields
    fromCurrency?: string;
    toCurrency?: string;
    fromAmount?: string;
    toAmount?: string;
    fxrate?: number;
    fxFee?: number;
  }>;
}

// Helper functions
export const mapTransactionStatus = (statusCode: string): TransactionStatus => {
  const status = statusCode.toLowerCase();
  if (status.includes('completed') || status === 'completed') return 'COMPLETED';
  if (status.includes('failed') || status === 'failed') return 'FAILED';
  if (status.includes('rejected') || status === 'rejected') return 'REJECTED';
  if (status.includes('pending') || status === 'pending') return 'PENDING';
  
  // Handle exact matches for common status codes
  if (status === 'success' || status === 'successful') return 'COMPLETED';
  if (status === 'error' || status === 'cancelled' || status === 'canceled') return 'FAILED';
  
  return 'PENDING';
};

export const formatTransactionDate = (utcDate: string): string => {
  return new Date(utcDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export const getTransactionAmount = (apiTransaction: APITransaction): string => {
  const details = apiTransaction.transactionDetails[0];
  if (!details) return '0';

  // Handle Exchange transactions - show both amounts with arrow
  if (apiTransaction.type === 'Exchange') {
    const fromAmount = details.fromCryptoAmount || '0';
    const toAmount = details.toCryptoAmount || '0';
    const fromCrypto = details.fromCryptoId || '';
    const toCrypto = details.toCryptoId || '';
    return `${fromAmount} ${fromCrypto} → ${toAmount} ${toCrypto}`;
  }

  // Handle FX transactions - show both amounts with arrow (similar to Exchange)
  if (apiTransaction.type === 'FX') {
    const fromAmount = details.fromAmount || '0';
    const toAmount = details.toAmount || '0';
    const fromCurrency = details.fromCurrency || '';
    const toCurrency = details.toCurrency || '';
    return `${fromAmount} ${fromCurrency} → ${toAmount} ${toCurrency}`;
  }

  // Handle Buy/Sell transactions (existing logic)
  if(details.amount) {
    return details.amount.toString()
  } else if(details.cryptoAmount) {
    return details.cryptoAmount.toString()
  } else return '0'
};

export const transformAPITransaction = (apiTransaction: APITransaction): Transaction => {
  return {
    id: apiTransaction.transactionId,
    type: apiTransaction.type,
    amount: getTransactionAmount(apiTransaction),
    currency: apiTransaction.currency,
    status: mapTransactionStatus(apiTransaction.status.code),
    timestamp: new Date(apiTransaction.createdDate),
    currencyType: apiTransaction.currencyType,
  };
};
