import { z } from 'zod';
import type { CryptoToolDefinition } from '../types';

const getQuotesInputSchema = z.object({
  fromToken: z.object({
    symbol: z.string(),
    address: z.string().optional(),
    decimals: z.number().optional(),
  }),
  toToken: z.object({
    symbol: z.string(),
    address: z.string().optional(),
    decimals: z.number().optional(),
  }),
  amount: z.string().describe('Amount to swap in human readable format'),
  fromChainId: z.number(),
  toChainId: z.number().optional().describe('For cross-chain operations'),
  slippage: z.number().optional().default(0.5).describe('Slippage tolerance in percentage'),
  userAddress: z.string().optional().describe('User address for personalized quotes'),
});

export type GetQuotesInput = z.infer<typeof getQuotesInputSchema>;

export interface QuoteResult {
  protocol: string;
  protocolType: 'dex' | 'bridge' | 'aggregator';
  fromToken: {
    symbol: string;
    address: string;
    amount: string;
    decimals: number;
  };
  toToken: {
    symbol: string;
    address: string;
    amount: string;
    decimals: number;
  };
  gasEstimate: string;
  estimatedGasUSD?: string;
  route?: string[];
  priceImpact: number;
  confidence: number;
  executionTime: number; // seconds
  bridgeTime?: number; // for cross-chain operations
  fees: {
    protocolFee: string;
    gasFee: string;
    totalUSD: string;
  };
  riskScore: number; // 0-100, lower is safer
  metadata: Record<string, any>;
}

export interface QuotesResponse {
  quotes: QuoteResult[];
  bestQuote?: QuoteResult;
  totalQuotes: number;
  errors: string[];
}

// Token address mappings for common tokens
const TOKEN_ADDRESSES: Record<number, Record<string, string>> = {
  1: { // Ethereum
    'ETH': '0x0000000000000000000000000000000000000000',
    'USDC': '0xa0b86a33e6441b8e776c4c98e5ccdfb3e57b78c9',
    'USDT': '0xdac17f958d2ee523a2206206994597c13d831ec7',
    'WETH': '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  },
  42161: { // Arbitrum
    'ETH': '0x0000000000000000000000000000000000000000',
    'USDC': '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
    'USDT': '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
    'WETH': '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
  },
  8453: { // Base
    'ETH': '0x0000000000000000000000000000000000000000',
    'USDC': '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    'WETH': '0x4200000000000000000000000000000000000006',
  },
  10: { // Optimism
    'ETH': '0x0000000000000000000000000000000000000000',
    'USDC': '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
    'USDT': '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58',
    'WETH': '0x4200000000000000000000000000000000000006',
  },
  137: { // Polygon
    'MATIC': '0x0000000000000000000000000000000000000000',
    'USDC': '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
    'USDT': '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    'WETH': '0x7ceb23fd6c4a31cfa2c2c8cb75d3e5bfc5f24e9',
  },
};

function getTokenAddress(symbol: string, chainId: number): string {
  return TOKEN_ADDRESSES[chainId]?.[symbol.toUpperCase()] || '';
}

function generateMockQuote(
  protocol: string,
  protocolType: 'dex' | 'bridge' | 'aggregator',
  params: GetQuotesInput
): QuoteResult {
  const { fromToken, toToken, amount, fromChainId, toChainId } = params;

  // Mock exchange rate calculation
  const exchangeRates: Record<string, Record<string, number>> = {
    'ETH': { 'USDC': 3200, 'USDT': 3200, 'WETH': 1 },
    'USDC': { 'ETH': 0.0003125, 'USDT': 1, 'WETH': 0.0003125 },
    'USDT': { 'ETH': 0.0003125, 'USDC': 1, 'WETH': 0.0003125 },
    'WETH': { 'ETH': 1, 'USDC': 3200, 'USDT': 3200 },
  };

  const rate = exchangeRates[fromToken.symbol.toUpperCase()]?.[toToken.symbol.toUpperCase()] || 1;
  const outputAmount = (parseFloat(amount) * rate * 0.997).toFixed(6); // 0.3% slippage

  const isCrossChain = toChainId && fromChainId !== toChainId;
  const protocolMultipliers = {
    'Uniswap V3': 1.002,
    '1inch': 1.005,
    'LiFi': 0.998,
    'Across': 0.999,
    'Stargate': 0.996,
  };

  const finalAmount = (parseFloat(outputAmount) * (protocolMultipliers[protocol as keyof typeof protocolMultipliers] || 1)).toFixed(6);

  return {
    protocol,
    protocolType,
    fromToken: {
      symbol: fromToken.symbol,
      address: getTokenAddress(fromToken.symbol, fromChainId),
      amount,
      decimals: fromToken.decimals || 18,
    },
    toToken: {
      symbol: toToken.symbol,
      address: getTokenAddress(toToken.symbol, toChainId || fromChainId),
      amount: finalAmount,
      decimals: toToken.decimals || 18,
    },
    gasEstimate: isCrossChain ? '250000' : '150000',
    estimatedGasUSD: isCrossChain ? '12.50' : '7.50',
    route: isCrossChain ? [fromToken.symbol, 'Bridge', toToken.symbol] : [fromToken.symbol, toToken.symbol],
    priceImpact: parseFloat(amount) > 1000 ? 0.15 : 0.05,
    confidence: protocol === 'Uniswap V3' ? 0.95 : 0.85,
    executionTime: isCrossChain ? 300 : 30,
    bridgeTime: isCrossChain ? 600 : undefined,
    fees: {
      protocolFee: (parseFloat(amount) * 0.003).toFixed(4),
      gasFee: isCrossChain ? '12.50' : '7.50',
      totalUSD: (parseFloat(amount) * 0.003 + (isCrossChain ? 12.50 : 7.50)).toFixed(2),
    },
    riskScore: protocol === 'Uniswap V3' ? 10 : 25,
    metadata: {
      dex: protocolType === 'dex' ? protocol : undefined,
      bridge: isCrossChain ? protocol : undefined,
      estimatedConfirmations: isCrossChain ? 64 : 12,
    },
  };
}

export const getQuotesTool: CryptoToolDefinition = {
  id: 'getQuotes',
  name: 'Get DeFi Quotes',
  description: 'Fetch quotes for swaps, bridges, and other DeFi operations',
  category: 'defi',
  inputSchema: getQuotesInputSchema,
  requiresWallet: false,
  riskLevel: 'low',
  execute: async (params: GetQuotesInput): Promise<QuotesResponse> => {
    const { fromChainId, toChainId } = params;
    const isCrossChain = toChainId && fromChainId !== toChainId;

    const quotes: QuoteResult[] = [];
    const errors: string[] = [];

    try {
      // Same-chain DEX quotes
      if (!isCrossChain) {
        quotes.push(generateMockQuote('Uniswap V3', 'dex', params));
        quotes.push(generateMockQuote('1inch', 'aggregator', params));
      }

      // Cross-chain bridge quotes
      if (isCrossChain) {
        quotes.push(generateMockQuote('LiFi', 'bridge', params));
        quotes.push(generateMockQuote('Across', 'bridge', params));
        quotes.push(generateMockQuote('Stargate', 'bridge', params));
      }

      // Sort by net output (amount - fees)
      quotes.sort((a, b) => {
        const netA = parseFloat(a.toToken.amount) - parseFloat(a.fees.totalUSD);
        const netB = parseFloat(b.toToken.amount) - parseFloat(b.fees.totalUSD);
        return netB - netA;
      });

      const bestQuote = quotes.length > 0 ? quotes[0] : undefined;

      return {
        quotes,
        bestQuote,
        totalQuotes: quotes.length,
        errors,
      };
    } catch (error) {
      errors.push(`Failed to fetch quotes: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        quotes: [],
        totalQuotes: 0,
        errors,
      };
    }
  },
};