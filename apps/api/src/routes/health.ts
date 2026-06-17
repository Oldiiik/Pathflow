import type { FastifyPluginAsync } from "fastify";
import { env } from "../config/env.js";

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/health", async () => ({
    status: "ok",
    service: "pathflow-api",
    model: env.GEMINI_PIPELINE_MODEL,
  }));
};
