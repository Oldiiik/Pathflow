import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { ObjectKindSchema } from "../domain/workspaceSchemas.js";
import { parseBody } from "../lib/validate.js";
import { appendWorkspaceObjects } from "../repositories/workspaceRepository.js";
import { generateMvpWorkspaceObjects } from "../services/mvpDataService.js";

const GenerateDataRequestSchema = z.object({
  kind: ObjectKindSchema,
});

export const dataRoutes: FastifyPluginAsync = async (app) => {
  app.post("/data/generate", async (request) => {
    const user = await app.requireUser(request);
    const body = parseBody(request, GenerateDataRequestSchema);
    const objects = generateMvpWorkspaceObjects(body.kind);
    await appendWorkspaceObjects({ userId: user.id, objects });
    return {
      objects,
    };
  });
};
