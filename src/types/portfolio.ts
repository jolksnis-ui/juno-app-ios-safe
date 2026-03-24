export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
  changePercent24h: number;
  icon: string;
  color: string;
}

export interface FiatAsset {
  id: string;
  currency: string;
  name: string;
  balance: number;
  symbol: string;
  icon: string;
}


export type AssetType = 'crypto' | 'fiat';
