import { z } from 'zod';

export const ChainId = z.union([
  z.literal(1),    // ethereum
  z.literal(42161), // arbitrum
  z.literal(8453),  // base
  z.literal(10),    // optimism
  z.literal(137),   // polygon
  z.literal(998),   // hyperevm
]);

export const TokenSymbol = z.enum([
  'ETH',
  'WETH',
  'USDC',
  'HYPE'
]);

export type ChainId = z.infer<typeof ChainId>;
export type TokenSymbol = z.infer<typeof TokenSymbol>;

export interface ToolContext {
  userAddress?: string;
  chainId?: ChainId;
  sessionId?: string;
  permissions?: string[];
}

export interface CryptoToolDefinition {
  id: string;
  name: string;
  description: string;
  category: 'wallet' | 'defi' | 'info' | 'execution' | 'monitoring';
  inputSchema: z.ZodSchema;
  execute: (params: any, context: ToolContext) => Promise<any>;
  requiresWallet?: boolean;
  requiresApproval?: boolean;
  riskLevel?: 'low' | 'medium' | 'high';
}

export interface ToolRegistry {
  register(tool: CryptoToolDefinition): void;
  unregister(id: string): void;
  get(id: string): CryptoToolDefinition | undefined;
  getByCategory(category: CryptoToolDefinition['category']): CryptoToolDefinition[];
  getAll(): CryptoToolDefinition[];
  execute(id: string, params: any, context: ToolContext): Promise<any>;
}

export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    executionTime?: number;
    chainId?: ChainId;
    transactionHash?: string;
    gasUsed?: string;
  };
}

export const BalanceCheckParams = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  tokens: z.array(TokenSymbol).optional(),
  chainId: ChainId.optional()
});

export const TokenPriceParams = z.object({
  token: TokenSymbol,
  chainId: ChainId.optional(),
  currency: z.enum(['USD', 'ETH']).default('USD')
});

export const GasEstimateParams = z.object({
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  data: z.string().optional(),
  value: z.string().optional(),
  chainId: ChainId.optional()
});

export const AddressValidationParams = z.object({
  address: z.string(),
  type: z.enum(['eoa', 'contract', 'any']).default('any')
});

export type BalanceCheckParams = z.infer<typeof BalanceCheckParams>;
export type TokenPriceParams = z.infer<typeof TokenPriceParams>;
export type GasEstimateParams = z.infer<typeof GasEstimateParams>;
export type AddressValidationParams = z.infer<typeof AddressValidationParams>;