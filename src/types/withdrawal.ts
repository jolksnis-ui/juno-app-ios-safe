export interface Country {
  _id: string;
  name: string;
  enabled: boolean;
  __v: number;
  code: string;
}

export interface SavedAccount {
  id: string;
  beneficiaryName: string;
  accountNumber: string;
  bankName: string;
  country: Country;
  iban?: string;
  swiftCode?: string;
  sortCode?: string;
  createdAt: string;
}

export interface WithdrawalFormData {
  // Currency and Amount
  selectedCurrency: {
    code: string;
    name: string;
    symbol: string;
  };
  amount: string;
  
  // Beneficiary Details
  beneficiaryName: string;
  beneficiaryCountry: Country | null;
  beneficiaryAddress: string;
  
  // Bank Details
  bankName: string;
  bankCountry: Country | null;
  bankAddress: string;
  saveBankAccount: boolean;
  accountNickname: string;
  
  // Account Details
  accountNumber: string;
  sortCode: string;
  iban: string;
  swiftCode: string;
  
  // Additional Information
  additionalInfo: string;
  reference: string;
  attachments: AttachmentFile[];
}

export interface AttachmentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uri: string;
}

export interface WithdrawalValidation {
  beneficiaryName: string | null;
  beneficiaryCountry: string | null;
  amount: string | null;
  bankCountry: string | null;
  accountNickname: string | null;
}

// Supported fiat currencies for withdrawal
export const WITHDRAWAL_CURRENCIES = [
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

// Mock saved accounts data (will be replaced with API later)
export const MOCK_SAVED_ACCOUNTS: SavedAccount[] = [
  {
    id: '1',
    beneficiaryName: 'LEONARDO BIANCHI',
    accountNumber: 'GB29 NWBK 6016 1331 9268 19',
    bankName: 'NatWest Bank',
    country: { _id: '1', code: 'GB', name: 'United Kingdom', enabled: true, __v: 0 },
    iban: 'GB29 NWBK 6016 1331 9268 19',
    swiftCode: 'NWBKGB2L',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    beneficiaryName: 'ALEXANDRA SMITH',
    accountNumber: 'DE44 5001 0517 5407 3249 31',
    bankName: 'Deutsche Bank',
    country: { _id: '2', code: 'DE', name: 'Germany', enabled: true, __v: 0 },
    iban: 'DE44 5001 0517 5407 3249 31',
    swiftCode: 'DEUTDEFF',
    createdAt: '2024-02-20',
  },
  {
    id: '3',
    beneficiaryName: 'LEONARDO ROSSI',
    accountNumber: 'GB29 NWBK 6016 1331 9268 19',
    bankName: 'NatWest Bank',
    country: { _id: '3', code: 'GB', name: 'United Kingdom', enabled: true, __v: 0 },
    iban: 'GB29 NWBK 6016 1331 9268 19',
    swiftCode: 'NWBKGB2L',
    createdAt: '2024-03-10',
  },
  {
    id: '4',
    beneficiaryName: 'JORDAN TAYLOR',
    accountNumber: 'IT60 X054 2811 1010 0000 0123 456',
    bankName: 'UniCredit Bank',
    country: { _id: '4', code: 'IT', name: 'Italy', enabled: true, __v: 0 },
    iban: 'IT60 X054 2811 1010 0000 0123 456',
    swiftCode: 'UNCRITMM',
    createdAt: '2024-04-05',
  },
  {
    id: '5',
    beneficiaryName: 'SOFIA VERDI',
    accountNumber: 'GB29 NWBK 6016 1331 9268 20',
    bankName: 'NatWest Bank',
    country: { _id: '5', code: 'GB', name: 'United Kingdom', enabled: true, __v: 0 },
    iban: 'GB29 NWBK 6016 1331 9268 20',
    swiftCode: 'NWBKGB2L',
    createdAt: '2024-05-12',
  },
  {
    id: '6',
    beneficiaryName: 'MICHAEL JOHNSON',
    accountNumber: 'DE44 5001 0517 5407 3249 32',
    bankName: 'Deutsche Bank',
    country: { _id: '6', code: 'DE', name: 'Germany', enabled: true, __v: 0 },
    iban: 'DE44 5001 0517 5407 3249 32',
    swiftCode: 'DEUTDEFF',
    createdAt: '2024-06-18',
  },
  {
    id: '7',
    beneficiaryName: 'EMMA ROMANO',
    accountNumber: 'GB29 NWBK 6016 1331 9268 21',
    bankName: 'NatWest Bank',
    country: { _id: '7', code: 'GB', name: 'United Kingdom', enabled: true, __v: 0 },
    iban: 'GB29 NWBK 6016 1331 9268 21',
    swiftCode: 'NWBKGB2L',
    createdAt: '2024-07-25',
  },
  {
    id: '8',
    beneficiaryName: 'CHRIS WILLIAMS',
    accountNumber: 'IT60 X054 2811 1010 0000 0123 457',
    bankName: 'UniCredit Bank',
    country: { _id: '8', code: 'IT', name: 'Italy', enabled: true, __v: 0 },
    iban: 'IT60 X054 2811 1010 0000 0123 457',
    swiftCode: 'UNCRITMM',
    createdAt: '2024-08-30',
  },
];
