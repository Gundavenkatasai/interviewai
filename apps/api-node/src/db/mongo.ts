import mongoose from "mongoose";
import { FastifyInstance } from "fastify";
import { env } from "../config/env";

export async function connectDB(app: FastifyInstance) {
  try {
    const uri = env.MONGODB_URI;
    const dbName = env.MONGODB_DB_NAME;

    mongoose.set("strictQuery", false);

    await mongoose.connect(uri, {
      dbName,
    });

    app.log.info(`✅ Connected to MongoDB (${dbName})`);
  } catch (error) {
    app.log.error(`❌ MongoDB connection error: ${error}`);
    process.exit(1);
  }

  mongoose.connection.on("disconnected", () => {
    app.log.warn("⚠️ MongoDB disconnected");
  });

  mongoose.connection.on("error", (err) => {
    app.log.error(`❌ MongoDB error: ${err}`);
  });
}
