import type {
  CryptoToolDefinition,
  ToolRegistry,
  ToolContext,
  ToolExecutionResult
} from './types';

class CryptoToolRegistry implements ToolRegistry {
  private tools: Map<string, CryptoToolDefinition> = new Map();

  register(tool: CryptoToolDefinition): void {
    if (this.tools.has(tool.id)) {
      throw new Error(`Tool with id '${tool.id}' is already registered`);
    }

    this.tools.set(tool.id, tool);
  }

  unregister(id: string): void {
    this.tools.delete(id);
  }

  get(id: string): CryptoToolDefinition | undefined {
    return this.tools.get(id);
  }

  getByCategory(category: CryptoToolDefinition['category']): CryptoToolDefinition[] {
    return Array.from(this.tools.values()).filter(tool => tool.category === category);
  }

  getAll(): CryptoToolDefinition[] {
    return Array.from(this.tools.values());
  }

  async execute(id: string, params: any, context: ToolContext): Promise<ToolExecutionResult> {
    const tool = this.get(id);

    if (!tool) {
      return {
        success: false,
        error: `Tool with id '${id}' not found`
      };
    }

    if (tool.requiresWallet && !context.userAddress) {
      return {
        success: false,
        error: 'This tool requires a connected wallet'
      };
    }

    try {
      const startTime = Date.now();

      const validatedParams = tool.inputSchema.parse(params);
      const result = await tool.execute(validatedParams, context);

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: result,
        metadata: {
          executionTime,
          chainId: context.chainId
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

export const cryptoToolRegistry = new CryptoToolRegistry();

export function registerTool(tool: CryptoToolDefinition): void {
  cryptoToolRegistry.register(tool);
}

export function getToolRegistry(): ToolRegistry {
  return cryptoToolRegistry;
}