/**
 * Agent Manager - Phase 8
 *
 * The AgentManager handles multiple NPC agents, providing methods to create,
 * retrieve, and manage agents. It serves as the central registry for all
 * active NPCs in the game.
 *
 * EXERCISE: Complete the TODOs to implement the agent manager.
 */

import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { logger } from '../utils/logger.js';
import { KnowledgeRetriever } from '../chains/retriever.js';
import { MemoryManager } from '../memory/memoryManager.js';
import { NPCAgent, createNPCAgent, NPCAgentConfig } from './npcAgent.js';
import type { NPCPersonality, NPCResponse } from '../core/index.js';

// ===========================================================================
// TODO 1: Define AgentManagerConfig Interface [PRE-FILLED]
// ===========================================================================
// Configuration for the agent manager.

// STEP 1: Define the AgentManagerConfig interface for manager configuration
// Syntax: export interface InterfaceName { properties }
// Params: InterfaceName = AgentManagerConfig
export interface AgentManagerConfig {
  // STEP 2: Declare optional maxConcurrentAgents for limiting active agents
  // Syntax: propertyName?: Type;
  // Params: propertyName = maxConcurrentAgents, Type = number
  maxConcurrentAgents?: number;
}//END AgentManagerConfig interface

// ===========================================================================
// TODO 2: Implement AgentManager Class [PRE-FILLED]
// ===========================================================================
// The central manager for all NPC agents.

// STEP 3: Define the AgentManager class for managing multiple NPC agents
// Syntax: export class ClassName { members }
// Params: ClassName = AgentManager
export class AgentManager {
  // TODO 3: Add private properties [PRE-FILLED]

  // STEP 4: Declare private agents Map for storing agent instances by ID
  // Syntax: private propertyName: Map<KeyType, ValueType>;
  // Params: propertyName = agents, KeyType = string, ValueType = NPCAgent
  private agents: Map<string, NPCAgent>;

  // STEP 5: Declare private llm property for shared language model
  // Syntax: private propertyName: Type;
  // Params: propertyName = llm, Type = BaseChatModel
  private llm: BaseChatModel;

  // STEP 6: Declare private retriever property for knowledge retrieval
  // Syntax: private propertyName: Type;
  // Params: propertyName = retriever, Type = KnowledgeRetriever
  private retriever: KnowledgeRetriever;

  // STEP 7: Declare optional private memoryManager for memory operations
  // Syntax: private propertyName?: Type;
  // Params: propertyName = memoryManager, Type = MemoryManager
  private memoryManager?: MemoryManager;

  // STEP 8: Declare private maxConcurrentAgents for agent limit
  // Syntax: private propertyName: Type;
  // Params: propertyName = maxConcurrentAgents, Type = number
  private maxConcurrentAgents: number;

  // ===========================================================================
  // TODO 4: Implement Constructor [EXERCISE]
  // ===========================================================================
  // Initialize the agent manager.

  // STEP 9: Define constructor with llm, retriever, optional memoryManager and config
  // Syntax: constructor(param1: Type1, param2: Type2, param3?: Type3, param4?: Type4) { initialization }
  // Params: param1 = llm, Type1 = BaseChatModel, param2 = retriever, Type2 = KnowledgeRetriever, param3 = memoryManager, Type3 = MemoryManager, param4 = config, Type4 = AgentManagerConfig
  constructor(
    llm: BaseChatModel,
    retriever: KnowledgeRetriever,
    memoryManager?: MemoryManager,
    config?: AgentManagerConfig
  ) {
    // STEP 10: Initialize agents as empty Map
    // Syntax: this.propertyName = new Map();
    // Params: propertyName = agents
    this.agents = new Map();
    // STEP 11: Assign llm parameter to instance property
    // Syntax: this.propertyName = parameterName;
    // Params: propertyName = llm, parameterName = llm
    this.llm = llm;
    // STEP 12: Assign retriever parameter to instance property
    // Syntax: this.propertyName = parameterName;
    // Params: propertyName = retriever, parameterName = retriever
    this.retriever = retriever;
    // STEP 13: Assign optional memoryManager parameter to instance property
    // Syntax: this.propertyName = parameterName;
    // Params: propertyName = memoryManager, parameterName = memoryManager
    this.memoryManager = memoryManager;
    // STEP 14: Set maxConcurrentAgents from config with default fallback
    // Syntax: this.propertyName = optionalConfig?.property || defaultValue;
    // Params: propertyName = maxConcurrentAgents, property = maxConcurrentAgents, defaultValue = 50
    this.maxConcurrentAgents = config?.maxConcurrentAgents || 50;
    // STEP 15: Log manager initialization
    // Syntax: logger.info(message, metadataObject);
    // Params: message = 'Initialized AgentManager', metadataObject = { maxConcurrentAgents }
    logger.info('Initialized AgentManager', {maxConcurrentAgents: this.maxConcurrentAgents});
    // --- YOUR CODE HERE ---
    // Temporary defaults (replace with your implementation)
    /* this.agents = new Map();
    this.llm = llm;
    this.retriever = retriever;
    this.memoryManager = memoryManager;
    this.maxConcurrentAgents = 50;
    logger.warn('AgentManager constructor not fully implemented'); */
  }//END constructor

  // ===========================================================================
  // TODO 5: Implement createAgent Method [EXERCISE]
  // ===========================================================================
  // Create a new NPC agent from a personality.

  // STEP 16: Define method to create new NPC agent
  // Syntax: methodName(param1: Type1, param2?: Type2): ReturnType { body }
  // Params: methodName = createAgent, param1 = personality, Type1 = NPCPersonality, param2 = config, Type2 = NPCAgentConfig, ReturnType = NPCAgent
  createAgent(
    personality: NPCPersonality,
    config?: NPCAgentConfig
  ): NPCAgent {
    // STEP 17: Check if max agents limit reached, throw error if so
    // Syntax: if (condition) { throw new Error(message); }
    // Params: condition = this.agents.size >= this.maxConcurrentAgents, message = `Maximum concurrent agents (${this.maxConcurrentAgents}) reached`
    if(this.agents.size >= this.maxConcurrentAgents){
      throw new Error(`Maximum concurrent agents (${this.maxConcurrentAgents}) reached`);
    }
    // STEP 18: Check if agent already exists, return existing if found
    // Syntax: if (condition) { logWarning; return existingAgent; }
    // Params: condition = this.agents.has(personality.id), existingAgent = this.agents.get(personality.id)!
    if(this.agents.has(personality.id)){
      logger.warn('logWarning!');
      return this.agents.get(personality.id)!;
    }
    // STEP 19: Create new agent using factory function
    // Syntax: const variableName = factoryFunction(arg1, arg2, arg3, arg4, arg5);
    // Params: variableName = agent, factoryFunction = createNPCAgent, arg1 = personality, arg2 = this.llm, arg3 = this.retriever, arg4 = this.memoryManager, arg5 = config
    const agent = createNPCAgent(personality, this.llm, this.retriever, this.memoryManager, config);
    // STEP 20: Add agent to agents Map
    // Syntax: this.mapProperty.set(key, value);
    // Params: mapProperty = agents, key = personality.id, value = agent
    this.agents.set(personality.id, agent);
    // STEP 21: Log agent creation
    // Syntax: logger.info(message);
    // Params: message = `Created NPC Agent: ${personality.name} (${personality.id})`
    logger.info(`Created NPC Agent: ${personality.name} (${personality.id})`);
    // STEP 22: Return the created agent
    // Syntax: return variableName;
    // Params: variableName = agent
    return agent;
    
    // --- YOUR CODE HERE ---
    /* logger.warn('createAgent not implemented');
    return createNPCAgent(personality, this.llm, this.retriever, this.memoryManager, config); */

  }//END createAgent method

  // ===========================================================================
  // TODO 6: Implement getAgent Method [EXERCISE]
  // ===========================================================================
  // Get an agent by NPC ID.

  // STEP 23: Define method to retrieve agent by ID
  // Syntax: methodName(param: Type): ReturnType | undefined { body }
  // Params: methodName = getAgent, param = npcId, Type = string, ReturnType = NPCAgent
  getAgent(npcId: string): NPCAgent | undefined {
    // STEP 24: Return agent from Map or undefined if not found
    // Syntax: return this.mapProperty.get(key);
    // Params: mapProperty = agents, key = npcId
    return this.agents.get(npcId);

    // --- YOUR CODE HERE ---
    //logger.warn('getAgent not implemented');
    //return undefined;
  
  }//END getAgent method

  // ===========================================================================
  // TODO 7: Implement getAllAgents Method [EXERCISE]
  // ===========================================================================
  // Get all active agents.

  // STEP 25: Define method to retrieve all agents as array
  // Syntax: methodName(): ReturnType[] { body }
  // Params: methodName = getAllAgents, ReturnType = NPCAgent
  getAllAgents(): NPCAgent[] {
    // STEP 26: Convert Map values to array
    // Syntax: return Array.from(this.mapProperty.values());
    // Params: mapProperty = agents
    return Array.from(this.agents.values());

    // --- YOUR CODE HERE ---
    //logger.warn('getAllAgents not implemented');
    //return [];

  }//END getAllAgents method

  // ===========================================================================
  // TODO 8: Implement hasAgent Method [EXERCISE]
  // ===========================================================================
  // Check if an agent exists.

  // STEP 27: Define method to check if agent exists
  // Syntax: methodName(param: Type): boolean { body }
  // Params: methodName = hasAgent, param = npcId, Type = string
  hasAgent(npcId: string): boolean {
    // STEP 28: Return whether Map contains the agent ID
    // Syntax: return this.mapProperty.has(key);
    // Params: mapProperty = agents, key = npcId
    return this.agents.has(npcId);

    // --- YOUR CODE HERE ---
    //logger.warn('hasAgent not implemented');
    //return false;

  }//END hasAgent method

  // ===========================================================================
  // TODO 9: Implement removeAgent Method [EXERCISE]
  // ===========================================================================
  // Remove an agent by NPC ID.

  // STEP 29: Define method to remove agent from registry
  // Syntax: methodName(param: Type): boolean { body }
  // Params: methodName = removeAgent, param = npcId, Type = string
  removeAgent(npcId: string): boolean {
    // STEP 30: Delete agent from Map and store result
    // Syntax: const variableName = this.mapProperty.delete(key);
    // Params: variableName = removed, mapProperty = agents, key = npcId
    const removed = this.agents.delete(npcId);

    // STEP 31: Log removal if agent was found and removed
    // Syntax: if (condition) { logger.info(message); }
    // Params: condition = removed, message = `Removed NPC Agent: ${npcId}`
    if(removed){
      logger.info(`Removed NPC Agent: ${npcId}`);
    }

    // STEP 32: Return whether removal was successful
    // Syntax: return variableName;
    // Params: variableName = removed
    return removed;

    // --- YOUR CODE HERE ---
    //logger.warn('removeAgent not implemented');
    //return false;

  }//END removeAgent method

  // ===========================================================================
  // TODO 10: Implement clearAllAgents Method [EXERCISE]
  // ===========================================================================
  // Remove all agents.

  // STEP 33: Define method to clear all agents from registry
  // Syntax: methodName(): void { body }
  // Params: methodName = clearAllAgents
  clearAllAgents(): void {
    // STEP 34: Store count before clearing for logging
    // Syntax: const variableName = this.mapProperty.size;
    // Params: variableName = count, mapProperty = agents
    const count = this.agents.size;

    // STEP 35: Clear the agents Map
    // Syntax: this.mapProperty.clear();
    // Params: mapProperty = agents
    this.agents.clear();

    // STEP 36: Log number of agents cleared
    // Syntax: logger.info(message);
    // Params: message = `Cleared all agents (${count} removed)`
    logger.info(`Cleared all agents (${count} removed)`);

    // --- YOUR CODE HERE ---
    // logger.warn('clearAllAgents not implemented');
  
  }//END clearAllAgents method

  // ===========================================================================
  // TODO 11: Implement processPlayerInput Method [EXERCISE]
  // ===========================================================================
  // Route a player message to the correct agent.

  // STEP 37: Define async method to process player input through specific agent
  // Syntax: async methodName(param1: Type1, param2: Type2, param3: Type3): Promise<ReturnType | null> { body }
  // Params: methodName = processPlayerInput, param1 = npcId, param2 = playerId, param3 = message, ReturnType = NPCResponse
  async processPlayerInput(
    npcId: string,
    playerId: string,
    message: string
  ): Promise<NPCResponse | null> {
    // STEP 38: Get agent by NPC ID
    // Syntax: const variableName = this.mapProperty.get(key);
    // Params: variableName = agent, mapProperty = agents, key = npcId
    const agent = this.agents.get(npcId);

    // STEP 39: Check if agent exists, log error and return null if not
    // Syntax: if (!condition) { logger.error(message); return null; }
    // Params: condition = agent, message = `Agent not found: ${npcId}`
    if(!agent){
      logger.error(`Agent not found: ${npcId}`);
      return null;
    }

    // STEP 40: Wrap chat operation in try-catch for error handling
    // Syntax: try { asyncOperation } catch (error) { errorHandling }
    // Params: asyncOperation = agent.chat(playerId, message), error = Error
    try{
      // STEP 41: Call agent's chat method with player info
      // Syntax: const variableName = await agent.method(arg1, arg2);
      // Params: variableName = response, method = chat, arg1 = playerId, arg2 = message
      const response = await agent.chat(playerId, message);

      // STEP 42: Return the response
      // Syntax: return variableName;
      // Params: variableName = response
      return response;

    } catch(error){
      // STEP 43: Log error and return null on failure (in catch block)
      // Syntax: logger.error(message, error); return null;
      // Params: message = `Error processing player input for ${npcId}`
      logger.error(`Error processing player input for ${npcId}`, error);
      return null;
    }

    // --- YOUR CODE HERE ---
    //logger.warn('processPlayerInput not implemented');
    //return null;

  }//END processPlayerInput method

  // ===========================================================================
  // TODO 12: Implement resetAgentConversation Method [EXERCISE]
  // ===========================================================================
  // Reset a specific agent's conversation.

  // STEP 44: Define method to reset agent's conversation history
  // Syntax: methodName(param: Type): boolean { body }
  // Params: methodName = resetAgentConversation, param = npcId, Type = string
  resetAgentConversation(npcId: string): boolean {
    // STEP 45: Get agent by NPC ID
    // Syntax: const variableName = this.mapProperty.get(key);
    // Params: variableName = agent, mapProperty = agents, key = npcId
    const agent = this.agents.get(npcId);

    // STEP 46: Return false if agent not found
    // Syntax: if (!condition) return false;
    // Params: condition = agent
    if(!agent){
      return false;
    }

    // STEP 47: Call agent's resetConversation method
    // Syntax: agent.method();
    // Params: method = resetConversation
    agent.resetConversation();

    // STEP 48: Return true for successful reset
    // Syntax: return true;
    // Params: returnValue = true
    return true;

    // --- YOUR CODE HERE ---
    //logger.warn('resetAgentConversation not implemented');
    //return false;

  }//END resetAgentConversation method

  // ===========================================================================
  // TODO 13: Implement getStats Method [EXERCISE]
  // ===========================================================================
  // Get manager statistics.

  // STEP 49: Define method to get manager statistics
  // Syntax: methodName() { return statsObject; }
  // Params: methodName = getStats
  getStats() {
    // STEP 50: Return object with manager statistics
    // Syntax: return { property1: value1, property2: value2, ... };
    // Params: property1 = activeAgents, property2 = maxConcurrentAgents, property3 = agentIds
    return {
      activeAgents: this.agents.size,
      maxConcurrentAgents: this.maxConcurrentAgents,
      agentIds: Array.from(this.agents.keys()),
    }

    // --- YOUR CODE HERE ---
    //logger.warn('getStats not implemented');
    //return {
      //activeAgents: 0,
      //maxConcurrentAgents: this.maxConcurrentAgents,
     // agentIds: [] as string[],
    //};

  }//END getStats method

  // ===========================================================================
  // TODO 14: Implement getAgentState Method [EXERCISE]
  // ===========================================================================
  // Get a specific agent's state.

  // STEP 51: Define method to get specific agent's state
  // Syntax: methodName(param: Type) { body }
  // Params: methodName = getAgentState, param = npcId, Type = string
  getAgentState(npcId: string) {
    // STEP 52: Get agent and return its state or null
    // Syntax: const agent = this.mapProperty.get(key); return agent ? agent.method() : null;
    // Params: mapProperty = agents, key = npcId, method = getState
    const agent = this.agents.get(npcId);
    return agent ? agent.getState() : null;

    // --- YOUR CODE HERE ---
    //logger.warn('getAgentState not implemented');
    //return null;

  }//END getAgentState method

  // ===========================================================================
  // TODO 15: Implement getAllAgentStates Method [EXERCISE]
  // ===========================================================================
  // Get all agent states.

  // STEP 53: Define method to get all agent states
  // Syntax: methodName() { return statesArray; }
  // Params: methodName = getAllAgentStates
  getAllAgentStates() {
    // STEP 54: Map all agents to their states
    // Syntax: return Array.from(this.mapProperty.values()).map(item => item.method());
    // Params: mapProperty = agents, item = agent, method = getState
    return Array.from(this.agents.values()).map(item => item.getState());

    // --- YOUR CODE HERE ---
    //logger.warn('getAllAgentStates not implemented');
    //return [];
    
  }//END getAllAgentStates method
}//END AgentManager class

// ===========================================================================
// TODO 16: Create Factory Function [PRE-FILLED]
// ===========================================================================

// STEP 55: Define factory function to create AgentManager instances
// Syntax: export function functionName(param1: Type1, param2: Type2, param3?: Type3, param4?: Type4): ReturnType { body }
// Params: functionName = createAgentManager, ReturnType = AgentManager
export function createAgentManager(
  llm: BaseChatModel,
  retriever: KnowledgeRetriever,
  memoryManager?: MemoryManager,
  config?: AgentManagerConfig
): AgentManager {
  // STEP 56: Instantiate and return new AgentManager with all dependencies
  // Syntax: return new ClassName(param1, param2, param3, param4);
  // Params: ClassName = AgentManager
  return new AgentManager(llm, retriever, memoryManager, config);
}//END createAgentManager function
