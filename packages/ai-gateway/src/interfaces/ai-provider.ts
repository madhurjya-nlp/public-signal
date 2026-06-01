import { AiCallMetadata, AiProviderName } from '../types';

export interface GenerateTextInput {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GenerateTextResult {
  text: string;
  metadata: AiCallMetadata;
}

export interface AiProvider {
  readonly name: AiProviderName;
  generateText(input: GenerateTextInput): Promise<GenerateTextResult>;
}

