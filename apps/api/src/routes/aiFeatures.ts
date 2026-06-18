import type { FastifyPluginAsync } from "fastify";
import {
  ProjectReviewRequestSchema,
  UniversityBioRequestSchema,
} from "../domain/aiFeatureSchemas.js";
import { badRequest } from "../lib/httpError.js";
import { parseBody } from "../lib/validate.js";
import { generateUniversityBio } from "../ai/pipelines/universityBioPipeline.js";
import { reviewProject } from "../ai/pipelines/projectReviewPipeline.js";

export const aiFeatureRoutes: FastifyPluginAsync = async (app) => {
  app.post("/ai/university-bio", async (request) => {
    const body = parseBody(request, UniversityBioRequestSchema);
    const result = await generateUniversityBio(body);
    return { bio: result.bio, model: result.model };
  });

  app.post("/ai/project-review", async (request) => {
    const body = parseBody(request, ProjectReviewRequestSchema);
    if (!body.name && !body.description) {
      throw badRequest("Describe the project so it can be reviewed.", "project_review_missing_input");
    }

    const result = await reviewProject(body);
    return { review: result.review, model: result.model };
  });
};
