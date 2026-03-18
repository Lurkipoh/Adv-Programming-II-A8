/**
 * Knowledge Retriever - Phase 7 (COMPLETED from Phase 6)
 */

import type { Metadata } from 'chromadb';
import { ChromaVectorStore, QueryOptions } from '../vectorstores/chroma.js';
import { EmbeddingGenerator } from '../llms/embeddings.js';
import { logger } from '../utils/logger.js';
import type { RetrievedDocument } from '../core/index.js';

export interface RetrievalOptions {
  topK?: number;
  filter?: Metadata;
  minScore?: number;
  includeMetadata?: boolean;
}

export class KnowledgeRetriever {
  private vectorStore: ChromaVectorStore;
  private embeddings: EmbeddingGenerator;

  constructor(vectorStore: ChromaVectorStore, embeddings: EmbeddingGenerator) {
    this.vectorStore = vectorStore;
    this.embeddings = embeddings;
  }

  async retrieve(query: string, options: RetrievalOptions = {}): Promise<RetrievedDocument[]> {
    const { topK = 5, filter, minScore = 0.0, includeMetadata = true } = options;

    try {
      logger.debug('Retrieving documents for query', { query, topK });

      const queryEmbedding = await this.embeddings.embedText(query);

      const queryOptions: QueryOptions = {
        topK,
        filter,
        includeMetadata,
      };

      const results = await this.vectorStore.query(queryEmbedding, queryOptions);

      const filteredResults = results.filter((doc) => doc.score >= minScore);

      logger.info('Retrieved documents', {
        query: query.substring(0, 50),
        retrieved: filteredResults.length,
        topK,
      });

      return filteredResults;
    } catch (error) {
      logger.error('Failed to retrieve documents', error, { query });
      throw error;
    }
  }

  async retrieveByType(
    query: string,
    type: string,
    options: RetrievalOptions = {}
  ): Promise<RetrievedDocument[]> {
    const topK = (options.topK || 5) * 3;
    const results = await this.retrieve(query, { ...options, topK, filter: undefined });

    const filtered = results.filter((doc) => {
      const docType = doc.metadata.type;
      if (docType !== type) return false;

      if (options.filter) {
        for (const [key, value] of Object.entries(options.filter)) {
          if (doc.metadata[key] !== value) return false;
        }
      }

      return true;
    });

    return filtered.slice(0, options.topK || 5);
  }

  async retrievePersonalityContext(
    npcId: string,
    query: string,
    topK = 3
  ): Promise<RetrievedDocument[]> {
    return this.retrieveByType(query, 'personality', {
      topK,
      filter: { npcId },
    });
  }

  async retrieveLoreContext(query: string, topK = 3): Promise<RetrievedDocument[]> {
    const loreResults = await this.retrieveByType(query, 'lore', { topK });
    const knowledgeResults = await this.retrieveByType(query, 'knowledge', { topK });

    const combined = [...loreResults, ...knowledgeResults]
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return combined;
  }

  async retrieveConversationContext(
    npcId: string,
    query: string,
    topK = 5
  ): Promise<RetrievedDocument[]> {
    return this.retrieveByType(query, 'conversation', {
      topK,
      filter: { npcId },
    });
  }

  async retrieveMultiSource(
    npcId: string,
    query: string,
    options: {
      personalityTopK?: number;
      loreTopK?: number;
      conversationTopK?: number;
    } = {}
  ): Promise<{
    personality: RetrievedDocument[];
    lore: RetrievedDocument[];
    conversation: RetrievedDocument[];
  }> {
    const { personalityTopK = 2, loreTopK = 2, conversationTopK = 3 } = options;

    try {
      const [personality, lore, conversation] = await Promise.all([
        this.retrievePersonalityContext(npcId, query, personalityTopK),
        this.retrieveLoreContext(query, loreTopK),
        this.retrieveConversationContext(npcId, query, conversationTopK),
      ]);

      logger.debug('Retrieved multi-source context', {
        personality: personality.length,
        lore: lore.length,
        conversation: conversation.length,
      });

      return { personality, lore, conversation };
    } catch (error) {
      logger.error('Failed to retrieve multi-source context', error);
      throw error;
    }
  }
}

export function createKnowledgeRetriever(
  vectorStore: ChromaVectorStore,
  embeddings: EmbeddingGenerator
): KnowledgeRetriever {
  return new KnowledgeRetriever(vectorStore, embeddings);
}
