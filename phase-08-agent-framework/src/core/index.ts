/**
 * Core Type Definitions - Phase 8 (COMPLETED from Phase 7)
 */

export type EmotionType =
  | 'neutral'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'fearful'
  | 'surprised'
  | 'disgusted'
  | 'curious'
  | 'excited';

export interface SpeechPatterns {
  tone: string;
  formality: 'formal' | 'casual' | 'informal' | 'slang';
  vocabulary?: string[];
  catchphrases?: string[];
}

export interface EmotionalRanges {
  angerThreshold: number;
  fearThreshold: number;
  empathyLevel: number;
  expressiveness: number;
}

export interface Relationship {
  targetId: string;
  targetName: string;
  attitude: 'friendly' | 'neutral' | 'hostile' | 'fearful';
  trustLevel: number;
}

export interface NPCPersonality {
  id: string;
  name: string;
  role: string;
  description: string;
  traits: string[];
  speechPatterns: SpeechPatterns;
  emotionalRanges: EmotionalRanges;
  goals: string[];
  backstory: string;
  relationships: Relationship[];
  knowledge?: string[];
}

export interface RetrievedDocument {
  content: string;
  metadata: Record<string, unknown>;
  score: number;
}

export interface RAGContext {
  query: string;
  retrievedDocs: RetrievedDocument[];
  personalityContext: string;
  conversationHistory: string;
}

export interface ConversationContext {
  timestamp: Date;
  speaker: 'player' | 'npc';
  message: string;
  emotion?: EmotionType;
}

export interface NPCResponse {
  dialog: string;
  emotion: EmotionType;
  action: NPCAction;
}

export interface NPCAction {
  type: string;
  target?: string;
  parameters?: Record<string, unknown>;
}
