# Phase 8: Agent Framework - Intermediate Exercise

## Overview

In this phase, you'll implement the **NPC Agent Framework** that combines all previous components (LLM, RAG, memory) into a cohesive agent class representing individual NPCs. You'll also create an **AgentManager** to handle multiple concurrent NPC agents.

## What's New in This Phase

- **Completed from Phases 1-7:** Configuration, logging, LLM, Socket.IO, personalities, embeddings, vector store, RAG pipeline, memory system
- **New:** `NPCAgent` class - encapsulates all NPC behavior and state
- **New:** `AgentManager` - manages multiple NPC agents (registry + factory pattern)
- **New:** Emotion tracking with intensity levels
- **New:** Player-NPC relationship scoring
- **New:** Agent lifecycle methods (create, chat, reset, destroy)

## Learning Objectives

- Understand agent-based architecture for NPCs
- Implement stateful agent classes with encapsulated state
- Learn multi-agent management patterns (registry, factory)
- Build relationship and emotion tracking systems
- Create reusable agent factory functions

## Prerequisites

1. **Ollama** running with required models:
```bash
ollama serve
ollama pull llama3.1:8b
ollama pull nomic-embed-text
```

2. **ChromaDB** running:
```bash
# Option A: Direct
chroma run

# Option B: Docker
docker run -p 8000:8000 chromadb/chroma
```

3. **Environment** configured:
```bash
cp .env.example .env
# Edit .env if needed (defaults work for local setup)
```

## Exercise Files

| File | TODOs | STEPs | Description |
|------|-------|-------|-------------|
| `src/agents/npcAgent.ts` | 8 (TODO 5-12) | STEPs 17-87 | NPC Agent class - constructor, chat, state management |
| `src/agents/agentManager.ts` | 12 (TODO 4-15) | STEPs 9-54 | Agent Manager - registry, factory, routing |
| `src/server/socketServer.ts` | 1 | STEPs 1-6 | Socket server - route player input through AgentManager |
| `src/index.ts` | 1 | STEP 1 | Entry point - pass agentManager to socket server config |
| **Total** | **22 TODOs** | | |

> TODOs 1-4 in `npcAgent.ts` and TODOs 1-3, 16 in `agentManager.ts` are [PRE-FILLED] with interfaces, class declarations, properties, and factory functions.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start required services (Ollama + ChromaDB)

3. Complete the TODOs in order:
   - `src/agents/npcAgent.ts` - NPC Agent class (TODOs 5-12)
   - `src/agents/agentManager.ts` - Agent Manager class (TODOs 4-15)
   - `src/server/socketServer.ts` - Route player input through AgentManager (1 TODO)
   - `src/index.ts` - Wire agentManager into socket server config (1 TODO)

4. Run tests:
```bash
npm test
```

5. Run the demo:
```bash
npm run dev
```

## Exercise Tasks

### Task 1: NPCAgent Constructor (TODO 5, STEPs 17-26)
Initialize the agent with all required components:
- Assign personality, LLM, retriever, and optional memory manager
- Initialize conversation history as empty array
- Set default relationship score (0.5 = neutral)
- Initialize emotion state to neutral defaults

### Task 2: chat() Method (TODO 6, STEPs 27-49)
Implement the core conversation method:
- Add player message to conversation history
- Store in short-term memory (if available)
- Retrieve RAG context from multiple sources
- Build prompt with personality, context, and history
- Generate LLM response and parse it
- Update emotion and relationship state
- Store interaction in long-term memory

### Task 3: Response Parsing (TODO 7, STEPs 50-56)
Parse LLM output into structured NPCResponse:
- Extract JSON from response text using regex
- Handle cases where LLM adds text around JSON
- Provide fallback for non-JSON responses

### Task 4: Emotion System (TODO 8, STEPs 57-62)
Track NPC emotional state:
- Store previous emotion for transition tracking
- Map emotion types to intensity values
- Update timestamp on each change

### Task 5: Relationship Scoring (TODO 9, STEPs 63-71)
Track player-NPC relationship:
- Positive keywords increase score (+0.05 each)
- Negative keywords decrease score (-0.1 each)
- NPC emotion affects score changes
- Clamp score to 0.0-1.0 range

### Task 6: Getter Methods (TODO 10, STEPs 72-81)
Implement state access methods:
- `getPersonality()` - return personality data
- `getConversationHistory()` - return copy of history (immutability)
- `getCurrentEmotion()` - return current emotion type
- `getEmotionIntensity()` - return intensity level
- `getRelationshipScore()` - return relationship value

### Task 7: State Management (TODOs 11-12, STEPs 82-87)
Implement conversation reset and state snapshot:
- `resetConversation()` - clear history and reset emotion
- `getState()` - return full agent state object

### Task 8: AgentManager Constructor (TODO 4, STEPs 9-15)
Initialize the manager with shared services:
- Initialize empty agents Map
- Store shared LLM, retriever, and memory manager
- Set max concurrent agents from config (default: 50)

### Task 9: Agent Lifecycle (TODOs 5-10, STEPs 16-36)
Implement agent CRUD operations:
- `createAgent()` - factory method with limit checking and dedup
- `getAgent()` / `getAllAgents()` / `hasAgent()` - lookups
- `removeAgent()` / `clearAllAgents()` - cleanup

### Task 10: Message Routing & Utilities (TODOs 11-15, STEPs 37-54)
Implement interaction routing and stats:
- `processPlayerInput()` - route messages to correct agent
- `resetAgentConversation()` - reset specific agent
- `getStats()` / `getAgentState()` / `getAllAgentStates()` - monitoring

### Task 11: Socket Server Agent Integration (socketServer.ts, STEPs 1-6)
Route player input through the AgentManager instead of calling the LLM directly:
- Check if agentManager is available
- Call `processPlayerInput()` to route the message to the correct NPC agent
- Emit `npc_response` with the agent's response data
- Handle missing agent and missing agentManager error cases

### Task 12: Wire AgentManager to Socket Server (index.ts, STEP 1)
Pass the agentManager instance to the socket server configuration:
- Add the `agentManager` property to the `createSocketServer()` config object
- This connects the agent framework to the communication layer

## Key Concepts

### Agent Architecture
```
+---------------------------+
|       NPCAgent            |
+---------------------------+
| - personality             |
| - llm                     |
| - retriever               |
| - memoryManager           |
| - conversationHistory     |
| - emotionState            |
| - relationshipScore       |
+---------------------------+
| + chat(playerId, input)   |
| + getPersonality()        |
| + getCurrentEmotion()     |
| + getRelationshipScore()  |
| + resetConversation()     |
| + getState()              |
+---------------------------+
```

### Agent Manager Pattern
```
+---------------------------+
|      AgentManager         |
+---------------------------+
| - agents: Map<id, Agent>  |
| - llm                     |
| - retriever               |
| - memoryManager           |
+---------------------------+
| + createAgent(personality)|
| + getAgent(npcId)         |
| + processPlayerInput(...) |
| + getAllAgents()           |
| + removeAgent(npcId)      |
| + getStats()              |
+---------------------------+
```

### Chat Flow
```
Player: "Hello merchant!"
         |
         v
+-------------------+
| AgentManager      |
| processPlayerInput|
+-------------------+
         |
         v
+-------------------+
| NPCAgent.chat()   |
| 1. Add to history |
| 2. Retrieve RAG   |
| 3. Generate resp  |
| 4. Update emotion |
| 5. Update memory  |
+-------------------+
         |
         v
NPCResponse: {
  dialog: "Welcome!",
  emotion: "happy",
  action: { type: "wave" }
}
```

## File Structure

```
intermediate-exercise/
+-- src/
|   +-- config/              # [COMPLETED] Configuration
|   +-- utils/               # [COMPLETED] Logger, personality loader
|   +-- llms/                # [COMPLETED] LLM and embeddings
|   +-- server/              # [COMPLETED (updated) - 1 TODO] Socket.IO server
|   +-- core/                # [COMPLETED] Core interfaces
|   +-- vectorstores/        # [COMPLETED] Chroma integration
|   +-- chains/              # [COMPLETED] Retriever and RAG
|   +-- memory/              # [COMPLETED] Memory manager
|   +-- agents/
|   |   +-- npcAgent.ts      # [EXERCISE] NPC Agent class (8 TODOs)
|   |   +-- agentManager.ts  # [EXERCISE] Agent Manager (12 TODOs)
|   +-- test/
|   |   +-- npcAgent.test.ts # [COMPLETED] Test suite
|   +-- index.ts             # [COMPLETED (updated) - 1 TODO] Entry point
+-- data/
|   +-- personalities/       # [COMPLETED] NPC personalities
|   +-- knowledge/           # [COMPLETED] Game lore files
+-- docs/                    # Architecture guides
+-- package.json
+-- tsconfig.json
+-- .env.example
```

## Success Criteria

- [ ] NPCAgent constructor properly initializes all state (TODO 5)
- [ ] `chat()` method generates context-aware responses using RAG (TODO 6)
- [ ] LLM responses are parsed into structured NPCResponse (TODO 7)
- [ ] Emotion tracking updates on each interaction (TODO 8)
- [ ] Relationship scoring responds to positive/negative keywords (TODO 9)
- [ ] All getter methods return correct values (TODO 10)
- [ ] `resetConversation()` clears history and emotion (TODO 11)
- [ ] `getState()` returns complete agent snapshot (TODO 12)
- [ ] AgentManager creates and manages multiple agents (TODOs 4-10)
- [ ] `processPlayerInput()` routes to correct agent (TODO 11)
- [ ] Socket server routes player input through AgentManager (socketServer.ts TODO)
- [ ] AgentManager is passed to socket server config (index.ts TODO)
- [ ] All tests pass: `npm test`
- [ ] Demo runs successfully: `npm run dev`

## Agent Lifecycle Example

### Creating an Agent
```typescript
const manager = createAgentManager(llm, retriever, memoryManager);
const merchant = await loadPersonality('merchant_001');
const agent = manager.createAgent(merchant);
```

### Processing Messages
```typescript
const response = await manager.processPlayerInput(
  'merchant_001',
  'player_001',
  'Hello! What do you sell?'
);
// Returns: { dialog: "...", emotion: "...", action: {...} }
```

### Getting Agent State
```typescript
const state = agent.getState();
// Returns: {
//   npcId, name, currentEmotion, emotionIntensity,
//   relationshipScore, conversationHistoryLength, lastInteraction
// }
```

## Next Steps

After completing Phase 8, you'll have a fully functional agent system! Continue to:
- **Phase 9:** LangGraph Flows - State machine conversation flows
- **Phase 10:** Emotion System - Dynamic NPC emotions
