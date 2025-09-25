# MCP Servers for Crypto DApp Integration

This document outlines how to integrate Model Context Protocol (MCP) servers with Shoppr's tool calling system to extend crypto dapp functionality.

Note on repo layout: MCP servers are isolated under `backend/servers/*` as independent workspace packages (e.g., `backend/servers/test-mcp` → `@shoppr/mcp-test-mcp`). Core discovers servers via an explicit `module` in config, by the naming pattern `@shoppr/mcp-<name>`, or via an `MCP_SERVERS_DIR` path (e.g., `backend/servers`).

## Overview

Shoppr's tool calling system is designed with MCP-style architecture, allowing seamless integration of external crypto protocol SDKs as MCP servers. This enables the AI to interact with various DeFi protocols, NFT platforms, and blockchain services through standardized interfaces.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   AI Chat       │    │  Tool Registry   │    │  MCP Servers    │
│   Interface     │───▶│     System       │───▶│   (External)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │  Core Tools      │
                       │  (Built-in)      │
                       └──────────────────┘
```

## Integration Patterns

### 1. Direct SDK Integration

For protocols with TypeScript/JavaScript SDKs, integrate directly into the tool registry:

```typescript
// Example: Uniswap V3 Integration
import { Pool, Position } from '@uniswap/v3-sdk';
import { Token } from '@uniswap/sdk-core';

export const uniswapV3Tool: CryptoToolDefinition = {
  id: 'uniswapV3Pool',
  name: 'Uniswap V3 Pool Info',
  description: 'Get detailed pool information from Uniswap V3',
  category: 'defi',
  inputSchema: z.object({
    token0: z.string(),
    token1: z.string(),
    fee: z.number(),
    chainId: z.number(),
  }),
  requiresWallet: false,
  riskLevel: 'low',
  execute: async (params, context) => {
    // Use Uniswap SDK to fetch pool data
    const pool = await Pool.fetchData(/* ... */);
    return pool.liquidity.toString();
  },
};
```

### 2. MCP Server Protocol

For external services or complex protocols, implement as MCP servers:

```typescript
// MCP Server Interface
interface MCPServer {
  name: string;
  version: string;
  tools: MCPTool[];
  connect(): Promise<void>;
  execute(toolId: string, params: any): Promise<any>;
  disconnect(): Promise<void>;
}

// Example: Compound Protocol MCP Server
class CompoundMCPServer implements MCPServer {
  name = 'compound-protocol';
  version = '1.0.0';

  tools = [
    {
      name: 'compound_supply',
      description: 'Supply assets to Compound',
      inputSchema: {
        type: 'object',
        properties: {
          asset: { type: 'string' },
          amount: { type: 'string' },
          userAddress: { type: 'string' }
        }
      }
    }
  ];

  async execute(toolId: string, params: any) {
    switch (toolId) {
      case 'compound_supply':
        return await this.handleSupply(params);
      default:
        throw new Error(`Unknown tool: ${toolId}`);
    }
  }
}
```

## Protocol Integration Examples

### DeFi Protocols

#### 1. **Aave Protocol**
```typescript
// MCP Server: aave-protocol
const aaveTools = [
  'aave_supply',      // Supply assets to earn interest
  'aave_borrow',      // Borrow against collateral
  'aave_repay',       // Repay borrowed assets
  'aave_withdraw',    // Withdraw supplied assets
  'aave_health_factor' // Check account health
];
```

#### 2. **Curve Finance**
```typescript
// MCP Server: curve-finance
const curveTools = [
  'curve_pools',      // List available pools
  'curve_swap',       // Execute swaps
  'curve_add_liquidity', // Add liquidity to pools
  'curve_remove_liquidity', // Remove liquidity
  'curve_gauge_deposit' // Stake LP tokens
];
```

#### 3. **1inch Aggregator**
```typescript
// MCP Server: oneinch-aggregator
const oneInchTools = [
  'oneinch_quote',    // Get swap quotes
  'oneinch_swap',     // Execute swaps
  'oneinch_protocols', // List supported protocols
  'oneinch_tokens'    // Get token list
];
```

### NFT Platforms

#### 1. **OpenSea Integration**
```typescript
// MCP Server: opensea-api
const openSeaTools = [
  'opensea_collection_stats', // Get collection statistics
  'opensea_asset_info',      // Get NFT metadata
  'opensea_create_offer',    // Create buy offers
  'opensea_list_asset',      // List NFT for sale
  'opensea_transfer'         // Transfer NFT
];
```

#### 2. **Reservoir Protocol**
```typescript
// MCP Server: reservoir-protocol
const reservoirTools = [
  'reservoir_floor_price',   // Get floor prices
  'reservoir_bid',          // Place collection bids
  'reservoir_sweep',        // Sweep floor listings
  'reservoir_analytics'     // Get market analytics
];
```

### Cross-Chain Protocols

#### 1. **LayerZero**
```typescript
// MCP Server: layerzero-protocol
const layerZeroTools = [
  'lz_estimate_fees',       // Estimate bridge fees
  'lz_send_tokens',        // Send tokens cross-chain
  'lz_check_delivery',     // Check message delivery
  'lz_supported_chains'    // List supported chains
];
```

#### 2. **Axelar Network**
```typescript
// MCP Server: axelar-network
const axelarTools = [
  'axelar_transfer',        // Cross-chain transfers
  'axelar_gmp_execute',    // General message passing
  'axelar_fee_estimate',   // Fee estimation
  'axelar_tx_status'       // Transaction status
];
```

## Implementation Guide

### Step 1: Define Tool Schema

```typescript
// Define input/output schemas using Zod
const protocolToolSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(['defi', 'nft', 'bridge', 'governance', 'lending']),
  inputSchema: z.any(),
  outputSchema: z.any().optional(),
  requiresWallet: z.boolean(),
  requiresApproval: z.boolean().optional(),
  riskLevel: z.enum(['low', 'medium', 'high']),
  supportedChains: z.array(z.number()),
  gasEstimate: z.string().optional(),
});
```

### Step 2: Create MCP Server

```typescript
// Create MCP server implementation
export class ProtocolMCPServer {
  private sdk: ProtocolSDK;

  constructor(config: ProtocolConfig) {
    this.sdk = new ProtocolSDK(config);
  }

  async initialize(): Promise<void> {
    await this.sdk.connect();
  }

  async listTools(): Promise<MCPTool[]> {
    return this.tools.map(tool => ({
      name: tool.id,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
  }

  async callTool(name: string, arguments_: any): Promise<any> {
    const tool = this.tools.find(t => t.id === name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    return await tool.execute(arguments_, {
      sdk: this.sdk,
      userAddress: arguments_.userAddress,
      chainId: arguments_.chainId,
    });
  }
}
```

### Step 3: Register with Tool Registry

```typescript
// Register MCP server tools with the main registry
export function registerMCPServer(server: MCPServer) {
  server.tools.forEach(tool => {
    const wrappedTool: CryptoToolDefinition = {
      id: `${server.name}_${tool.name}`,
      name: tool.description,
      description: tool.description,
      category: inferCategory(tool.name),
      inputSchema: zodFromJsonSchema(tool.inputSchema),
      requiresWallet: tool.requiresWallet || false,
      riskLevel: inferRiskLevel(tool.name),
      execute: async (params, context) => {
        return await server.execute(tool.name, {
          ...params,
          userAddress: context.userAddress,
          chainId: context.chainId,
        });
      },
    };

    registerTool(wrappedTool);
  });
}
```

## Configuration

### Environment Variables

```bash
# MCP Server Configuration
MCP_SERVERS_ENABLED=true
# Optional: point to the servers directory (for local dev)
MCP_SERVERS_DIR=./backend/servers

# Protocol-specific configuration
AAVE_API_KEY=your_aave_api_key
COMPOUND_SUBGRAPH_URL=https://api.thegraph.com/subgraphs/name/graphprotocol/compound-v2
OPENSEA_API_KEY=your_opensea_api_key
ONEINCH_API_KEY=your_1inch_api_key

# Chain RPC URLs
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-key
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/your-key
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/your-key
```

### MCP Server Registry

```typescript
// config/mcp-servers.ts
export const MCPServerConfig = {
  servers: [
    {
      name: 'aave-protocol',
      enabled: true,
      // Option A: explicit module specifier
      // module: '@shoppr/mcp-aave-protocol',
      config: {
        apiKey: process.env.AAVE_API_KEY,
        chains: [1, 137, 42161], // Ethereum, Polygon, Arbitrum
      },
    },
    {
      name: 'uniswap-v3',
      enabled: true,
      // Option B: rely on naming convention @shoppr/mcp-uniswap-v3
      config: {
        subgraphUrl: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
        chains: [1, 10, 42161, 8453], // Ethereum, Optimism, Arbitrum, Base
      },
    },
    {
      name: 'opensea-api',
      enabled: process.env.OPENSEA_API_KEY !== undefined,
      config: {
        apiKey: process.env.OPENSEA_API_KEY,
        baseUrl: 'https://api.opensea.io/api/v1',
      },
    },
  ],
};
```

## Security Considerations

### 1. **Risk Assessment**
```typescript
function assessToolRisk(tool: MCPTool): RiskLevel {
  // High risk: Asset transfers, approvals, governance
  if (tool.name.includes('transfer') ||
      tool.name.includes('approve') ||
      tool.name.includes('vote')) {
    return 'high';
  }

  // Medium risk: Trading, liquidity operations
  if (tool.name.includes('swap') ||
      tool.name.includes('liquidity')) {
    return 'medium';
  }

  // Low risk: Read-only operations
  return 'low';
}
```

### 2. **Input Validation**
```typescript
async function validateToolInput(tool: MCPTool, input: any): Promise<void> {
  // Validate against schema
  const result = tool.inputSchema.safeParse(input);
  if (!result.success) {
    throw new Error(`Invalid input: ${result.error.message}`);
  }

  // Additional security checks
  if (input.amount && parseFloat(input.amount) > MAX_TRANSACTION_AMOUNT) {
    throw new Error('Transaction amount exceeds safety limit');
  }

  if (input.recipient && !isValidAddress(input.recipient)) {
    throw new Error('Invalid recipient address');
  }
}
```

### 3. **Permission Management**
```typescript
interface ToolPermissions {
  requiresWallet: boolean;
  requiresApproval: boolean;
  maxAmountUSD?: number;
  allowedChains?: number[];
  rateLimitPerHour?: number;
}

function checkPermissions(
  tool: MCPTool,
  context: ToolContext,
  permissions: ToolPermissions
): void {
  if (permissions.requiresWallet && !context.userAddress) {
    throw new Error('Wallet connection required');
  }

  if (permissions.allowedChains &&
      !permissions.allowedChains.includes(context.chainId)) {
    throw new Error('Chain not supported for this operation');
  }
}
```

## Monitoring and Analytics

### 1. **Tool Usage Metrics**
```typescript
interface ToolMetrics {
  toolId: string;
  executionCount: number;
  successRate: number;
  averageExecutionTime: number;
  errorTypes: Record<string, number>;
  lastExecuted: Date;
}

async function trackToolUsage(
  toolId: string,
  duration: number,
  success: boolean,
  error?: string
): Promise<void> {
  // Update metrics in database
  await updateToolMetrics({
    toolId,
    duration,
    success,
    error,
    timestamp: new Date(),
  });
}
```

### 2. **Health Monitoring**
```typescript
interface MCPServerHealth {
  serverId: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  responseTime: number;
  errorRate: number;
}

async function checkServerHealth(server: MCPServer): Promise<MCPServerHealth> {
  const startTime = Date.now();

  try {
    await server.ping();
    const responseTime = Date.now() - startTime;

    return {
      serverId: server.name,
      status: responseTime < 1000 ? 'healthy' : 'degraded',
      lastCheck: new Date(),
      responseTime,
      errorRate: await getErrorRate(server.name),
    };
  } catch (error) {
    return {
      serverId: server.name,
      status: 'unhealthy',
      lastCheck: new Date(),
      responseTime: Date.now() - startTime,
      errorRate: 1.0,
    };
  }
}
```

## Testing MCP Servers

### 1. **Unit Tests**
```typescript
describe('ProtocolMCPServer', () => {
  let server: ProtocolMCPServer;

  beforeEach(async () => {
    server = new ProtocolMCPServer(testConfig);
    await server.initialize();
  });

  test('should list available tools', async () => {
    const tools = await server.listTools();
    expect(tools).toContain('protocol_swap');
    expect(tools).toContain('protocol_pools');
  });

  test('should execute tool with valid parameters', async () => {
    const result = await server.callTool('protocol_quote', {
      tokenIn: 'USDC',
      tokenOut: 'WETH',
      amount: '1000',
    });

    expect(result).toHaveProperty('quote');
    expect(result.quote).toBeGreaterThan(0);
  });
});
```

### 2. **Integration Tests**
```typescript
describe('MCP Server Integration', () => {
  test('should register and execute tools via registry', async () => {
    const server = new TestMCPServer();
    registerMCPServer(server);

    const registry = getToolRegistry();
    const result = await registry.execute(
      'test_server_example_tool',
      { param1: 'value1' },
      { userAddress: TEST_ADDRESS, chainId: 1 }
    );

    expect(result.success).toBe(true);
  });
});
```

## Best Practices

### 1. **Error Handling**
- Always wrap SDK calls in try-catch blocks
- Provide meaningful error messages
- Implement retry logic for transient failures
- Log errors for debugging and monitoring

### 2. **Performance Optimization**
- Cache frequently accessed data
- Implement connection pooling for external APIs
- Use batch requests when possible
- Set appropriate timeouts

### 3. **User Experience**
- Provide clear tool descriptions
- Include examples in tool documentation
- Implement progress indicators for long-running operations
- Offer transaction simulation before execution

### 4. **Maintenance**
- Keep SDK dependencies updated
- Monitor for protocol upgrades
- Implement feature flags for gradual rollouts
- Maintain backward compatibility

## Future Enhancements

1. **Dynamic Tool Discovery**: Automatically discover and register new MCP servers
2. **Tool Composition**: Chain multiple tools together for complex operations
3. **Smart Routing**: Automatically select the best protocol for user goals
4. **Risk Scoring**: AI-powered risk assessment for operations
5. **Gas Optimization**: Automatic gas price optimization across tools

## Contributing

To add a new MCP server:

1. Create a new workspace package under `backend/servers/<name>` exporting `createServer()`
2. Add configuration in `backend/core/src/config/mcp-servers.ts`
3. Write comprehensive tests
4. Update this documentation
5. Submit pull request with examples

For questions or support, see the main project README or open an issue.
