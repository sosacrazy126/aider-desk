import { LlmProvider, PROVIDER_MODELS } from '@common/llm-providers';

type TextContent =
  | string
  | {
      type: 'text';
      text: string;
    };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isTextContent = (content: any): content is TextContent => content?.type === 'text' || typeof content === 'string';

export const extractTextContent = (content: unknown): string => {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .filter(isTextContent)
      .map((c) => (typeof c === 'string' ? c : c.text))
      .join('\n\n');
  }

  if (typeof content === 'object' && content !== null && 'content' in content) {
    return extractTextContent((content as { content: unknown }).content);
  }

  return '';
};

export const calculateCost = (llmProvider: LlmProvider, sentTokens: number, receivedTokens: number) => {
  const providerModels = PROVIDER_MODELS[llmProvider.name];
  if (!providerModels) {
    return 0;
  }

  // Get the model name directly from the provider
  const model = llmProvider.model;
  if (!model) {
    return 0;
  }

  // Find the model cost configuration
  const modelCost = providerModels.models[model];
  if (!modelCost) {
    return 0;
  }

  // Calculate cost in dollars (costs are per million tokens)
  const inputCost = (sentTokens * modelCost.inputCost) / 1_000_000;
  const outputCost = (receivedTokens * modelCost.outputCost) / 1_000_000;

  return inputCost + outputCost;
};
