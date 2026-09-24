import { LinkedInRunner } from "../linkedin.runner";

export interface IPublishResult {
  mode: "publora" | "manual" | "diy";
  postGroupId?: string;
  url?: string;
  copyReadyText?: string;
  message?: string;
  scheduledTime?: string;
  publishedAt?: string;
}

export interface ILinkedInPublishProvider {
  publishPost(params: {
    kind: "post" | "comment" | "reply" | "reshare";
    draftText: string;
    targetUrl: string;
    platformId?: string;
    scheduledTime?: string;
    mediaUrls?: string[];
  }): Promise<IPublishResult>;
  cancelPublication(postGroupId: string): Promise<any>;
}

export class PubloraPublishProvider implements ILinkedInPublishProvider {
  async publishPost(params: {
    kind: "post" | "comment" | "reply" | "reshare";
    draftText: string;
    targetUrl: string;
    platformId?: string;
    scheduledTime?: string;
    mediaUrls?: string[];
  }): Promise<IPublishResult> {
    const res = await LinkedInRunner.publishContent(params);
    if (!res.success) {
      throw new Error(res.error || "Publora publication failed");
    }
    const data = res.data || {};
    return {
      mode: data.mode || "publora",
      postGroupId: data.postGroupId || data.id,
      url: data.url || params.targetUrl,
      message: data.message || "Post published or scheduled via Publora",
      scheduledTime: params.scheduledTime,
      publishedAt: new Date().toISOString(),
    };
  }

  async cancelPublication(postGroupId: string): Promise<any> {
    return LinkedInRunner.unpublish(postGroupId);
  }
}

export class ManualPublishProvider implements ILinkedInPublishProvider {
  async publishPost(params: {
    kind: "post" | "comment" | "reply" | "reshare";
    draftText: string;
    targetUrl: string;
  }): Promise<IPublishResult> {
    const res = await LinkedInRunner.publishContent({
      kind: params.kind,
      targetUrl: params.targetUrl,
      draftText: params.draftText,
    });
    const data = res.data || {};
    return {
      mode: "manual",
      copyReadyText: params.draftText,
      url: params.targetUrl,
      message: data.message || `Ready for manual publishing. Copy text to ${params.targetUrl}`,
    };
  }

  async cancelPublication(): Promise<any> {
    return { success: true, mode: "manual", message: "Draft marked as unapproved" };
  }
}
