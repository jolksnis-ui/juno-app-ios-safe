export interface LedgerEntry {
  _id: string;
  clientId: string;
  transactionId: string;
  transactionRef: string;
  type: string;
  currencyType: string;
  currency: string;
  amount: number;
  balanceAmount: number;
  balanceUSDAmount: number;
  overallUSDBalance: number;
  USDAmount: string;
  txnInOut: string;
  creationDate: string;
  __v: number;
}

export interface FiatBalance {
  balanceAmount: number;
  currencyType: string;
  currencyShortName: string;
  currencyFullName: string;
  currencyIcon: string;
  convertedUSDAmount: number;
  ledgerBalance: LedgerEntry[];
  isFreeze: boolean;
  holdingPercentage: number;
}

export interface CryptoBalance {
  balanceAmount: number;
  currencyType: string;
  currencyShortName: string;
  currencyFullName: string;
  currencyIcon: string;
  convertedUSDAmount: number;
  blockchain: string;
  walletNetwork: string;
  walletAddress: string;
  holdingPercentage: number;
  minTradeAmt: number;
  maxTradeAmt: number;
  isFreeze: boolean;
}

export interface BalanceResponse {
  clientBalanceList: FiatBalance[];
  totalFiatAmount: number;
}

export interface CryptoBalanceResponse {
  clientBalanceList: CryptoBalance[];
  totalCryptoAmount: number;
}
