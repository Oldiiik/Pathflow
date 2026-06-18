import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../../.env") });

function parseOrigins(value: string) {
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8787),
  HOST: z.string().default("127.0.0.1"),
  FRONTEND_ORIGIN: z
    .string()
    .default("http://localhost:5173")
    .transform((value, ctx) => {
      const origins = parseOrigins(value);
      if (!origins.length) {
        ctx.addIssue({
          code: "custom",
          message: "FRONTEND_ORIGIN must include at least one URL.",
        });
        return z.NEVER;
      }

      for (const origin of origins) {
        const parsed = z.string().url().safeParse(origin);
        if (!parsed.success) {
          ctx.addIssue({
            code: "custom",
            message: `Invalid FRONTEND_ORIGIN URL: ${origin}`,
          });
          return z.NEVER;
        }
      }

      return origins;
    }),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_PIPELINE_MODEL: z.string().min(1).default("gemini-3.1-flash-lite"),
  AI_DAILY_REQUEST_LIMIT: z.coerce.number().int().positive().default(40),
  OPS_TOKEN: z.string().min(16).optional(),
});

export const env = EnvSchema.parse(process.env);

export type Env = typeof env;
