import { z } from 'zod';
import type { CryptoToolDefinition, ToolContext } from '../types';
import { TokenPriceParams } from '../types';

const COINGECKO_IDS: Record<string, string> = {
  ETH: 'ethereum',
  WETH: 'ethereum',
  USDC: 'usd-coin',
  HYPE: 'hyperevm' // Example - would need real CoinGecko ID
};

export const getTokenPriceTool: CryptoToolDefinition = {
  id: 'getTokenPrice',
  name: 'Get Token Price',
  description: 'Fetch current token prices from CoinGecko',
  category: 'info',
  inputSchema: TokenPriceParams,
  requiresWallet: false,
  riskLevel: 'low',

  async execute(params: z.infer<typeof TokenPriceParams>, context: ToolContext) {
    const { token, currency = 'USD' } = params;

    const coinId = COINGECKO_IDS[token];
    if (!coinId) {
      throw new Error(`Price data not available for token: ${token}`);
    }

    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=${currency.toLowerCase()}&include_24hr_change=true`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      const priceData = data[coinId];

      if (!priceData) {
        throw new Error(`No price data found for ${token}`);
      }

      const price = priceData[currency.toLowerCase()];
      const change24h = priceData[`${currency.toLowerCase()}_24h_change`];

      return {
        token,
        currency,
        price,
        change24h: change24h || 0,
        priceFormatted: `${currency === 'USD' ? '$' : ''}${price.toLocaleString()}${currency === 'ETH' ? ' ETH' : ''}`,
        changeFormatted: `${change24h > 0 ? '+' : ''}${change24h?.toFixed(2) || '0.00'}%`,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to fetch price for ${token}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};