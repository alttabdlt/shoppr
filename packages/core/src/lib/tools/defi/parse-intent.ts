import { z } from 'zod';
import type { CryptoToolDefinition } from '../types';

const parseIntentInputSchema = z.object({
  text: z.string().describe('Natural language description of the DeFi operation'),
  userAddress: z.string().optional().describe('User wallet address for context'),
  chainId: z.number().optional().describe('Preferred chain ID'),
});

export type ParseIntentInput = z.infer<typeof parseIntentInputSchema>;

export interface ParsedIntent {
  action: 'swap' | 'bridge' | 'stake' | 'lend' | 'borrow' | 'provide_liquidity' | 'unknown';
  fromToken?: {
    symbol: string;
    amount?: string;
    address?: string;
  };
  toToken?: {
    symbol: string;
    address?: string;
  };
  fromChain?: number;
  toChain?: number;
  amount?: string;
  slippage?: number;
  confidence: number; // 0-1 score of parsing confidence
  parameters: Record<string, any>;
  raw_text: string;
}

export const parseIntentTool: CryptoToolDefinition = {
  id: 'parseIntent',
  name: 'Parse DeFi Intent',
  description: 'Parse natural language into structured DeFi operation intent',
  category: 'defi',
  inputSchema: parseIntentInputSchema,
  requiresWallet: false,
  riskLevel: 'low',
  execute: async (params: ParseIntentInput): Promise<ParsedIntent> => {
    const { text, userAddress, chainId } = params;

    // Parse common DeFi operations from natural language
    const intent: ParsedIntent = {
      action: 'unknown',
      confidence: 0,
      parameters: {},
      raw_text: text,
    };

    const lowerText = text.toLowerCase();

    // Detect action type
    if (lowerText.includes('swap') || lowerText.includes('trade') || lowerText.includes('exchange')) {
      intent.action = 'swap';
      intent.confidence += 0.3;
    } else if (lowerText.includes('bridge') || lowerText.includes('cross-chain') || lowerText.includes('transfer')) {
      intent.action = 'bridge';
      intent.confidence += 0.3;
    } else if (lowerText.includes('stake') || lowerText.includes('staking')) {
      intent.action = 'stake';
      intent.confidence += 0.3;
    } else if (lowerText.includes('lend') || lowerText.includes('lending') || lowerText.includes('supply')) {
      intent.action = 'lend';
      intent.confidence += 0.3;
    } else if (lowerText.includes('borrow') || lowerText.includes('borrowing')) {
      intent.action = 'borrow';
      intent.confidence += 0.3;
    } else if (lowerText.includes('liquidity') || lowerText.includes('lp') || lowerText.includes('pool')) {
      intent.action = 'provide_liquidity';
      intent.confidence += 0.3;
    }

    // Parse token symbols and amounts
    const tokenRegex = /(\d+(?:\.\d+)?)\s*([A-Z]{2,10})(?:\s+(?:to|for|into)\s+([A-Z]{2,10}))?/gi;
    const matches = [...text.matchAll(tokenRegex)];

    if (matches.length > 0) {
      const [, amount, fromToken, toToken] = matches[0];
      intent.amount = amount;
      intent.fromToken = {
        symbol: fromToken.toUpperCase(),
        amount: amount,
      };

      if (toToken) {
        intent.toToken = {
          symbol: toToken.toUpperCase(),
        };
      }
      intent.confidence += 0.4;
    }

    // Parse chains
    const chainMentions = {
      'ethereum': 1,
      'eth': 1,
      'arbitrum': 42161,
      'arb': 42161,
      'base': 8453,
      'optimism': 10,
      'op': 10,
      'polygon': 137,
      'matic': 137,
    };

    for (const [chainName, id] of Object.entries(chainMentions)) {
      if (lowerText.includes(chainName)) {
        if (!intent.fromChain) {
          intent.fromChain = id;
        } else if (!intent.toChain && intent.action === 'bridge') {
          intent.toChain = id;
        }
        intent.confidence += 0.1;
      }
    }

    // Parse slippage
    const slippageMatch = text.match(/(\d+(?:\.\d+)?)\s*%?\s*slippage/i);
    if (slippageMatch) {
      intent.slippage = parseFloat(slippageMatch[1]);
      intent.confidence += 0.1;
    }

    // Default values
    if (chainId && !intent.fromChain) {
      intent.fromChain = chainId;
    }

    // Ensure confidence doesn't exceed 1
    intent.confidence = Math.min(intent.confidence, 1);

    return intent;
  },
};