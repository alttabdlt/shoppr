import { createPublicClient, http, formatUnits, parseEther } from 'viem';
import * as chains from 'viem/chains';
import type { Chain } from 'viem';
import { z } from 'zod';
import type { CryptoToolDefinition, ToolContext, ChainId } from '../types';
import { GasEstimateParams } from '../types';

const CHAIN_CONFIG: Record<ChainId, Chain> = {
  [chains.mainnet.id]: chains.mainnet,
  [chains.arbitrum.id]: chains.arbitrum,
  [chains.base.id]: chains.base,
  [chains.optimism.id]: chains.optimism,
  [chains.polygon.id]: chains.polygon,
  998: chains.mainnet // TODO: Add hyperevm chain config
};

export const estimateGasTool: CryptoToolDefinition = {
  id: 'estimateGas',
  name: 'Estimate Gas',
  description: 'Estimate gas costs for transactions on supported chains',
  category: 'info',
  inputSchema: GasEstimateParams,
  requiresWallet: false,
  riskLevel: 'low',

  async execute(params: z.infer<typeof GasEstimateParams>, context: ToolContext) {
    const { to, data = '0x', value = '0', chainId = 1 } = params;

    const client = createPublicClient({
      chain: CHAIN_CONFIG[chainId],
      transport: http()
    });

    try {
      const gasEstimate = await client.estimateGas({
        to: to as `0x${string}`,
        data: data as `0x${string}`,
        value: parseEther(value)
      });

      const gasPrice = await client.getGasPrice();
      const gasCost = gasEstimate * gasPrice;

      return {
        chainId,
        gasEstimate: gasEstimate.toString(),
        gasPrice: gasPrice.toString(),
        gasCost: gasCost.toString(),
        gasCostFormatted: `${formatUnits(gasCost, 18)} ETH`,
        gasPriceGwei: formatUnits(gasPrice, 9),
        transaction: {
          to,
          data,
          value
        }
      };
    } catch (error) {
      throw new Error(`Failed to estimate gas: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};