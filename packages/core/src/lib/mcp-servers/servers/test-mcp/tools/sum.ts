import { z } from 'zod';
import type { MCPServerTool } from '../../../types';

export const sumTool: MCPServerTool = {
  id: 'sum',
  description: 'Sum two numbers',
  inputSchema: z.object({ a: z.number(), b: z.number() }),
  category: 'info',
  handler: async ({ a, b }) => ({ result: a + b }),
};

