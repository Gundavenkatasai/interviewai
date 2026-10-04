import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(8001),
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/applyhustle"),
  MONGODB_DB_NAME: z.string().default("applyhustle"),
  JWT_SECRET: z.string().min(16).default("super_secret_jwt_key_interviewai_production_safe"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  GROQ_API_KEY: z.string().optional().default(""),
  OPENAI_API_KEY: z.string().optional().default(""),
  QWEN_API_KEY: z.string().optional().default(""),
  REDIS_URL: z.string().optional().default("redis://127.0.0.1:6379"),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

export function loadConfig(): EnvConfig {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment variables:", result.error.format());
    throw new Error("Invalid environment configuration.");
  }
  return result.data;
}

export const env = loadConfig();
