export interface APIStatement {
  _id: string;
  clientId: string;
  openingBalance: string;
  closingBalance: string;
  currency: string;
  currencyShortName: string;
  currencyType: 'fiat' | 'crypto';
  createdBy: string;
  createdAt: string;
  timePeriod: {
    fromDate: string;
    endDate: string;
  };
  __v: number;
}

export interface Statement {
  id: string;
  type: 'fiat' | 'crypto';
  currency: string;
  currencyShortName: string;
  openingBalance: string;
  closingBalance: string;
  timePeriod: {
    fromDate: string;
    endDate: string;
  };
  generatedDate: string;
  status: 'generated' | 'processing' | 'failed';
  downloadUrl?: string;
  fileName: string;
}

export interface GetStatementListRequest {
  currencyType: 'fiat' | 'crypto';
}

export interface CreateStatementRequest {
  fromDate: string; // Format: "2025-08"
  currency: string;
  currencyType: 'fiat' | 'crypto';
  name: string;
}

export interface GeneratePDFRequest {
  statementId: string;
  fromDate: string; // ISO format: "2025-08-01T00:00:00.000Z"
  endDate: string; // ISO format: "2025-09-01T00:00:00.000Z"
  currency: string;
  activeCurrencyPage: 'fiat' | 'crypto';
  downloadType: 'pdf';
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export interface FiatCurrency extends Currency {
  type: 'fiat';
}

export interface CryptoCurrency extends Currency {
  type: 'crypto';
}

export type StatementType = 'fiat' | 'crypto';

export interface MonthYear {
  month: number;
  year: number;
  displayName: string;
}