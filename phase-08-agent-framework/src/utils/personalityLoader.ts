/**
 * Personality Loader - Phase 7 (COMPLETED from Phase 4)
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { logger } from './logger.js';
import { personalitiesConfig } from '../config/index.js';
import type { NPCPersonality } from '../core/index.js';

export async function loadPersonality(
  npcId: string,
  directory?: string
): Promise<NPCPersonality> {
  const dir = directory || personalitiesConfig.directory;
  const filePath = join(dir, `${npcId}.json`);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const personality = JSON.parse(content) as NPCPersonality;

    logger.info('Loaded personality', {
      npcId,
      name: personality.name,
      role: personality.role,
    });

    return personality;
  } catch (error) {
    logger.error('Failed to load personality', error, { npcId, filePath });
    throw error;
  }
}

export async function loadAllPersonalities(
  directory?: string
): Promise<Map<string, NPCPersonality>> {
  const dir = directory || personalitiesConfig.directory;
  const personalities = new Map<string, NPCPersonality>();

  try {
    const files = await fs.readdir(dir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    for (const file of jsonFiles) {
      const npcId = file.replace('.json', '');
      try {
        const personality = await loadPersonality(npcId, dir);
        personalities.set(npcId, personality);
      } catch (error) {
        logger.warn('Skipping invalid personality file', { file });
      }
    }

    logger.info('Loaded all personalities', {
      count: personalities.size,
      npcs: Array.from(personalities.keys()),
    });

    return personalities;
  } catch (error) {
    logger.error('Failed to load personalities', error, { directory: dir });
    throw error;
  }
}

export function getPersonalityPrompt(personality: NPCPersonality): string {
  const traitsStr = personality.traits.join(', ');
  const goalsStr = personality.goals.join(', ');
  const catchphrases = personality.speechPatterns.catchphrases?.join('", "') || '';

  return `You are ${personality.name}, a ${personality.role}.

PERSONALITY TRAITS: ${traitsStr}

SPEAKING STYLE:
- Tone: ${personality.speechPatterns.tone}
- Formality: ${personality.speechPatterns.formality}
${catchphrases ? `- Catchphrases: "${catchphrases}"` : ''}

GOALS: ${goalsStr}

BACKGROUND:
${personality.backstory}

INSTRUCTIONS:
- Stay in character at all times
- Use your defined speaking style
- Reference your background when relevant
- Work toward your goals in conversations`;
}

export function validatePersonality(data: unknown): data is NPCPersonality {
  if (typeof data !== 'object' || data === null) return false;
  const p = data as Record<string, unknown>;
  return (
    typeof p.id === 'string' &&
    typeof p.name === 'string' &&
    typeof p.role === 'string' &&
    Array.isArray(p.traits) &&
    typeof p.speechPatterns === 'object' &&
    typeof p.emotionalRanges === 'object' &&
    Array.isArray(p.goals) &&
    typeof p.backstory === 'string' &&
    Array.isArray(p.relationships)
  );
}
