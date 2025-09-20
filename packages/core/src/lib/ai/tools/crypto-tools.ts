import { tool } from 'ai';
import { getToolRegistry, initializeToolRegistry, type ToolContext, type CryptoToolDefinition } from '../../tools';
import type { Session } from 'next-auth';
import type { UIMessageStreamWriter } from 'ai';
import type { ChatMessage } from '@/lib/types';

interface CryptoToolsProps {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
}

let toolsInitialized = false;

function ensureToolsInitialized() {
  if (!toolsInitialized) {
    initializeToolRegistry();
    toolsInitialized = true;
  }
}

export function createCryptoTools({ session, dataStream }: CryptoToolsProps) {
  ensureToolsInitialized();

  const registry = getToolRegistry();
  const allTools = registry.getAll();

  const tools: Record<string, any> = {};

  for (const cryptoTool of allTools) {
    tools[cryptoTool.id] = tool({
      description: cryptoTool.description,
      inputSchema: cryptoTool.inputSchema,
      execute: async (params) => {
        // Get wallet context from React context (passed from the component)
        const context: ToolContext = (params as any).__walletContext || {
          userAddress: undefined,
          sessionId: session.user?.id,
          permissions: []
        };

        // Remove the wallet context from params before passing to tool
        const cleanParams = { ...(params as any) };
        delete cleanParams.__walletContext;

        try {
          const result = await registry.execute(cryptoTool.id, cleanParams, context);

          if (!result.success) {
            throw new Error(result.error);
          }

          return result.data;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          throw new Error(errorMessage);
        }
      }
    });
  }

  return tools;
}

export function getCryptoToolsForChat() {
  ensureToolsInitialized();

  const registry = getToolRegistry();
  return registry.getAll().map((tool: CryptoToolDefinition) => tool.id);
}