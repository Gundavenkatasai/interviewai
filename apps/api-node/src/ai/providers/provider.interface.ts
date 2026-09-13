export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMProvider {
  generate(messages: LLMMessage[], options?: any): Promise<string>;
  generateStructured<T>(messages: LLMMessage[], schema: any, options?: any): Promise<T>;
}
