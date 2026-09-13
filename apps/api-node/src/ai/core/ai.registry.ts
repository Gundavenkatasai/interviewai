import { AIModelConfig } from "./provider.interface";

export const MODEL_REGISTRY: Record<string, AIModelConfig> = {
  "qwen-27b": {
    id: "qwen-27b",
    provider: "qwen",
    model: "qwen/qwen3.8-27b",
    contextWindow: 32000,
    supportsStructuredOutput: true,
    supportsStreaming: true,
    maxOutputTokens: 8000,
  },
  "qwen-27b-fallback": {
    id: "qwen-27b-fallback",
    provider: "qwen",
    model: "qwen/qwen3.6-27b",
    contextWindow: 32000,
    supportsStructuredOutput: true,
    supportsStreaming: true,
    maxOutputTokens: 8000,
  },
  "gpt-oss-120b": {
    id: "gpt-oss-120b",
    provider: "groq",
    model: "openai/gpt-oss-120b",
    contextWindow: 32000,
    supportsStructuredOutput: true,
    supportsStreaming: true,
    maxOutputTokens: 8000,
  },
  "gpt-oss-20b": {
    id: "gpt-oss-20b",
    provider: "groq",
    model: "openai/gpt-oss-20b",
    contextWindow: 8000,
    supportsStructuredOutput: true,
    supportsStreaming: true,
    maxOutputTokens: 2000,
  },
  "fake-model": {
    id: "fake-model",
    provider: "fake",
    model: "fake-model-v1",
    contextWindow: 100000,
    supportsStructuredOutput: true,
    supportsStreaming: true,
    maxOutputTokens: 100000,
  },
};

export class AIRegistry {
  static getModelConfig(id: string): AIModelConfig {
    const config = MODEL_REGISTRY[id];
    if (!config) {
      throw new Error(`Model ${id} not found in registry`);
    }
    return config;
  }
}
