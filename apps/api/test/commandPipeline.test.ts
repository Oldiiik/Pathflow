import assert from "node:assert/strict";
import test from "node:test";

process.env.NODE_ENV = "test";
process.env.PORT = "8787";
process.env.HOST = "127.0.0.1";
process.env.FRONTEND_ORIGIN = "http://localhost:5173";
process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
process.env.GEMINI_PIPELINE_MODEL = "gemini-3.1-flash-lite";
delete process.env.GEMINI_API_KEY;

const { runCommandPipeline } = await import("../src/ai/pipelines/commandPipeline.js");

test("command pipeline fallback", async (t) => {
  await t.test("routes a rich admissions message to multiple workspace tools", async () => {
    const result = await runCommandPipeline({
      message:
        "I want to study business analytics in Asia, I don't like olympiads, and I have hackathon projects.",
    });

    const kinds = result.tools.map((tool) => tool.kind);

    assert.equal(result.usedFallback, true);
    assert.equal(result.model, null);
    assert.ok(kinds.includes("university"));
    assert.ok(kinds.includes("majorFit"));
    assert.ok(kinds.includes("portfolio"));
    assert.deepEqual(Object.keys(result.memoryPatch).sort(), ["avoidedPaths", "goals"]);
    assert.deepEqual(result.memoryPatch.avoidedPaths, ["Olympiads"]);
    assert.deepEqual(result.memoryPatch.goals, ["Study business analytics in Asia"]);
  });

  await t.test("uses major fit as the default route for vague messages", async () => {
    const result = await runCommandPipeline({
      message: "I am not sure what to do next.",
    });

    assert.equal(result.usedFallback, true);
    assert.deepEqual(result.tools.map((tool) => tool.kind), ["majorFit"]);
  });

  await t.test("normalizes partial memory without crashing", async () => {
    const result = await runCommandPipeline({
      message: "Find opportunities to improve my weak profile.",
      memory: {
        goals: ["Study business"],
      },
    });

    const kinds = result.tools.map((tool) => tool.kind);

    assert.equal(result.usedFallback, true);
    assert.ok(kinds.includes("gapRadar"));
    assert.ok(kinds.includes("opportunity"));
  });
});
