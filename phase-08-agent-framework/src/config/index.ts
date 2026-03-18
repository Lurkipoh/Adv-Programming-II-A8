/**
 * Configuration Exports - Phase 7 (COMPLETED from Phase 1)
 */

import { systemV2Config } from './systemV2.config.js';

export const ollamaConfig = {
  baseUrl: systemV2Config.ollama.baseUrl,
  model: systemV2Config.ollama.model,
  temperature: systemV2Config.ollama.temperature,
  maxTokens: systemV2Config.ollama.maxTokens,
  embeddingModel: systemV2Config.ollama.embeddingModel,
};

export const embeddingConfig = {
  model: systemV2Config.ollama.embeddingModel,
  dimensions: 768,
};

export const chromaConfig = {
  host: systemV2Config.chroma.host,
  port: systemV2Config.chroma.port,
  collectionName: systemV2Config.chroma.collectionName,
};

export const serverConfig = {
  host: systemV2Config.server.host,
  port: systemV2Config.server.port,
  socketIoPort: systemV2Config.server.socketIoPort,
};

export const personalitiesConfig = {
  directory: systemV2Config.personalities.directory,
};

export const knowledgeConfig = {
  directory: systemV2Config.knowledge.directory,
};

export const memoryConfig = {
  shortTermMaxSize: systemV2Config.memory.shortTermMaxSize,
  longTermThreshold: systemV2Config.memory.longTermThreshold,
  summarizationThreshold: systemV2Config.memory.summarizationThreshold,
  retrievalTopK: systemV2Config.memory.retrievalTopK,
};

export { systemV2Config };
export default systemV2Config;
