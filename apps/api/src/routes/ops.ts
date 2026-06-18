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

export const opsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/ops/readiness", async (request) => {
    requireOpsToken(request);

    const checks = {
      env: {
        geminiApiKey: Boolean(env.GEMINI_API_KEY),
        opsToken: Boolean(env.OPS_TOKEN),
      },
      schema: null as Awaited<ReturnType<typeof loadBackendReadinessSchema>> | null,
      database: {
        reachable: false,
      },
    };

    try {
      checks.schema = await loadBackendReadinessSchema();
      checks.database.reachable = true;
    } catch {
      return {
        status: "degraded",
        checks,
      };
    }

    const schemaOk = allTrue(checks.schema.tables) && allTrue(checks.schema.functions);
    return {
      status: checks.env.geminiApiKey && schemaOk ? "ok" : "degraded",
      checks,
    };
  });
};
