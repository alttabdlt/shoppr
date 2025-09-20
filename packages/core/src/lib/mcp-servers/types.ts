import { z } from 'zod';
import type { CryptoToolDefinition, ToolContext } from '../tools/types';

export interface MCPServerTool {
  id: string;
  description: string;
  inputSchema: z.ZodSchema;
  requiresWallet?: boolean;
  riskLevel?: CryptoToolDefinition['riskLevel'];
  category?: CryptoToolDefinition['category'];
  handler: (params: any, context: ToolContext) => Promise<any>;
}

export interface MCPServer {
  name: string;
  version: string;
  tools: MCPServerTool[];
  initialize?: () => Promise<void> | void;
  ping?: () => Promise<void> | void;
}

export type MCPServerFactory = (config?: Record<string, any>) => MCPServer;

