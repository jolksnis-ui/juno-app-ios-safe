import { getCryptoBalances, getClientBalances } from './balanceService';

export interface BuyCryptoIntent {
  type: 'buy_crypto';
  amount?: number;
  amountType?: 'fiat' | 'crypto';
  fromCurrency?: string;
  toCurrency?: string;
  confidence: number;
  rawText: string;
  needsClarification?: {
    reason: string;
    suggestions?: string[];
  };
}

export interface TransactionIntent {
  type: 'buy_crypto' | 'sell_crypto' | 'exchange' | 'transfer' | 'send';
  intent: BuyCryptoIntent | any;
}

export class TransactionIntentParser {
  private static instance: TransactionIntentParser;

  private readonly cryptoCurrencies = ['BTC', 'ETH', 'USDT', 'USDC', 'LTC', 'BCH', 'XRP', 'ADA', 'DOT', 'LINK', 'UNI'];
  private readonly fiatCurrencies = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'SGD', 'JPY'];
  
  private readonly buyPatterns = [
    /(?:buy|purchase|get|acquire)\s+(?:me\s+)?(?:some\s+)?(.+)/i,
    /(?:i\s+)?(?:want|need|would\s+like)\s+(?:to\s+)?(?:buy|purchase|get)\s+(.+)/i,
    /(?:can\s+)?(?:i|you)\s+(?:buy|purchase|get)\s+(.+)/i,
    /(\$?[\d,]+\.?\d*)\s+(?:worth\s+)?(?:of\s+)?(\w+)/i,
    /convert\s+(\$?[\d,]+\.?\d*)\s+(\w+)\s+to\s+(\w+)/i,
  ];

  private readonly cryptoSymbolMap: { [key: string]: string } = {
    'bitcoin': 'BTC',
    'btc': 'BTC',
    'ethereum': 'ETH',
    'eth': 'ETH',
    'tether': 'USDT',
    'usdt': 'USDT',
    'usdc': 'USDC',
    'litecoin': 'LTC',
    'ltc': 'LTC',
    'ripple': 'XRP',
    'xrp': 'XRP',
    'cardano': 'ADA',
    'ada': 'ADA',
    'polkadot': 'DOT',
    'dot': 'DOT',
    'chainlink': 'LINK',
    'link': 'LINK',
    'uniswap': 'UNI',
    'uni': 'UNI',
    'bitcoin cash': 'BCH',
    'bch': 'BCH',
  };

  private readonly fiatSymbolMap: { [key: string]: string } = {
    'dollars': 'USD',
    'dollar': 'USD',
    'usd': 'USD',
    '$': 'USD',
    'euros': 'EUR',
    'euro': 'EUR',
    'eur': 'EUR',
    '€': 'EUR',
    'pounds': 'GBP',
    'pound': 'GBP',
    'gbp': 'GBP',
    '£': 'GBP'
  };

  public static getInstance(): TransactionIntentParser {
    if (!TransactionIntentParser.instance) {
      TransactionIntentParser.instance = new TransactionIntentParser();
    }
    return TransactionIntentParser.instance;
  }

  public async parseMessage(message: string): Promise<TransactionIntent | null> {
    const lowerMessage = message.toLowerCase();
    
    // Check for buy intent
    if (this.hasBuyIntent(lowerMessage)) {
      return {
        type: 'buy_crypto',
        intent: await this.parseBuyCryptoIntent(message)
      };
    }

    // TODO: Add other transaction types (sell, exchange, transfer)
    
    return null;
  }

  private hasBuyIntent(message: string): boolean {
    const buyKeywords = ['buy', 'purchase', 'get', 'acquire', 'want to buy', 'need to buy'];
    const cryptoKeywords = ['crypto', 'bitcoin', 'btc', 'ethereum', 'eth', ...Object.keys(this.cryptoSymbolMap)];
    
    const hasBuyKeyword = buyKeywords.some(keyword => message.includes(keyword));
    const hasCryptoKeyword = cryptoKeywords.some(keyword => message.includes(keyword));
    
    return hasBuyKeyword || (message.includes('worth of') && hasCryptoKeyword);
  }

  private async parseBuyCryptoIntent(message: string): Promise<BuyCryptoIntent> {
    const intent: BuyCryptoIntent = {
      type: 'buy_crypto',
      confidence: 0,
      rawText: message
    };

    // Extract amount
    const amountMatch = message.match(/(?:\$|₹|£|€)?\s*([\d,]+\.?\d*)\s*(?:usd|eur|gbp|inr|dollars?|euros?|pounds?|rupees?)?/i);
    if (amountMatch) {
      intent.amount = parseFloat(amountMatch[1].replace(/,/g, ''));
      
      // Determine if it's fiat or crypto amount based on context
      const beforeAmount = message.substring(0, message.indexOf(amountMatch[0])).toLowerCase();
      const afterAmount = message.substring(message.indexOf(amountMatch[0]) + amountMatch[0].length).toLowerCase();
      
      if (message.includes('$') || message.includes('₹') || message.includes('£') || message.includes('€')) {
        intent.amountType = 'fiat';
        // Extract fiat currency from symbol
        if (message.includes('$')) intent.fromCurrency = 'USD';
        else if (message.includes('₹')) intent.fromCurrency = 'INR';
        else if (message.includes('£')) intent.fromCurrency = 'GBP';
        else if (message.includes('€')) intent.fromCurrency = 'EUR';
      } else if (afterAmount.includes('worth') || beforeAmount.includes('spend')) {
        intent.amountType = 'fiat';
      } else {
        // Check if "of" is followed by crypto (e.g., "0.001 of ETH")
        const ofCryptoMatch = afterAmount.match(/^\s*of\s+(\w+)/i);
        if (ofCryptoMatch) {
          const cryptoCurrency = this.extractCryptoCurrency(ofCryptoMatch[1]);
          if (cryptoCurrency) {
            intent.amountType = 'crypto';
            intent.toCurrency = cryptoCurrency;
          }
        } else {
          // Check if the amount is followed by a crypto currency
          const cryptoAfterAmount = this.extractCryptoCurrency(afterAmount);
          if (cryptoAfterAmount) {
            intent.amountType = 'crypto';
            intent.toCurrency = cryptoAfterAmount;
          } else {
            // Default to fiat if no crypto currency found
            intent.amountType = 'fiat';
          }
        }
      }
    }

    // Extract crypto currency
    const cryptoCurrency = this.extractCryptoCurrency(message);
    if (cryptoCurrency) {
      intent.toCurrency = cryptoCurrency;
      intent.confidence += 0.3;
    }

    // Extract fiat currency if not already set
    if (!intent.fromCurrency) {
      const fiatCurrency = this.extractFiatCurrency(message);
      if (fiatCurrency) {
        intent.fromCurrency = fiatCurrency;
      } else {
        // Default to USD if not specified
        intent.fromCurrency = 'USD';
      }
    }

    // Calculate confidence
    if (intent.amount) intent.confidence += 0.3;
    if (intent.toCurrency) intent.confidence += 0.2;
    if (intent.fromCurrency) intent.confidence += 0.2;

    // Check if clarification is needed
    if (!intent.amount) {
      intent.needsClarification = {
        reason: 'amount_missing',
        suggestions: ['How much would you like to spend?', 'What amount of crypto do you want to buy?']
      };
    } else if (!intent.toCurrency) {
      intent.needsClarification = {
        reason: 'crypto_missing',
        suggestions: ['Which cryptocurrency would you like to buy?', 'Bitcoin (BTC)', 'Ethereum (ETH)', 'USDT']
      };
    }

    return intent;
  }

  private extractCryptoCurrency(text: string): string | undefined {
    const lowerText = text.toLowerCase();
    
    // Check for full names and symbols
    for (const [key, value] of Object.entries(this.cryptoSymbolMap)) {
      if (lowerText.includes(key)) {
        return value;
      }
    }
    
    // Check for uppercase symbols in original text
    for (const symbol of this.cryptoCurrencies) {
      if (text.includes(symbol)) {
        return symbol;
      }
    }
    
    return undefined;
  }

  private extractFiatCurrency(text: string): string | undefined {
    const lowerText = text.toLowerCase();
    
    // Check for currency symbols and names
    for (const [key, value] of Object.entries(this.fiatSymbolMap)) {
      if (lowerText.includes(key) || text.includes(key)) {
        return value;
      }
    }
    
    // Check for uppercase codes in original text
    for (const code of this.fiatCurrencies) {
      if (text.includes(code)) {
        return code;
      }
    }
    
    return undefined;
  }

  public generateClarificationMessage(intent: BuyCryptoIntent): string {
    if (!intent.needsClarification) {
      return '';
    }

    switch (intent.needsClarification.reason) {
      case 'amount_missing':
        return "I can help you buy crypto! How much would you like to spend?";
      case 'crypto_missing':
        return `Great! You want to spend ${intent.fromCurrency} ${intent.amount}. Which cryptocurrency would you like to buy? (BTC, ETH, USDT, etc.)`;
      default:
        return "I need a bit more information to help you buy crypto. Could you specify the amount and cryptocurrency?";
    }
  }

  public async enhanceIntentWithContext(intent: BuyCryptoIntent): Promise<BuyCryptoIntent> {
    try {
      // Get user's balances to provide context
      const [fiatBalances, cryptoBalances] = await Promise.all([
        getClientBalances(),
        getCryptoBalances()
      ]);

      // If user didn't specify fiat currency, use their primary balance currency
      if (!intent.fromCurrency && fiatBalances.clientBalanceList.length > 0) {
        // Find the balance with highest amount as primary
        const primaryBalance = fiatBalances.clientBalanceList.reduce((prev, current) => 
          (prev.balanceAmount > current.balanceAmount) ? prev : current
        );
        intent.fromCurrency = primaryBalance.currencyShortName;
      }

      // Add context about available balance
      if (intent.amount && intent.amountType === 'fiat' && intent.fromCurrency) {
        const relevantBalance = fiatBalances.clientBalanceList.find(b => b.currencyShortName === intent.fromCurrency);
        if (relevantBalance && relevantBalance.balanceAmount < intent.amount) {
          intent.needsClarification = {
            reason: 'insufficient_balance',
            suggestions: [`Your ${intent.fromCurrency} balance is ${relevantBalance.balanceAmount}. Would you like to buy a smaller amount?`]
          };
        }
      }

      return intent;
    } catch (error) {
      console.error('Error enhancing intent with context:', error);
      return intent;
    }
  }
}

export const transactionIntentParser = TransactionIntentParser.getInstance();