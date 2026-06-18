import assert from "node:assert/strict";
import test from "node:test";

import {
  MemoryPatchSchema,
  MemoryStateSchema,
  PersistedWorkspaceSchema,
  mergeMemoryPatch,
} from "../src/domain/workspaceSchemas.js";

test("workspace memory schemas", async (t) => {
  await t.test("state defaults to a complete memory object", () => {
    assert.deepEqual(MemoryStateSchema.parse({}), {
      goals: [],
      savedUniversities: [],
      preferredPaths: [],
      avoidedPaths: [],
      openGaps: [],
      nextSteps: [],
    });
  });

  await t.test("patches stay sparse and do not inherit state defaults", () => {
    assert.deepEqual(MemoryPatchSchema.parse({ goals: ["Study business"] }), {
      goals: ["Study business"],
    });
  });

  await t.test("merge trims new items and avoids duplicates without dropping existing memory", () => {
    const merged = mergeMemoryPatch(
      MemoryStateSchema.parse({
        goals: ["Study business"],
        avoidedPaths: ["Olympiads"],
      }),
      {
        goals: ["Study business", "  Target Asia  "],
        avoidedPaths: ["", "Olympiads", "Long essay-only process"],
      },
    );

    assert.deepEqual(merged.goals, ["Study business", "Target Asia"]);
    assert.deepEqual(merged.avoidedPaths, ["Olympiads", "Long essay-only process"]);
    assert.deepEqual(merged.openGaps, []);
  });

  await t.test("persisted workspace defaults messages, objects, and roadmap collections", () => {
    const parsed = PersistedWorkspaceSchema.parse({
      memory: {
        goals: ["Study business"],
      },
    });

    assert.deepEqual(parsed.messages, []);
    assert.deepEqual(parsed.objects, []);
    assert.deepEqual(parsed.roadmap, []);
    assert.deepEqual(parsed.memory.goals, ["Study business"]);
    assert.deepEqual(parsed.memory.avoidedPaths, []);
  });

  await t.test("persisted workspace accepts command messages with result kinds", () => {
    const parsed = PersistedWorkspaceSchema.parse({
      messages: [
        {
          id: "message-1",
          role: "system",
          text: "Detected intent.",
          resultKinds: ["university", "majorFit"],
        },
      ],
      objects: [],
      roadmap: [],
      memory: {},
    });

    assert.deepEqual(parsed.messages[0], {
      id: "message-1",
      role: "system",
      text: "Detected intent.",
      resultKinds: ["university", "majorFit"],
    });
  });
});
