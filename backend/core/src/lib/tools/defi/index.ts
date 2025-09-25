import { parseIntentTool, type ParseIntentInput, type ParsedIntent } from './parse-intent';
import { getQuotesTool, type GetQuotesInput, type QuoteResult, type QuotesResponse } from './get-quotes';

export { parseIntentTool, type ParseIntentInput, type ParsedIntent };
export { getQuotesTool, type GetQuotesInput, type QuoteResult, type QuotesResponse };

export const defiTools = [
  parseIntentTool,
  getQuotesTool,
];