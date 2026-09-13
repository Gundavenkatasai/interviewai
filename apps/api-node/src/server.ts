import mongoose from "mongoose";
import { buildApp } from "./app";
import { env } from "./config/env";

async function startServer() {
  let app: any;
  try {
    app = await buildApp();

    await app.listen({ port: env.PORT, host: "0.0.0.0" });
    app.log.info(`🚀 Server running at http://localhost:${env.PORT}`);
    app.log.info(`📚 Swagger docs available at http://localhost:${env.PORT}/docs`);
    
    // Start background tasks
    const { OutreachQueue } = require("./modules/outreach/outreach.queue");
    // OutreachQueue.start(); // Disabled temporarily as Redis is not running
    
    const { JobScheduler } = require("./modules/jobs/ingestion/scheduler");
    JobScheduler.start();

    // Graceful Shutdown
    const gracefulShutdown = async (signal: string) => {
      app.log.info(`Received ${signal}, shutting down gracefully...`);
      OutreachQueue.stop();
      const { JobScheduler } = require("./modules/jobs/ingestion/scheduler");
      JobScheduler.stop();
      try {
        await app.close();
        app.log.info('Fastify server closed.');
        await mongoose.connection.close();
        app.log.info('MongoDB connection closed.');
        process.exit(0);
      } catch (err) {
        app.log.error(`Error during shutdown: ${err}`);
        process.exit(1);
      }
    };

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
