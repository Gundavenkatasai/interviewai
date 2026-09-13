export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export type AITask =
  | "INTERVIEW_QUESTION"
  | "INTERVIEW_EVALUATION"
  | "RESUME_ANALYSIS"
  | "RESUME_OPTIMIZATION"
  | "ATS_ANALYSIS"
  | "JOB_MATCHING"
  | "CAREER_SUMMARY"
  | "COVER_LETTER"
  | "OUTREACH"
  | "CAREER_RECOMMENDATION";

export interface AIModelConfig {
  id: string;
  provider: string; // e.g., "qwen", "groq", "fake"
  model: string;
  contextWindow: number;
  supportsStructuredOutput: boolean;
  supportsStreaming: boolean;
  maxOutputTokens: number;
}

export interface GenerateTextRequest {
  messages: LLMMessage[];
  task?: AITask;
  modelConfig?: AIModelConfig;
  temperature?: number;
  maxTokens?: number;
  requestId?: string;
  abortSignal?: AbortSignal;
}

export interface GenerateStructuredRequest<T> extends GenerateTextRequest {
  schema?: any; // Zod schema or JSON schema equivalent
}

export interface StreamTextRequest extends GenerateTextRequest {}

export interface AIProvider {
  id: string;
  generateText(request: GenerateTextRequest): Promise<string>;
  generateStructured<T>(request: GenerateStructuredRequest<T>): Promise<T>;
  streamText?(request: StreamTextRequest): AsyncIterable<string>;
}

export class AIError extends Error {
  constructor(
    public code: "RATE_LIMIT" | "TIMEOUT" | "SERVER_ERROR" | "INVALID_REQUEST" | "AUTH_ERROR" | "INVALID_RESPONSE" | "NETWORK_ERROR",
    public provider: string,
    public retryable: boolean,
    public safeMessage: string,
    public originalError?: any
  ) {
    super(safeMessage);
    this.name = "AIError";
  }
}
