/**
 * Memory Manager - Phase 8 (COMPLETED from Phase 7)
 */

import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { logger } from '../utils/logger.js';
import { memoryConfig } from '../config/index.js';
import { KnowledgeRetriever } from '../chains/retriever.js';
import { ChromaVectorStore } from '../vectorstores/chroma.js';
import { EmbeddingGenerator } from '../llms/embeddings.js';
import type { ConversationContext, NPCPersonality, RetrievedDocument } from '../core/index.js';

export interface MemoryEntry {
  id: string;
  npcId: string;
  playerId: string;
  timestamp: Date;
  content: string;
  type: 'conversation' | 'event' | 'fact' | 'relationship';
  importance: number;
  emotion?: string;
  summary?: string;
  metadata: Record<string, unknown>;
}

export interface MemoryManagerConfig {
  shortTermMaxSize: number;
  longTermThreshold: number;
  summarizationThreshold: number;
  retrievalTopK: number;
}

export class MemoryManager {
  private shortTermMemory: Map<string, ConversationContext[]>;
  private config: MemoryManagerConfig;
  private vectorStore: ChromaVectorStore;
  private embeddings: EmbeddingGenerator;
  private retriever: KnowledgeRetriever;
  private llm: BaseChatModel;

  constructor(
    vectorStore: ChromaVectorStore,
    embeddings: EmbeddingGenerator,
    retriever: KnowledgeRetriever,
    llm: BaseChatModel,
    config?: Partial<MemoryManagerConfig>
  ) {
    this.vectorStore = vectorStore;
    this.embeddings = embeddings;
    this.retriever = retriever;
    this.llm = llm;
    this.shortTermMemory = new Map();

    this.config = {
      shortTermMaxSize: config?.shortTermMaxSize || memoryConfig.shortTermMaxSize,
      longTermThreshold: config?.longTermThreshold || memoryConfig.longTermThreshold,
      summarizationThreshold: config?.summarizationThreshold || memoryConfig.summarizationThreshold,
      retrievalTopK: config?.retrievalTopK || memoryConfig.retrievalTopK,
    };
  }

  private getMemoryKey(npcId: string, playerId: string): string {
    return `${npcId}:${playerId}`;
  }

  addToShortTerm(
    npcId: string,
    playerId: string,
    message: ConversationContext
  ): void {
    const key = this.getMemoryKey(npcId, playerId);
    const memory = this.shortTermMemory.get(key) || [];

    memory.push(message);

    if (memory.length > this.config.shortTermMaxSize) {
      memory.shift();
    }

    this.shortTermMemory.set(key, memory);
  }

  getShortTerm(npcId: string, playerId: string): ConversationContext[] {
    const key = this.getMemoryKey(npcId, playerId);
    return this.shortTermMemory.get(key) || [];
  }

  private calculateImportance(
    playerMessage: string,
    npcResponse: string,
    emotion: string = 'neutral'
  ): number {
    let importance = 0.3;

    const emotionalWeight: Record<string, number> = {
      angry: 0.3,
      fearful: 0.3,
      surprised: 0.2,
      excited: 0.2,
      happy: 0.15,
      sad: 0.15,
      curious: 0.1,
      neutral: 0.0,
    };
    importance += emotionalWeight[emotion] || 0;

    const importantKeywords = [
      'quest', 'mission', 'task', 'help',
      'trade', 'buy', 'sell', 'gold',
      'attack', 'defend', 'battle', 'fight',
      'secret', 'treasure', 'important', 'urgent',
    ];

    const text = (playerMessage + ' ' + npcResponse).toLowerCase();
    const keywordMatches = importantKeywords.filter(kw => text.includes(kw)).length;
    importance += Math.min(keywordMatches * 0.1, 0.3);

    const questionCount = (playerMessage.match(/\?/g) || []).length;
    importance += Math.min(questionCount * 0.05, 0.15);

    const totalLength = playerMessage.length + npcResponse.length;
    if (totalLength > 200) importance += 0.1;
    if (totalLength > 400) importance += 0.1;

    return Math.min(importance, 1.0);
  }

  async storeInLongTerm(
    npcId: string,
    playerId: string,
    playerMessage: string,
    npcResponse: string,
    emotion: string = 'neutral',
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    const importance = this.calculateImportance(playerMessage, npcResponse, emotion);

    if (importance < this.config.longTermThreshold) {
      return;
    }

    const memoryId = `memory_${npcId}_${playerId}_${Date.now()}`;
    const timestamp = new Date().toISOString();

    const memoryContent = `[Conversation on ${timestamp}]
Player: ${playerMessage}
NPC: ${npcResponse}
Emotion: ${emotion}
Importance: ${importance.toFixed(2)}`;

    try {
      const embedding = await this.embeddings.embedText(memoryContent);

      await this.vectorStore.addDocuments(
        [{
          id: memoryId,
          content: memoryContent,
          metadata: {
            npcId,
            playerId,
            timestamp,
            importance,
            emotion,
            type: 'conversation',
            ...metadata,
          },
        }],
        [embedding]
      );

      logger.info('Stored long-term memory', { memoryId, importance: importance.toFixed(2) });
    } catch (error) {
      logger.error('Failed to store memory', error, { memoryId });
    }
  }

  async retrieveRelevantMemories(
    npcId: string,
    playerId: string,
    query: string,
    topK?: number
  ): Promise<RetrievedDocument[]> {
    const k = topK || this.config.retrievalTopK;

    try {
      const memories = await this.retriever.retrieveConversationContext(
        npcId,
        query,
        k
      );

      logger.info('Retrieved memories', {
        npcId,
        playerId,
        count: memories.length,
      });

      return memories;
    } catch (error) {
      logger.error('Error retrieving memories', error);
      return [];
    }
  }

  async summarizeOldMemories(
    npcId: string,
    playerId: string,
    personality: NPCPersonality
  ): Promise<string | null> {
    const shortTerm = this.getShortTerm(npcId, playerId);

    if (shortTerm.length < this.config.summarizationThreshold) {
      return null;
    }

    const toSummarize = shortTerm.slice(0, Math.floor(shortTerm.length / 2));

    const conversationText = toSummarize
      .map(ctx => `${ctx.speaker === 'player' ? 'Player' : personality.name}: ${ctx.message}`)
      .join('\n');

    const summaryPrompt = `Summarize this conversation between the player and ${personality.name} in 2-3 sentences.
Focus on key facts, decisions, and relationship changes.

Conversation:
${conversationText}

Summary:`;

    try {
      const response = await this.llm.invoke(summaryPrompt);
      const summary = response.content.toString().trim();

      const summaryId = `summary_${npcId}_${playerId}_${Date.now()}`;
      const summaryContent = `[Summary of conversation]\n${summary}`;

      const embedding = await this.embeddings.embedText(summaryContent);

      await this.vectorStore.addDocuments(
        [{
          id: summaryId,
          content: summaryContent,
          metadata: {
            npcId,
            playerId,
            timestamp: new Date().toISOString(),
            type: 'summary',
            messageCount: toSummarize.length,
          },
        }],
        [embedding]
      );

      logger.info('Created conversation summary', { summaryId });

      return summary;
    } catch (error) {
      logger.error('Error summarizing memories', error);
      return null;
    }
  }

  clearShortTerm(npcId: string, playerId: string): void {
    const key = this.getMemoryKey(npcId, playerId);
    this.shortTermMemory.delete(key);
    logger.info('Cleared short-term memory', { npcId, playerId });
  }

  getStats(npcId: string, playerId: string) {
    const key = this.getMemoryKey(npcId, playerId);
    const shortTerm = this.shortTermMemory.get(key) || [];

    return {
      npcId,
      playerId,
      shortTermCount: shortTerm.length,
      shortTermMaxSize: this.config.shortTermMaxSize,
      needsSummarization: shortTerm.length >= this.config.summarizationThreshold,
    };
  }

  formatMemoriesForContext(memories: RetrievedDocument[]): string {
    if (memories.length === 0) {
      return 'No relevant past conversations.';
    }

    return memories
      .map((mem, i) => `[Memory ${i + 1} - relevance: ${mem.score.toFixed(2)}]\n${mem.content}`)
      .join('\n\n');
  }
}

export function createMemoryManager(
  vectorStore: ChromaVectorStore,
  embeddings: EmbeddingGenerator,
  retriever: KnowledgeRetriever,
  llm: BaseChatModel,
  config?: Partial<MemoryManagerConfig>
): MemoryManager {
  return new MemoryManager(vectorStore, embeddings, retriever, llm, config);
}
