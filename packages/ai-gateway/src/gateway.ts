import { AiProvider, GenerateTextInput, GenerateTextResult } from './interfaces/ai-provider';
import {
  EmbedTextInput,
  EmbedTextResult,
  EmbeddingProvider,
} from './interfaces/embedding-provider';
import { AiProviderName } from './types';

export class AiGateway {
  private readonly textProviders = new Map<AiProviderName, AiProvider>();
  private readonly embeddingProviders = new Map<AiProviderName, EmbeddingProvider>();

  constructor(
    providers: {
      text?: AiProvider[];
      embeddings?: EmbeddingProvider[];
    } = {},
  ) {
    providers.text?.forEach((provider) => {
      this.textProviders.set(provider.name, provider);
    });
    providers.embeddings?.forEach((provider) => {
      this.embeddingProviders.set(provider.name, provider);
    });
  }

  async generateText(
    providerName: AiProviderName,
    input: GenerateTextInput,
  ): Promise<GenerateTextResult> {
    const provider = this.textProviders.get(providerName);

    if (!provider) {
      throw new Error(`Text provider is not registered: ${providerName}`);
    }

    return provider.generateText(input);
  }

  async embedText(
    providerName: AiProviderName,
    input: EmbedTextInput,
  ): Promise<EmbedTextResult> {
    const provider = this.embeddingProviders.get(providerName);

    if (!provider) {
      throw new Error(`Embedding provider is not registered: ${providerName}`);
    }

    return provider.embedText(input);
  }
}

