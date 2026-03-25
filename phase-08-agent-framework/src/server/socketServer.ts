/**
 * Socket.IO Server - Phase 8 (COMPLETED - Updated for Agent Integration)
 *
 * Provides real-time communication between the game engine and NPC agents.
 * Handles player input, NPC responses, and connection management.
 *
 * UPDATED: Now uses AgentManager instead of direct OllamaLLM calls.
 * The handlePlayerInput method routes messages through the agent framework.
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { createServer, Server as HTTPServer } from 'http';
import { logger } from '../utils/logger.js';
import { AgentManager } from '../agents/agentManager.js';
import { response } from 'express';
import { timeStamp } from 'console';

/**
 * Configuration for the Socket server.
 */
export interface SocketServerConfig {
  port: number;
  host?: string;
  agentManager?: AgentManager;
  cors?: {
    origin: string | string[];
    credentials: boolean;
  };
}

/**
 * Data structure for player input events.
 */
export interface PlayerInputData {
  playerId: string;
  npcId: string;
  message: string;
}

/**
 * SocketServer handles real-time communication with game clients.
 */
export class SocketServer {
  private io: SocketIOServer;
  private httpServer: HTTPServer;
  private port: number;
  private host: string;
  private agentManager?: AgentManager;

  constructor(config: SocketServerConfig) {
    this.port = config.port;
    this.host = config.host || '0.0.0.0';
    this.agentManager = config.agentManager;

    this.httpServer = createServer();

    this.io = new SocketIOServer(this.httpServer, {
      cors: config.cors || {
        origin: '*',
        credentials: false,
      },
    });

    this.setupEventHandlers();
  }

  /**
   * Set up Socket.IO event handlers.
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.info('Client connected', {
        clientId: socket.id,
        address: socket.handshake.address,
      });

      socket.emit('connected', {
        clientId: socket.id,
        timestamp: new Date().toISOString(),
        message: 'Connected to NPC AI Agent System',
      });

      socket.on('player_input', async (data: PlayerInputData) => {
        await this.handlePlayerInput(socket, data);
      });

      socket.on('disconnect', (reason: string) => {
        logger.info('Client disconnected', {
          clientId: socket.id,
          reason,
        });
      });

      socket.on('error', (error: Error) => {
        logger.error('Socket error', error, {
          clientId: socket.id,
        });
      });
    });
  }

  /**
   * Handle player input and route to appropriate agent.
   *
   * @param socket - The socket connection
   * @param data - The player input data
   *
   * ============================================================
   * TODO: Route player input through the AgentManager
   * ============================================================
   *
   * Instead of calling the LLM directly, use this.agentManager
   * to process the player's message through the correct NPC agent.
   *
   * STEP 1: Check if this.agentManager exists
   * STEP 2: Call this.agentManager.processPlayerInput(npcId, playerId, message)
   * STEP 3: If response exists, emit 'npc_response' with { npcId, playerId, response, timestamp }
   * STEP 4: Log successful response with npcId, playerId, and emotion
   * STEP 5: If no response, emit 'error' with message indicating agent not found
   * STEP 6: If no agentManager, emit 'error' with message indicating agent manager not configured
   */
  private async handlePlayerInput(socket: Socket, data: PlayerInputData): Promise<void> {
    try {
      const { playerId, npcId, message } = data;

      if (!playerId || !npcId || !message) {
        socket.emit('error', {
          message: 'Invalid input: playerId, npcId, and message are required',
        });
        return;
      }

      logger.info('Processing player input', {
        playerId,
        npcId,
        messagePreview: message.substring(0, 50),
      });

      // --- EXERCISE: Implement STEPs 1-6 below ---

      // STEP 1
      if(this.agentManager){
        const response = this.agentManager.processPlayerInput(npcId, playerId, message);
        
        if(response){
          socket.emit('npc_response', {npcId, playerId, response, timeStamp: new Date().toISOString(),});
          logger.info('NPC response sent', { npcId, playerId, emotion: response.emotion, });
        }
      }
      else{
        socket.emit('error', 'Agent manager not configured');
      }
      
      //logger.warn('handlePlayerInput not fully implemented - route through agentManager');
      //socket.emit('error', {
       // message: 'handlePlayerInput not implemented yet - complete the TODO in socketServer.ts',
     // });

    } catch (error) {
      logger.error('Error processing player input', error);
      socket.emit('error', {
        message: 'Failed to process input',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Start the Socket.IO server.
   */
  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.httpServer.listen(this.port, this.host, () => {
        logger.info('Socket.IO server started', {
          host: this.host,
          port: this.port,
        });
        resolve();
      });
    });
  }

  /**
   * Stop the Socket.IO server.
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.io.close(() => {
        this.httpServer.close(() => {
          logger.info('Socket.IO server stopped');
          resolve();
        });
      });
    });
  }

  /**
   * Get the Socket.IO server instance.
   *
   * @returns The SocketIOServer instance
   */
  getIO(): SocketIOServer {
    return this.io;
  }

  /**
   * Set the agent manager.
   *
   * @param agentManager - The AgentManager to use
   */
  setAgentManager(agentManager: AgentManager): void {
    this.agentManager = agentManager;
  }
}

/**
 * Factory function to create a SocketServer.
 *
 * @param config - Server configuration
 * @returns A new SocketServer instance
 */
export function createSocketServer(config: SocketServerConfig): SocketServer {
  return new SocketServer(config);
}
