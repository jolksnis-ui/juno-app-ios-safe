import { QuotationData } from '../types/chat';
import { requestForQuotation, getBlockchainForCrypto, BuySellQuotationRequest } from './quotationService';
import { createCryptoTransaction, CreateBuySellCryptoTransactionRequest } from './transactionService';
import { getCryptoFee } from './exchangeService';
import { getUserData } from './secureStorage';

export interface ChatQuotationSession {
  sessionId: string;
  quotationData: QuotationData;
  intervalId?: NodeJS.Timeout;
  lastEditedField: 'from' | 'to';
  originalFromAmount: string;
  originalToAmount: string;
  userEmail: string;
  clientId: string;
  accountNumber: string;
}

export class ChatQuotationManager {
  private static instance: ChatQuotationManager;
  private activeSessions: Map<string, ChatQuotationSession> = new Map();
  
  public static getInstance(): ChatQuotationManager {
    if (!ChatQuotationManager.instance) {
      ChatQuotationManager.instance = new ChatQuotationManager();
    }
    return ChatQuotationManager.instance;
  }

  /**
   * Start a new quotation session for buy crypto
   * Reuses the exact logic from buy-crypto-confirm screen
   */
  async startBuyQuotation(
    sessionId: string,
    fromCurrency: { code: string; name: string },
    toCurrency: { code: string; name: string },
    amount: number,
    amountType: 'fiat' | 'crypto',
    onQuotationUpdate: (quotation: QuotationData) => void,
    onExpiry: () => void
  ): Promise<QuotationData> {
    try {
      // Get user data for the quotation
      const userData = await getUserData();
      if (!userData) {
        throw new Error('User not authenticated');
      }

      // Get fee for the transaction (reusing existing service)
      const feeResponse = await getCryptoFee(
        toCurrency.code,
        userData.clientId,
        userData.clientEmail
      );
      const feePercent = feeResponse.data.fee;

      // Prepare quotation request based on amount type
      // This follows the exact same logic as buy-crypto-confirm.tsx
      const lastEditedField = amountType === 'fiat' ? 'from' : 'to';
      let quotationRequest: BuySellQuotationRequest;

      if (lastEditedField === 'from') {
        // User entered fiat amount - deduct fee before sending to API
        const fiatAfterFee = amount - (amount * feePercent / 100);
        
        quotationRequest = {
          userId: userData.accountNumber,
          crypto: toCurrency.code,
          blockchain: getBlockchainForCrypto(toCurrency.code),
          fiatAmount: fiatAfterFee.toFixed(2),
          side: 'Buy' as const,
          fiat: fromCurrency.code,
          email: userData.clientEmail,
          isWebUI: true
        };
      } else {
        // User entered crypto amount - no fee deduction needed
        quotationRequest = {
          userId: userData.accountNumber,
          crypto: toCurrency.code,
          blockchain: getBlockchainForCrypto(toCurrency.code),
          cryptoAmount: amount.toString(),
          side: 'Buy' as const,
          fiat: fromCurrency.code,
          email: userData.clientEmail,
          isWebUI: true
        };
      }

      // Request initial quotation (reusing existing service)
      const response = await requestForQuotation(quotationRequest);
      
      // Calculate final amounts based on quotation response
      // This is the exact logic from buy-crypto-confirm.tsx
      let finalFiatAmount: number;
      let finalCryptoAmount: number;

      if (lastEditedField === 'from') {
        finalFiatAmount = amount;
        finalCryptoAmount = parseFloat(response.data.receiveQuantity);
      } else {
        const deliverAmount = parseFloat(response.data.deliverQuantity);
        finalFiatAmount = deliverAmount + (deliverAmount * feePercent / 100);
        finalCryptoAmount = amount;
      }

      // Create quotation data object
      const quotationData: QuotationData = {
        quotationId1: response.data.quotationId1,
        quotationId2: response.data.quotationId2,
        price: response.data.price,
        deliverQuantity: response.data.deliverQuantity,
        receiveQuantity: response.data.receiveQuantity,
        fiatAmount: finalFiatAmount,
        cryptoAmount: finalCryptoAmount,
        fiatCurrency: fromCurrency.code,
        cryptoCurrency: toCurrency.code,
        feePercent,
        expiresAt: new Date(response.data.expireTime),
        refreshCount: 1,
        maxRefreshCount: 5,
        status: 'active',
        transactionType: 'buy'
      };

      // Store session
      const session: ChatQuotationSession = {
        sessionId,
        quotationData,
        lastEditedField,
        originalFromAmount: amountType === 'fiat' ? amount.toString() : finalFiatAmount.toString(),
        originalToAmount: amountType === 'crypto' ? amount.toString() : finalCryptoAmount.toString(),
        userEmail: userData.clientEmail,
        clientId: userData.clientId,
        accountNumber: userData.accountNumber
      };

      // Set up auto-refresh interval (same as buy-crypto-confirm)
      session.intervalId = setInterval(async () => {
        try {
          const updatedQuotation = await this.refreshQuotation(sessionId);
          if (updatedQuotation) {
            onQuotationUpdate(updatedQuotation);
            
            // Check if max refresh reached
            if (updatedQuotation.refreshCount >= updatedQuotation.maxRefreshCount) {
              updatedQuotation.status = 'expired';
              this.stopQuotation(sessionId);
              onExpiry();
            }
          }
        } catch (error) {
          console.error('Error refreshing quotation:', error);
        }
      }, 5000); // 5 second interval as per original implementation

      this.activeSessions.set(sessionId, session);
      
      return quotationData;
    } catch (error) {
      console.error('Error starting quotation:', error);
      throw error;
    }
  }

  /**
   * Refresh an existing quotation
   * Reuses the fetch logic from buy-crypto-confirm
   */
  async refreshQuotation(sessionId: string): Promise<QuotationData | null> {
    const session = this.activeSessions.get(sessionId);
    if (!session || session.quotationData.status !== 'active') {
      return null;
    }

    try {
      let quotationRequest: BuySellQuotationRequest;
      
      if (session.lastEditedField === 'from') {
        const fiatAfterFee = parseFloat(session.originalFromAmount) - 
          (parseFloat(session.originalFromAmount) * session.quotationData.feePercent / 100);
        
        quotationRequest = {
          userId: session.accountNumber,
          crypto: session.quotationData.cryptoCurrency,
          blockchain: getBlockchainForCrypto(session.quotationData.cryptoCurrency),
          fiatAmount: fiatAfterFee.toFixed(2),
          side: 'Buy' as const,
          fiat: session.quotationData.fiatCurrency,
          email: session.userEmail,
          isWebUI: true
        };
      } else {
        quotationRequest = {
          userId: session.accountNumber,
          crypto: session.quotationData.cryptoCurrency,
          blockchain: getBlockchainForCrypto(session.quotationData.cryptoCurrency),
          cryptoAmount: session.originalToAmount,
          side: 'Buy' as const,
          fiat: session.quotationData.fiatCurrency,
          email: session.userEmail,
          isWebUI: true
        };
      }

      const response = await requestForQuotation(quotationRequest);
      
      // Update quotation data
      let finalFiatAmount: number;
      let finalCryptoAmount: number;

      if (session.lastEditedField === 'from') {
        finalFiatAmount = parseFloat(session.originalFromAmount);
        finalCryptoAmount = parseFloat(response.data.receiveQuantity);
      } else {
        const deliverAmount = parseFloat(response.data.deliverQuantity);
        finalFiatAmount = deliverAmount + (deliverAmount * session.quotationData.feePercent / 100);
        finalCryptoAmount = parseFloat(session.originalToAmount);
      }

      session.quotationData = {
        ...session.quotationData,
        quotationId1: response.data.quotationId1,
        quotationId2: response.data.quotationId2,
        price: response.data.price,
        deliverQuantity: response.data.deliverQuantity,
        receiveQuantity: response.data.receiveQuantity,
        fiatAmount: finalFiatAmount,
        cryptoAmount: finalCryptoAmount,
        expiresAt: new Date(response.data.expireTime),
        refreshCount: session.quotationData.refreshCount + 1
      };

      return session.quotationData;
    } catch (error) {
      console.error('Error refreshing quotation:', error);
      return null;
    }
  }

  /**
   * Execute buy transaction using the current quotation
   * Reuses the exact transaction logic from buy-crypto-confirm
   */
  async executeBuyTransaction(sessionId: string): Promise<any> {
    const session = this.activeSessions.get(sessionId);
    if (!session || session.quotationData.status !== 'active') {
      throw new Error('No active quotation found');
    }

    // Stop quotation updates immediately
    this.stopQuotation(sessionId);

    try {
      // Calculate fee amount (same logic as buy-crypto-confirm)
      const feeAmount = session.lastEditedField === 'from' 
        ? parseFloat(session.originalFromAmount) * session.quotationData.feePercent / 100
        : parseFloat(session.quotationData.deliverQuantity) * session.quotationData.feePercent / 100;

      // Build transaction request (exact same structure as buy-crypto-confirm)
      const transactionRequest: CreateBuySellCryptoTransactionRequest = {
        currencyType: 'crypto',
        type: 'Buy',
        clientId: session.clientId,
        transactionEmail: session.userEmail,
        transactionFee: parseFloat(feeAmount.toFixed(2)),
        transactionDetails: {
          quotationId1: session.quotationData.quotationId1,
          ...(session.quotationData.quotationId2 && { 
            quotationId2: session.quotationData.quotationId2 
          }),
          fiatAmount: parseFloat(session.quotationData.fiatAmount.toFixed(2)),
          cryptoAmount: session.quotationData.cryptoAmount,
          fiatCurrency: session.quotationData.fiatCurrency,
          cryptoId: session.quotationData.cryptoCurrency,
          blockchain: getBlockchainForCrypto(session.quotationData.cryptoCurrency),
          quotationPrice: parseFloat(session.quotationData.price),
          fee: session.quotationData.feePercent,
          calculationMethod: session.lastEditedField === 'from' ? 'fiat' : 'crypto',
          netCryptoAmount: 0,
        },
        email: session.userEmail,
        isWebUI: true
      };

      // Execute transaction using existing service
      const response = await createCryptoTransaction(transactionRequest);
      
      // Mark quotation as executed
      session.quotationData.status = 'executed';
      
      return response;
    } catch (error) {
      // Mark quotation as failed
      if (session) {
        session.quotationData.status = 'cancelled';
      }
      throw error;
    }
  }

  /**
   * Stop quotation updates and clean up
   */
  stopQuotation(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      if (session.intervalId) {
        clearInterval(session.intervalId);
      }
      if (session.quotationData.status === 'active') {
        session.quotationData.status = 'cancelled';
      }
    }
  }

  /**
   * Get active quotation for a session
   */
  getQuotation(sessionId: string): QuotationData | null {
    const session = this.activeSessions.get(sessionId);
    return session ? session.quotationData : null;
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    const now = new Date();
    this.activeSessions.forEach((session, sessionId) => {
      if (session.quotationData.expiresAt < now && session.quotationData.status === 'active') {
        this.stopQuotation(sessionId);
        this.activeSessions.delete(sessionId);
      }
    });
  }
}

export const chatQuotationManager = ChatQuotationManager.getInstance();