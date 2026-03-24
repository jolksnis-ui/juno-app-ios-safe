import { ChatMessage, ChatContext, ChatActionButton } from '../types/chat';

/**
 * Enhanced mock chat service with comprehensive coverage for all financial operations
 * Supports all fiat and crypto currencies with intelligent pattern matching
 */
export class MockChatService {
  // Supported currencies
  private readonly FIAT_CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'CAD', 'AUD', 'CHF', 'TRY', 'HKD', 'SGD'];
  private readonly CRYPTO_CURRENCIES = ['BTC', 'ETH', 'USDT', 'USDC', 'LTC', 'TRX'];
  
  // Currency information
  private readonly CURRENCY_INFO: Record<string, any> = {
    // Fiat currencies
    USD: { name: 'US Dollar', symbol: '$', region: 'United States' },
    EUR: { name: 'Euro', symbol: '€', region: 'European Union' },
    GBP: { name: 'British Pound', symbol: '£', region: 'United Kingdom' },
    AED: { name: 'UAE Dirham', symbol: 'د.إ', region: 'United Arab Emirates' },
    CAD: { name: 'Canadian Dollar', symbol: 'C$', region: 'Canada' },
    AUD: { name: 'Australian Dollar', symbol: 'A$', region: 'Australia' },
    CHF: { name: 'Swiss Franc', symbol: 'CHF', region: 'Switzerland' },
    TRY: { name: 'Turkish Lira', symbol: '₺', region: 'Turkey' },
    HKD: { name: 'Hong Kong Dollar', symbol: 'HK$', region: 'Hong Kong' },
    SGD: { name: 'Singapore Dollar', symbol: 'S$', region: 'Singapore' },
    
    // Crypto currencies
    BTC: { name: 'Bitcoin', symbol: '₿', network: 'Bitcoin', type: 'Native' },
    ETH: { name: 'Ethereum', symbol: 'Ξ', network: 'Ethereum', type: 'Native' },
    USDT: { name: 'Tether', symbol: 'USDT', network: 'Multiple', type: 'Stablecoin' },
    USDC: { name: 'USD Coin', symbol: 'USDC', network: 'Multiple', type: 'Stablecoin' },
    LTC: { name: 'Litecoin', symbol: 'Ł', network: 'Litecoin', type: 'Native' },
    TRX: { name: 'TRON', symbol: 'TRX', network: 'TRON', type: 'Native' }
  };

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract currency from user message
   */
  private extractCurrency(message: string): string | null {
    const upperMessage = message.toUpperCase();
    
    // Check for exact currency codes
    for (const currency of [...this.FIAT_CURRENCIES, ...this.CRYPTO_CURRENCIES]) {
      if (upperMessage.includes(currency)) {
        return currency;
      }
    }
    
    // Check for common names
    const currencyNames = {
      'BITCOIN': 'BTC',
      'ETHEREUM': 'ETH',
      'TETHER': 'USDT',
      'LITECOIN': 'LTC',
      'TRON': 'TRX',
      'DOLLAR': 'USD',
      'EURO': 'EUR',
      'POUND': 'GBP',
      'DIRHAM': 'AED'
    };
    
    for (const [name, code] of Object.entries(currencyNames)) {
      if (upperMessage.includes(name)) {
        return code;
      }
    }
    
    return null;
  }

  /**
   * Detect transaction type from message
   */
  private detectTransactionType(message: string): string | null {
    const lowerMessage = message.toLowerCase();
    
    const transactionTypes = {
      'deposit': ['deposit', 'add money', 'fund', 'top up', 'load'],
      'withdrawal': ['withdraw', 'cash out', 'take out', 'remove money'],
      'payment': ['pay', 'payment', 'bill', 'send money', 'transfer'],
      'fx': ['exchange', 'convert', 'swap', 'change currency', 'fx'],
      'buy': ['buy', 'purchase', 'invest in', 'get'],
      'sell': ['sell', 'cash out', 'liquidate'],
      'receive': ['receive', 'get', 'incoming', 'deposit'],
      'send': ['send', 'transfer', 'move', 'withdraw']
    };
    
    for (const [type, keywords] of Object.entries(transactionTypes)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return type;
      }
    }
    
    return null;
  }

  /**
   * Handle fiat currency operations
   */
  private handleFiatOperation(currency: string, operation: string, context: ChatContext): { response: string, actionButtons: ChatActionButton[] } {
    const currencyInfo = this.CURRENCY_INFO[currency as keyof typeof this.CURRENCY_INFO];
    const actionButtons: ChatActionButton[] = [];
    let response = '';

    switch (operation) {
      case 'deposit':
        response = `**Deposit ${currencyInfo.name} (${currency})**

💰 **How to deposit ${currency} to your account:**

**Available Methods:**
• **Bank Transfer** - Free, 1-3 business days
• **Debit Card** - Instant, small fee applies
• **Wire Transfer** - Same day, higher fees

**Steps to deposit:**
1. Go to your dashboard
2. Select "Add Money" or "Deposit"
3. Choose ${currency} as your currency
4. Select your preferred deposit method
5. Enter the amount and confirm

**Important Notes:**
• Minimum deposit: ${currency === 'USD' ? '$10' : `${currencyInfo.symbol}10`}
• Maximum daily limit: ${currency === 'USD' ? '$10,000' : `${currencyInfo.symbol}10,000`}
• Funds are typically available within 1-3 business days

*All deposits are secured with bank-level encryption.*`;

        actionButtons.push({
          id: 'deposit_fiat',
          label: `Deposit ${currency}`,
          action: 'navigate',
          data: { screen: '/(auth)/dashboard' }
        });
        break;

      case 'withdrawal':
        response = `**Withdraw ${currencyInfo.name} (${currency})**

💸 **How to withdraw ${currency} from your account:**

**Withdrawal Methods:**
• **Bank Transfer** - Free, 1-3 business days
• **Wire Transfer** - Same day, fee applies
• **International Transfer** - 3-5 business days

**Steps to withdraw:**
1. Go to your dashboard
2. Select "Withdraw" or "Cash Out"
3. Choose ${currency} as your currency
4. Enter withdrawal amount
5. Confirm your bank details
6. Submit withdrawal request

**Processing Times:**
• Domestic transfers: 1-3 business days
• International transfers: 3-5 business days
• Wire transfers: Same business day

**Limits & Fees:**
• Minimum withdrawal: ${currency === 'USD' ? '$25' : `${currencyInfo.symbol}25`}
• Daily limit: ${currency === 'USD' ? '$25,000' : `${currencyInfo.symbol}25,000`}
• Standard transfers: Free
• Express transfers: Small fee applies

*Withdrawals are processed securely through our banking partners.*`;

        actionButtons.push({
          id: 'withdraw_fiat',
          label: `Withdraw ${currency}`,
          action: 'navigate',
          data: { screen: '/(auth)/dashboard' }
        });
        break;

      case 'payment':
        response = `**Make Payment with ${currencyInfo.name} (${currency})**

💳 **Payment Options:**

**Bill Payments:**
• Utilities, phone, internet bills
• Credit card payments
• Loan payments

**Money Transfers:**
• Send to friends and family
• International transfers
• Business payments

**Steps to make a payment:**
1. Go to "Send Money" or "Pay Bills"
2. Select ${currency} as payment currency
3. Enter recipient details
4. Specify payment amount
5. Add payment reference/memo
6. Review and confirm payment

**Payment Features:**
• Instant domestic transfers
• International transfers in 1-3 days
• Payment tracking and receipts
• Scheduled recurring payments

**Security:**
• Two-factor authentication required
• Transaction limits for protection
• Real-time fraud monitoring

*All payments are protected by our security guarantee.*`;

        actionButtons.push({
          id: 'make_payment',
          label: `Pay with ${currency}`,
          action: 'navigate',
          data: { screen: '/(auth)/dashboard' }
        });
        break;

      case 'fx':
        response = `**Currency Exchange - ${currencyInfo.name} (${currency})**

🔄 **Foreign Exchange Services:**

**Exchange ${currency} to:**
${this.FIAT_CURRENCIES.filter(c => c !== currency).map(c => 
  `• ${this.CURRENCY_INFO[c as keyof typeof this.CURRENCY_INFO].name} (${c})`
).join('\n')}

**Current Rates:** *(Live rates available in app)*
• Competitive exchange rates
• Real-time rate updates
• Rate alerts available

**Steps to exchange currency:**
1. Go to "Exchange" or "Convert"
2. Select ${currency} as source currency
3. Choose target currency
4. Enter amount to exchange
5. Review exchange rate and fees
6. Confirm the exchange

**Exchange Features:**
• Live market rates
• Low exchange fees
• Instant conversions
• Rate history tracking

**Tips for Better Rates:**
• Monitor rates throughout the day
• Set rate alerts for target rates
• Consider timing for major currency pairs
• Exchange larger amounts for better rates

*Exchange rates fluctuate based on market conditions.*`;

        actionButtons.push({
          id: 'exchange_fiat',
          label: `Exchange ${currency}`,
          action: 'navigate',
          data: { screen: '/(auth)/dashboard' }
        });
        break;

      default:
        response = `**${currencyInfo.name} (${currency}) Operations**

${currencyInfo.symbol} **Available ${currency} Services:**

• **Deposit** - Add ${currency} to your account
• **Withdraw** - Cash out ${currency} to your bank
• **Exchange** - Convert ${currency} to other currencies
• **Payments** - Send ${currency} to others
• **Bills** - Pay bills with ${currency}

**Regional Information:**
• Primary region: ${currencyInfo.region}
• Currency symbol: ${currencyInfo.symbol}
• Supported worldwide

What would you like to do with your ${currency}?`;

        actionButtons.push({
          id: 'fiat_operations',
          label: `${currency} Operations`,
          action: 'navigate',
          data: { screen: '/(auth)/dashboard' }
        });
    }

    return { response, actionButtons };
  }

  /**
   * Handle crypto currency operations
   */
  private handleCryptoOperation(currency: string, operation: string, context: ChatContext): { response: string, actionButtons: ChatActionButton[] } {
    const currencyInfo = this.CURRENCY_INFO[currency as keyof typeof this.CURRENCY_INFO];
    const actionButtons: ChatActionButton[] = [];
    let response = '';

    switch (operation) {
      case 'buy':
        response = `**Buy ${currencyInfo.name} (${currency})**

🚀 **Purchase ${currency} - ${currencyInfo.name}**

**About ${currency}:**
${currency === 'BTC' ? '• Digital gold and store of value\n• Limited supply of 21 million coins\n• Most secure blockchain network' :
  currency === 'ETH' ? '• Smart contract platform\n• Powers DeFi and NFT ecosystems\n• Proof-of-stake consensus' :
  currency === 'USDT' || currency === 'USDC' ? '• Stablecoin pegged to USD\n• Low volatility\n• Great for trading pairs' :
  currency === 'LTC' ? '• Faster transactions than Bitcoin\n• Lower fees\n• Silver to Bitcoin\'s gold' :
  currency === 'TRX' ? '• High-speed blockchain\n• Low transaction fees\n• DApp platform' : '• Popular cryptocurrency'}

**How to buy ${currency}:**
1. Tap "Buy Crypto" below
2. Select ${currency} from the list
3. Choose payment method (card/bank)
4. Enter purchase amount
5. Review fees and total cost
6. Confirm your purchase

**Investment Tips:**
• Start with small amounts
• Consider dollar-cost averaging
• Research before investing
• Only invest what you can afford to lose

**Current Market:**
• Network: ${(currencyInfo as any).network || 'Multiple'}
• Type: ${(currencyInfo as any).type || 'Cryptocurrency'}

*Cryptocurrency investments carry high risk. Past performance doesn't guarantee future results.*`;

        actionButtons.push({
          id: 'buy_crypto',
          label: `Buy ${currency}`,
          action: 'navigate',
          data: { screen: '/(auth)/buy-crypto' }
        });
        break;

      case 'sell':
        response = `**Sell ${currencyInfo.name} (${currency})**

💸 **Sell Your ${currency} Holdings**

**Before You Sell:**
• Check current market price
• Consider tax implications
• Review your investment goals
• Think about partial vs. full sale

**How to sell ${currency}:**
1. Tap "Sell Crypto" below
2. Select ${currency} from your portfolio
3. Enter amount to sell
4. Choose where to receive funds
5. Review current market rate
6. Confirm the sale

**Sale Options:**
• **Market Order** - Sell immediately at current price
• **Limit Order** - Set your desired price
• **Partial Sale** - Sell only a portion

**Important Considerations:**
• Sales are final and cannot be reversed
• Market prices fluctuate constantly
• Consider keeping some for long-term
• Tax reporting may be required

**Proceeds Options:**
• Transfer to bank account
• Keep as fiat in your wallet
• Exchange for other cryptocurrencies

*Selling crypto may have tax implications. Consult a tax professional if needed.*`;

        actionButtons.push({
          id: 'sell_crypto',
          label: `Sell ${currency}`,
          action: 'navigate',
          data: { screen: '/(auth)/sell-crypto' }
        });
        break;

      case 'send':
        response = `**Send ${currencyInfo.name} (${currency})**

📤 **Transfer ${currency} to Another Wallet**

**Before Sending ${currency}:**
• Double-check the recipient address
• Verify the network (${(currencyInfo as any).network})
• Confirm the amount is correct
• Check network fees

**How to send ${currency}:**
1. Tap "Send Crypto" below
2. Select ${currency} from your wallet
3. Enter or scan recipient address
4. Specify amount to send
5. Review network fees
6. Confirm the transaction

**Security Checklist:**
✅ Recipient address is correct
✅ Network matches (${(currencyInfo as any).network})
✅ Amount is accurate
✅ You trust the recipient

**Network Information:**
• Network: ${(currencyInfo as any).network}
• Confirmation time: ${currency === 'BTC' ? '10-60 minutes' : currency === 'ETH' ? '1-5 minutes' : currency === 'TRX' ? '1-3 minutes' : '1-10 minutes'}
• Network fees: Variable based on congestion

**Important Warnings:**
⚠️ Transactions are irreversible
⚠️ Wrong address = permanent loss
⚠️ Always send small test amount first
⚠️ Verify network compatibility

*Crypto transactions cannot be reversed. Always verify details before sending.*`;

        actionButtons.push({
          id: 'send_crypto',
          label: `Send ${currency}`,
          action: 'navigate',
          data: { screen: '/(auth)/send-crypto' }
        });
        break;

      case 'receive':
        response = `**Receive ${currencyInfo.name} (${currency})**

📥 **Get ${currency} in Your Wallet**

**How to receive ${currency}:**
1. Tap "Receive Crypto" below
2. Select ${currency} from your wallets
3. Copy your ${currency} address
4. Share address with sender
5. Wait for transaction confirmation

**Your ${currency} Address:**
• Unique address for receiving ${currency}
• Safe to share publicly
• QR code available for easy scanning
• Address remains the same

**Network Details:**
• Network: ${(currencyInfo as any).network}
• Confirmations needed: ${currency === 'BTC' ? '3-6' : currency === 'ETH' ? '12-35' : '1-3'}
• Typical confirmation time: ${currency === 'BTC' ? '30-60 minutes' : currency === 'ETH' ? '2-5 minutes' : '1-3 minutes'}

**Security Tips:**
• Only share your address, never private keys
• Verify network compatibility with sender
• Small test transactions recommended
• Monitor for incoming transactions

**What Happens Next:**
1. Sender initiates transaction
2. Transaction broadcasts to network
3. Network confirms transaction
4. ${currency} appears in your wallet
5. You receive notification

**Supported Networks:**
${currency === 'USDT' ? '• Ethereum (ERC-20)\n• TRON (TRC-20)\n• Other networks available' : `• ${(currencyInfo as any).network} network`}

*Always verify the network matches what the sender is using.*`;

        actionButtons.push({
          id: 'receive_crypto',
          label: `Receive ${currency}`,
          action: 'navigate',
          data: { screen: '/(auth)/receive-crypto' }
        });
        break;

      case 'fx':
      case 'exchange':
        response = `**Exchange ${currencyInfo.name} (${currency})**

🔄 **Swap ${currency} for Other Cryptocurrencies**

**Available Trading Pairs:**
${this.CRYPTO_CURRENCIES.filter(c => c !== currency).map(c => 
  `• ${currency} → ${c} (${this.CURRENCY_INFO[c as keyof typeof this.CURRENCY_INFO].name})`
).join('\n')}

**How to exchange ${currency}:**
1. Tap "Exchange Crypto" below
2. Select ${currency} as source
3. Choose target cryptocurrency
4. Enter amount to exchange
5. Review exchange rate and fees
6. Confirm the swap

**Exchange Features:**
• Real-time market rates
• Low trading fees
• Instant swaps
• No external wallet needed

**Trading Tips:**
• Compare rates across different pairs
• Consider market volatility
• Check trading fees
• Monitor price trends

**Popular ${currency} Pairs:**
${currency === 'BTC' ? '• BTC/ETH - Most liquid pair\n• BTC/USDT - Stable trading\n• BTC/USDC - USD exposure' :
  currency === 'ETH' ? '• ETH/BTC - Major pair\n• ETH/USDT - Stable trading\n• ETH/USDC - USD exposure' :
  '• Trade with BTC, ETH, or stablecoins'}

**Market Information:**
• 24/7 trading available
• Real-time price updates
• Advanced order types
• Price alerts available

*Exchange rates fluctuate based on market conditions. Consider timing and volatility.*`;

        actionButtons.push({
          id: 'exchange_crypto',
          label: `Exchange ${currency}`,
          action: 'navigate',
          data: { screen: '/(auth)/exchange-crypto' }
        });
        break;

      default:
        response = `**${currencyInfo.name} (${currency}) Operations**

${currencyInfo.symbol} **Available ${currency} Services:**

• **Buy** - Purchase ${currency} with fiat
• **Sell** - Convert ${currency} to fiat
• **Send** - Transfer ${currency} to another wallet
• **Receive** - Get ${currency} from others
• **Exchange** - Swap ${currency} for other crypto

**${currency} Information:**
• Name: ${currencyInfo.name}
• Network: ${(currencyInfo as any).network}
• Type: ${(currencyInfo as any).type}

**Current Holdings:**
${context.userBalances?.crypto?.find((c: any) => c.currency === currency) ? 
  `You currently hold ${currency} in your portfolio.` : 
  `You don't currently hold ${currency}. Consider buying some!`}

What would you like to do with ${currency}?`;

        actionButtons.push({
          id: 'crypto_operations',
          label: `${currency} Operations`,
          action: 'navigate',
          data: { screen: '/(auth)/dashboard' }
        });
    }

    return { response, actionButtons };
  }

  async processMessage(userMessage: string, context: ChatContext): Promise<ChatMessage> {
    const lowerMessage = userMessage.toLowerCase();
    let response = '';
    let type: ChatMessage['type'] = 'text';
    let actionButtons: ChatActionButton[] = [];

    // Extract currency and transaction type
    const currency = this.extractCurrency(userMessage);
    const transactionType = this.detectTransactionType(userMessage);

    // Handle currency-specific operations
    if (currency && transactionType) {
      if (this.FIAT_CURRENCIES.includes(currency)) {
        const result = this.handleFiatOperation(currency, transactionType, context);
        response = result.response;
        actionButtons = result.actionButtons;
        type = 'transaction';
      } else if (this.CRYPTO_CURRENCIES.includes(currency)) {
        const result = this.handleCryptoOperation(currency, transactionType, context);
        response = result.response;
        actionButtons = result.actionButtons;
        type = 'transaction';
      }
    }
    
    // Balance inquiries
    else if (lowerMessage.includes('balance') || lowerMessage.includes('portfolio')) {
      type = 'balance';
      const totalFiat = context.userBalances?.totalFiat || 0;
      const totalCrypto = context.userBalances?.totalCrypto || 0;
      const totalValue = totalFiat + totalCrypto;

      response = `**Your Portfolio Overview**

💰 **Total Portfolio Value:** $${totalValue.toFixed(2)}

**Asset Breakdown:**
• 💵 Fiat Balance: $${totalFiat.toFixed(2)}
• ₿ Crypto Balance: $${totalCrypto.toFixed(2)}

**Holdings Summary:**
• ${context.userBalances?.fiat?.length || 0} fiat currencies
• ${context.userBalances?.crypto?.length || 0} cryptocurrencies

**Supported Assets:**
**Fiat:** ${this.FIAT_CURRENCIES.join(', ')}
**Crypto:** ${this.CRYPTO_CURRENCIES.join(', ')}

**Quick Actions:**
• View detailed breakdown
• Add more funds
• Start trading
• Analyze performance`;

      actionButtons.push({
        id: 'view_dashboard',
        label: 'View Dashboard',
        action: 'navigate',
        data: { screen: '/(auth)/dashboard' }
      });
    }
    
    // Transaction history
    else if (lowerMessage.includes('transaction') || lowerMessage.includes('history')) {
      type = 'transaction';
      const recentCount = context.recentTransactions?.length || 0;
      
      response = `**Transaction History**

📊 **Recent Activity:** ${recentCount} transactions

**Transaction Types Available:**
**Fiat Operations:**
• Deposits & Withdrawals
• Currency Exchange (FX)
• Payments & Transfers
• Bill Payments

**Crypto Operations:**
• Buy & Sell orders
• Send & Receive transfers
• Crypto exchanges/swaps
• Staking rewards

**Supported Currencies:**
• **Fiat:** ${this.FIAT_CURRENCIES.join(', ')}
• **Crypto:** ${this.CRYPTO_CURRENCIES.join(', ')}

${recentCount > 0 ? 'Your recent transactions include various operations across multiple currencies.' : 'No recent transactions found. Start by making your first transaction!'}`;

      actionButtons.push({
        id: 'view_transactions',
        label: 'View All Transactions',
        action: 'navigate',
        data: { screen: '/(auth)/transactions' }
      });
    }
    
    // Currency-specific information without operation
    else if (currency) {
      const currencyInfo = this.CURRENCY_INFO[currency as keyof typeof this.CURRENCY_INFO];
      
      if (this.FIAT_CURRENCIES.includes(currency)) {
        response = `**${currencyInfo.name} (${currency})**

${currencyInfo.symbol} **Fiat Currency Information**

**Regional Details:**
• Currency: ${currencyInfo.name}
• Symbol: ${currencyInfo.symbol}
• Region: ${currencyInfo.region}

**Available Operations:**
• **Deposit** - Add ${currency} to your account
• **Withdraw** - Cash out to your bank
• **Exchange** - Convert to other currencies
• **Payments** - Send money or pay bills
• **FX Trading** - Currency exchange

**Features:**
• Instant transfers
• Competitive exchange rates
• Low fees
• Secure transactions
• 24/7 support

What would you like to do with ${currency}?`;
      } else {
        response = `**${currencyInfo.name} (${currency})**

${currencyInfo.symbol} **Cryptocurrency Information**

**Technical Details:**
• Name: ${currencyInfo.name}
• Symbol: ${currencyInfo.symbol}
• Network: ${(currencyInfo as any).network}
• Type: ${(currencyInfo as any).type}

**Available Operations:**
• **Buy** - Purchase with fiat currency
• **Sell** - Convert to fiat
• **Send** - Transfer to other wallets
• **Receive** - Get from other wallets
• **Exchange** - Swap for other crypto

**Key Features:**
${currency === 'BTC' ? '• Store of value\n• Limited supply\n• Most secure network' :
  currency === 'ETH' ? '• Smart contracts\n• DeFi platform\n• NFT support' :
  currency === 'USDT' || currency === 'USDC' ? '• Price stability\n• USD-pegged\n• Trading pairs' :
  currency === 'LTC' ? '• Fast transactions\n• Low fees\n• Bitcoin alternative' :
  currency === 'TRX' ? '• High throughput\n• Low costs\n• DApp platform' : '• Digital asset'}

What would you like to do with ${currency}?`;
      }

      actionButtons.push({
        id: `${currency.toLowerCase()}_operations`,
        label: `${currency} Operations`,
        action: 'navigate',
        data: { screen: '/(auth)/dashboard' }
      });
    }
    
    // General help and default responses
    else if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      response = `**Juno AI - Your Financial Assistant**

👋 **I can help you with all your financial needs!**

**💰 Fiat Currency Operations:**
• **Deposit** - Add money to your account
• **Withdraw** - Cash out to your bank
• **Exchange** - Convert between currencies
• **Payments** - Send money or pay bills
• **FX Trading** - Foreign exchange

**₿ Cryptocurrency Operations:**
• **Buy** - Purchase crypto with fiat
• **Sell** - Convert crypto to fiat
• **Send** - Transfer to other wallets
• **Receive** - Get crypto from others
• **Exchange** - Swap between cryptocurrencies

**📊 Portfolio Management:**
• Check balances and portfolio value
• View transaction history
• Analyze asset allocation
• Get investment insights

**🌍 Supported Currencies:**
• **Fiat:** ${this.FIAT_CURRENCIES.join(', ')}
• **Crypto:** ${this.CRYPTO_CURRENCIES.join(', ')}

**💡 Try asking:**
• "Help me buy Bitcoin"
• "How do I deposit EUR?"
• "Send USDT to my friend"
• "What's my portfolio balance?"
• "Exchange USD to GBP"

What would you like to do today?`;

      actionButtons.push({
        id: 'view_dashboard',
        label: 'Go to Dashboard',
        action: 'navigate',
        data: { screen: '/(auth)/dashboard' }
      });
    }
    
    // Default response for unrecognized queries
    else {
      response = `I understand you're asking about "${userMessage}".

**🤖 As your Juno AI assistant, I can help with:**

**💱 All Currency Operations:**
• **Fiat:** ${this.FIAT_CURRENCIES.join(', ')}
• **Crypto:** ${this.CRYPTO_CURRENCIES.join(', ')}

**📋 Available Services:**
• Deposits & Withdrawals
• Currency Exchange & FX
• Crypto Buy/Sell/Send/Receive
• Portfolio Management
• Transaction History

**💡 Try asking something like:**
• "Help me deposit USD"
• "Buy some Bitcoin"
• "Send ETH to my wallet"
• "Exchange EUR to GBP"
• "What's my balance?"

**🎯 Be specific about:**
• Which currency (e.g., BTC, USD, EUR)
• What operation (buy, sell, send, deposit)
• Any specific amounts or details

How can I help you with your finances today?`;

      actionButtons.push({
        id: 'explore_features',
        label: 'Explore Features',
        action: 'navigate',
        data: { screen: '/(auth)/dashboard' }
      });
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    return {
      id: this.generateMessageId(),
      content: response,
      role: 'assistant',
      timestamp: new Date(),
      type,
      metadata: {
        actionButtons: actionButtons.length > 0 ? actionButtons : undefined
      }
    };
  }
}

export const mockChatService = new MockChatService();
