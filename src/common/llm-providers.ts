export interface LlmProviderBase {
  name: 'openai' | 'anthropic' | 'gemini';
  apiKey: string;
  model: string;
  active: boolean;
}

export interface OpenAiProvider extends LlmProviderBase {
  name: 'openai';
}
export const isOpenAiProvider = (provider: LlmProviderBase): provider is OpenAiProvider => provider.name === 'openai';

export interface AnthropicProvider extends LlmProviderBase {
  name: 'anthropic';
}
export const isAnthropicProvider = (provider: LlmProviderBase): provider is AnthropicProvider => provider.name === 'anthropic';

export interface GeminiProvider extends LlmProviderBase {
  name: 'gemini';
}
export const isGeminiProvider = (provider: LlmProviderBase): provider is GeminiProvider => provider.name === 'gemini';

export type LlmProvider = OpenAiProvider | AnthropicProvider | GeminiProvider;

export const PROVIDER_MODELS = {
  openai: {
    models: {
      'gpt-4o-mini': {
        inputCost: 0.15,
        outputCost: 0.6,
      },
    },
  },
  anthropic: {
    models: {
      'claude-3-7-sonnet-20250219': {
        inputCost: 3.0,
        outputCost: 15.0,
      },
    },
  },
  gemini: {
    models: {
      'gemini-2.0-flash': {
        inputCost: 0.1,
        outputCost: 0.4,
      },
    },
  },
};
