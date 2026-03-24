export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  type?: 'text' | 'balance' | 'transaction' | 'insight' | 'quotation' | 'transaction_confirm';
  metadata?: {
    balanceData?: any;
    transactionData?: any;
    actionButtons?: ChatActionButton[];
    retryInfo?: {
      attempt: number;
      maxAttempts: number;
      isRetrying: boolean;
      delay?: number;
    };
    quotationData?: QuotationData;
    transactionIntent?: TransactionIntentData;
  };
}

export interface QuotationData {
  quotationId1: string;
  quotationId2?: string;
  price: string;
  deliverQuantity: string;
  receiveQuantity: string;
  fiatAmount: number;
  cryptoAmount: number;
  fiatCurrency: string;
  cryptoCurrency: string;
  feePercent: number;
  expiresAt: Date;
  refreshCount: number;
  maxRefreshCount: number;
  status: 'active' | 'expired' | 'executed' | 'cancelled';
  transactionType: 'buy' | 'sell' | 'exchange';
}

export interface TransactionIntentData {
  type: 'buy_crypto' | 'sell_crypto' | 'exchange' | 'transfer';
  amount?: number;
  amountType?: 'fiat' | 'crypto';
  fromCurrency?: string;
  toCurrency?: string;
  recipient?: string;
  status: 'pending' | 'confirming' | 'authenticated' | 'processing' | 'completed' | 'failed';
}

export interface ChatActionButton {
  id: string;
  label: string;
  action: 'navigate' | 'execute' | 'copy' | 'confirm_transaction' | 'cancel_transaction' | 'refresh_quotation';
  data?: any;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  disabled?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatContext {
  userBalances?: {
    fiat: any[];
    crypto: any[];
    totalFiat: number;
    totalCrypto: number;
  };
  recentTransactions?: any[];
  currentScreen?: string;
  userPreferences?: {
    preferredCurrency: string;
    riskTolerance: 'low' | 'medium' | 'high';
    notificationSettings: any;
  };
}

export interface LLMRequest {
  message: string;
  context: ChatContext;
  conversationHistory: ChatMessage[];
}

export interface LLMResponse {
  content: string;
  type: 'text' | 'balance' | 'transaction' | 'insight';
  actionButtons?: ChatActionButton[];
  metadata?: any;
}

export interface FinancialInsight {
  type: 'portfolio_analysis' | 'market_trend' | 'risk_assessment' | 'recommendation';
  title: string;
  description: string;
  data: any;
  confidence: number;
  timestamp: Date;
}
