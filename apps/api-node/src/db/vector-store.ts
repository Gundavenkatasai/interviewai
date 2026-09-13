import { ResumeChunk } from "../modules/resume/resume.model";

export interface VectorSearchResult {
  chunk: any;
  score: number;
}

export abstract class VectorStore {
  abstract addChunk(chunk: any, embedding: number[]): Promise<void>;
  abstract search(queryEmbedding: number[], limit: number, filter?: any): Promise<VectorSearchResult[]>;
}

export class LocalFallbackVectorStore extends VectorStore {
  async addChunk(chunk: any, embedding: number[]): Promise<void> {
    // In local fallback, the chunk is already saved to Mongo via standard operations.
    // We just assume embedding is stored as an array on the document.
  }

  async search(queryEmbedding: number[], limit: number = 5, filter: any = {}): Promise<VectorSearchResult[]> {
    // Basic in-memory cosine similarity search (fallback when Atlas is unavailable)
    const chunks = await ResumeChunk.find(filter).lean();
    
    const results = chunks
      .filter((c: any) => c.embedding && c.embedding.length > 0)
      .map((c: any) => {
        const score = this.cosineSimilarity(queryEmbedding, c.embedding as number[]);
        return { chunk: c, score };
      })
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, limit);

    return results;
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

// In production with Atlas, we would use an AtlasVectorStore implementation.
// For now, we export the local fallback as default.
export const vectorStore = new LocalFallbackVectorStore();
