import { AIProvider, GenerateTextRequest, GenerateStructuredRequest, AIError } from "../core/provider.interface";
import { env } from "../../config/env";

export class GroqProvider implements AIProvider {
  public id = "groq";
  private apiKey: string;
  private baseUrl = "https://api.groq.com/openai/v1/chat/completions";

  constructor() {
    this.apiKey = env.GROQ_API_KEY || process.env.GROQ_API_KEY || "";
  }

  async generateText(request: GenerateTextRequest): Promise<string> {
    if (!this.apiKey) {
      throw new AIError("AUTH_ERROR", this.id, false, "Groq provider missing API key");
    }

    const modelConfig = request.modelConfig;
    if (!modelConfig) {
      throw new AIError("INVALID_REQUEST", this.id, false, "Model configuration is missing");
    }

    const maxTokens = request.maxTokens ?? modelConfig.maxOutputTokens;
    const temperature = request.temperature ?? 0.2;

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: modelConfig.model,
          messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
          temperature,
          max_tokens: maxTokens
        }),
        signal: request.abortSignal as any
      });

      if (!response.ok) {
        const errText = await response.text();
        const status = response.status;
        
        if (status === 429) {
          throw new AIError("RATE_LIMIT", this.id, true, "Rate limit exceeded on Groq");
        }
        if (status >= 500) {
          throw new AIError("SERVER_ERROR", this.id, true, `Groq Server Error: ${status}`);
        }
        throw new AIError("INVALID_RESPONSE", this.id, false, `Groq request failed with ${status}: ${errText}`);
      }

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content?.trim() || "";
      
      if (content.includes("<think>")) {
        content = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
      }
      
      if (!content) {
        throw new AIError("INVALID_RESPONSE", this.id, true, "Groq returned empty response");
      }
      
      return content;
    } catch (err: any) {
      if (err instanceof AIError) throw err;
      if (err.name === 'AbortError') {
        throw new AIError("TIMEOUT", this.id, true, "Request aborted or timed out");
      }
      throw new AIError("NETWORK_ERROR", this.id, true, `Groq network error: ${err.message}`, err);
    }
  }

  async generateStructured<T>(request: GenerateStructuredRequest<T>): Promise<T> {
    const systemPrompt = `You must respond with valid JSON strictly matching the requested schema. Output ONLY raw JSON, with no code fences or commentary.`;
    
    const augmentedRequest: GenerateTextRequest = {
      ...request,
      messages: [
        { role: "system", content: systemPrompt },
        ...request.messages
      ],
      temperature: request.temperature ?? 0.1
    };

    const raw = await this.generateText(augmentedRequest);

    try {
      const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/\s*```$/, "").trim();
      return JSON.parse(cleaned) as T;
    } catch {
      const jsonMatch = raw.match(/\{[\s\S]*\}/) || raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]) as T;
        } catch {}
      }
      throw new AIError("INVALID_RESPONSE", this.id, true, "Failed to parse structured JSON from Groq response");
    }
  }
}
