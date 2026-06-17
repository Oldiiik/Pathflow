import type { FastifyPluginAsync } from "fastify";
import { SignUpRequestSchema, UpdateProfileRequestSchema } from "../domain/profileSchemas.js";
import { parseBody } from "../lib/validate.js";
import {
  createAuthUserWithProfile,
  getProfile,
  upsertProfile,
} from "../repositories/profileRepository.js";

export const accountRoutes: FastifyPluginAsync = async (app) => {
  app.post("/auth/signup", async (request) => {
    const body = parseBody(request, SignUpRequestSchema);
    const result = await createAuthUserWithProfile(body);
    return { ok: true, userId: result.userId };
  });

  app.get("/profile", async (request) => {
    const user = await app.requireUser(request);
    const profile = await getProfile(user.id);
    return { profile };
  });

  app.put("/profile", async (request) => {
    const user = await app.requireUser(request);
    const body = parseBody(request, UpdateProfileRequestSchema);
    const profile = await upsertProfile(user.id, body);
    return { profile };
  });
};
