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

    if (request.task === "INTERVIEW_ANSWER_EVALUATION" || request.task === "INTERVIEW_EVALUATION") {
      return {
        score: 8.5,
        correct: true,
        dimensionScores: {
          technicalAccuracy: 8.5,
          relevance: 8.5,
          completeness: 8.0,
          depth: 8.0,
          problemSolving: 8.5,
          communication: 9.0,
          structure: 8.5,
          confidenceClarity: 8.5,
        },
        evidenceState: {
          technicalAccuracy: "SUPPORTED",
          relevance: "SUPPORTED",
          completeness: "SUPPORTED",
          depth: "SUPPORTED",
          problemSolving: "SUPPORTED",
          communication: "SUPPORTED",
          structure: "SUPPORTED",
          confidenceClarity: "SUPPORTED",
        },
        strengths: ["Strong architectural insight", "Clear multi-tiered caching design"],
        weaknesses: ["Add concrete latency numbers for L1 vs L2 cache"],
        evidence: ["Multi-tiered approach with Redis and PostgreSQL"],
        missingPoints: ["Cache invalidation stamps"],
        feedback: "Excellent structured answer showing production awareness.",
        recommendedAnswer: "Combine local L1 cache with Redis cluster and read replicas.",
        suggestedImprovements: ["Include benchmarks"],
        confidence: 0.9,
      } as any as T;
    }

    if (request.task === "INTERVIEW_FOLLOWUP_GENERATION" || request.task === "INTERVIEW_QUESTION") {
      return {
        questionText: "How do you handle database failover and automated replica promotion under partitioned networks?",
        category: "technical",
        topic: "High Availability",
        difficulty: "hard",
        reason: "Follow-up probing high availability",
        expectedConcepts: ["Quorum", "Split-brain prevention", "Health checks"],
      } as any as T;
    }

    if (request.task === "INTERVIEW_FINAL_REPORT") {
      return {
        overallScore: 8.6,
        dimensionScores: {
          technical: 8.7,
          communication: 8.5,
          problemSolving: 8.8,
          relevance: 8.6,
          completeness: 8.4,
          depth: 8.5,
          structure: 8.6,
          confidence: 8.7,
        },
        strengths: ["Demonstrated deep understanding of distributed architectures and caching"],
        weaknesses: ["Could include more specific latency metrics"],
        technicalGaps: ["Cache stampede mitigation"],
        communicationFeedback: ["Well paced and structured responses"],
        repeatedMistakes: [],
        topicCoverage: {
          coveredTopics: ["Distributed Systems", "High Availability", "Architecture"],
          weakTopics: [],
          strongTopics: ["Distributed Systems"],
          remainingTopics: [],
        },
        questionEvaluations: [],
        recommendedTopics: ["Distributed Consensus", "Raft Protocol"],
        recommendedQuestions: ["Explain how Raft prevents split-brain leaders during network partitions."],
        readinessAssessment: "Ready",
        nextBestActions: ["Review consensus protocols", "Practice system design diagrams"],
        confidence: "HIGH",
      } as any as T;
    }

    return {} as T;
  }
}
