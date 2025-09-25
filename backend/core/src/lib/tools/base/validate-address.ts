import { createPublicClient, http, isAddress, getAddress } from 'viem';
import * as chains from 'viem/chains';
import type { Chain } from 'viem';
import { z } from 'zod';
import type { CryptoToolDefinition, ToolContext, ChainId } from '../types';
import { AddressValidationParams } from '../types';

const CHAIN_CONFIG: Record<ChainId, Chain> = {
  [chains.mainnet.id]: chains.mainnet,
  [chains.arbitrum.id]: chains.arbitrum,
  [chains.base.id]: chains.base,
  [chains.optimism.id]: chains.optimism,
  [chains.polygon.id]: chains.polygon,
  998: chains.mainnet // TODO: Add hyperevm chain config
};

export const validateAddressTool: CryptoToolDefinition = {
  id: 'validateAddress',
  name: 'Validate Address',
  description: 'Validate Ethereum addresses and check if they are contracts or EOAs',
  category: 'info',
  inputSchema: AddressValidationParams,
  requiresWallet: false,
  riskLevel: 'low',

  async execute(params: z.infer<typeof AddressValidationParams>, context: ToolContext) {
    const { address, type = 'any' } = params;

    if (!isAddress(address)) {
      return {
        address,
        isValid: false,
        error: 'Invalid Ethereum address format'
      };
    }

    const checksumAddress = getAddress(address);

    // Check on multiple chains to determine type
    const chainToCheck = context.chainId || 1;
    const client = createPublicClient({
      chain: CHAIN_CONFIG[chainToCheck],
      transport: http()
    });

    try {
      const code = await client.getBytecode({ address: checksumAddress });
      const isContract = code && code !== '0x';
      const isEOA = !isContract;

      let typeValid = true;
      if (type === 'contract' && !isContract) typeValid = false;
      if (type === 'eoa' && !isEOA) typeValid = false;

      return {
        address: checksumAddress,
        isValid: true,
        isContract,
        isEOA,
        typeValid,
        chainChecked: chainToCheck,
        codeSize: code ? (code.length - 2) / 2 : 0 // Remove 0x and convert hex to bytes
      };
    } catch (error) {
      return {
        address: checksumAddress,
        isValid: true, // Address format is valid even if we can't check chain state
        error: `Could not verify address type: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};