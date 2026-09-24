import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const isProd = process.env.NODE_ENV === "production";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("3000").transform((val) => parseInt(val, 10)),
  MONGODB_URI: z.string().default(isProd ? "" : "mongodb://localhost:27017").refine(val => val !== "", { message: "MONGODB_URI is required in production" }),
  MONGODB_DB_NAME: z.string().default("applyhustle"),
  JWT_SECRET: z.string().default(isProd ? "" : "super_secret_jwt_key_change_in_production").refine(val => val !== "", { message: "JWT_SECRET is required in production" }),
  JWT_EXPIRES_IN: z.string().default("7d"),
  FRONTEND_URL: z.string().default(isProd ? "" : "http://localhost:5173").refine(val => val !== "", { message: "FRONTEND_URL is required in production" }),
  QWEN_BASE_URL: z.string().optional(),
  QWEN_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  APIFY_TOKEN: z.string().optional(),
  REDIS_URL: z.string().optional()
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  process.exit(1);
}

export const env = _env.data;
