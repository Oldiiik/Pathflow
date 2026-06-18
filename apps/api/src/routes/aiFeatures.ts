import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import {
  ProjectReviewRequestSchema,
  UniversityBioRequestSchema,
} from "../domain/aiFeatureSchemas.js";
import { badRequest } from "../lib/httpError.js";
import { parseBody } from "../lib/validate.js";
import { generateUniversityBio } from "../ai/pipelines/universityBioPipeline.js";
import { reviewProject } from "../ai/pipelines/projectReviewPipeline.js";
import { reserveAiUsage } from "../repositories/aiUsageRepository.js";
import { logPipelineRun } from "../repositories/workspaceRepository.js";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function bestEffortLog(app: FastifyInstance, input: Parameters<typeof logPipelineRun>[0]) {
  try {
    await logPipelineRun(input);
  } catch (error) {
    app.log.warn({ err: error }, "Failed to record AI pipeline run");
  }
}

export const aiFeatureRoutes: FastifyPluginAsync = async (app) => {
  app.post("/ai/university-bio", async (request) => {
    const user = await app.requireUser(request);
    const body = parseBody(request, UniversityBioRequestSchema);
    const start = Date.now();
    await reserveAiUsage(user.id);

    try {
      const result = await generateUniversityBio(body);
      const response = { bio: result.bio, model: result.model };
      await bestEffortLog(app, {
        userId: user.id,
        pipeline: "university_bio",
        model: result.model,
        usedFallback: false,
        status: "ok",
        request: body,
        response,
        latencyMs: Date.now() - start,
      });
      return response;
    } catch (error) {
      await bestEffortLog(app, {
        userId: user.id,
        pipeline: "university_bio",
        model: null,
        usedFallback: false,
        status: "error",
        request: body,
        response: {},
        latencyMs: Date.now() - start,
        errorMessage: errorMessage(error),
      });
      throw error;
    }
  });

  app.post("/ai/project-review", async (request) => {
    const user = await app.requireUser(request);
    const body = parseBody(request, ProjectReviewRequestSchema);
    if (!body.name && !body.description) {
      throw badRequest("Describe the project so it can be reviewed.", "project_review_missing_input");
    }

    const start = Date.now();
    await reserveAiUsage(user.id);

    try {
      const result = await reviewProject(body);
      const response = { review: result.review, model: result.model };
      await bestEffortLog(app, {
        userId: user.id,
        pipeline: "project_review",
        model: result.model,
        usedFallback: false,
        status: "ok",
        request: body,
        response,
        latencyMs: Date.now() - start,
      });
      return response;
    } catch (error) {
      await bestEffortLog(app, {
        userId: user.id,
        pipeline: "project_review",
        model: null,
        usedFallback: false,
        status: "error",
        request: body,
        response: {},
        latencyMs: Date.now() - start,
        errorMessage: errorMessage(error),
      });
      throw error;
    }
  });
};
