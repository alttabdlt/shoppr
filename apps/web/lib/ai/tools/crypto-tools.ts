import { tool } from 'ai';
import { z } from 'zod';
import {
  initializeToolRegistry,
  getToolRegistry,
  type ToolContext,
  type CryptoToolDefinition
} from '@shoppr/core';
import type { Session } from '@/app/(auth)/auth';

// Initialize the tool registry
initializeToolRegistry();

export function createCryptoTools({
  session,
  dataStream
}: {
  session: Session;
  dataStream: any;
}) {
  const registry = getToolRegistry();
  const tools = registry.getAll();

  const cryptoTools: Record<string, any> = {};

  tools.forEach((toolDef: CryptoToolDefinition) => {
    cryptoTools[toolDef.id] = tool({
      description: toolDef.description,
      parameters: toolDef.inputSchema,
      execute: async (params) => {
        try {
          // Create tool context - in a real app, you'd get this from the user session
          const context: ToolContext = {
            userAddress: session.user?.address, // Add address to session if available
            chainId: 1, // Default to Ethereum, should come from wallet context
          };

          const result = await registry.execute(toolDef.id, params, context);

          if (result.success) {
            // Stream the result back to the chat
            dataStream.write({
              type: 'tool-result',
              toolName: toolDef.id,
              result: result.data,
            });

            return result.data;
          } else {
            throw new Error(result.error || 'Tool execution failed');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          dataStream.write({
            type: 'tool-error',
            toolName: toolDef.id,
            error: errorMessage,
          });

          throw new Error(`${toolDef.name} failed: ${errorMessage}`);
        }
      },
    });
  });

  return cryptoTools;
}

export function getCryptoToolsForChat(): string[] {
  const registry = getToolRegistry();
  const tools = registry.getAll();

  // Return tool IDs that should be available in chat
  return tools
    .filter(tool => {
      // Only include low and medium risk tools in chat by default
      // High risk tools require explicit user approval
      return tool.riskLevel !== 'high';
    })
    .map(tool => tool.id);
}

// Utility function to get tool descriptions for AI prompt
export function getCryptoToolDescriptions(): string {
  const registry = getToolRegistry();
  const tools = registry.getAll();

  const descriptions = tools.map(tool => {
    const riskBadge = tool.riskLevel === 'high' ? ' [HIGH RISK]' :
                     tool.riskLevel === 'medium' ? ' [MEDIUM RISK]' : '';
    const walletRequired = tool.requiresWallet ? ' [REQUIRES WALLET]' : '';

    return `- ${tool.name}${riskBadge}${walletRequired}: ${tool.description}`;
  }).join('\n');

  return `Available crypto tools:\n${descriptions}`;
}