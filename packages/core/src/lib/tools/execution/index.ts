import { executeSwapTool, type ExecuteSwapInput, type SwapExecutionResult } from './execute-swap';
import { executeBridgeTool, type ExecuteBridgeInput, type BridgeExecutionResult } from './execute-bridge';

export { executeSwapTool, type ExecuteSwapInput, type SwapExecutionResult };
export { executeBridgeTool, type ExecuteBridgeInput, type BridgeExecutionResult };

export const executionTools = [
  executeSwapTool,
  executeBridgeTool,
];