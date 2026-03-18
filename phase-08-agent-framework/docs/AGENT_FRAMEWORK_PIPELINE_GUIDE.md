# Phase 8: Agent Framework - Pipeline Guide

**Understanding the NPC Agent Pipeline**

This document explains how the agent framework processes player interactions through the full pipeline.

---

## Table of Contents

- [Agent Architecture](#agent-architecture)
- [NPCAgent Class](#npcagent-class)
- [AgentManager Class](#agentmanager-class)
- [Chat Pipeline](#chat-pipeline)
- [State Management](#state-management)
- [Emotion Tracking](#emotion-tracking)
- [Relationship Scoring](#relationship-scoring)

---

## Agent Architecture

### Why Agents?

Previous phases built individual components:
- **Phase 2:** LLM for text generation
- **Phase 5:** Embeddings and vector store
- **Phase 6:** RAG for knowledge retrieval
- **Phase 7:** Memory for conversation history

The **Agent** combines all of these into a single, self-contained NPC that:
- Maintains its own state (emotion, relationships)
- Processes player input through the full pipeline
- Returns consistent, in-character responses

### Design Pattern: Composition

Each agent **contains** references to shared services rather than creating its own:

```typescript
// Shared services (created once)
const llm = createOllamaLLM();
const retriever = createKnowledgeRetriever(vectorStore, embeddings);
const memoryManager = new MemoryManager(...);

// Each agent uses the same services but has independent state
const merchant = new NPCAgent(merchantPersonality, llm, retriever, memoryManager);
const guard = new NPCAgent(guardPersonality, llm, retriever, memoryManager);
```

This pattern:
- Reduces resource usage (one LLM connection, one vector store)
- Allows independent agent state
- Makes agent creation lightweight

```mermaid
graph LR
    subgraph SHARED["Shared Services (created once)"]
        LLM["LLM<br/>Ollama"]
        VS["Vector Store<br/>Chroma"]
        MEM["Memory Manager"]
    end

    subgraph AGENTS["Independent Agent Instances"]
        A1["NPCAgent<br/>Merchant"]
        A2["NPCAgent<br/>Guard"]
        A3["NPCAgent<br/>Wizard"]
    end

    LLM --> A1
    LLM --> A2
    LLM --> A3
    VS --> A1
    VS --> A2
    VS --> A3
    MEM --> A1
    MEM --> A2
    MEM --> A3

    style SHARED fill:#4c6ef511,stroke:#4c6ef5,stroke-width:2px
    style AGENTS fill:#51cf6611,stroke:#51cf66,stroke-width:2px
    style LLM fill:#4c6ef5,stroke:#364fc7,color:#fff
    style VS fill:#7950f2,stroke:#6741d9,color:#fff
    style MEM fill:#7950f2,stroke:#6741d9,color:#fff
    style A1 fill:#51cf66,stroke:#37b24d,color:#fff
    style A2 fill:#51cf66,stroke:#37b24d,color:#fff
    style A3 fill:#51cf66,stroke:#37b24d,color:#fff
    classDef default fill:#ffffff15,stroke:#888,color:#ddd
```

---

## NPCAgent Class

**File:** `src/agents/npcAgent.ts`

### Encapsulated State

Each NPCAgent instance maintains:

| Property | Type | Purpose |
|----------|------|---------|
| `personality` | NPCPersonality | Character traits, backstory, speech patterns |
| `conversationHistory` | ConversationContext[] | Recent dialog (capped at max) |
| `emotionState` | EmotionState | Current and previous emotion + intensity |
| `relationshipScore` | number (0.0-1.0) | Player-NPC relationship quality |

### Injected Services

| Service | Type | Purpose |
|---------|------|---------|
| `llm` | BaseChatModel | Text generation via Ollama |
| `retriever` | KnowledgeRetriever | RAG context retrieval |
| `memoryManager` | MemoryManager (optional) | Short/long-term memory storage |

---

## AgentManager Class

**File:** `src/agents/agentManager.ts`

### Registry Pattern

The AgentManager uses a `Map<string, NPCAgent>` to maintain a registry of active agents:

```
agents Map:
  "merchant_001" --> NPCAgent (Gregor the Merchant)
  "guard_002"    --> NPCAgent (Captain Stone)
  "wizard_003"   --> NPCAgent (Merlin the Wise)
```

### Factory Pattern

The `createAgent()` method:
1. Checks concurrent agent limit (default: 50)
2. Checks for duplicate agent IDs (returns existing if found)
3. Creates new NPCAgent with shared services
4. Registers in the Map
5. Returns the agent

### Message Routing

`processPlayerInput(npcId, playerId, message)` routes messages to the correct agent by looking up the NPC ID in the registry and calling `agent.chat()`.

```mermaid
graph TB
    Player["Player Message<br/>npcId + playerId + text"] --> AM["AgentManager<br/>processPlayerInput()"]
    AM --> LOOKUP["Map.get(npcId)"]
    LOOKUP -->|found| AGENT["NPCAgent.chat()"]
    LOOKUP -->|not found| ERR["Error: Agent not registered"]
    AGENT --> RESP["NPCResponse<br/>dialog + emotion + action"]

    style Player fill:#4c6ef5,stroke:#364fc7,color:#fff
    style AM fill:#f59f00,stroke:#e67700,color:#fff
    style LOOKUP fill:#868686,stroke:#666666,color:#fff
    style AGENT fill:#51cf66,stroke:#37b24d,color:#fff
    style ERR fill:#ff6b6b,stroke:#ff4444,color:#fff
    style RESP fill:#51cf66,stroke:#37b24d,color:#fff
    classDef default fill:#ffffff15,stroke:#888,color:#ddd
```

---

## Chat Pipeline

The `chat()` method is the core processing pipeline:

```mermaid
flowchart LR
    S1["1. Record<br/>Input"] --> S2["2. Short-Term<br/>Memory"] --> S3["3. RAG<br/>Retrieve"] --> S4["4. Build<br/>Prompt"] --> S5["5. LLM<br/>Generate"] --> S6["6. Parse<br/>JSON"] --> S7["7. Return<br/>Response"]

    style S1 fill:#f59f00,stroke:#e67700,color:#fff
    style S2 fill:#f59f00,stroke:#e67700,color:#fff
    style S3 fill:#ae3ec9,stroke:#9c36b5,color:#fff
    style S4 fill:#ae3ec9,stroke:#9c36b5,color:#fff
    style S5 fill:#4c6ef5,stroke:#364fc7,color:#fff
    style S6 fill:#868686,stroke:#666666,color:#fff
    style S7 fill:#51cf66,stroke:#37b24d,color:#fff
    classDef default fill:#ffffff15,stroke:#888,color:#ddd
```

### Step 1: Record Player Input
```typescript
const playerEntry: ConversationContext = {
  timestamp: new Date(),
  speaker: 'player',
  message: playerInput,
};
this.conversationHistory.push(playerEntry);
```

### Step 2: Store in Short-Term Memory
```typescript
if (this.memoryManager) {
  this.memoryManager.addToShortTerm(this.personality.id, playerId, playerEntry);
}
```

### Step 3: Retrieve RAG Context
```typescript
const context = await this.retriever.retrieveMultiSource(
  this.personality.id,
  playerInput,
  { personalityTopK: 2, loreTopK: 3, conversationTopK: 2 }
);
```

This retrieves:
- Personality-related documents (traits, backstory)
- Game lore (world knowledge)
- Past conversation context

### Step 4: Build Prompt
The prompt combines:
- System prompt from personality profile
- Retrieved RAG context
- Recent conversation history (last 6 messages)
- Current player input

### Step 5: Generate LLM Response
```typescript
const llmResponse = await this.llm.invoke(prompt);
const responseText = llmResponse.content.toString();
const response = this.parseResponse(responseText);
```

### Step 6: Update Agent State
- Update emotion based on response
- Update relationship score based on player keywords
- Add NPC response to conversation history
- Store in long-term memory

### Step 7: Return Response
```typescript
return {
  dialog: "Welcome, traveler! I have fine potions today.",
  emotion: "happy",
  action: { type: "open_inventory" }
};
```

---

## State Management

### Emotion State

```typescript
interface EmotionState {
  currentEmotion: EmotionType;    // e.g., 'happy', 'angry'
  emotionIntensity: number;       // 0.0 - 1.0
  previousEmotion: EmotionType;   // for transition tracking
  lastUpdate: Date;               // when emotion last changed
}
```

### Agent State Snapshot

`getState()` returns a read-only snapshot:

```typescript
{
  npcId: "merchant_001",
  name: "Gregor",
  currentEmotion: "happy",
  emotionIntensity: 0.6,
  relationshipScore: 0.55,
  conversationHistoryLength: 4,
  lastInteraction: "2024-01-15T10:30:00.000Z"
}
```

### Reset Behavior

`resetConversation()` clears:
- Conversation history (empty array)
- Emotion state (back to neutral)

It does **not** reset:
- Relationship score (persistent across conversations)
- Personality data (immutable)

---

## Emotion Tracking

### Intensity Mapping

Each emotion type has a default intensity:

| Emotion | Intensity |
|---------|-----------|
| neutral | 0.0 |
| curious | 0.4 |
| sad | 0.5 |
| disgusted | 0.5 |
| happy | 0.6 |
| surprised | 0.6 |
| fearful | 0.7 |
| angry | 0.8 |
| excited | 0.8 |

### Transition Tracking

The `previousEmotion` field enables:
- Detecting emotional shifts
- Smooth emotion transitions in animations
- Context for future responses

```mermaid
graph LR
    subgraph TRANSITIONS["Emotion Transitions"]
        neutral["neutral<br/>0.0"]
        curious["curious<br/>0.4"]
        sad["sad<br/>0.5"]
        happy["happy<br/>0.6"]
        surprised["surprised<br/>0.6"]
        fearful["fearful<br/>0.7"]
        angry["angry<br/>0.8"]
        excited["excited<br/>0.8"]
    end

    neutral -.-> curious
    neutral -.-> happy
    curious -.-> excited
    happy -.-> excited
    sad -.-> angry
    surprised -.-> fearful

    style TRANSITIONS fill:#f59f0011,stroke:#f59f00,stroke-width:2px
    style neutral fill:#868686,stroke:#666666,color:#fff
    style curious fill:#51cf66,stroke:#37b24d,color:#fff
    style sad fill:#4c6ef5,stroke:#364fc7,color:#fff
    style happy fill:#51cf66,stroke:#37b24d,color:#fff
    style surprised fill:#f59f00,stroke:#e67700,color:#fff
    style fearful fill:#ae3ec9,stroke:#9c36b5,color:#fff
    style angry fill:#ff6b6b,stroke:#ff4444,color:#fff
    style excited fill:#51cf66,stroke:#37b24d,color:#fff
    classDef default fill:#ffffff15,stroke:#888,color:#ddd
```

---

## Relationship Scoring

### Score Range: 0.0 (hostile) to 1.0 (trusted friend)

**Starting value:** 0.5 (neutral)

### Factors that Increase Score (+)

| Factor | Delta | Example |
|--------|-------|---------|
| Positive keywords | +0.05 each | "thank", "please", "help", "kind", "appreciate" |
| Happy/excited NPC emotion | +0.02 | NPC responds positively |

### Factors that Decrease Score (-)

| Factor | Delta | Example |
|--------|-------|---------|
| Negative keywords | -0.10 each | "stupid", "idiot", "hate", "useless", "annoying" |
| Angry/disgusted NPC emotion | -0.02 | NPC responds negatively |

### Clamping

```typescript
this.relationshipScore = Math.max(0, Math.min(1, this.relationshipScore + delta));
```

This ensures the score never goes below 0 or above 1.

```mermaid
flowchart TB
    INPUT2["playerInput + npcResponse"]
    POS2["Positive Keywords<br/>thank · please · help · kind · appreciate<br/>delta += 0.05 each"]
    NEG2["Negative Keywords<br/>stupid · idiot · hate · useless · annoying<br/>delta -= 0.10 each"]
    EMO2["Emotion Influence<br/>happy/excited: +0.02<br/>angry/disgusted: -0.02"]
    CLAMP2["Clamp: Math.max(0, Math.min(1, score + delta))"]
    SCORE2["Updated Score<br/>0.0 (hostile) ↔ 1.0 (trusted)"]

    INPUT2 --> POS2 --> NEG2 --> EMO2 --> CLAMP2 --> SCORE2

    style INPUT2 fill:#4c6ef5,stroke:#364fc7,color:#fff
    style POS2 fill:#51cf66,stroke:#37b24d,color:#fff
    style NEG2 fill:#ff6b6b,stroke:#ff4444,color:#fff
    style EMO2 fill:#f59f00,stroke:#e67700,color:#fff
    style CLAMP2 fill:#868686,stroke:#666666,color:#fff
    style SCORE2 fill:#51cf66,stroke:#37b24d,color:#fff
    classDef default fill:#ffffff15,stroke:#888,color:#ddd
```

---

## Complete Example

```typescript
// 1. Create shared services
const llm = createOllamaLLM();
const vectorStore = await createChromaVectorStore();
const embeddings = createEmbeddingGenerator();
const retriever = new KnowledgeRetriever(vectorStore, embeddings);
const memoryManager = new MemoryManager(vectorStore, embeddings, retriever, llm);

// 2. Create agent manager
const agentManager = createAgentManager(llm, retriever, memoryManager);

// 3. Load and create agents
const merchantPersonality = await loadPersonality('data/personalities/merchant_001.json');
const merchant = agentManager.createAgent(merchantPersonality);

// 4. Process player input
const response = await agentManager.processPlayerInput(
  'merchant_001',
  'player_123',
  'Hello! What do you have for sale?'
);

console.log(response);
// { dialog: "Welcome! I have potions, scrolls...", emotion: "happy", action: {...} }

// 5. Get agent state
const state = merchant.getState();
console.log(state);
// { npcId: "merchant_001", currentEmotion: "happy", relationshipScore: 0.52, ... }
```

---

*Phase 8 of 10 - Agent Framework*
