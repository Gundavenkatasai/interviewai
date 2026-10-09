import { ProviderCapabilities, ILinkedInDataProvider } from "./provider.interface";

export class CapabilityRegistry {
  /**
   * Asserts whether a provider explicitly supports a specific feature
   */
  static assertSupport(
    provider: ILinkedInDataProvider,
    feature: keyof ProviderCapabilities
  ): void {
    if (!provider.capabilities[feature]) {
      throw new Error(
        `LinkedIn provider "${provider.name}" does not support capability: ${feature}. Choose a capable provider.`
      );
    }
  }

  /**
   * Filters a list of providers by required capability
   */
  static filterByCapability(
    providers: ILinkedInDataProvider[],
    feature: keyof ProviderCapabilities
  ): ILinkedInDataProvider[] {
    return providers.filter((p) => Boolean(p.capabilities[feature]));
  }
}
