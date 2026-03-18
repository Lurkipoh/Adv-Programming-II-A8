/**
 * Embedding Generator - Phase 7 (COMPLETED from Phase 5)
 */

import { OllamaEmbeddings } from '@langchain/ollama';
import { logger } from '../utils/logger.js';
import { embeddingConfig, ollamaConfig } from '../config/index.js';

export interface EmbeddingOptions {
  model?: string;
  baseUrl?: string;
}

export class EmbeddingGenerator {
  private embeddings: OllamaEmbeddings;
  private dimensions: number;

  constructor(options: EmbeddingOptions = {}) {
    const {
      model = embeddingConfig.model,
      baseUrl = ollamaConfig.baseUrl,
    } = options;

    this.embeddings = new OllamaEmbeddings({
      model,
      baseUrl,
    });

    this.dimensions = embeddingConfig.dimensions;

    logger.info('Initialized Embedding Generator', {
      model,
      baseUrl,
      dimensions: this.dimensions,
    });
  }

  async embedText(text: string): Promise<number[]> {
    try {
      const embedding = await this.embeddings.embedQuery(text);

      logger.debug('Generated text embedding', {
        textLength: text.length,
        embeddingDimensions: embedding.length,
      });

      return embedding;
    } catch (error) {
      logger.error('Failed to generate text embedding', error);
      throw error;
    }
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    try {
      const embeddings = await this.embeddings.embedDocuments(texts);

      logger.debug('Generated document embeddings', {
        documentCount: texts.length,
        embeddingDimensions: embeddings[0]?.length || 0,
      });

      return embeddings;
    } catch (error) {
      logger.error('Failed to generate document embeddings', error);
      throw error;
    }
  }

  getDimensions(): number {
    return this.dimensions;
  }
}

export function createEmbeddingGenerator(options?: EmbeddingOptions): EmbeddingGenerator {
  return new EmbeddingGenerator(options);
}
