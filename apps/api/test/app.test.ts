import assert from "node:assert/strict";
import test from "node:test";

process.env.NODE_ENV = "test";
process.env.PORT = "8787";
process.env.HOST = "127.0.0.1";
process.env.FRONTEND_ORIGIN = "http://localhost:5173";
process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
process.env.GEMINI_PIPELINE_MODEL = "gemini-3.1-flash-lite";

const { buildApp } = await import("../src/app.js");

test("API contract", async (t) => {
  const app = await buildApp();
  t.after(async () => {
    await app.close();
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

  await t.test("POST /ai/university-bio validates missing university name before model work", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/ai/university-bio",
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
      payload: {
        name: "",
        description: "",
        link: "",
      },
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().error.code, "project_review_missing_input");
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
