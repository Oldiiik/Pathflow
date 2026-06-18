import assert from "node:assert/strict";
import test from "node:test";

import {
  MemoryPatchSchema,
  MemoryStateSchema,
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
});
