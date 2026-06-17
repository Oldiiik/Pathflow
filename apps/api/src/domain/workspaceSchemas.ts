import { z } from "zod";

export const ObjectKindSchema = z.enum([
  "university",
  "majorFit",
  "gapRadar",
  "opportunity",
  "portfolio",
]);

export type ObjectKind = z.infer<typeof ObjectKindSchema>;

export const MemoryStateSchema = z.object({
  goals: z.array(z.string()).default([]),
  savedUniversities: z.array(z.string()).default([]),
  preferredPaths: z.array(z.string()).default([]),
  avoidedPaths: z.array(z.string()).default([]),
  openGaps: z.array(z.string()).default([]),
  nextSteps: z.array(z.string()).default([]),
});

export type MemoryState = z.infer<typeof MemoryStateSchema>;

export const MemoryPatchSchema = MemoryStateSchema.partial();

export type MemoryPatch = z.infer<typeof MemoryPatchSchema>;

export const emptyMemory = (): MemoryState => ({
  goals: [],
  savedUniversities: [],
  preferredPaths: [],
  avoidedPaths: [],
  openGaps: [],
  nextSteps: [],
});

export const ToolPlanItemSchema = z.object({
  kind: ObjectKindSchema,
  reason: z.string().min(1),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
});

export const CommandPipelineResultSchema = z.object({
  systemMessage: z.string().min(1),
  memoryPatch: MemoryPatchSchema.default({}),
  tools: z.array(ToolPlanItemSchema).min(1).max(6),
  roadmapSuggestions: z
    .array(
      z.object({
        label: z.string().min(1),
        priority: z.enum(["high", "medium", "low"]).default("medium"),
        context: z.string().min(1).default("Command"),
      }),
    )
    .max(8)
    .default([]),
});

export type CommandPipelineResult = z.infer<typeof CommandPipelineResultSchema>;

export const CommandRequestSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  memory: MemoryStateSchema.partial().optional(),
});

export const WorkspaceObjectSchema = z.object({
  id: z.string().min(1),
  kind: ObjectKindSchema,
  data: z.record(z.string(), z.unknown()),
});

export type WorkspaceObject = z.infer<typeof WorkspaceObjectSchema>;

export const RoadmapTaskSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  status: z.enum(["todo", "doing", "done"]).default("todo"),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  context: z.string().min(1).default("Task"),
});

export type RoadmapTask = z.infer<typeof RoadmapTaskSchema>;

export const PersistedWorkspaceSchema = z.object({
  objects: z.array(WorkspaceObjectSchema).default([]),
  memory: MemoryStateSchema.default(emptyMemory),
  roadmap: z.array(RoadmapTaskSchema).default([]),
});

export type PersistedWorkspace = z.infer<typeof PersistedWorkspaceSchema>;

export const SaveWorkspaceRequestSchema = PersistedWorkspaceSchema;
