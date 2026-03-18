/**
 * Chroma Vector Store - Phase 7 (COMPLETED from Phase 5)
 */

import { ChromaClient, Collection, IncludeEnum } from 'chromadb';
import type { Metadata } from 'chromadb';
import { logger } from '../utils/logger.js';
import { chromaConfig } from '../config/index.js';
import type { RetrievedDocument } from '../core/index.js';

export interface ChromaDocument {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
}

export interface QueryOptions {
  topK?: number;
  filter?: Metadata;
  includeMetadata?: boolean;
}

export class ChromaVectorStore {
  private client: ChromaClient;
  private collection: Collection | null = null;
  private collectionName: string;

  constructor() {
    this.client = new ChromaClient({
      path: `http://${chromaConfig.host}:${chromaConfig.port}`,
    });
    this.collectionName = chromaConfig.collectionName;

    logger.info('Created Chroma client', {
      host: chromaConfig.host,
      port: chromaConfig.port,
      collection: this.collectionName,
    });
  }

  async initialize(): Promise<void> {
    try {
      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
        metadata: {
          'hnsw:space': 'cosine',
        },
      });

      logger.info('Initialized Chroma collection', {
        collection: this.collectionName,
      });
    } catch (error) {
      logger.error('Failed to initialize Chroma collection', error);
      throw error;
    }
  }

  async addDocuments(docs: ChromaDocument[], embeddings: number[][]): Promise<void> {
    if (!this.collection) {
      throw new Error('Collection not initialized. Call initialize() first.');
    }

    try {
      await this.collection.add({
        ids: docs.map(d => d.id),
        embeddings: embeddings,
        metadatas: docs.map(d => d.metadata as Metadata),
        documents: docs.map(d => d.content),
      });

      logger.info('Added documents to Chroma', {
        count: docs.length,
        collection: this.collectionName,
      });
    } catch (error) {
      logger.error('Failed to add documents to Chroma', error);
      throw error;
    }
  }

  async query(embedding: number[], options: QueryOptions = {}): Promise<RetrievedDocument[]> {
    if (!this.collection) {
      throw new Error('Collection not initialized. Call initialize() first.');
    }

    const { topK = 5, filter, includeMetadata = true } = options;

    try {
      const results = await this.collection.query({
        queryEmbeddings: [embedding],
        nResults: topK,
        where: filter,
        include: includeMetadata ? [IncludeEnum.Documents, IncludeEnum.Metadatas, IncludeEnum.Distances] : [IncludeEnum.Documents, IncludeEnum.Distances],
      });

      const documents: RetrievedDocument[] = [];
      const ids = results.ids?.[0] || [];
      const docs = results.documents?.[0] || [];
      const metadatas = results.metadatas?.[0] || [];
      const distances = results.distances?.[0] || [];

      for (let i = 0; i < ids.length; i++) {
        const distance = distances[i] || 0;
        const score = 1 - (distance / 2);

        documents.push({
          content: docs[i] || '',
          metadata: (metadatas[i] as Record<string, unknown>) || {},
          score,
        });
      }

      logger.debug('Queried Chroma', {
        resultsCount: documents.length,
        topK,
      });

      return documents;
    } catch (error) {
      logger.error('Failed to query Chroma', error);
      throw error;
    }
  }

  async deleteCollection(): Promise<void> {
    try {
      await this.client.deleteCollection({
        name: this.collectionName,
      });
      this.collection = null;

      logger.info('Deleted Chroma collection', {
        collection: this.collectionName,
      });
    } catch (error) {
      logger.error('Failed to delete Chroma collection', error);
      throw error;
    }
  }

  getCollection(): Collection | null {
    return this.collection;
  }
}

export async function createChromaVectorStore(): Promise<ChromaVectorStore> {
  const store = new ChromaVectorStore();
  await store.initialize();
  return store;
}
