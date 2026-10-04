import { logger } from "@interview-ai/logger";

const workerLogger = logger.with({ component: "BackgroundWorker" });

export async function bootstrapWorker() {
  workerLogger.info("Starting Interview AI Background Worker...");

  const shutdown = async (signal: string) => {
    workerLogger.info(`Received ${signal}, shutting down gracefully...`);
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  workerLogger.info("Background Worker initialized and listening for queue jobs.");
}

if (require.main === module) {
  bootstrapWorker().catch((err) => {
    workerLogger.error("Failed to start Background Worker", err);
    process.exit(1);
  });
}
