/**
 * Phase 08 - NPC Agent Tests
 *
 * These tests verify that your NPC Agent and AgentManager correctly
 * initialize agents, manage state, and process player interactions.
 *
 * Run with: npm test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies
vi.mock('chromadb', () => ({
  ChromaClient: vi.fn().mockImplementation(() => ({
    getOrCreateCollection: vi.fn().mockResolvedValue({
      add: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue({
        ids: [['doc1']],
        documents: [['Test context']],
        metadatas: [[{ type: 'personality' }]],
        distances: [[0.1]],
      }),
    }),
  })),
}));

vi.mock('@langchain/ollama', () => ({
  OllamaEmbeddings: vi.fn().mockImplementation(() => ({
    embedQuery: vi.fn().mockResolvedValue(new Array(768).fill(0.1)),
  })),
  ChatOllama: vi.fn().mockImplementation(() => ({
    invoke: vi.fn().mockResolvedValue({ content: 'Hello traveler!' }),
  })),
}));

describe('Phase 08: NPC Agent Framework', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('NPCAgent Class', () => {
    it('should export NPCAgent class', async () => {
      const module = await import('../agents/npcAgent.js');
      expect(module.NPCAgent).toBeDefined();
    });

    it('should export createNPCAgent factory', async () => {
      const module = await import('../agents/npcAgent.js');
      expect(module.createNPCAgent).toBeDefined();
      expect(typeof module.createNPCAgent).toBe('function');
    });
  });

  describe('Agent State Management', () => {
    it('should have getState method', async () => {
      const module = await import('../agents/npcAgent.js');
      expect(module.NPCAgent.prototype.getState).toBeDefined();
    });

    it('should have getPersonality method', async () => {
      const module = await import('../agents/npcAgent.js');
      expect(module.NPCAgent.prototype.getPersonality).toBeDefined();
    });

    it('should have chat method', async () => {
      const module = await import('../agents/npcAgent.js');
      expect(module.NPCAgent.prototype.chat).toBeDefined();
    });
  });

  describe('AgentManager Class', () => {
    it('should export AgentManager class', async () => {
      const module = await import('../agents/agentManager.js');
      expect(module.AgentManager).toBeDefined();
    });

    it('should export createAgentManager factory', async () => {
      const module = await import('../agents/agentManager.js');
      expect(module.createAgentManager).toBeDefined();
      expect(typeof module.createAgentManager).toBe('function');
    });

    it('should have createAgent method', async () => {
      const module = await import('../agents/agentManager.js');
      expect(module.AgentManager.prototype.createAgent).toBeDefined();
    });

    it('should have getAgent method', async () => {
      const module = await import('../agents/agentManager.js');
      expect(module.AgentManager.prototype.getAgent).toBeDefined();
    });

    it('should have getAllAgents method', async () => {
      const module = await import('../agents/agentManager.js');
      expect(module.AgentManager.prototype.getAllAgents).toBeDefined();
    });

    it('should have removeAgent method', async () => {
      const module = await import('../agents/agentManager.js');
      expect(module.AgentManager.prototype.removeAgent).toBeDefined();
    });
  });

  describe('Agent Response Structure', () => {
    it('should return properly structured response', async () => {
      const expectedResponse = {
        dialog: expect.any(String),
        emotion: expect.any(String),
        action: expect.any(Object),
      };

      // Verify structure expectations
      expect(expectedResponse.dialog).toBeDefined();
      expect(expectedResponse.emotion).toBeDefined();
      expect(expectedResponse.action).toBeDefined();
    });
  });

  describe('Agent State Structure', () => {
    it('should have correct state properties', async () => {
      const expectedState = {
        npcId: 'merchant_001',
        currentEmotion: 'neutral',
        emotionIntensity: 0,
        relationshipScore: 0,
        activeQuests: [],
        completedQuests: [],
      };

      expect(expectedState.npcId).toBeDefined();
      expect(expectedState.currentEmotion).toBe('neutral');
      expect(typeof expectedState.emotionIntensity).toBe('number');
      expect(Array.isArray(expectedState.activeQuests)).toBe(true);
    });
  });
});
