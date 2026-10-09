import {
  ILinkedInDataProvider,
  ProviderCapabilities,
  ProviderResult,
  LinkedInProfileData,
  ProviderHealthStatus,
} from "../../core/provider.interface";
import { ProfileNormalizer } from "../../normalization/profile.normalizer";
import { ContentHasher } from "../../deduplication/content.hasher";

export class ImportedDataProvider implements ILinkedInDataProvider {
  readonly name = "imported";
  readonly version = "2.0.0";
  readonly capabilities: ProviderCapabilities = {
    supportsProfile: true,
    supportsPosts: false,
    supportsJobs: false,
    supportsCompanies: false,
    supportsEngagement: false,
    supportsSearch: false,
  };

  /**
   * Ingests JSON exported data or candidate resume structures
   */
  async ingestProfileJson(
    data: Record<string, any>,
    canonicalUrl: string = "https://www.linkedin.com/in/imported/"
  ): Promise<ProviderResult<LinkedInProfileData>> {
    const startTime = Date.now();

    const normalized = ProfileNormalizer.normalize({
      canonicalUrl,
      fullName: data.fullName || data.name,
      headline: data.headline || data.title,
      location: data.location,
      about: data.about || data.summary,
      photoUrl: data.photoUrl,
      experience: Array.isArray(data.experience) ? data.experience : [],
      education: Array.isArray(data.education) ? data.education : [],
      skills: Array.isArray(data.skills) ? data.skills : [],
      certifications: Array.isArray(data.certifications) ? data.certifications : [],
      projects: Array.isArray(data.projects) ? data.projects : [],
      rawText: JSON.stringify(data),
      source: "imported",
      sourceProvider: this.name,
      providerVersion: this.version,
    });

    return {
      success: true,
      data: normalized,
      latencyMs: Date.now() - startTime,
      provenance: normalized.provenance,
    };
  }

  async fetchProfile(url: string): Promise<ProviderResult<LinkedInProfileData>> {
    return this.ingestProfileJson({}, url);
  }

  async checkHealth(): Promise<ProviderHealthStatus> {
    return {
      providerName: this.name,
      isHealthy: true,
      lastChecked: new Date(),
      latencyMs: 1,
      successRate24h: 1.0,
      activeCircuitBreaker: false,
      capabilities: this.capabilities,
      statusMessage: "Imported data provider operational.",
    };
  }
}
