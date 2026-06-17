import type { FastifyRequest } from "fastify";
import type { z } from "zod";
import { badRequest } from "./httpError.js";

export function parseBody<TSchema extends z.ZodType>(request: FastifyRequest, schema: TSchema): z.infer<TSchema> {
  const parsed = schema.safeParse(request.body);
  if (!parsed.success) {
    throw badRequest(parsed.error.issues.map((issue) => issue.message).join("; "), "invalid_body");
  }
  return parsed.data;
}
