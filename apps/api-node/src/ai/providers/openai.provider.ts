import { LLMProvider, LLMMessage } from "./provider.interface";
import { env } from "../../config/env";

export class OpenAICompatibleProvider implements LLMProvider {
  private baseUrl = process.env.OPENAI_COMPATIBLE_API_URL || "https://api.openai.com/v1";
  private apiKey = process.env.OPENAI_COMPATIBLE_API_KEY || process.env.OPENAI_API_KEY || "";
  private defaultModel = process.env.OPENAI_COMPATIBLE_MODEL || "gpt-4o";

  async generate(messages: LLMMessage[], options?: any): Promise<string> {
    if (!this.apiKey) {
      throw new Error("OPENAI_COMPATIBLE_API_KEY is missing");
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || this.defaultModel,
        messages,
        temperature: options?.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI-Compatible API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async generateStructured<T>(messages: LLMMessage[], schema: any, options?: any): Promise<T> {
    if (!this.apiKey) {
      throw new Error("OPENAI_COMPATIBLE_API_KEY is missing");
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || this.defaultModel,
        messages,
        temperature: options?.temperature ?? 0.1,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "structured_output",
            schema: schema,
            strict: true
          }
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI-Compatible API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content) as T;
  }
}
