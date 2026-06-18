import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8787),
  HOST: z.string().default("127.0.0.1"),
  FRONTEND_ORIGIN: z.string().url().default("http://localhost:5173"),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_PIPELINE_MODEL: z.string().min(1).default("gemini-3.1-flash-lite"),
  AI_DAILY_REQUEST_LIMIT: z.coerce.number().int().positive().default(40),
  OPS_TOKEN: z.string().min(16).optional(),
});

export const env = EnvSchema.parse(process.env);

export type Env = typeof env;
