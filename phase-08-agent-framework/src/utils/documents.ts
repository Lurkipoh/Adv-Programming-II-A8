/**
 * Document Utilities - Phase 7 (COMPLETED from Phase 6)
 */

import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger.js';
import type { ChromaDocument } from '../vectorstores/chroma.js';

export interface DocumentSource {
  path: string;
  type: 'personality' | 'knowledge' | 'conversation' | 'lore';
  metadata?: Record<string, unknown>;
}

export interface ChunkOptions {
  chunkSize: number;
  chunkOverlap: number;
}

export async function loadTextDocument(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    logger.debug('Loaded text document', { path: filePath });
    return content;
  } catch (error) {
    logger.error('Failed to load text document', error, { path: filePath });
    throw error;
  }
}

export function chunkText(text: string, options: ChunkOptions): string[] {
  const { chunkSize, chunkOverlap } = options;
  const chunks: string[] = [];

  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();

    if ((currentChunk + trimmedSentence).length > chunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());

        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-Math.floor(chunkOverlap / 10));
        currentChunk = overlapWords.join(' ') + ' ' + trimmedSentence;
      } else {
        for (let i = 0; i < trimmedSentence.length; i += chunkSize - chunkOverlap) {
          chunks.push(trimmedSentence.slice(i, i + chunkSize));
        }
        currentChunk = '';
      }
    } else {
      currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  logger.debug('Chunked text', {
    originalLength: text.length,
    chunks: chunks.length,
    chunkSize,
    chunkOverlap,
  });

  return chunks;
}

export function createDocumentsFromChunks(
  chunks: string[],
  baseMetadata: Record<string, unknown> = {}
): ChromaDocument[] {
  return chunks.map((chunk, index) => ({
    id: uuidv4(),
    content: chunk,
    metadata: {
      ...baseMetadata,
      chunkIndex: index,
      totalChunks: chunks.length,
      createdAt: new Date().toISOString(),
    },
  }));
}

export async function loadAndProcessDocument(
  source: DocumentSource,
  chunkOptions: ChunkOptions = { chunkSize: 500, chunkOverlap: 50 }
): Promise<ChromaDocument[]> {
  try {
    const content = await loadTextDocument(source.path);
    const chunks = chunkText(content, chunkOptions);

    const baseMetadata = {
      ...source.metadata,
      type: source.type,
      sourcePath: source.path,
    };

    const documents = createDocumentsFromChunks(chunks, baseMetadata);

    logger.info('Loaded and processed document', {
      path: source.path,
      type: source.type,
      chunks: documents.length,
    });

    return documents;
  } catch (error) {
    logger.error('Failed to load and process document', error, { path: source.path });
    throw error;
  }
}

export async function listFiles(dirPath: string, extension?: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => !extension || name.endsWith(extension));

    logger.debug('Listed files in directory', { path: dirPath, count: files.length });
    return files;
  } catch (error) {
    logger.error('Failed to list files', error, { path: dirPath });
    throw error;
  }
}
