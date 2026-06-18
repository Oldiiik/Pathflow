import fp from "fastify-plugin";
import { createClient, type User } from "@supabase/supabase-js";
import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import { env } from "../config/env.js";
import { unauthorized } from "../lib/httpError.js";

declare module "fastify" {
  interface FastifyRequest {
    user: User | null;
  }
}

function bearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export const authPlugin: FastifyPluginAsync = fp(async (app) => {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  app.decorateRequest("user", null);

  app.decorate("requireUser", async (request: FastifyRequest) => {
    const token = bearerToken(request);
    if (!token) throw unauthorized();

    if (env.NODE_ENV === "test" && token === "test-user-token") {
      const user = {
        id: "00000000-0000-4000-8000-000000000001",
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
        created_at: new Date(0).toISOString(),
      } as User;
      request.user = user;
      return user;
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) throw unauthorized();

    request.user = data.user;
    return data.user;
  });
});

declare module "fastify" {
  interface FastifyInstance {
    requireUser(request: FastifyRequest): Promise<User>;
  }
}
