import { z } from 'zod';
import { registerTool, getToolRegistry } from '../tools/registry';
import type { CryptoToolDefinition, ToolContext } from '../tools/types';
import type { MCPServer, MCPServerTool, MCPServerFactory } from './types';

function inferCategory(tool: MCPServerTool): CryptoToolDefinition['category'] {
  return tool.category ?? 'info';
}

function inferRisk(tool: MCPServerTool): CryptoToolDefinition['riskLevel'] {
  return tool.riskLevel ?? 'low';
}

export function wrapAndRegisterMCPServer(server: MCPServer) {
  server.tools.forEach((tool) => {
    const toolId = `mcp__${server.name}__${tool.id}`;

    // Skip if already registered to make idempotent
    const existing = getToolRegistry().get(toolId);
    if (existing) return;

    const wrapped: CryptoToolDefinition = {
      id: toolId,
      name: `${server.name}:${tool.id}`,
      description: tool.description,
      category: inferCategory(tool),
      inputSchema: tool.inputSchema,
      requiresWallet: tool.requiresWallet ?? false,
      riskLevel: inferRisk(tool),
      execute: async (params: any, context: ToolContext) => {
        return tool.handler(params, context);
      },
    };

    registerTool(wrapped);
  });
}

export async function registerMCPServer(server: MCPServer) {
  if (server.initialize) {
    await server.initialize();
  }
  wrapAndRegisterMCPServer(server);
}

// Dynamic registry from config
export async function registerMCPServersFromConfig() {
  // Defer import to avoid bundling surprises
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const { MCPServerConfig } = await import('../../config/mcp-servers');

  for (const entry of MCPServerConfig.servers) {
    if (!entry.enabled) continue;
    try {
      // Expect each server in ./servers/<name>/index.ts to export createServer
      const mod: any = await import(`./servers/${entry.name}/index.ts`);
      const create: MCPServerFactory | undefined = mod.createServer || mod.default;
      if (!create) continue;
      const server = create(entry.config);
      await registerMCPServer(server);
    } catch {
      // Skip if not found or failed to load
      continue;
    }
  }
}

export type { MCPServer, MCPServerTool } from './types';
