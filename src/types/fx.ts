export interface FXFormData {
  fromCurrency: {
    code: string;
    name: string;
    symbol: string;
    flag: string;
  };
  toCurrency: {
    code: string;
    name: string;
    symbol: string;
    flag: string;
  };
  fromAmount: string;
  toAmount: string;
  calculationMethod: 'fromAmount' | 'toAmount';
}

export interface FXValidation {
  fromAmount: string | null;
  toAmount: string | null;
}

export interface FiatExchangeRateRequest {
  fromCurrency: string;
  toCurrency: string;
}

export interface FiatExchangeRateResponse {
  fixedRate: number;
  convertedAmount: number;
}

export interface CreateFXTransactionRequest {
  currencyType: "fiat";
  type: "FX";
  transactionEmail: string;
  balance: {
    balanceAmount: number;
  };
  transactionDetails: {
    fromCurrency: string;
    toCurrency: string;
    fromAmount: string;
    toAmount: string;
    fxrate: number;
    fxFee: number;
    exchangeRate: number;
    calculationMethod: string;
  };
}

export interface CreateFXTransactionResponse {
  success: boolean;
  message: string;
  transactionId?: string;
}

// Supported fiat currencies for FX (reuse transfer currencies)
export const FX_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', flag: '🇮🇱' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱' },
];
