import { checkBalanceTool } from './check-balance';
import { getTokenPriceTool } from './get-token-price';
import { estimateGasTool } from './estimate-gas';
import { validateAddressTool } from './validate-address';
import { registerTool } from '../registry';

export function registerBaseTools() {
  registerTool(checkBalanceTool);
  registerTool(getTokenPriceTool);
  registerTool(estimateGasTool);
  registerTool(validateAddressTool);
}

export {
  checkBalanceTool,
  getTokenPriceTool,
  estimateGasTool,
  validateAddressTool
};