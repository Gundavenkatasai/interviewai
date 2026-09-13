import { AIRouter } from "./core/ai.router";
import { QwenProvider } from "./providers/qwen.provider";
import { GroqProvider } from "./providers/groq.provider";
import { FakeAIProvider } from "./providers/fake.provider";
import { LLMMessage, AITask } from "./core/provider.interface";

// Register providers to the Router once
AIRouter.registerProvider(new QwenProvider());
AIRouter.registerProvider(new GroqProvider());
AIRouter.registerProvider(new FakeAIProvider());

export class AIService {
  
  static async generate(messages: LLMMessage[], options?: any): Promise<string> {
    // Map legacy options to generic AITask. If not provided, assume a generic task that falls back to Qwen
    const task: AITask = options?.task || "INTERVIEW_QUESTION"; 
    
    return AIRouter.executeTask<string>(task, messages, {
      structured: false,
      temperature: options?.temperature,
      maxTokens: options?.max_tokens,
    }) as Promise<string>;
  }

  static async generateStructured<T>(messages: LLMMessage[], schema?: any, options?: any): Promise<T> {
    const task: AITask = options?.task || "RESUME_ANALYSIS"; 

    return AIRouter.executeTask<T>(task, messages, {
      structured: true,
      schema: schema,
      temperature: options?.temperature,
      maxTokens: options?.max_tokens,
    }) as Promise<T>;
  }
}
