import { LinkedInPostData, DataProvenance } from "../domain/provider.interface";
import { ContentHasher } from "./content.hasher";
import { ProfileNormalizer } from "./profile.normalizer";

export class PostNormalizer {
  static normalize(raw: {
    postId?: string;
    postUrl: string;
    authorName?: string;
    authorHeadline?: string;
    authorProfileUrl?: string;
    authorAvatarUrl?: string;
    publishedAt?: Date | string;
    publishedText?: string;
    mediaUrls?: string[];
    reactionCount?: number;
    commentCount?: number;
    shareCount?: number;
    urn?: string;
    source: DataProvenance["source"];
    sourceProvider: string;
    providerVersion: string;
  }): LinkedInPostData {
    const publishedText = ProfileNormalizer.sanitizeText(raw.publishedText || "");
    const contentHash = ContentHasher.hash(publishedText || raw.postUrl);
    const postId = raw.postId || raw.urn?.replace("urn:li:activity:", "") || ContentHasher.hash(raw.postUrl).slice(0, 16);

    return {
      postId,
      postUrl: raw.postUrl,
      authorName: ProfileNormalizer.sanitizeText(raw.authorName || "LinkedIn Author"),
      authorHeadline: raw.authorHeadline ? ProfileNormalizer.sanitizeText(raw.authorHeadline) : undefined,
      authorProfileUrl: raw.authorProfileUrl?.trim(),
      authorAvatarUrl: raw.authorAvatarUrl?.trim(),
      publishedAt: raw.publishedAt ? new Date(raw.publishedAt) : undefined,
      publishedText,
      mediaUrls: Array.isArray(raw.mediaUrls) ? raw.mediaUrls.filter(Boolean) : [],
      reactionCount: typeof raw.reactionCount === "number" ? Math.max(0, raw.reactionCount) : undefined,
      commentCount: typeof raw.commentCount === "number" ? Math.max(0, raw.commentCount) : undefined,
      shareCount: typeof raw.shareCount === "number" ? Math.max(0, raw.shareCount) : undefined,
      urn: raw.urn,
      provenance: {
        source: raw.source,
        sourceUrl: raw.postUrl,
        sourceProvider: raw.sourceProvider,
        retrievedAt: new Date(),
        contentHash,
        providerVersion: raw.providerVersion,
        isUntrustedExternalContent: true,
      },
    };
  }
}
