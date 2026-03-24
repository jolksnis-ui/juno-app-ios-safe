export interface WalletAddress {
  _id: string;
  blockchain: string;
  network: string;
  address: {
    seedIndex: number;
    key: string;
  };
  applicationId: string;
  userId: string;
}

export interface WalletResponse {
  error: boolean;
  data: WalletAddress[];
  message: string;
}

export interface GenerateWalletData {
  applicationId: string;
  walletId: number;
  network: string;
  userId: string;
  blockchain: string;
  address: {
    seedIndex: number;
    key: string;
  };
  status: string;
}

export interface GenerateWalletResponse {
  error: boolean;
  data: GenerateWalletData;
  message: string;
}

// Crypto to Blockchain mapping
export const CRYPTO_TO_BLOCKCHAIN: Record<string, string> = {
  'ETH': 'Ethereum',
  'USDT': 'Ethereum', // ERC-20 token
  'USDC': 'Ethereum', // ERC-20 token
  'BTC': 'Bitcoin',
  'LTC': 'Litecoin',
  'XRP': 'Ripple',
  'TRX': 'Tron'
};

// Interface for the wallet address state in the UI
export interface WalletAddressState {
  address: string;
  network: string;
  cryptoType: string;
  exists: boolean;
}
