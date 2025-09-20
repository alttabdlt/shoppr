export * from './types';
export * from './registry';
export * from './base';
export * from './defi';
export * from './execution';

import { registerBaseTools } from './base';
import { defiTools } from './defi';
import { executionTools } from './execution';
import { registerTool } from './registry';
import { registerMCPServersFromConfig } from '../mcp-servers';

export function initializeToolRegistry() {
  registerBaseTools();

  // Register DeFi tools
  defiTools.forEach(tool => registerTool(tool));

  // Register execution tools
  executionTools.forEach(tool => registerTool(tool));

  // Optionally register MCP servers from config
  // Enable via MCP_SERVERS_ENABLED=true (defaults to true if unset)
  const enabled = process.env.MCP_SERVERS_ENABLED;
  if (enabled === undefined || enabled === 'true' || enabled === '1') {
    // Fire and forget; if config missing or none enabled, nothing happens
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    registerMCPServersFromConfig();
  }
}

export { getToolRegistry } from './registry';
