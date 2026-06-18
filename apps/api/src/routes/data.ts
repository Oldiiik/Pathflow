import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { ObjectKindSchema } from "../domain/workspaceSchemas.js";
import { parseBody } from "../lib/validate.js";
import { generateMvpWorkspaceObjects } from "../services/mvpDataService.js";

const GenerateDataRequestSchema = z.object({
  kind: ObjectKindSchema,
});

export const dataRoutes: FastifyPluginAsync = async (app) => {
  app.post("/data/generate", async (request) => {
    await app.requireUser(request);
    const body = parseBody(request, GenerateDataRequestSchema);
    return {
      objects: generateMvpWorkspaceObjects(body.kind),
    };
  });
};
