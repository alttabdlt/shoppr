import type { MCPServer } from '../../types';
import { pingTool } from './tools/ping';
import { echoTool } from './tools/echo';
import { sumTool } from './tools/sum';

export function createServer(): MCPServer {
  return {
    name: 'test-mcp',
    version: '1.0.0',
    tools: [pingTool, echoTool, sumTool],
    ping: async () => void 0,
  };
}
