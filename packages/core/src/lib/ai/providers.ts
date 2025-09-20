import { customProvider } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { isTestEnvironment } from '../constants';

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require('./models.mock');
      return customProvider({
        languageModels: {
          'chat-model': chatModel,
          'chat-model-reasoning': reasoningModel,
          'title-model': titleModel,
          'artifact-model': artifactModel,
        },
      });
    })()
  : (() => {
      const openrouter = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY,
        // Optional configuration for analytics
        extraBody: {
          ...(process.env.OPENROUTER_REFERER && {
            'HTTP-Referer': process.env.OPENROUTER_REFERER,
          }),
          ...(process.env.OPENROUTER_TITLE && {
            'X-Title': process.env.OPENROUTER_TITLE,
          }),
        },
      });

      const CHAT_MODEL_ID =
        process.env.OPENROUTER_CHAT_MODEL_ID ?? 'qwen/qwen3-32b';
      const REASONING_MODEL_ID =
        process.env.OPENROUTER_REASONING_MODEL_ID ??
        'qwen/qwen3-30b-a3b-instruct-2507';
      const TITLE_MODEL_ID =
        process.env.OPENROUTER_TITLE_MODEL_ID ?? CHAT_MODEL_ID;
      const ARTIFACT_MODEL_ID =
        process.env.OPENROUTER_ARTIFACT_MODEL_ID ?? CHAT_MODEL_ID;

      return customProvider({
        languageModels: {
          'chat-model': openrouter.chat(CHAT_MODEL_ID),
          'chat-model-reasoning': openrouter.chat(REASONING_MODEL_ID),
          'title-model': openrouter.chat(TITLE_MODEL_ID),
          'artifact-model': openrouter.chat(ARTIFACT_MODEL_ID),
        },
      });
    })();