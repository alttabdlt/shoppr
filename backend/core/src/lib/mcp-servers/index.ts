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

  const tryDynamicImport = async (spec: string) => {
    try {
      // Hint bundlers to skip analyzing this dynamic import.
      // This prevents warnings like:
      // "Critical dependency: the request of a dependency is an expression"
      // and ensures the module is resolved at runtime only in Node.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return await import(/* webpackIgnore: true */ spec);
    } catch {
      return undefined;
    }
  };

  const pathCandidates = (name: string, declared?: string) => {
    const list: string[] = [];
    if (declared) list.push(declared);
    // Workspace package naming convention
    list.push(`@shoppr/mcp-${name}`);
    // Env-provided servers directory (absolute or relative to process.cwd())
    if (process.env.MCP_SERVERS_DIR) {
      const base = process.env.MCP_SERVERS_DIR.replace(/\/$/, '');
      list.push(`${base}/${name}/dist/index.js`);
      list.push(`${base}/${name}/src/index.ts`);
      list.push(`${base}/${name}/index.js`);
      list.push(`${base}/${name}/index.ts`);
    }
    // Legacy in-repo location for backwards compatibility
    list.push(`./servers/${name}/index.ts`);
    return list;
  };

  for (const entry of (MCPServerConfig.servers as unknown as any[])) {
    if (!entry?.enabled) continue;

    const candidates = pathCandidates(entry.name, entry.module);

    let mod: any | undefined;
    for (const spec of candidates) {
      // eslint-disable-next-line no-await-in-loop
      mod = await tryDynamicImport(spec);
      if (mod) break;
    }

    if (!mod) continue; // Skip if not found

    const create: MCPServerFactory | undefined = mod.createServer || mod.default;
    if (!create) continue;

    const server = create(entry.config);
    // eslint-disable-next-line no-await-in-loop
    await registerMCPServer(server);
  }
}

export type { MCPServer, MCPServerTool } from './types';
