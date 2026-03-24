export interface CryptoFeeResponse {
  error: boolean;
  data: {
    profile: string;
    transactionType: string;
    fee: number;
    fromCrypto: string;
    fromCryptoId: string;
  };
  message: string;
}

export interface SavedCryptoAddress {
  _id: string;
  clientId: string;
  cryptoId: string;
  address: string;
  nickName: string;
  blockchain: string;
  createdDate: string;
  updatedDate: string;
  __v?: number;
}

export interface CreateCryptoTransactionRequest {
  currencyType: "crypto";
  type: "Send";
  transactionEmail: string;
  transactionFee: string;
  transactionDetails: {
    cryptoId: string;
    blockchain: string;
    cryptoAmount: number;
    baseAmount: string;
    fromAddress: string;
    toAddress: string;
  };
}

export interface CreateCryptoTransactionResponse {
  msg: string;
  status: string;
}

// UI state interfaces for send crypto screens
export interface SendCryptoState {
  selectedCrypto: string;
  amount: string;
  selectedAddress: SavedCryptoAddress | null;
  senderWallet: string;
  cryptoBalance: number;
  transactionFee: number;
  isLoadingBalance: boolean;
  isLoadingFee: boolean;
  isLoadingAddresses: boolean;
}

// Validate wallet address interfaces
export interface ValidateWalletAddressRequest {
  crypto: string;
  blockchain: string;
  walletAddress: string;
  nickname: string;
}

export interface ValidateWalletAddressResponse {
  error: boolean;
  data?: boolean;
  message: string | { error: boolean; message: string };
}

// Save crypto address interfaces
export interface SaveCryptoAddressRequest {
  nickName: string;
  cryptoId: string;
  blockchain: string;
  address: string;
}

export interface SaveCryptoAddressResponse {
  clientId: string;
  cryptoId: string;
  address: string;
  nickName: string;
  blockchain: string;
  _id: string;
  createdDate: string;
  updatedDate: string;
  __v: number;
}

// Blockchain mapping for crypto currencies
export const SEND_CRYPTO_TO_BLOCKCHAIN: Record<string, string> = {
  'ETH': 'Ethereum',
  'USDT': 'Ethereum', // Default to Ethereum for USDT
  'USDC': 'Ethereum',
  'BTC': 'Bitcoin',
  'LTC': 'Litecoin',
  'XRP': 'Ripple',
  'TRX': 'Tron'
};
