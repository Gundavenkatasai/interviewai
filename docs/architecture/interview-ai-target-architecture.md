# Interview AI Target Architecture

## High-Level Architecture Map

```mermaid
graph TD
    subgraph Frontend [React 19 / Vite]
        UI[UI Components]
        Context[State & Auth Context]
        APIClient[React Query / Fetch]
        WSClient[WebSocket Client]
    end

    subgraph Backend [Fastify / Node.js]
        Routes[API Routes]
        Auth[Auth Middleware]
        Controllers[Domain Controllers]
        Services[Business Services]
        WSManager[WebSocket Manager]
        AILayer[AI Provider Factory]
    end

    subgraph Database [MongoDB]
        Users[(Users)]
        Profiles[(Canonical Profiles)]
        Resumes[(Resumes & Versions)]
        Jobs[(Jobs)]
        Applications[(Applications)]
        Interviews[(Interviews & Transcripts)]
    end

    subgraph AI Providers
        Groq[Groq: Llama3/Qwen/Whisper]
        vLLM[vLLM: Local / Hosted Qwen]
    end

    UI --> Context
    Context --> APIClient
    UI --> WSClient
    APIClient --> Routes
    WSClient --> WSManager
    Routes --> Auth
    Auth --> Controllers
    Controllers --> Services
    WSManager --> Services
    Services --> Database
    Services --> AILayer
    AILayer --> Groq
    AILayer --> vLLM
```

## Architectural Principles
1. **Source of Truth**: MongoDB is the absolute source of truth. AI inferences must never silently overwrite user data without explicit status markers (`AI_SUGGESTED`, `VERIFIED`).
2. **Provider Agnosticism**: The `AILayer` must wrap all LLM interactions so that swapping Groq for OpenAI or vLLM requires changing only one file.
3. **Stateless APIs**: REST endpoints are completely stateless, authenticating via JWT on every request.
4. **Stateful Interviews**: Interview sessions use persistent WebSockets to maintain conversational state and stream STT/TTS with low latency.
