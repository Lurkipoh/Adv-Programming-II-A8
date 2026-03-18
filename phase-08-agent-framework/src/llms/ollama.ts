/**
 * Ollama LLM Integration - Phase 7 (COMPLETED from Phase 2)
 */

import { ChatOllama } from '@langchain/ollama';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ollamaConfig } from '../config/index.js';
import { logger } from '../utils/logger.js';

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
}

export class OllamaLLM {
  private model: ChatOllama;

  constructor(options: LLMOptions = {}) {
    const {
      temperature = ollamaConfig.temperature,
      maxTokens = ollamaConfig.maxTokens,
    } = options;

    this.model = new ChatOllama({
      baseUrl: ollamaConfig.baseUrl,
      model: ollamaConfig.model,
      temperature,
      numPredict: maxTokens,
    });

    logger.info('Initialized Ollama LLM', {
      model: ollamaConfig.model,
      baseUrl: ollamaConfig.baseUrl,
      temperature,
      maxTokens,
    });
  }

  async generate(prompt: string): Promise<string> {
    try {
      const response = await this.model.invoke(prompt);
      const content = typeof response.content === 'string' ? response.content : '';
      logger.debug('Generated LLM response', {
        promptLength: prompt.length,
        responseLength: content.length,
      });
      return content;
    } catch (error) {
      logger.error('Failed to generate LLM response', error);
      throw error;
    }
  }

  async *streamGenerate(prompt: string): AsyncGenerator<string> {
    try {
      const stream = await this.model.stream(prompt);
      for await (const chunk of stream) {
        const content = typeof chunk.content === 'string' ? chunk.content : '';
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      logger.error('Failed to stream LLM response', error);
      throw error;
    }
  }

  getModel(): BaseChatModel {
    return this.model;
  }
}

export function createOllamaLLM(options?: LLMOptions): OllamaLLM {
  return new OllamaLLM(options);
}
