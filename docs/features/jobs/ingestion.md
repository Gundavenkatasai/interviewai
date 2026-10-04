# Ingestion Pipeline Specification

## Pipeline Flow
```
External Source -> Adapter -> Ingestion Pipeline -> Normalizer -> Deduplicator -> MongoDB Storage
```

1. **Scheduled Triggers**: Background worker executes hourly batches via `JobScheduler`.
2. **Backpressure & Concurrency Bounds**: Adapters are bounded to prevent third-party rate limits and local system exhaustion.
3. **India Geography Filter**: Postings are verified against standard Indian tech hubs (Bengaluru, Mumbai, Pune, Hyderabad, Delhi NCR, Chennai, Kolkata, Ahmedabad) or verified India-remote status.
4. **Freshness Verification**: Real timestamps extracted from source postings are validated. Jobs with unverified dates are marked with approximate confidence indicators rather than fabricated dates.
5. **Telemetry & Run Tracking**: Every run logs:
   - `jobsFetched`
   - `jobsAccepted`
   - `jobsRejected`
   - `duplicatesFound`
   - `durationMs`
   - `errorDetails`
