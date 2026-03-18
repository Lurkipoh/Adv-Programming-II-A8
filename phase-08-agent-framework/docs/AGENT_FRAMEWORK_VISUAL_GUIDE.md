# Phase 8: Agent Framework - Visual Guide

**Architecture Diagrams and Flow Charts**

---

## Layer Position in Full Architecture

```mermaid
graph TD
    L10["Layer 10: Azure Cloud<br/>Azure Cognitive Services"] --> L9
    L9["Layer 9: Orchestration<br/>Entry point, initializes all services"] --> L8
    L8["Layer 8: Communication<br/>Socket.io + HTTP endpoints"] --> L7
    L7["<b>Layer 7: Agent System</b><br/>NPC Agents — THIS PHASE"] --> L6
    L6["Layer 6: Memory<br/>Three-tier memory architecture"] --> L5
    L5["Layer 5: LangGraph<br/>State machines for conversation/quest/emotion"] --> L4
    L4["Layer 4: RAG Pipeline<br/>Retrieval-augmented generation"] --> L3
    L3["Layer 3: Data Management<br/>Document processing and indexing"] --> L2
    L2["Layer 2: AI Infrastructure<br/>Embeddings, Vector DB, LLM"] --> L1
    L1["Layer 1: Foundation<br/>Types, configuration, logging"]

    style L7 fill:#51cf66,stroke:#37b24d,color:#fff,stroke-width:3px
    style L6 fill:#f59f00,stroke:#e67700,color:#fff
    style L8 fill:#f59f00,stroke:#e67700,color:#fff
    classDef default fill:#ffffff15,stroke:#888,color:#ddd
```

---

## NPCAgent Structure

```mermaid
graph TB
    subgraph AGENT["NPCAgent"]
        subgraph STATE["Encapsulated State"]
            personality["personality: NPCPersonality<br/>(from JSON)"]
            history["conversationHistory<br/>(last 10 messages)"]
            emotion["emotionState: EmotionState<br/>(current emotion + intensity)"]
            relationship["relationshipScore: number<br/>(0.0 - 1.0)"]
        end

        subgraph SERVICES["Injected Services"]
            llm["llm: BaseChatModel<br/>(text generation)"]
            retriever["retriever: KnowledgeRetriever<br/>(RAG search)"]
            memory["memoryManager?: MemoryManager<br/>(optional memory)"]
        end

        subgraph METHOD["Main Method"]
            chat["chat(playerId, message) → NPCResponse"]
            step1["1. Add player message to history"]
            step2["2. Retrieve RAG context"]
            step3["3. Build prompt with personality"]
            step4["4. Generate LLM response + parse JSON"]
            step5["5. Update emotion and relationship"]
            step6["6. Store in memory and return"]
            chat --> step1 --> step2 --> step3 --> step4 --> step5 --> step6
        end
    end

    style AGENT fill:#51cf6611,stroke:#51cf66,stroke-width:2px
    style STATE fill:#f59f0011,stroke:#f59f00,stroke-width:2px
    style SERVICES fill:#4c6ef511,stroke:#4c6ef5,stroke-width:2px
    style METHOD fill:#ae3ec911,stroke:#ae3ec9,stroke-width:2px
    style llm fill:#4c6ef5,stroke:#364fc7,color:#fff
    style retriever fill:#ae3ec9,stroke:#9c36b5,color:#fff
    style memory fill:#7950f2,stroke:#6741d9,color:#fff
    classDef default fill:#ffffff15,stroke:#888,color:#ddd
```

---

## AgentManager Structure

```mermaid
graph TB
    subgraph MANAGER["AgentManager"]
        subgraph REGISTRY["Registry (Map)"]
            map["agents: Map‹string, NPCAgent›"]
            m1["merchant_001 → NPCAgent<br/>(Gregor the Merchant)"]
            g1["guard_002 → NPCAgent<br/>(Captain Stone)"]
            w1["wizard_003 → NPCAgent<br/>(Merlin the Wise)"]
            map --- m1
            map --- g1
            map --- w1
        end

        subgraph SHARED["Shared Services"]
            llm2["llm: BaseChatModel"]
            ret2["retriever: KnowledgeRetriever"]
            mem2["memoryManager?: MemoryManager"]
        end

        subgraph FACTORY["Factory Method"]
            create["createAgent(personality) → NPCAgent"]
            f1["1. Check concurrent limit (max 50)"]
            f2["2. Check if agent exists (return cached)"]
            f3["3. Create new NPCAgent with shared services"]
            f4["4. Register in Map"]
            f5["5. Return agent"]
            create --> f1 --> f2 --> f3 --> f4 --> f5
        end
    end

    style MANAGER fill:#f59f0011,stroke:#f59f00,stroke-width:2px
    style REGISTRY fill:#51cf6611,stroke:#51cf66,stroke-width:2px
    style SHARED fill:#4c6ef511,stroke:#4c6ef5,stroke-width:2px
    style FACTORY fill:#ae3ec911,stroke:#ae3ec9,stroke-width:2px
    style llm2 fill:#4c6ef5,stroke:#364fc7,color:#fff
    style ret2 fill:#ae3ec9,stroke:#9c36b5,color:#fff
    style mem2 fill:#7950f2,stroke:#6741d9,color:#fff
    classDef default fill:#ffffff15,stroke:#888,color:#ddd
```

---

## Request Flow Through Agent System

```mermaid
sequenceDiagram
    autonumber

    box rgb(76,110,245,0.1) Client
        participant Player as Player Message
    end

    box rgb(245,159,0,0.1) Agent Layer
        participant AM as AgentManager
        participant NPC as NPCAgent
    end

    box rgb(121,80,242,0.1) Services
        participant SVC as Services<br/>(RAG + LLM + Memory)
    end

    Player->>AM: processPlayerInput(npcId, playerId, msg)
    AM->>AM: getAgent(npcId)
    AM->>NPC: chat(playerId, msg)
    NPC->>SVC: Retrieve RAG context
    SVC-->>NPC: context documents
    NPC->>SVC: Generate LLM response
    SVC-->>NPC: generated text
    NPC->>SVC: Store in memory
    NPC-->>AM: NPCResponse
    AM-->>Player: NPCResponse
```

---

## Chat Method Pipeline (Detailed)

```mermaid
flowchart TB
    INPUT["chat(playerId, playerInput)"]
    S1["1. Record player message<br/>in history"]
    S2["2. Add to short-term<br/>memory (if available)"]
    S3["3. retrieveMultiSource()<br/>personality + lore + conversation"]
    S4["4. Build prompt<br/>system + RAG + history + input"]
    S5["5. LLM.invoke()<br/>Generate text"]
    S6["6. parseResponse()<br/>Extract JSON or fallback"]
    S7["7. updateEmotion()<br/>Set intensity"]
    S8["8. updateRelationshipScore()<br/>+/- keywords"]
    S9["9. Record NPC response<br/>in history + memory"]
    S10["10. Trim history<br/>if > max * 2"]
    OUTPUT["Return NPCResponse<br/>{ dialog, emotion, action }"]

    INPUT --> S1 --> S2 --> S3 --> S4 --> S5 --> S6 --> S7 --> S8 --> S9 --> S10 --> OUTPUT

    style INPUT fill:#4c6ef5,stroke:#364fc7,color:#fff
    style S1 fill:#f59f00,stroke:#e67700,color:#fff
    style S2 fill:#f59f00,stroke:#e67700,color:#fff
    style S3 fill:#ae3ec9,stroke:#9c36b5,color:#fff
    style S4 fill:#ae3ec9,stroke:#9c36b5,color:#fff
    style S5 fill:#4c6ef5,stroke:#364fc7,color:#fff
    style S6 fill:#868686,stroke:#666666,color:#fff
    style S7 fill:#51cf66,stroke:#37b24d,color:#fff
    style S8 fill:#51cf66,stroke:#37b24d,color:#fff
    style S9 fill:#7950f2,stroke:#6741d9,color:#fff
    style S10 fill:#868686,stroke:#666666,color:#fff
    style OUTPUT fill:#51cf66,stroke:#37b24d,color:#fff
    classDef default fill:#ffffff15,stroke:#888,color:#ddd
```

---

## Emotion State Transitions

```mermaid
flowchart TB
    CALL["updateEmotion(newEmotion)"]
    TRACK["previousEmotion = current<br/>currentEmotion = new<br/>lastUpdate = now"]
    CALL --> TRACK --> LOOKUP

    subgraph LOOKUP["Intensity Lookup"]
        direction LR
        E1["neutral<br/>0.0"]
        E2["curious<br/>0.4"]
        E3["sad<br/>0.5"]
        E4["disgusted<br/>0.5"]
        E5["happy<br/>0.6"]
        E6["surprised<br/>0.6"]
        E7["fearful<br/>0.7"]
        E8["angry<br/>0.8"]
        E9["excited<br/>0.8"]
    end

    style LOOKUP fill:#f59f0011,stroke:#f59f00,stroke-width:2px
    style CALL fill:#4c6ef5,stroke:#364fc7,color:#fff
    style TRACK fill:#868686,stroke:#666666,color:#fff
    style E1 fill:#868686,stroke:#666666,color:#fff
    style E2 fill:#51cf66,stroke:#37b24d,color:#fff
    style E3 fill:#4c6ef5,stroke:#364fc7,color:#fff
    style E4 fill:#ff6b6b,stroke:#ff4444,color:#fff
    style E5 fill:#51cf66,stroke:#37b24d,color:#fff
    style E6 fill:#f59f00,stroke:#e67700,color:#fff
    style E7 fill:#ae3ec9,stroke:#9c36b5,color:#fff
    style E8 fill:#ff6b6b,stroke:#ff4444,color:#fff
    style E9 fill:#51cf66,stroke:#37b24d,color:#fff
    classDef default fill:#ffffff15,stroke:#888,color:#ddd
```

---

## Relationship Score Flow

```mermaid
flowchart TB
    CALL2["updateRelationshipScore(playerInput, response)"]
    INIT["Convert input to lowercase<br/>Initialize delta = 0"]
    POS["Positive Keywords Check<br/>thank · please · help · kind · appreciate<br/>Each match: delta += 0.05"]
    NEG["Negative Keywords Check<br/>stupid · idiot · hate · useless · annoying<br/>Each match: delta -= 0.10"]
    EMO["Emotion Influence<br/>happy/excited: delta += 0.02<br/>angry/disgusted: delta -= 0.02"]
    CLAMP["Clamp to 0.0 – 1.0<br/>Math.max(0, Math.min(1, score + delta))"]
    RESULT["Updated relationshipScore"]

    CALL2 --> INIT --> POS --> NEG --> EMO --> CLAMP --> RESULT

    style CALL2 fill:#4c6ef5,stroke:#364fc7,color:#fff
    style INIT fill:#868686,stroke:#666666,color:#fff
    style POS fill:#51cf66,stroke:#37b24d,color:#fff
    style NEG fill:#ff6b6b,stroke:#ff4444,color:#fff
    style EMO fill:#f59f00,stroke:#e67700,color:#fff
    style CLAMP fill:#868686,stroke:#666666,color:#fff
    style RESULT fill:#51cf66,stroke:#37b24d,color:#fff
    classDef default fill:#ffffff15,stroke:#888,color:#ddd
```

---

## Dependencies

**This phase uses all previous components:**

| Phase | Component | Used For |
|-------|-----------|----------|
| Phase 1 | Types, Config, Logger | Core infrastructure |
| Phase 2 | OllamaLLM | Text generation |
| Phase 4 | Personality Loader | Character data |
| Phase 5 | Embeddings, VectorStore | Vector operations |
| Phase 6 | RAG Pipeline (Retriever) | Context retrieval |
| Phase 7 | Memory Manager | Conversation memory |

---

## Key Files

| File | Purpose |
|------|---------|
| `src/agents/npcAgent.ts` | Individual NPC agent class |
| `src/agents/agentManager.ts` | Agent registry and factory |
| `src/core/index.ts` | Type definitions (EmotionType, NPCResponse, etc.) |
| `src/index.ts` | Entry point demonstrating agent usage |

---

*Phase 8 of 10 - Agent Framework*
