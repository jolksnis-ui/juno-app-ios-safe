export interface Country {
  _id: string;
  name: string;
  enabled: boolean;
  __v: number;
  code: string;
}

export interface SavedRecipient {
  id: string;
  recipientName: string;
  accountNumber: string;
  bankName: string;
  country: Country;
  iban?: string;
  swiftCode?: string;
  sortCode?: string;
  createdAt: string;
}

export interface PaymentOutFormData {
  // Currency and Amount
  selectedCurrency: {
    code: string;
    name: string;
    symbol: string;
  };
  amount: string;
  
  // Recipient Details
  recipientName: string;
  recipientCountry: Country | null;
  recipientAddress: string;
  
  // Bank Details
  bankName: string;
  bankCountry: Country | null;
  bankAddress: string;
  saveRecipient: boolean;
  recipientNickname: string;
  
  // Account Details
  accountNumber: string;
  sortCode: string;
  iban: string;
  swiftCode: string;
  
  // Payment Details
  paymentPurpose: string;
  reference: string;
  additionalInfo: string;
  attachments: AttachmentFile[];
}

export interface AttachmentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uri: string;
}

export interface PaymentOutValidation {
  recipientName: string | null;
  recipientCountry: string | null;
  amount: string | null;
  bankCountry: string | null;
  recipientNickname: string | null;
  paymentPurpose: string | null;
}

// Supported fiat currencies for payment out (same as withdrawal)
export const PAYMENT_CURRENCIES = [
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

// Common payment purposes
export const PAYMENT_PURPOSES = [
  'Invoice Payment',
  'Service Payment',
  'Salary Payment',
  'Supplier Payment',
  'Contractor Payment',
  'Rent Payment',
  'Loan Payment',
  'Insurance Payment',
  'Utility Payment',
  'Other',
];
