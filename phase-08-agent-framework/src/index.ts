/**
 * AI NPC Agent System - Phase 8 Entry Point
 *
 * Runs the NPC Agent Framework server with:
 * - Socket.IO server for real-time communication
 * - AgentManager handling multiple NPC agents
 * - Personality loading and agent creation
 */

import 'dotenv/config';
import { join } from 'path';
import { logger } from './utils/logger.js';
import { serverConfig } from './config/index.js';
import { createOllamaLLM } from './llms/ollama.js';
import { createEmbeddingGenerator } from './llms/embeddings.js';
import { createChromaVectorStore } from './vectorstores/chroma.js';
import { createKnowledgeRetriever } from './chains/retriever.js';
import { createMemoryManager } from './memory/memoryManager.js';
import { createAgentManager } from './agents/agentManager.js';
import { loadAllPersonalities } from './utils/personalityLoader.js';
import { createSocketServer } from './server/socketServer.js';

async function main(): Promise<void> {
  logger.info('=== Phase 8: Agent Framework Server ===');

  try {
    // Step 1: Initialize components
    logger.info('--- Initializing Components ---');
    const llm = createOllamaLLM();
    const embeddings = createEmbeddingGenerator();
    const vectorStore = await createChromaVectorStore();
    const retriever = createKnowledgeRetriever(vectorStore, embeddings);
    const memoryManager = createMemoryManager(
      vectorStore,
      embeddings,
      retriever,
      llm.getModel()
    );

    // Step 2: Create agent manager
    logger.info('--- Creating Agent Manager ---');
    const agentManager = createAgentManager(
      llm.getModel(),
      retriever,
      memoryManager,
      { maxConcurrentAgents: 10 }
    );

    // Step 3: Load personalities and create agents
    logger.info('--- Creating NPC Agents ---');
    const personalitiesDir = join(process.cwd(), 'data', 'personalities');
    const personalities = await loadAllPersonalities(personalitiesDir);

    for (const [npcId, personality] of personalities) {
      agentManager.createAgent(personality);
      logger.info(`✅ Loaded NPC: ${personality.name} (${npcId})`);
    }

    logger.info('Agent manager stats:', agentManager.getStats());

    // Step 4: Create and start Socket.IO server
    logger.info('\n--- Starting Socket.IO Server ---');
    /**
     * TODO: Pass agentManager to the socket server
     *
     * STEP 1: Add the agentManager property to the config object below
     *         so the socket server can route player messages through agents.
     */
    const socketServer = createSocketServer({
      port: serverConfig.socketIoPort,
      host: serverConfig.host,
      // --- EXERCISE: Add agentManager here (STEP 1) ---
      cors: {
        origin: '*',
        credentials: false,
      },
    });

    await socketServer.start();

    logger.info('=== Phase 8: Agent Framework Server Running ===');
    logger.info(`Server listening on http://${serverConfig.host}:${serverConfig.socketIoPort}`);
    logger.info('');
    logger.info('Available events:');
    logger.info('  - player_input: Send messages to NPCs');
    logger.info('  - npc_response: Receive NPC responses');
    logger.info('');
    logger.info('Test with: npm run test:agent');
    logger.info('Press Ctrl+C to stop the server.');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('\nShutting down...');
      await socketServer.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('\nShutting down...');
      await socketServer.stop();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Phase 8 server failed to start', error);
    logger.warn('Make sure:');
    logger.warn('1. Chroma is running: chroma run');
    logger.warn('2. Ollama is running: ollama serve');
    logger.warn('3. Models are downloaded:');
    logger.warn('   - ollama pull llama3.1:8b');
    logger.warn('   - ollama pull nomic-embed-text');
    process.exit(1);
  }
}

main();
