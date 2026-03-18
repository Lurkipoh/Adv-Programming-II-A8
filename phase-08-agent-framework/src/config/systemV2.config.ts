/**
 * System Configuration - Phase 7 (COMPLETED from Phase 1)
 */

import 'dotenv/config';

export const systemV2Config = {
  server: {
    host: process.env.SERVER_HOST || '0.0.0.0',
    port: parseInt(process.env.SERVER_PORT || '3000', 10),
    socketIoPort: parseInt(process.env.SOCKET_IO_PORT || '3001', 10),
  },

  ollama: {
    model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.OLLAMA_MAX_TOKENS || '512', 10),
    embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',
  },

  chroma: {
    host: process.env.CHROMA_HOST || 'localhost',
    port: parseInt(process.env.CHROMA_PORT || '8000', 10),
    collectionName: process.env.CHROMA_COLLECTION_V2 || 'npc_knowledge_v2',
  },

  personalities: {
    directory: process.env.PERSONALITIES_DIR || './data/personalities',
  },

  knowledge: {
    directory: process.env.KNOWLEDGE_DIR || './data/knowledge',
  },

  performance: {
    maxConcurrentNPCs: parseInt(process.env.MAX_CONCURRENT_NPCS || '50', 10),
    maxConversationHistory: parseInt(process.env.MAX_CONVERSATION_HISTORY || '10', 10),
  },

  memory: {
    shortTermMaxSize: parseInt(process.env.MEMORY_SHORT_TERM_MAX || '20', 10),
    longTermThreshold: parseFloat(process.env.MEMORY_LONG_TERM_THRESHOLD || '0.5'),
    summarizationThreshold: parseInt(process.env.MEMORY_SUMMARIZATION_THRESHOLD || '50', 10),
    retrievalTopK: parseInt(process.env.MEMORY_RETRIEVAL_TOP_K || '5', 10),
    retentionDays: parseInt(process.env.MEMORY_RETENTION_DAYS || '30', 10),
  },
};

export default systemV2Config;
