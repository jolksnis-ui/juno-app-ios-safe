export interface IBANAccount {
  _id: string;
  accountId: string;
  correlationId: string;
  client: string;
  name: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  city: string;
  region: string;
  postcode: string;
  country: string;
  nationality: string;
  registrationNumber: string;
  isIndividual: boolean;
  currecny: string; // Note: API has typo in field name
  currency: string;
  isDisable: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
  bic_number: string;
  iban_number: string;
  account_number: string;
  sort_code?: string;
  countryName: string;
}

export interface IBANAccountResponse {
  accounts: IBANAccount[];
}

export interface DepositCurrency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}
