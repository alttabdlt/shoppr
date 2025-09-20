import { z } from 'zod';
import type { MCPServerTool } from '../../../types';

export const pingTool: MCPServerTool = {
  id: 'ping',
  description: 'Health check; returns pong',
  inputSchema: z.object({}),
  category: 'monitoring',
  handler: async () => ({ pong: true, ts: Date.now() }),
};

