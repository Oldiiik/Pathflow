import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { ZodError } from "zod";
import { env } from "./config/env.js";
import { HttpError } from "./lib/httpError.js";
import { authPlugin } from "./plugins/auth.js";
import { accountRoutes } from "./routes/account.js";
import { healthRoutes } from "./routes/health.js";
import { workspaceRoutes } from "./routes/workspace.js";

export async function buildApp() {
  const app = Fastify({
    logger:
      env.NODE_ENV === "test"
        ? false
        : {
            level: env.NODE_ENV === "production" ? "info" : "debug",
          },
    bodyLimit: 512 * 1024,
  });

  await app.register(cors, {
    origin: env.FRONTEND_ORIGIN,
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute",
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof HttpError) {
      request.log.warn(error);
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    if (error instanceof ZodError) {
      request.log.warn(error);
      return reply.status(400).send({
        error: {
          code: "validation_error",
          message: error.issues.map((issue) => issue.message).join("; "),
        },
      });
    }

    request.log.error(error);
    return reply.status(500).send({
      error: {
        code: "internal_error",
        message: "Internal server error",
      },
    });
  });

  await app.register(authPlugin);
  await app.register(healthRoutes);
  await app.register(accountRoutes);
  await app.register(workspaceRoutes);

  return app;
}
