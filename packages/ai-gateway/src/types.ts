export type AiProviderName = 'openai' | 'anthropic' | 'gemini' | 'local';

export interface AiUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface AiCallMetadata {
  provider: AiProviderName;
  model: string;
  usage?: AiUsage;
}

