export * from "./domain/provider.interface";
export * from "./domain/errors";
export * from "./domain/profile.scorer";
export * from "./domain/hook.generator";
export * from "./domain/humanizer";
export * from "./domain/post.analyzer";

export * from "./infrastructure/capability.registry";
export * from "./infrastructure/provider.registry";
export * from "./infrastructure/snapshot.cache";
export * from "./infrastructure/url.normalizer";
export * from "./infrastructure/content.hasher";
export * from "./infrastructure/profile.normalizer";
export * from "./infrastructure/post.normalizer";
export * from "./infrastructure/job.normalizer";

export * from "./infrastructure/providers/public/public.guest.provider";
export * from "./infrastructure/providers/manual/manual.input.provider";
export * from "./infrastructure/providers/imported/imported.data.provider";
export * from "./infrastructure/providers/playwright/playwright.provider";
export * from "./infrastructure/providers/playwright/browser.service";

// Automatically register default providers into registry
import { ProviderRegistry } from "./infrastructure/provider.registry";
import { PublicGuestProvider } from "./infrastructure/providers/public/public.guest.provider";
import { ManualInputProvider } from "./infrastructure/providers/manual/manual.input.provider";
import { ImportedDataProvider } from "./infrastructure/providers/imported/imported.data.provider";
import { PlaywrightProvider } from "./infrastructure/providers/playwright/playwright.provider";

ProviderRegistry.register(new PublicGuestProvider());
ProviderRegistry.register(new ManualInputProvider());
ProviderRegistry.register(new ImportedDataProvider());
ProviderRegistry.register(new PlaywrightProvider());
