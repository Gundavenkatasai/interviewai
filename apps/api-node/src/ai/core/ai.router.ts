import { AITask, AIModelConfig, LLMMessage } from "./provider.interface";
import { AIRegistry } from "./ai.registry";
import { ReliabilityManager } from "../reliability/reliability.manager";
import { AIProvider } from "./provider.interface";

export interface TaskRoute {
  primaryModel: string;
  fallbackModel: string;
  defaultTemperature: number;
  defaultMaxTokens: number;
}

export const ROUTING_TABLE: Record<AITask, TaskRoute> = {
  CAREER_SUMMARY: {
    primaryModel: "qwen-27b",
    fallbackModel: "gpt-oss-120b",
    defaultTemperature: 0.3,
    defaultMaxTokens: 1500,
  },
  RESUME_ANALYSIS: {
    primaryModel: "qwen-27b",
    fallbackModel: "gpt-oss-120b",
    defaultTemperature: 0.1,
    defaultMaxTokens: 2000,
  },
  RESUME_OPTIMIZATION: {
    primaryModel: "qwen-27b",
    fallbackModel: "gpt-oss-120b",
    defaultTemperature: 0.2,
    defaultMaxTokens: 2000,
  },
  ATS_ANALYSIS: {
    primaryModel: "qwen-27b",
    fallbackModel: "gpt-oss-120b",
    defaultTemperature: 0.1,
    defaultMaxTokens: 1500,
  },
  JOB_MATCHING: {
    primaryModel: "qwen-27b",
    fallbackModel: "gpt-oss-120b",
    defaultTemperature: 0.1,
    defaultMaxTokens: 1500,
  },
  INTERVIEW_QUESTION: {
    primaryModel: "gpt-oss-20b",
    fallbackModel: "qwen-27b",
    defaultTemperature: 0.7,
    defaultMaxTokens: 800,
  },
  INTERVIEW_EVALUATION: {
    primaryModel: "qwen-27b",
    fallbackModel: "gpt-oss-20b",
    defaultTemperature: 0.2,
    defaultMaxTokens: 1500,
  },
  CAREER_RECOMMENDATION: {
    primaryModel: "qwen-27b",
    fallbackModel: "gpt-oss-120b",
    defaultTemperature: 0.5,
    defaultMaxTokens: 1000,
  },
  COVER_LETTER: {
    primaryModel: "qwen-27b",
    fallbackModel: "gpt-oss-120b",
    defaultTemperature: 0.6,
    defaultMaxTokens: 1000,
  },
  OUTREACH: {
    primaryModel: "gpt-oss-20b",
    fallbackModel: "qwen-27b-fallback",
    defaultTemperature: 0.6,
    defaultMaxTokens: 800,
  }
};

export class AIRouter {
  private static providers = new Map<string, AIProvider>();

  static registerProvider(provider: AIProvider) {
    this.providers.set(provider.id, provider);
  }

  static getProvider(id: string): AIProvider {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`Provider ${id} is not registered in AIRouter.`);
    }
    return provider;
  }

  static getRoute(task: AITask): TaskRoute {
    return ROUTING_TABLE[task];
  }

  static async executeTask<T = any>(
    task: AITask,
    messages: LLMMessage[],
    options: { structured?: boolean; schema?: any; temperature?: number; maxTokens?: number } = {}
  ): Promise<T | string> {
    const route = this.getRoute(task);
    const useTestProvider = process.env.NODE_ENV === "test";

    // Primary Execution
    let primaryModelId = route.primaryModel;
    if (useTestProvider) primaryModelId = "fake-model";

    const primaryModel = AIRegistry.getModelConfig(primaryModelId);
    const primaryProvider = this.getProvider(primaryModel.provider);

    const temp = options.temperature ?? route.defaultTemperature;
    const maxT = options.maxTokens ?? route.defaultMaxTokens;

    try {
      if (options.structured) {
        return await ReliabilityManager.executeStructured<T>(primaryProvider, {
          messages,
          task,
          modelConfig: primaryModel,
          temperature: temp,
          maxTokens: maxT,
          schema: options.schema
        });
      } else {
        return await ReliabilityManager.executeText(primaryProvider, {
          messages,
          task,
          modelConfig: primaryModel,
          temperature: temp,
          maxTokens: maxT
        });
      }
    } catch (err: any) {
      if (!err.retryable && err.code !== "TIMEOUT" && err.code !== "SERVER_ERROR") {
        throw err;
      }

      // Fallback Execution
      console.warn(`[AIRouter] Primary model ${primaryModel.id} failed, falling back to ${route.fallbackModel}...`);
      
      let fallbackModelId = route.fallbackModel;
      if (useTestProvider) fallbackModelId = "fake-model"; // Fake doesn't really fail fallback

      const fallbackModel = AIRegistry.getModelConfig(fallbackModelId);
      const fallbackProvider = this.getProvider(fallbackModel.provider);

      if (options.structured) {
        return await ReliabilityManager.executeStructured<T>(fallbackProvider, {
          messages,
          task,
          modelConfig: fallbackModel,
          temperature: temp,
          maxTokens: maxT,
          schema: options.schema
        });
      } else {
        return await ReliabilityManager.executeText(fallbackProvider, {
          messages,
          task,
          modelConfig: fallbackModel,
          temperature: temp,
          maxTokens: maxT
        });
      }
    }
  }
}
