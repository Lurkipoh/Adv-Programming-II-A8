/**
 * RAG Chain - Phase 7 (COMPLETED from Phase 6)
 */

import { KnowledgeRetriever } from './retriever.js';
import { OllamaLLM } from '../llms/ollama.js';
import { logger } from '../utils/logger.js';
import type { RetrievedDocument, RAGContext } from '../core/index.js';

export interface RAGOptions {
  topK?: number;
  includePersonality?: boolean;
  includeLore?: boolean;
  includeConversation?: boolean;
  minRelevanceScore?: number;
}

export class RAGChain {
  private retriever: KnowledgeRetriever;
  private llm: OllamaLLM;

  constructor(retriever: KnowledgeRetriever, llm: OllamaLLM) {
    this.retriever = retriever;
    this.llm = llm;
  }

  private buildRAGContext(
    query: string,
    retrievedDocs: RetrievedDocument[],
    personalityContext: string,
    conversationHistory: string
  ): RAGContext {
    return {
      query,
      retrievedDocs,
      personalityContext,
      conversationHistory,
    };
  }

  private formatRetrievedContext(docs: RetrievedDocument[]): string {
    if (docs.length === 0) {
      return 'No relevant context found.';
    }

    return docs
      .map(
        (doc, index) =>
          `[Context ${index + 1}] (relevance: ${doc.score.toFixed(2)})\n${doc.content}`
      )
      .join('\n\n');
  }

  async retrieveContext(
    npcId: string,
    query: string,
    options: RAGOptions = {}
  ): Promise<RAGContext> {
    const {
      includePersonality = true,
      includeLore = true,
      includeConversation = true,
    } = options;

    try {
      const multiSourceResults = await this.retriever.retrieveMultiSource(npcId, query, {
        personalityTopK: includePersonality ? 2 : 0,
        loreTopK: includeLore ? 2 : 0,
        conversationTopK: includeConversation ? 3 : 0,
      });

      const allDocs: RetrievedDocument[] = [
        ...multiSourceResults.personality,
        ...multiSourceResults.lore,
        ...multiSourceResults.conversation,
      ];

      allDocs.sort((a, b) => b.score - a.score);

      const personalityContext = this.formatRetrievedContext(multiSourceResults.personality);
      const conversationContext = this.formatRetrievedContext(multiSourceResults.conversation);

      const ragContext = this.buildRAGContext(
        query,
        allDocs,
        personalityContext,
        conversationContext
      );

      logger.debug('Built RAG context', {
        query: query.substring(0, 50),
        totalDocs: allDocs.length,
      });

      return ragContext;
    } catch (error) {
      logger.error('Failed to retrieve RAG context', error);
      throw error;
    }
  }

  async generate(
    npcId: string,
    query: string,
    systemPrompt: string,
    options: RAGOptions = {}
  ): Promise<string> {
    try {
      const ragContext = await this.retrieveContext(npcId, query, options);
      const contextStr = this.formatRetrievedContext(ragContext.retrievedDocs);

      const prompt = `${systemPrompt}

RETRIEVED CONTEXT:
${contextStr}

PERSONALITY CONTEXT:
${ragContext.personalityContext}

RECENT CONVERSATION:
${ragContext.conversationHistory}

USER INPUT: ${query}

RESPONSE:`;

      logger.debug('Generated RAG prompt', {
        promptLength: prompt.length,
        retrievedDocs: ragContext.retrievedDocs.length,
      });

      const response = await this.llm.generate(prompt);

      logger.info('Generated RAG response', {
        query: query.substring(0, 50),
        responseLength: response.length,
      });

      return response;
    } catch (error) {
      logger.error('Failed to generate RAG response', error);
      throw error;
    }
  }

  async *streamGenerate(
    npcId: string,
    query: string,
    systemPrompt: string,
    options: RAGOptions = {}
  ): AsyncGenerator<string> {
    try {
      const ragContext = await this.retrieveContext(npcId, query, options);
      const contextStr = this.formatRetrievedContext(ragContext.retrievedDocs);

      const prompt = `${systemPrompt}

RETRIEVED CONTEXT:
${contextStr}

PERSONALITY CONTEXT:
${ragContext.personalityContext}

RECENT CONVERSATION:
${ragContext.conversationHistory}

USER INPUT: ${query}

RESPONSE:`;

      for await (const chunk of this.llm.streamGenerate(prompt)) {
        yield chunk;
      }

      logger.info('Streamed RAG response', {
        query: query.substring(0, 50),
      });
    } catch (error) {
      logger.error('Failed to stream RAG response', error);
      throw error;
    }
  }
}

export function createRAGChain(retriever: KnowledgeRetriever, llm: OllamaLLM): RAGChain {
  return new RAGChain(retriever, llm);
}
