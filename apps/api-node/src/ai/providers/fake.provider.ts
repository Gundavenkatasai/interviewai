import { AIProvider, GenerateTextRequest, GenerateStructuredRequest, AIError } from "../core/provider.interface";

export class FakeAIProvider implements AIProvider {
  public id = "fake";
  
  // Test configuration
  public forceTimeout = false;
  public forceRateLimit = false;
  public forceInvalidSchema = false;
  public forceServerError = false;
  public staticResponse: string | any = null;

  async generateText(request: GenerateTextRequest): Promise<string> {
    if (this.forceTimeout) {
      throw new AIError("TIMEOUT", this.id, true, "Fake provider forced timeout");
    }
    if (this.forceRateLimit) {
      throw new AIError("RATE_LIMIT", this.id, true, "Fake provider forced rate limit");
    }
    if (this.forceServerError) {
      throw new AIError("SERVER_ERROR", this.id, true, "Fake provider forced server error");
    }

    if (this.staticResponse !== null) {
      return typeof this.staticResponse === 'string' ? this.staticResponse : JSON.stringify(this.staticResponse);
    }

    return "Fake AI text response for " + request.task;
  }

  async generateStructured<T>(request: GenerateStructuredRequest<T>): Promise<T> {
    if (this.forceTimeout) {
      throw new AIError("TIMEOUT", this.id, true, "Fake provider forced timeout");
    }
    if (this.forceRateLimit) {
      throw new AIError("RATE_LIMIT", this.id, true, "Fake provider forced rate limit");
    }
    if (this.forceServerError) {
      throw new AIError("SERVER_ERROR", this.id, true, "Fake provider forced server error");
    }
    if (this.forceInvalidSchema) {
      return { _invalid: "This does not match the schema" } as any as T;
    }

    if (this.staticResponse !== null) {
      return this.staticResponse as T;
    }

    // Return a default valid-looking structure based on the task
    if (request.task === "RESUME_OPTIMIZATION") {
      return {
        proposals: [
          {
            id: "p1",
            section: "Experience",
            targetId: "0",
            originalText: "original text",
            proposedText: "Engineered robust original text improving latency by 10%.",
            reason: "Mock reason",
            evidence: ["Mock"],
            issueIds: ["mock_issue"],
            unsupportedClaims: [],
            risk: "low"
          }
        ]
      } as any as T;
    }

    if (request.task === "RESUME_ANALYSIS" || request.task === "CAREER_SUMMARY") {
       return {
         healthScore: 85,
         healthStatus: "STRONG",
         summary: {
            coreStrengths: ["Mock"],
            potentialGaps: []
         }
       } as any as T;
    }

    return {} as T;
  }
}
