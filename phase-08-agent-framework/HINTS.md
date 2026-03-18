# Phase 8: Agent Framework - Solution Hints

> **Warning:** Only use these hints if you're truly stuck! Try to solve the exercises using the STEP annotations first.

---

## npcAgent.ts

### TODO 5: Constructor (STEPs 17-26)

```typescript
constructor(
  personality: NPCPersonality,
  llm: BaseChatModel,
  retriever: KnowledgeRetriever,
  memoryManager?: MemoryManager,
  config?: NPCAgentConfig
) {
  this.personality = personality;
  this.llm = llm;
  this.retriever = retriever;
  this.memoryManager = memoryManager;
  this.conversationHistory = [];
  this.maxConversationHistory = config?.maxConversationHistory || 10;
  this.relationshipScore = 0.5;

  this.emotionState = {
    currentEmotion: 'neutral',
    emotionIntensity: 0,
    previousEmotion: 'neutral',
    lastUpdate: new Date(),
  };

  logger.info('Created NPC Agent', {
    npcId: personality.id,
    name: personality.name,
  });
}
```

### TODO 6: chat Method (STEPs 27-49)

```typescript
async chat(playerId: string, playerInput: string): Promise<NPCResponse> {
  try {
    logger.info(`NPC Agent [${this.personality.name}] processing input`, {
      npcId: this.personality.id,
      playerId,
      input: playerInput.substring(0, 50),
    });

    // Add player message to history
    const playerEntry: ConversationContext = {
      timestamp: new Date(),
      speaker: 'player',
      message: playerInput,
    };
    this.conversationHistory.push(playerEntry);

    // Add to short-term memory
    if (this.memoryManager) {
      this.memoryManager.addToShortTerm(this.personality.id, playerId, playerEntry);
    }

    // Retrieve context
    const context = await this.retriever.retrieveMultiSource(
      this.personality.id,
      playerInput,
      { personalityTopK: 2, loreTopK: 3, conversationTopK: 2 }
    );

    // Build prompt
    const systemPrompt = getPersonalityPrompt(this.personality);
    const contextStr = [...context.lore, ...context.personality]
      .map(d => d.content)
      .join('\n');
    const historyStr = this.conversationHistory
      .slice(-6)
      .map(c => `${c.speaker === 'player' ? 'Player' : this.personality.name}: ${c.message}`)
      .join('\n');

    const prompt = `${systemPrompt}

RELEVANT CONTEXT:
${contextStr}

RECENT CONVERSATION:
${historyStr}

Player says: "${playerInput}"

Respond as ${this.personality.name}. Format: JSON {"dialog": "...", "emotion": "...", "action": {"type": "..."}}`;

    // Generate response
    const llmResponse = await this.llm.invoke(prompt);
    const responseText = llmResponse.content.toString();

    // Parse response
    const response = this.parseResponse(responseText);

    // Update emotion
    this.updateEmotion(response.emotion);

    // Update relationship
    this.updateRelationshipScore(playerInput, response);

    // Add NPC response to history
    const npcEntry: ConversationContext = {
      timestamp: new Date(),
      speaker: 'npc',
      message: response.dialog,
      emotion: response.emotion,
    };
    this.conversationHistory.push(npcEntry);

    // Store in memory
    if (this.memoryManager) {
      this.memoryManager.addToShortTerm(this.personality.id, playerId, npcEntry);
      await this.memoryManager.storeInLongTerm(
        this.personality.id,
        playerId,
        playerInput,
        response.dialog,
        response.emotion
      );
    }

    // Trim history
    if (this.conversationHistory.length > this.maxConversationHistory * 2) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxConversationHistory * 2);
    }

    logger.info(`NPC Agent [${this.personality.name}] generated response`, {
      emotion: response.emotion,
      relationshipScore: this.relationshipScore.toFixed(2),
    });

    return response;
  } catch (error) {
    logger.error(`NPC Agent [${this.personality.name}] chat error`, error);
    return {
      dialog: "I seem to have lost my train of thought. Could you repeat that?",
      emotion: 'neutral',
      action: { type: 'none' },
    };
  }
}
```

### TODO 7: parseResponse Method (STEPs 50-56)

```typescript
private parseResponse(responseText: string): NPCResponse {
  try {
    // Try to extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        dialog: parsed.dialog || responseText,
        emotion: (parsed.emotion as EmotionType) || 'neutral',
        action: parsed.action || { type: 'none' },
      };
    }
  } catch {
    // JSON parsing failed
  }

  // Fallback: use raw text as dialog
  return {
    dialog: responseText.trim(),
    emotion: 'neutral',
    action: { type: 'none' },
  };
}
```

### TODO 8: updateEmotion Method (STEPs 57-62)

```typescript
private updateEmotion(newEmotion: EmotionType): void {
  this.emotionState.previousEmotion = this.emotionState.currentEmotion;
  this.emotionState.currentEmotion = newEmotion;
  this.emotionState.lastUpdate = new Date();

  // Set intensity based on emotion type
  const intensityMap: Record<EmotionType, number> = {
    neutral: 0,
    happy: 0.6,
    sad: 0.5,
    angry: 0.8,
    fearful: 0.7,
    surprised: 0.6,
    disgusted: 0.5,
    curious: 0.4,
    excited: 0.8,
  };
  this.emotionState.emotionIntensity = intensityMap[newEmotion] || 0;
}
```

### TODO 9: updateRelationshipScore Method (STEPs 63-71)

```typescript
private updateRelationshipScore(playerInput: string, response: NPCResponse): void {
  const input = playerInput.toLowerCase();
  let delta = 0;

  // Positive keywords
  const positiveKeywords = ['thank', 'please', 'help', 'kind', 'appreciate'];
  for (const keyword of positiveKeywords) {
    if (input.includes(keyword)) delta += 0.05;
  }

  // Negative keywords
  const negativeKeywords = ['stupid', 'idiot', 'hate', 'useless', 'annoying'];
  for (const keyword of negativeKeywords) {
    if (input.includes(keyword)) delta -= 0.1;
  }

  // Emotion influence
  if (response.emotion === 'happy' || response.emotion === 'excited') {
    delta += 0.02;
  } else if (response.emotion === 'angry' || response.emotion === 'disgusted') {
    delta -= 0.02;
  }

  this.relationshipScore = Math.max(0, Math.min(1, this.relationshipScore + delta));
}
```

### TODO 10: Getter Methods (STEPs 72-81)

```typescript
getPersonality(): NPCPersonality {
  return this.personality;
}

getConversationHistory(): ConversationContext[] {
  return [...this.conversationHistory];
}

getCurrentEmotion(): EmotionType {
  return this.emotionState.currentEmotion;
}

getEmotionIntensity(): number {
  return this.emotionState.emotionIntensity;
}

getRelationshipScore(): number {
  return this.relationshipScore;
}
```

### TODO 11: resetConversation Method (STEPs 82-85)

```typescript
resetConversation(): void {
  this.conversationHistory = [];
  this.emotionState = {
    currentEmotion: 'neutral',
    emotionIntensity: 0,
    previousEmotion: 'neutral',
    lastUpdate: new Date(),
  };
  logger.info(`Conversation reset for NPC [${this.personality.name}]`);
}
```

### TODO 12: getState Method (STEPs 86-87)

```typescript
getState() {
  return {
    npcId: this.personality.id,
    name: this.personality.name,
    currentEmotion: this.emotionState.currentEmotion,
    emotionIntensity: this.emotionState.emotionIntensity,
    relationshipScore: this.relationshipScore,
    conversationHistoryLength: this.conversationHistory.length,
    lastInteraction: this.conversationHistory[this.conversationHistory.length - 1]?.timestamp || null,
  };
}
```

---

## agentManager.ts

### TODO 4: Constructor (STEPs 9-15)

```typescript
constructor(
  llm: BaseChatModel,
  retriever: KnowledgeRetriever,
  memoryManager?: MemoryManager,
  config?: AgentManagerConfig
) {
  this.agents = new Map();
  this.llm = llm;
  this.retriever = retriever;
  this.memoryManager = memoryManager;
  this.maxConcurrentAgents = config?.maxConcurrentAgents || 50;

  logger.info('Initialized AgentManager', {
    maxConcurrentAgents: this.maxConcurrentAgents,
  });
}
```

### TODO 5: createAgent Method (STEPs 16-22)

```typescript
createAgent(
  personality: NPCPersonality,
  config?: NPCAgentConfig
): NPCAgent {
  if (this.agents.size >= this.maxConcurrentAgents) {
    throw new Error(`Maximum concurrent agents (${this.maxConcurrentAgents}) reached`);
  }

  if (this.agents.has(personality.id)) {
    logger.warn(`Agent ${personality.id} already exists, returning existing agent`);
    return this.agents.get(personality.id)!;
  }

  const agent = createNPCAgent(
    personality,
    this.llm,
    this.retriever,
    this.memoryManager,
    config
  );

  this.agents.set(personality.id, agent);

  logger.info(`Created NPC Agent: ${personality.name} (${personality.id})`);

  return agent;
}
```

### TODO 6-9: Basic Agent Methods (STEPs 23-32)

```typescript
getAgent(npcId: string): NPCAgent | undefined {
  return this.agents.get(npcId);
}

getAllAgents(): NPCAgent[] {
  return Array.from(this.agents.values());
}

hasAgent(npcId: string): boolean {
  return this.agents.has(npcId);
}

removeAgent(npcId: string): boolean {
  const removed = this.agents.delete(npcId);
  if (removed) {
    logger.info(`Removed NPC Agent: ${npcId}`);
  }
  return removed;
}
```

### TODO 10: clearAllAgents Method (STEPs 33-36)

```typescript
clearAllAgents(): void {
  const count = this.agents.size;
  this.agents.clear();
  logger.info(`Cleared all agents (${count} removed)`);
}
```

### TODO 11: processPlayerInput Method (STEPs 37-43)

```typescript
async processPlayerInput(
  npcId: string,
  playerId: string,
  message: string
): Promise<NPCResponse | null> {
  const agent = this.agents.get(npcId);

  if (!agent) {
    logger.error(`Agent not found: ${npcId}`);
    return null;
  }

  try {
    const response = await agent.chat(playerId, message);
    return response;
  } catch (error) {
    logger.error(`Error processing player input for ${npcId}`, error);
    return null;
  }
}
```

### TODO 12-15: Utility Methods (STEPs 44-54)

```typescript
resetAgentConversation(npcId: string): boolean {
  const agent = this.agents.get(npcId);
  if (!agent) return false;

  agent.resetConversation();
  return true;
}

getStats() {
  return {
    activeAgents: this.agents.size,
    maxConcurrentAgents: this.maxConcurrentAgents,
    agentIds: Array.from(this.agents.keys()),
  };
}

getAgentState(npcId: string) {
  const agent = this.agents.get(npcId);
  return agent ? agent.getState() : null;
}

getAllAgentStates() {
  return Array.from(this.agents.values()).map(agent => agent.getState());
}
```

---

## Key Concepts Explained

### Agent Architecture

```
AgentManager (1) --manages--> NPCAgent (many)
                                  |
                        +---------+---------+
                        |         |         |
                   Personality  Memory   Retriever
```

### JSON Response Parsing

```typescript
// Try to extract JSON from LLM response
const jsonMatch = responseText.match(/\{[\s\S]*\}/);
if (jsonMatch) {
  const parsed = JSON.parse(jsonMatch[0]);
  // Use parsed values
}
```

This pattern handles cases where the LLM adds text around the JSON.

### Relationship Score Bounds

```typescript
this.relationshipScore = Math.max(0, Math.min(1, this.relationshipScore + delta));
```

This ensures the score stays between 0.0 and 1.0.

### Copy Array for Immutability

```typescript
getConversationHistory(): ConversationContext[] {
  return [...this.conversationHistory];  // Spread creates a copy
}
```

This prevents external code from modifying the internal array.

### Non-Null Assertion

```typescript
return this.agents.get(personality.id)!;
```

The `!` tells TypeScript we know the value exists (use after confirming with `has()`).

---

## socketServer.ts

### TODO: handlePlayerInput - Route through AgentManager (STEPs 1-6)

```typescript
if (this.agentManager) {
  const response = await this.agentManager.processPlayerInput(npcId, playerId, message);

  if (response) {
    socket.emit('npc_response', {
      npcId,
      playerId,
      response,
      timestamp: new Date().toISOString(),
    });

    logger.info('NPC response sent', {
      npcId,
      playerId,
      emotion: response.emotion,
    });
  } else {
    socket.emit('error', {
      message: `Agent ${npcId} not found or failed to respond`,
    });
  }
} else {
  socket.emit('error', {
    message: 'Agent manager not configured',
  });
}
```

**Key points:**
- STEP 1: Check `this.agentManager` exists before using it
- STEP 2: `processPlayerInput()` returns `NPCResponse | null`
- STEP 3: Emit `'npc_response'` with npcId, playerId, response, and timestamp
- STEP 4: Log with the response's emotion field
- STEP 5: If response is null, the agent was not found
- STEP 6: If no agentManager, emit an error telling the client

---

## index.ts

### TODO: Pass agentManager to createSocketServer config (STEP 1)

```typescript
const socketServer = createSocketServer({
  port: serverConfig.socketIoPort,
  host: serverConfig.host,
  agentManager,
  cors: {
    origin: '*',
    credentials: false,
  },
});
```

**Key point:** Simply add `agentManager,` (shorthand property) to the config object. This connects the agent framework to the socket server so player messages flow through the agents instead of bypassing them.
