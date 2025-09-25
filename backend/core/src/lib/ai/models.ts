export const DEFAULT_CHAT_MODEL: string = 'chat-model';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model',
    name: 'Qwen 32B',
    description: 'Qwen3 32B via OpenRouter (tools + structured outputs)',
  },
  {
    id: 'chat-model-reasoning',
    name: 'Qwen 30B A3B (Reasoning)',
    description: 'Qwen3 30B A3B instruct variant for reasoning-style prompts',
  },
];
