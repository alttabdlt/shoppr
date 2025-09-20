import { createPublicClient, http, formatUnits, erc20Abi } from 'viem';
import * as chains from 'viem/chains';
import type { Chain } from 'viem';
import { z } from 'zod';
import type { CryptoToolDefinition, ToolContext, ChainId, TokenSymbol } from '../types';
import { BalanceCheckParams } from '../types';

const CHAIN_CONFIG: Record<ChainId, Chain> = {
  [chains.mainnet.id]: chains.mainnet,
  [chains.arbitrum.id]: chains.arbitrum,
  [chains.base.id]: chains.base,
  [chains.optimism.id]: chains.optimism,
  [chains.polygon.id]: chains.polygon,
  998: chains.mainnet // TODO: Add hyperevm chain config
};

const TOKEN_ADDRESSES: Record<ChainId, Partial<Record<TokenSymbol, string>>> = {
  [chains.mainnet.id]: {
    USDC: '0xA0b86a33E6441226Da8F6d9F2D6b458E3E72Df2b',
    WETH: '0xC02aaA39b223FE8d0A0e5C4F27eAD9083C756Cc2'
  },
  [chains.arbitrum.id]: {
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'
  },
  [chains.base.id]: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    WETH: '0x4200000000000000000000000000000000000006'
  },
  [chains.optimism.id]: {
    USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    WETH: '0x4200000000000000000000000000000000000006'
  },
  [chains.polygon.id]: {
    USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    WETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'
  },
  998: {}
};

export const checkBalanceTool: CryptoToolDefinition = {
  id: 'checkBalance',
  name: 'Check Balance',
  description: 'Check token balances for a wallet address across supported chains',
  category: 'wallet',
  inputSchema: BalanceCheckParams,
  requiresWallet: false,
  riskLevel: 'low',

  async execute(params: z.infer<typeof BalanceCheckParams>, context: ToolContext) {
    const { address, tokens = ['ETH', 'USDC', 'WETH'], chainId } = params;
    const chainsToCheck = chainId ? [chainId] : ([chains.mainnet.id, chains.arbitrum.id, chains.base.id] as ChainId[]);

    const results: Record<string, Record<string, { balance: string; formatted: string; symbol: string }>> = {};

    for (const chain of chainsToCheck) {
      const client = createPublicClient({
        chain: CHAIN_CONFIG[chain],
        transport: http()
      });

      results[chain] = {};

      for (const token of tokens) {
        try {
          if (token === 'ETH') {
            const balance = await client.getBalance({ address: address as `0x${string}` });
            results[chain][token] = {
              balance: balance.toString(),
              formatted: formatUnits(balance, 18),
              symbol: 'ETH'
            };
          } else {
            const tokenAddress = TOKEN_ADDRESSES[chain][token];
            if (!tokenAddress) {
              results[chain][token] = {
                balance: '0',
                formatted: '0',
                symbol: token
              };
              continue;
            }

            const balance = await client.readContract({
              address: tokenAddress as `0x${string}`,
              abi: erc20Abi,
              functionName: 'balanceOf',
              args: [address as `0x${string}`]
            });

            const decimals = await client.readContract({
              address: tokenAddress as `0x${string}`,
              abi: erc20Abi,
              functionName: 'decimals'
            });

            results[chain][token] = {
              balance: balance.toString(),
              formatted: formatUnits(balance, decimals),
              symbol: token
            };
          }
        } catch (error) {
          results[chain][token] = {
            balance: '0',
            formatted: '0',
            symbol: token
          };
        }
      }
    }

    const summary = Object.entries(results).map(([chain, tokens]) => {
      const tokenList = Object.entries(tokens)
        .filter(([_, data]) => parseFloat(data.formatted) > 0)
        .map(([symbol, data]) => `${data.formatted} ${symbol}`)
        .join(', ');

      return tokenList ? `${chain}: ${tokenList}` : `${chain}: No tokens`;
    }).join('\n');

    return {
      address,
      balances: results,
      summary
    };
  }
};