export interface TransferFormData {
  // Currency and Amount
  selectedCurrency: {
    code: string;
    name: string;
    symbol: string;
    flag: string;
  };
  amount: string;
  
  // Transfer Details
  email: string;
  reference: string;
}

export interface TransferValidation {
  email: string | null;
  amount: string | null;
}

export interface ValidateEmailRequest {
  userEmail: string;
}

export interface ValidateEmailResponse {
  emailExist: boolean;
  username: string | null;
}

export interface CreateTransferTransactionRequest {
  currencyType: "fiat";
  type: "Transfer";
  currency: string;
  transactionDetails: {
    email: string;
    amount: string;
    reference: string;
    currency: string;
  };
  transactionEmail: string;
  balance: {
    balanceAmount: string;
    updated: string;
  };
}

export interface CreateTransferTransactionResponse {
  success: boolean;
  message: string;
  transactionId?: string;
}

// Supported fiat currencies for transfer (reuse withdrawal currencies)
export const TRANSFER_CURRENCIES = [
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
