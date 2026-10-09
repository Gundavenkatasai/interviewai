# LinkedIn Provider Architecture

## 1. Provider Abstraction & Registry
The LinkedIn subsystem employs an extensible Provider Pattern to completely decouple external data fetching mechanisms from domain logic. Providers must implement the `ILinkedInDataProvider` interface:

```typescript
export interface ILinkedInDataProvider {
  readonly name: string;
  readonly version: string;
  readonly capabilities: ProviderCapabilities;

  scrapeProfile?(url: string): Promise<ProviderResult<LinkedInProfileData>>;
  scrapePosts?(authorUrl: string, maxPosts?: number): Promise<ProviderResult<LinkedInPostData[]>>;
  searchJobs?(query: JobSearchQuery): Promise<ProviderResult<LinkedInJobData[]>>;
  scrapeCompany?(companyUrl: string): Promise<ProviderResult<LinkedInCompanyData>>;
  checkHealth?(): Promise<ProviderHealthStatus>;
}
```

---

## 2. Capability Declarations
Every provider must explicitly declare its supported operations via `ProviderCapabilities`:

| Provider | Supports Profile | Supports Posts | Supports Jobs | Supports Companies | Supports Search | Notes |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| `public_guest` | **Yes** | No | **Yes** | **Yes** | **Yes** | Cheerio HTTP parsing; zero credentials required. |
| `playwright_browser` | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | Headless Chromium instance; bounded concurrency. |
| `manual_input` | **Yes** | **Yes** | No | No | No | Air-gapped fallback for manual pasted text. |
| `imported` | **Yes** | No | No | No | No | Processes user-supplied JSON or LinkedIn archives. |

UI components query the `CapabilityRegistry` to dynamically enable or disable features based on the active provider.

---

## 3. Circuit Breaker & Reliability Engineering
The `ProviderRegistry` maintains telemetry and health metrics for every registered provider:
- **Consecutive Failure Threshold**: 5 failures before circuit trips to `OPEN`.
- **Reset Timeout**: 60 seconds cool-down period before entering `HALF_OPEN`.
- **Latency Tracking**: Rolling average latency (exponential moving average).
- **Graceful Fallbacks**: When a network provider encounters an `AuthWallError` or `RateLimitError`, the system gracefully prompts the user to switch to `manual_input` or view cached snapshots.
