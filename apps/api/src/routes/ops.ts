import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import { env } from "../config/env.js";
import { HttpError, unauthorized } from "../lib/httpError.js";
import { loadBackendReadinessSchema } from "../repositories/readinessRepository.js";

function bearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

function requireOpsToken(request: FastifyRequest) {
  if (!env.OPS_TOKEN) {
    if (env.NODE_ENV === "production") {
      throw new HttpError(503, "ops_token_not_configured", "Operational diagnostics are not configured.");
    }
    return;
  }

  if (bearerToken(request) !== env.OPS_TOKEN) {
    throw unauthorized();
  }
}

function allTrue(record: Record<string, boolean>) {
  return Object.values(record).every(Boolean);
}

function falseKeys(record: Record<string, boolean>) {
  return Object.entries(record)
    .filter(([, ok]) => !ok)
    .map(([key]) => key);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export const opsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/ops/readiness", async (request) => {
    requireOpsToken(request);
    const envChecks = {
      geminiApiKey: Boolean(env.GEMINI_API_KEY),
      opsToken: Boolean(env.OPS_TOKEN),
    };

    const checks = {
      env: envChecks,
      schema: null as Awaited<ReturnType<typeof loadBackendReadinessSchema>> | null,
      database: {
        reachable: false,
        error: null as string | null,
      },
    };

    try {
      checks.schema = await loadBackendReadinessSchema();
      checks.database.reachable = true;
    } catch (error) {
      checks.database.error = errorMessage(error);
      return {
        status: "degraded",
        checks,
        missing: {
          env: falseKeys(envChecks),
          schema: {
            tables: [] as string[],
            functions: [] as string[],
          },
        },
      };
    }

    const schemaOk = allTrue(checks.schema.tables) && allTrue(checks.schema.functions);
    return {
      status: checks.env.geminiApiKey && checks.env.opsToken && schemaOk ? "ok" : "degraded",
      checks,
      missing: {
        env: falseKeys(checks.env),
        schema: {
          tables: falseKeys(checks.schema.tables),
          functions: falseKeys(checks.schema.functions),
        },
      },
    };
  });
};
