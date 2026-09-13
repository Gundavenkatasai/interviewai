import { LLMProvider, LLMMessage } from "./provider.interface";

export class LocalProvider implements LLMProvider {
  private baseUrl = process.env.LOCAL_LLM_API_URL || "http://localhost:11434/v1"; // Example: Ollama compatible
  private defaultModel = process.env.LOCAL_LLM_MODEL || "llama3";

  async generate(messages: LLMMessage[], options?: any): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: options?.model || this.defaultModel,
        messages,
        temperature: options?.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Local LLM error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async generateStructured<T>(messages: LLMMessage[], schema: any, options?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: options?.model || this.defaultModel,
        messages,
        temperature: options?.temperature ?? 0.1,
        response_format: {
          type: "json_object", // Note: Most local LLMs only support basic json_object
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Local LLM error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content) as T;
  }
}
