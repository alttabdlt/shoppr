import { z } from 'zod';
import type { MCPServerTool } from '@shoppr/core';

export const echoTool: MCPServerTool = {
  id: 'echo',
  description: 'Echo back a message',
  inputSchema: z.object({ message: z.string() }),
  category: 'info',
  handler: async (params) => ({ message: params.message }),
};

