import { LinkedInRunner } from "../linkedin.runner";

export interface IMediaResult {
  provider: "pixfaro" | "manual";
  imageUrl?: string;
  prompt: string;
  cost?: string;
  fallback?: boolean;
  message?: string;
}

export interface ILinkedInMediaProvider {
  createIllustration(prompt: string, kind?: string): Promise<IMediaResult>;
  createQuoteCard(text: string, handle?: string, style?: string): Promise<IMediaResult>;
}

export class PixfaroMediaProvider implements ILinkedInMediaProvider {
  async createIllustration(prompt: string, kind: string = "wide"): Promise<IMediaResult> {
    const res = await LinkedInRunner.generateIllustration(prompt, kind);
    const data = res.data || {};
    return {
      provider: "pixfaro",
      imageUrl: data.url,
      prompt,
      cost: data.cost,
      fallback: res.fallback || !data.url,
      message: data.note || (data.url ? "Generated successfully" : "Fallback prompt mode"),
    };
  }

  async createQuoteCard(text: string, handle: string = "@InterviewAI", style: string = "brand"): Promise<IMediaResult> {
    const res = await LinkedInRunner.generateQuoteCard(text, handle, style);
    const data = res.data || {};
    return {
      provider: "pixfaro",
      imageUrl: data.url,
      prompt: text,
      cost: data.cost,
      fallback: res.fallback || !data.url,
      message: data.message || data.note || "Quote card rendered",
    };
  }
}

export class ManualMediaProvider implements ILinkedInMediaProvider {
  async createIllustration(prompt: string): Promise<IMediaResult> {
    return {
      provider: "manual",
      prompt,
      fallback: true,
      message: `Manual image prompt prepared: "${prompt}". Use an external tool (Midjourney, Canva, DALL-E) to create image and paste URL.`,
    };
  }

  async createQuoteCard(text: string, handle: string = "@InterviewAI"): Promise<IMediaResult> {
    return {
      provider: "manual",
      prompt: text,
      fallback: true,
      message: `Create a quote card with handle ${handle} and text: "${text}"`,
    };
  }
}
