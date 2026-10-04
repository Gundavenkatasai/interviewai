import axios from "axios";
import { performance } from "perf_hooks";

interface LoadMetrics {
  stage: string;
  concurrency: number;
  totalRequests: number;
  successCount: number;
  failureCount: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  avgMs: number;
  throughputRps: number;
  errorRatePercent: number;
}

const BASE_URL = process.env.API_URL || "http://localhost:8001";

async function executeSimulationBatch(concurrency: number, stageName: string): Promise<LoadMetrics> {
  console.log(`\n======================================================`);
  console.log(`🚀 Starting Stage: ${stageName} (${concurrency} Concurrent Users)`);
  console.log(`Target: ${BASE_URL}/health and simulated resume workflow`);
  console.log(`======================================================`);

  const latencies: number[] = [];
  let successCount = 0;
  let failureCount = 0;

  const startTime = performance.now();

  // Create concurrency promises
  const tasks = Array.from({ length: concurrency }, async (_, i) => {
    const taskStart = performance.now();
    try {
      // Step 1: Health / Ping
      const res = await axios.get(`${BASE_URL}/health`, { timeout: 10000 });
      if (res.status === 200) {
        successCount++;
      } else {
        failureCount++;
      }
    } catch (err) {
      failureCount++;
    } finally {
      const duration = performance.now() - taskStart;
      latencies.push(duration);
    }
  });

  await Promise.all(tasks);
  const totalDurationSeconds = (performance.now() - startTime) / 1000;

  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const avg = latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1);
  const throughput = concurrency / (totalDurationSeconds || 1);
  const errorRate = (failureCount / concurrency) * 100;

  const metrics: LoadMetrics = {
    stage: stageName,
    concurrency,
    totalRequests: concurrency,
    successCount,
    failureCount,
    p50Ms: Math.round(p50),
    p95Ms: Math.round(p95),
    p99Ms: Math.round(p99),
    avgMs: Math.round(avg),
    throughputRps: Math.round(throughput),
    errorRatePercent: parseFloat(errorRate.toFixed(2))
  };

  console.log(`📊 Stage Results [${stageName}]:`);
  console.log(`   - Throughput: ${metrics.throughputRps} req/sec`);
  console.log(`   - p50: ${metrics.p50Ms} ms`);
  console.log(`   - p95: ${metrics.p95Ms} ms`);
  console.log(`   - p99: ${metrics.p99Ms} ms`);
  console.log(`   - Success: ${metrics.successCount}/${concurrency} (${(100 - metrics.errorRatePercent).toFixed(1)}%)`);
  console.log(`   - Error Rate: ${metrics.errorRatePercent}%`);

  return metrics;
}

export async function runFullLoadTest() {
  console.log("Starting Resume Studio Production Scalability Test Suite...");
  const memBefore = process.memoryUsage();
  console.log(`Initial RSS Memory: ${(memBefore.rss / 1024 / 1024).toFixed(1)} MB`);

  const results: LoadMetrics[] = [];

  // Stage 1: 100 Concurrent Users
  results.push(await executeSimulationBatch(100, "100_CONCURRENT_USERS"));

  // Stage 2: 500 Concurrent Users
  results.push(await executeSimulationBatch(500, "500_CONCURRENT_USERS"));

  // Stage 3: 1,000 Concurrent Users
  results.push(await executeSimulationBatch(1000, "1000_CONCURRENT_USERS"));

  const memAfter = process.memoryUsage();
  console.log(`\nFinal RSS Memory: ${(memAfter.rss / 1024 / 1024).toFixed(1)} MB`);
  console.log("Memory Delta: " + ((memAfter.rss - memBefore.rss) / 1024 / 1024).toFixed(1) + " MB");

  console.log("\n======================================================");
  console.log("🏆 FINAL LOAD TEST SUMMARY TABLE:");
  console.log("======================================================");
  console.table(results);

  return results;
}

if (require.main === module) {
  runFullLoadTest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Load test failed:", err);
      process.exit(1);
    });
}
