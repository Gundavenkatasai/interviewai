export * from "./core/provider.interface";
export * from "./core/errors";
export * from "./core/capability.registry";
export * from "./core/provider.registry";

export * from "./providers/public/public.guest.provider";
export * from "./providers/manual/manual.input.provider";
export * from "./providers/imported/imported.data.provider";
export * from "./providers/playwright/playwright.provider";
export * from "./providers/playwright/browser.service";

export * from "./deduplication/url.normalizer";
export * from "./deduplication/content.hasher";
export * from "./normalization/profile.normalizer";
export * from "./normalization/post.normalizer";
export * from "./normalization/job.normalizer";
export * from "./caching/snapshot.cache";

export * from "./profile/profile.scorer";
export * from "./content/hook.generator";
export * from "./content/humanizer";
export * from "./content/post.analyzer";

// Automatically register default providers into registry
import { ProviderRegistry } from "./core/provider.registry";
import { PublicGuestProvider } from "./providers/public/public.guest.provider";
import { ManualInputProvider } from "./providers/manual/manual.input.provider";
import { ImportedDataProvider } from "./providers/imported/imported.data.provider";
import { PlaywrightProvider } from "./providers/playwright/playwright.provider";

ProviderRegistry.register(new PublicGuestProvider());
ProviderRegistry.register(new ManualInputProvider());
ProviderRegistry.register(new ImportedDataProvider());
ProviderRegistry.register(new PlaywrightProvider());
