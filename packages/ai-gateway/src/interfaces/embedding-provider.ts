import { AiCallMetadata, AiProviderName } from '../types';

export interface EmbedTextInput {
  texts: string[];
}

export interface EmbedTextResult {
  vectors: number[][];
  metadata: AiCallMetadata & {
    dimensions: number;
  };
}

export interface EmbeddingProvider {
  readonly name: AiProviderName;
  embedText(input: EmbedTextInput): Promise<EmbedTextResult>;
}

