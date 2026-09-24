import { LinkedInRunner } from "../linkedin.runner";

export interface ILinkedInPostData {
  url: string;
  authorName?: string;
  authorHeadline?: string;
  postText: string;
  likesCount?: number;
  commentsCount?: number;
  repostsCount?: number;
  publishedAt?: string;
  shareUrn?: string;
  urn?: string;
  isUntrusted: boolean;
}

export interface ILinkedInReadProvider {
  fetchPost(url: string, token?: string): Promise<ILinkedInPostData>;
  fetchComments(url: string, token?: string): Promise<any[]>;
  fetchEngagers(url: string, token?: string): Promise<any[]>;
}

export class ApifyReadProvider implements ILinkedInReadProvider {
  async fetchPost(url: string, token?: string): Promise<ILinkedInPostData> {
    const bridgeResult = await LinkedInRunner.fetchPost(url);
    if (!bridgeResult.success) {
      throw new Error(bridgeResult.error || "Apify failed to fetch post");
    }
    const data = bridgeResult.data || {};
    return {
      url,
      authorName: data.authorName || data.author || "Unknown Author",
      authorHeadline: data.authorHeadline || "",
      postText: data.text || data.content || "",
      likesCount: data.likes || data.numLikes || 0,
      commentsCount: data.comments || data.numComments || 0,
      repostsCount: data.reposts || data.numShares || 0,
      publishedAt: data.postedAt || data.postedAtISO || new Date().toISOString(),
      shareUrn: data.shareUrn || data.urn,
      urn: data.urn,
      isUntrusted: true, // Untrusted external data isolation
    };
  }

  async fetchComments(url: string, token?: string): Promise<any[]> {
    try {
      const res = await LinkedInRunner.fetchComments(url, 20);
      return res.data || [];
    } catch {
      return [];
    }
  }

  async fetchEngagers(url: string, token?: string): Promise<any[]> {
    try {
      const res = await LinkedInRunner.fetchEngagers(url, 50);
      return res.data || [];
    } catch {
      return [];
    }
  }
}

export class ManualReadProvider implements ILinkedInReadProvider {
  async fetchPost(url: string): Promise<ILinkedInPostData> {
    return {
      url,
      postText: "",
      isUntrusted: true,
    };
  }

  async fetchComments(url: string): Promise<any[]> {
    return [];
  }

  async fetchEngagers(url: string): Promise<any[]> {
    return [];
  }
}
