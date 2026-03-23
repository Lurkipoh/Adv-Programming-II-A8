/**
 * NPC Agent - Phase 8
 *
 * The NPCAgent class encapsulates all behavior and state for a single NPC.
 * It combines personality, memory, retrieval, and LLM generation into a
 * cohesive agent that can converse with players.
 *
 * EXERCISE: Complete the TODOs to implement the NPC agent.
 */

import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { logger } from '../utils/logger.js';
import { KnowledgeRetriever } from '../chains/retriever.js';
import { MemoryManager } from '../memory/memoryManager.js';
import { getPersonalityPrompt } from '../utils/personalityLoader.js';
import type {
  NPCPersonality,
  NPCResponse,
  NPCAction,
  ConversationContext,
  EmotionType,
} from '../core/index.js';
import { response } from 'express';

// ===========================================================================
// TODO 1: Define EmotionState Interface [PRE-FILLED]
// ===========================================================================
// Track the current emotional state of the NPC.

// STEP 1: Define the EmotionState interface to track NPC emotional state
// Syntax: interface InterfaceName { properties }
// Params: InterfaceName = EmotionState
interface EmotionState {
  // STEP 2: Declare currentEmotion property for current emotion type
  // Syntax: propertyName: Type;
  // Params: propertyName = currentEmotion, Type = EmotionType
  currentEmotion: EmotionType;

  // STEP 3: Declare emotionIntensity property for intensity level (0.0-1.0)
  // Syntax: propertyName: Type;
  // Params: propertyName = emotionIntensity, Type = number
  emotionIntensity: number;

  // STEP 4: Declare previousEmotion property to track emotion transitions
  // Syntax: propertyName: Type;
  // Params: propertyName = previousEmotion, Type = EmotionType
  previousEmotion: EmotionType;

  // STEP 5: Declare lastUpdate property for tracking when emotion was updated
  // Syntax: propertyName: Type;
  // Params: propertyName = lastUpdate, Type = Date
  lastUpdate: Date;
}//END EmotionState interface

// ===========================================================================
// TODO 2: Define NPCAgentConfig Interface [PRE-FILLED]
// ===========================================================================
// Configuration options for the agent.

// STEP 6: Define the NPCAgentConfig interface for agent configuration
// Syntax: export interface InterfaceName { properties }
// Params: InterfaceName = NPCAgentConfig
export interface NPCAgentConfig {
  // STEP 7: Declare optional maxConversationHistory for limiting stored history
  // Syntax: propertyName?: Type;
  // Params: propertyName = maxConversationHistory, Type = number
  maxConversationHistory?: number;
}//END NPCAgentConfig interface

// ===========================================================================
// TODO 3: Implement NPCAgent Class [PRE-FILLED]
// ===========================================================================
// The core NPC agent class.

// STEP 8: Define the NPCAgent class for managing individual NPC behavior
// Syntax: export class ClassName { members }
// Params: ClassName = NPCAgent
export class NPCAgent {
  // TODO 4: Add private properties [PRE-FILLED]

  // STEP 9: Declare private personality property for NPC personality data
  // Syntax: private propertyName: Type;
  // Params: propertyName = personality, Type = NPCPersonality
  private personality: NPCPersonality;

  // STEP 10: Declare private llm property for language model instance
  // Syntax: private propertyName: Type;
  // Params: propertyName = llm, Type = BaseChatModel
  private llm: BaseChatModel;

  // STEP 11: Declare private retriever property for knowledge retrieval
  // Syntax: private propertyName: Type;
  // Params: propertyName = retriever, Type = KnowledgeRetriever
  private retriever: KnowledgeRetriever;

  // STEP 12: Declare optional private memoryManager for memory operations
  // Syntax: private propertyName?: Type;
  // Params: propertyName = memoryManager, Type = MemoryManager
  private memoryManager?: MemoryManager;

  // STEP 13: Declare private conversationHistory array for dialog tracking
  // Syntax: private propertyName: Type[];
  // Params: propertyName = conversationHistory, Type = ConversationContext
  private conversationHistory: ConversationContext[];

  // STEP 14: Declare private emotionState for emotional tracking
  // Syntax: private propertyName: Type;
  // Params: propertyName = emotionState, Type = EmotionState
  private emotionState: EmotionState;

  // STEP 15: Declare private relationshipScore for player relationship (0.0-1.0)
  // Syntax: private propertyName: Type;
  // Params: propertyName = relationshipScore, Type = number
  private relationshipScore: number;

  // STEP 16: Declare private maxConversationHistory for history limit
  // Syntax: private propertyName: Type;
  // Params: propertyName = maxConversationHistory, Type = number
  private maxConversationHistory: number;

  // ===========================================================================
  // TODO 5: Implement Constructor [EXERCISE]
  // ===========================================================================
  // Initialize the agent with all required components.

  // STEP 17: Define constructor with personality, llm, retriever, optional memoryManager and config
  // Syntax: constructor(param1: Type1, param2: Type2, param3: Type3, param4?: Type4, param5?: Type5) { initialization }
  // Params: param1 = personality, Type1 = NPCPersonality, param2 = llm, Type2 = BaseChatModel, param3 = retriever, Type3 = KnowledgeRetriever, param4 = memoryManager, Type4 = MemoryManager, param5 = config, Type5 = NPCAgentConfig
  constructor(
    personality: NPCPersonality,
    llm: BaseChatModel,
    retriever: KnowledgeRetriever,
    memoryManager?: MemoryManager,
    config?: NPCAgentConfig
  ) {
    // STEP 18: Assign personality parameter to instance property
    // Syntax: this.propertyName = parameterName;
    // Params: propertyName = personality, parameterName = personality
    this.personality = personality;

    // STEP 19: Assign llm parameter to instance property
    // Syntax: this.propertyName = parameterName;
    // Params: propertyName = llm, parameterName = llm
    this.llm = llm;

    // STEP 20: Assign retriever parameter to instance property
    // Syntax: this.propertyName = parameterName;
    // Params: propertyName = retriever, parameterName = retriever
    this.retriever = retriever;

    // STEP 21: Assign optional memoryManager parameter to instance property
    // Syntax: this.propertyName = parameterName;
    // Params: propertyName = memoryManager, parameterName = memoryManager
    this.memoryManager = memoryManager;

    // STEP 22: Initialize conversationHistory as empty array
    // Syntax: this.propertyName = [];
    // Params: propertyName = conversationHistory
    this.conversationHistory = [];

    // STEP 23: Set maxConversationHistory from config with default fallback
    // Syntax: this.propertyName = optionalConfig?.property || defaultValue;
    // Params: propertyName = maxConversationHistory, property = maxConversationHistory, defaultValue = 10
    this.maxConversationHistory = config?.maxConversationHistory || 10;

    // STEP 24: Initialize relationshipScore to neutral (0.5)
    // Syntax: this.propertyName = value;
    // Params: propertyName = relationshipScore, value = 0.5
    this. relationshipScore = 0.5;

    // STEP 25: Initialize emotionState object with default neutral state
    // Syntax: this.propertyName = { property1: value1, property2: value2, ... };
    // Params: propertyName = emotionState, properties = { currentEmotion: 'neutral', emotionIntensity: 0, previousEmotion: 'neutral', lastUpdate: new Date() }
    this.emotionState = {
      currentEmotion: 'neutral',
      emotionIntensity: 0,
      previousEmotion: 'neutral',
      lastUpdate: new Date(),
    };

    // STEP 26: Log agent creation with NPC identity
    // Syntax: logger.info(message, metadataObject);
    // Params: message = 'Created NPC Agent', metadataObject = { npcId: personality.id, name: personality.name }
    logger.info('Created NPC Agent', {npcId: personality.id, name: personality.name});

    // --- YOUR CODE HERE ---
    // Temporary defaults (replace with your implementation)
    // this.personality = personality;
    // this.llm = llm;
    // this.retriever = retriever;
    // this.memoryManager = memoryManager;
    // this.conversationHistory = [];
    // this.maxConversationHistory = 10;
    // this.relationshipScore = 0.5;
    // this.emotionState = {
    //   currentEmotion: 'neutral',
    //   emotionIntensity: 0,
    //   previousEmotion: 'neutral',
    //   lastUpdate: new Date(),
    // };

    // logger.warn('NPCAgent constructor not fully implemented');
  }//END constructor

  // ===========================================================================
  // TODO 6: Implement chat Method [EXERCISE]
  // ===========================================================================
  // Main method to process player input and generate NPC response.

  // STEP 27: Define async chat method for processing player input
  // Syntax: async methodName(param1: Type1, param2: Type2): Promise<ReturnType> { body }
  // Params: methodName = chat, param1 = playerId, Type1 = string, param2 = playerInput, Type2 = string, ReturnType = NPCResponse
  async chat(playerId: string, playerInput: string): Promise<NPCResponse> {
    
    // STEP 28: Wrap chat processing in try-catch for error handling
    // Syntax: try { asyncOperations } catch (error) { errorHandling }
    // Params: asyncOperations = chatPipeline, error = Error
    try{
      // STEP 29: Log incoming player input with truncated message
      // Syntax: logger.info(message, metadataObject);
      // Params: message = `NPC Agent [${this.personality.name}] processing input`, metadataObject = { npcId, playerId, input }
      logger.info(`NPC Agent [${this.personality.name}] processing input`, {npcId: this.personality.id, playerId, playerInput});
      
      // STEP 30: Create player conversation entry with timestamp and speaker
      // Syntax: const variableName: Type = { properties };
      // Params: variableName = playerEntry, Type = ConversationContext
      const playerEntry: ConversationContext = {timestamp: new Date(), speaker: "player", message: playerInput};

      // STEP 31: Add player entry to conversation history
      // Syntax: this.arrayProperty.push(item);
      // Params: arrayProperty = conversationHistory, item = playerEntry
      this.conversationHistory.push(playerEntry);

      // STEP 32: Add to short-term memory if memoryManager exists
      // Syntax: if (condition) { operation }
      // Params: condition = this.memoryManager, operation = this.memoryManager.addToShortTerm(npcId, playerId, playerEntry)
      if(this.memoryManager){
        this.memoryManager.addToShortTerm(this.personality.id, playerId, playerEntry);
      }

      // STEP 33: Retrieve context from multiple sources using RAG
      // Syntax: const variableName = await this.retriever.method(npcId, query, options);
      // Params: variableName = context, method = retrieveMultiSource, npcId = this.personality.id, query = playerInput, options = { personalityTopK: 2, loreTopK: 3, conversationTopK: 2 }
      const context = await this.retriever.retrieveMultiSource(this.personality.id, playerInput, {
        personalityTopK: 2,
        loreTopK: 3,
        conversationTopK: 2,
      });

      // STEP 34: Build system prompt from personality
      // Syntax: const variableName = functionName(argument);
      // Params: variableName = systemPrompt, functionName = getPersonalityPrompt, argument = this.personality
      const systemPrompt = getPersonalityPrompt(this.personality);

      // STEP 35: Combine lore and personality context into string
      // Syntax: const variableName = [...array1, ...array2].map(callback).join(separator);
      // Params: variableName = contextStr, array1 = context.lore, array2 = context.personality, callback = d => d.content, separator = '\n'
      const contextStr = [...context.lore, ...context.personality].map(d => d.content).join('\n');

      // STEP 36: Format recent conversation history as string
      // Syntax: const variableName = this.arrayProperty.slice(start).map(callback).join(separator);
      // Params: variableName = historyStr, arrayProperty = conversationHistory, start = -6, separator = '\n'
      const historyStr = this.conversationHistory.slice(-6).map(c => c.speaker).join('\n');

      // STEP 37: Build complete prompt with context, history, and player input
      // Syntax: const variableName = `template literal with ${interpolations}`;
      // Params: variableName = prompt, interpolations = systemPrompt, contextStr, historyStr, playerInput, this.personality.name
      const prompt = `${systemPrompt}, ${contextStr}, ${historyStr}, ${playerInput}, ${this.personality.name}`;

      // STEP 38: Generate response from LLM
      // Syntax: const variableName = await this.llm.method(prompt);
      // Params: variableName = llmResponse, method = invoke, prompt = prompt
      const llmResponse = await this.llm.invoke(prompt);

      // STEP 39: Extract text content from LLM response
      // Syntax: const variableName = response.property.method();
      // Params: variableName = responseText, response = llmResponse, property = content, method = toString
      const responseText = llmResponse.content.toString();

      // STEP 40: Parse LLM response to extract structured data
      // Syntax: const variableName = this.method(argument);
      // Params: variableName = response, method = parseResponse, argument = responseText
      const response = this.parseResponse(responseText);
      
      // STEP 41: Update emotion state based on response
      // Syntax: this.method(argument);
      // Params: method = updateEmotion, argument = response.emotion

      // STEP 42: Update relationship score based on interaction
      // Syntax: this.method(argument1, argument2);
      // Params: method = updateRelationshipScore, argument1 = playerInput, argument2 = response

      // STEP 43: Create NPC conversation entry with response
      // Syntax: const variableName: Type = { properties };
      // Params: variableName = npcEntry, Type = ConversationContext

      // STEP 44: Add NPC entry to conversation history
      // Syntax: this.arrayProperty.push(item);
      // Params: arrayProperty = conversationHistory, item = npcEntry

      // STEP 45: Store in memory if memoryManager exists
      // Syntax: if (condition) { operations }
      // Params: condition = this.memoryManager, operations = addToShortTerm + storeInLongTerm

      // STEP 46: Trim conversation history if exceeds maximum
      // Syntax: if (condition) { this.arrayProperty = this.arrayProperty.slice(index); }
      // Params: condition = this.conversationHistory.length > this.maxConversationHistory * 2, arrayProperty = conversationHistory, index = -this.maxConversationHistory * 2

      // STEP 47: Log successful response generation
      // Syntax: logger.info(message, metadataObject);
      // Params: message = `NPC Agent [${this.personality.name}] generated response`, metadataObject = { emotion, relationshipScore }

      // STEP 48: Return the generated response
      // Syntax: return variableName;
      // Params: variableName = response
    } catch(error){
      
      // STEP 49: Log error and return fallback response (in catch block)
      // Syntax: logger.error(message, error); return fallbackObject;
      // Params: message = `NPC Agent [${this.personality.name}] chat error`, fallbackObject = { dialog, emotion: 'neutral', action: { type: 'none' } }
    }

    // --- YOUR CODE HERE ---

    logger.warn('chat method not implemented');
    return {
      dialog: 'Chat not implemented - complete the TODOs',
      emotion: 'neutral',
      action: { type: 'none' },
    };
  }//END chat method

  // ===========================================================================
  // TODO 7: Implement parseResponse Method [EXERCISE]
  // ===========================================================================
  // Parse LLM response to extract dialog, emotion, and action.

  // STEP 50: Define private method to parse LLM response text
  // Syntax: private methodName(param: Type): ReturnType { body }
  // Params: methodName = parseResponse, param = responseText, Type = string, ReturnType = NPCResponse
  private parseResponse(responseText: string): NPCResponse {
    // STEP 51: Wrap JSON parsing in try-catch
    // Syntax: try { parsing } catch { fallback }
    // Params: parsing = extractAndParseJSON, fallback = fallThroughToDefault

    // STEP 52: Extract JSON object from response using regex
    // Syntax: const variableName = string.match(regexPattern);
    // Params: variableName = jsonMatch, string = responseText, regexPattern = /\{[\s\S]*\}/

    // STEP 53: Parse JSON if match found
    // Syntax: if (condition) { parseAndReturn }
    // Params: condition = jsonMatch

    // STEP 54: Parse JSON string to object
    // Syntax: const variableName = JSON.parse(string);
    // Params: variableName = parsed, string = jsonMatch[0]

    // STEP 55: Return structured response with parsed or default values
    // Syntax: return { property1: parsed.prop1 || default1, ... };
    // Params: property1 = dialog, property2 = emotion, property3 = action

    // STEP 56: Return fallback response using raw text
    // Syntax: return { properties };
    // Params: properties = { dialog: responseText.trim(), emotion: 'neutral', action: { type: 'none' } }

    // --- YOUR CODE HERE ---

    logger.warn('parseResponse not implemented');
    return {
      dialog: responseText,
      emotion: 'neutral',
      action: { type: 'none' },
    };
  }//END parseResponse method

  // ===========================================================================
  // TODO 8: Implement updateEmotion Method [EXERCISE]
  // ===========================================================================
  // Update the agent's emotional state.

  // STEP 57: Define private method to update emotion state
  // Syntax: private methodName(param: Type): void { body }
  // Params: methodName = updateEmotion, param = newEmotion, Type = EmotionType
  private updateEmotion(newEmotion: EmotionType): void {
    // STEP 58: Store current emotion as previous emotion
    // Syntax: this.objectProperty.property = this.objectProperty.property;
    // Params: objectProperty = emotionState, property = previousEmotion, sourceProperty = currentEmotion

    // STEP 59: Update current emotion to new value
    // Syntax: this.objectProperty.property = newValue;
    // Params: objectProperty = emotionState, property = currentEmotion, newValue = newEmotion

    // STEP 60: Update lastUpdate timestamp
    // Syntax: this.objectProperty.property = new Date();
    // Params: objectProperty = emotionState, property = lastUpdate

    // STEP 61: Define intensity mapping for each emotion type
    // Syntax: const variableName: Record<KeyType, ValueType> = { mappings };
    // Params: variableName = intensityMap, KeyType = EmotionType, ValueType = number

    // STEP 62: Set emotion intensity based on mapping with fallback
    // Syntax: this.objectProperty.property = mapping[key] || defaultValue;
    // Params: objectProperty = emotionState, property = emotionIntensity, mapping = intensityMap, key = newEmotion, defaultValue = 0

    // --- YOUR CODE HERE ---

    logger.warn('updateEmotion not implemented');
  }//END updateEmotion method

  // ===========================================================================
  // TODO 9: Implement updateRelationshipScore Method [EXERCISE]
  // ===========================================================================
  // Update relationship score based on interaction.

  // STEP 63: Define private method to update relationship score
  // Syntax: private methodName(param1: Type1, param2: Type2): void { body }
  // Params: methodName = updateRelationshipScore, param1 = playerInput, Type1 = string, param2 = response, Type2 = NPCResponse
  private updateRelationshipScore(playerInput: string, response: NPCResponse): void {
    // STEP 64: Convert input to lowercase for keyword matching
    // Syntax: const variableName = string.toLowerCase();
    // Params: variableName = input, string = playerInput

    // STEP 65: Initialize delta for score change
    // Syntax: let variableName = initialValue;
    // Params: variableName = delta, initialValue = 0

    // STEP 66: Define positive keywords array
    // Syntax: const variableName = [values];
    // Params: variableName = positiveKeywords, values = 'thank', 'please', 'help', 'kind', 'appreciate'

    // STEP 67: Check positive keywords and increment delta
    // Syntax: for (const item of array) { if (condition) operation }
    // Params: item = keyword, array = positiveKeywords, condition = input.includes(keyword), operation = delta += 0.05

    // STEP 68: Define negative keywords array
    // Syntax: const variableName = [values];
    // Params: variableName = negativeKeywords, values = 'stupid', 'idiot', 'hate', 'useless', 'annoying'

    // STEP 69: Check negative keywords and decrement delta
    // Syntax: for (const item of array) { if (condition) operation }
    // Params: item = keyword, array = negativeKeywords, condition = input.includes(keyword), operation = delta -= 0.1

    // STEP 70: Adjust delta based on response emotion
    // Syntax: if (condition) { operation } else if (condition) { operation }
    // Params: condition1 = response.emotion === 'happy' || response.emotion === 'excited', operation1 = delta += 0.02, condition2 = response.emotion === 'angry' || response.emotion === 'disgusted', operation2 = delta -= 0.02

    // STEP 71: Apply delta with clamping to 0-1 range
    // Syntax: this.property = Math.max(min, Math.min(max, this.property + delta));
    // Params: property = relationshipScore, min = 0, max = 1, delta = delta

    // --- YOUR CODE HERE ---

    logger.warn('updateRelationshipScore not implemented');
  }//END updateRelationshipScore method

  // ===========================================================================
  // TODO 10: Implement Getter Methods [EXERCISE]
  // ===========================================================================

  // STEP 72: Define getter method for personality
  // Syntax: methodName(): ReturnType { return this.property; }
  // Params: methodName = getPersonality, ReturnType = NPCPersonality
  getPersonality(): NPCPersonality {
    // STEP 73: Return the personality instance
    // Syntax: return this.propertyName;
    // Params: propertyName = personality

    // --- YOUR CODE HERE ---

    logger.warn('getPersonality not implemented');
    return this.personality;
  }//END getPersonality method

  // STEP 74: Define getter method for conversation history
  // Syntax: methodName(): ReturnType { return copy; }
  // Params: methodName = getConversationHistory, ReturnType = ConversationContext[]
  getConversationHistory(): ConversationContext[] {
    // STEP 75: Return a shallow copy of conversation history
    // Syntax: return [...this.arrayProperty];
    // Params: arrayProperty = conversationHistory

    // --- YOUR CODE HERE ---

    logger.warn('getConversationHistory not implemented');
    return [];
  }//END getConversationHistory method

  // STEP 76: Define getter method for current emotion
  // Syntax: methodName(): ReturnType { return this.objectProperty.property; }
  // Params: methodName = getCurrentEmotion, ReturnType = EmotionType
  getCurrentEmotion(): EmotionType {
    // STEP 77: Return current emotion from emotionState
    // Syntax: return this.objectProperty.property;
    // Params: objectProperty = emotionState, property = currentEmotion

    // --- YOUR CODE HERE ---

    logger.warn('getCurrentEmotion not implemented');
    return 'neutral';
  }//END getCurrentEmotion method

  // STEP 78: Define getter method for emotion intensity
  // Syntax: methodName(): ReturnType { return this.objectProperty.property; }
  // Params: methodName = getEmotionIntensity, ReturnType = number
  getEmotionIntensity(): number {
    // STEP 79: Return emotion intensity from emotionState
    // Syntax: return this.objectProperty.property;
    // Params: objectProperty = emotionState, property = emotionIntensity

    // --- YOUR CODE HERE ---

    logger.warn('getEmotionIntensity not implemented');
    return 0;
  }//END getEmotionIntensity method

  // STEP 80: Define getter method for relationship score
  // Syntax: methodName(): ReturnType { return this.property; }
  // Params: methodName = getRelationshipScore, ReturnType = number
  getRelationshipScore(): number {
    // STEP 81: Return the relationship score
    // Syntax: return this.propertyName;
    // Params: propertyName = relationshipScore

    // --- YOUR CODE HERE ---

    logger.warn('getRelationshipScore not implemented');
    return 0.5;
  }//END getRelationshipScore method

  // ===========================================================================
  // TODO 11: Implement resetConversation Method [EXERCISE]
  // ===========================================================================
  // Reset conversation history and emotion state.

  // STEP 82: Define method to reset conversation state
  // Syntax: methodName(): void { body }
  // Params: methodName = resetConversation
  resetConversation(): void {
    // STEP 83: Clear conversation history array
    // Syntax: this.arrayProperty = [];
    // Params: arrayProperty = conversationHistory

    // STEP 84: Reset emotion state to neutral defaults
    // Syntax: this.objectProperty = { defaultProperties };
    // Params: objectProperty = emotionState, defaultProperties = { currentEmotion: 'neutral', emotionIntensity: 0, previousEmotion: 'neutral', lastUpdate: new Date() }

    // STEP 85: Log conversation reset
    // Syntax: logger.info(message);
    // Params: message = `Conversation reset for NPC [${this.personality.name}]`

    // --- YOUR CODE HERE ---

    logger.warn('resetConversation not implemented');
  }//END resetConversation method

  // ===========================================================================
  // TODO 12: Implement getState Method [EXERCISE]
  // ===========================================================================
  // Return a snapshot of the agent's current state.

  // STEP 86: Define method to get agent state snapshot
  // Syntax: methodName() { return stateObject; }
  // Params: methodName = getState
  getState() {
    // STEP 87: Return object with all state properties
    // Syntax: return { property1: value1, property2: value2, ... };
    // Params: property1 = npcId, property2 = name, property3 = currentEmotion, property4 = emotionIntensity, property5 = relationshipScore, property6 = conversationHistoryLength, property7 = lastInteraction

    // --- YOUR CODE HERE ---

    logger.warn('getState not implemented');
    return {
      npcId: this.personality.id,
      name: this.personality.name,
      currentEmotion: 'neutral',
      emotionIntensity: 0,
      relationshipScore: 0.5,
      conversationHistoryLength: 0,
      lastInteraction: null,
    };
  }//END getState method
}//END NPCAgent class

// ===========================================================================
// TODO 13: Create Factory Function [PRE-FILLED]
// ===========================================================================

// STEP 88: Define factory function to create NPCAgent instances
// Syntax: export function functionName(param1: Type1, param2: Type2, param3: Type3, param4?: Type4, param5?: Type5): ReturnType { body }
// Params: functionName = createNPCAgent, ReturnType = NPCAgent
export function createNPCAgent(
  personality: NPCPersonality,
  llm: BaseChatModel,
  retriever: KnowledgeRetriever,
  memoryManager?: MemoryManager,
  config?: NPCAgentConfig
): NPCAgent {
  // STEP 89: Instantiate and return new NPCAgent with all dependencies
  // Syntax: return new ClassName(param1, param2, param3, param4, param5);
  // Params: ClassName = NPCAgent
  return new NPCAgent(personality, llm, retriever, memoryManager, config);
}//END createNPCAgent function
