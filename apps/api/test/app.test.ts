import assert from "node:assert/strict";
import test from "node:test";

process.env.NODE_ENV = "test";
process.env.PORT = "8787";
process.env.HOST = "127.0.0.1";
process.env.FRONTEND_ORIGIN = "http://localhost:5173,https://pathflow.example.com";
process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
process.env.GEMINI_API_KEY = "test-gemini-api-key";
process.env.GEMINI_PIPELINE_MODEL = "gemini-3.1-flash-lite";
process.env.AI_DAILY_REQUEST_LIMIT = "1";
process.env.OPS_TOKEN = "test-ops-token-123";

const { buildApp } = await import("../src/app.js");
const { resetTestAiUsage, reserveAiUsage } = await import("../src/repositories/aiUsageRepository.js");

test("API contract", async (t) => {
  const app = await buildApp();
  t.after(async () => {
    await app.close();
  });
  t.beforeEach(() => {
    resetTestAiUsage();
  });

  await t.test("GET /health returns service status and configured pipeline model", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/health",
    });

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.json(), {
      status: "ok",
      service: "pathflow-api",
      model: "gemini-3.1-flash-lite",
    });
  });

  await t.test("CORS allows configured frontend origins", async () => {
    const res = await app.inject({
      method: "OPTIONS",
      url: "/health",
      headers: {
        origin: "https://pathflow.example.com",
        "access-control-request-method": "GET",
      },
    });

    assert.equal(res.statusCode, 204);
    assert.equal(res.headers["access-control-allow-origin"], "https://pathflow.example.com");
  });

  await t.test("CORS does not allow unknown frontend origins", async () => {
    const res = await app.inject({
      method: "OPTIONS",
      url: "/health",
      headers: {
        origin: "https://unknown.example.com",
        "access-control-request-method": "GET",
      },
    });

    assert.equal(res.statusCode, 404);
    assert.equal(res.headers["access-control-allow-origin"], undefined);
  });

  await t.test("protected routes return the unified unauthorized error without a bearer token", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/profile",
    });

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.json(), {
      error: {
        code: "unauthorized",
        message: "Unauthorized",
      },
    });
  });

  await t.test("POST /auth/signup validates input before calling Supabase", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: {
        email: "not-an-email",
        password: "short",
        name: "",
      },
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().error.code, "invalid_body");
    assert.match(res.json().error.message, /Invalid email address/);
  });

  await t.test("GET /ops/readiness requires the ops bearer token", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/ops/readiness",
    });

    assert.equal(res.statusCode, 401);
    assert.equal(res.json().error.code, "unauthorized");
  });

  await t.test("GET /ops/readiness returns deploy diagnostics with the ops bearer token", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/ops/readiness",
      headers: {
        authorization: "Bearer test-ops-token-123",
      },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.json().status, "ok");
    assert.deepEqual(res.json().missing, {
      env: [],
      schema: {
        tables: [],
        functions: [],
      },
    });
    assert.equal(res.json().checks.database.reachable, true);
  });

  await t.test("POST /ai/university-bio validates missing university name before model work", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/ai/university-bio",
      headers: {
        authorization: "Bearer test-user-token",
      },
      payload: {
        name: "",
        country: "Singapore",
        city: "Singapore",
      },
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().error.code, "invalid_body");
  });

  await t.test("POST /ai/project-review requires at least a name or description", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/ai/project-review",
      headers: {
        authorization: "Bearer test-user-token",
      },
      payload: {
        name: "",
        description: "",
        link: "",
      },
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().error.code, "project_review_missing_input");
  });

  await t.test("AI routes reject unauthenticated requests before model work", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/ai/project-review",
      payload: {
        name: "Admissions dashboard",
        description: "A small analytics dashboard for applicants.",
      },
    });

    assert.equal(res.statusCode, 401);
    assert.equal(res.json().error.code, "unauthorized");
  });

  await t.test("POST /data/generate is protected before generating MVP objects", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/data/generate",
      payload: {
        kind: "university",
      },
    });

    assert.equal(res.statusCode, 401);
    assert.equal(res.json().error.code, "unauthorized");
  });

  await t.test("POST /data/generate returns MVP workspace objects for authenticated users", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/data/generate",
      headers: {
        authorization: "Bearer test-user-token",
      },
      payload: {
        kind: "university",
      },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.json().objects[0].kind, "university");
    assert.equal(res.json().objects[0].data.name, "National University of Singapore");
  });

  await t.test("AI routes reject authenticated users over the daily request limit before model work", async () => {
    await reserveAiUsage("00000000-0000-4000-8000-000000000001");

    const res = await app.inject({
      method: "POST",
      url: "/ai/project-review",
      headers: {
        authorization: "Bearer test-user-token",
      },
      payload: {
        name: "Admissions dashboard",
        description: "A small analytics dashboard for applicants.",
      },
    });

    assert.equal(res.statusCode, 429);
    assert.equal(res.json().error.code, "ai_daily_limit_exceeded");
  });

  await t.test("POST /workspace/command shares the AI daily request limit", async () => {
    await reserveAiUsage("00000000-0000-4000-8000-000000000001");

    const res = await app.inject({
      method: "POST",
      url: "/workspace/command",
      headers: {
        authorization: "Bearer test-user-token",
      },
      payload: {
        message: "I want to study business in Asia",
      },
    });

    assert.equal(res.statusCode, 429);
    assert.equal(res.json().error.code, "ai_daily_limit_exceeded");
  });

  await t.test("POST /workspace/command is protected before body validation or pipeline work", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/workspace/command",
      payload: {
        message: "I want to study business in Asia",
      },
    });

    assert.equal(res.statusCode, 401);
    assert.equal(res.json().error.code, "unauthorized");
  });
});
