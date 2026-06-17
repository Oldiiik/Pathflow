import { supabaseAdmin } from "../db/supabase.js";
import { badRequest } from "../lib/httpError.js";
import {
  MemoryStateSchema,
  PersistedWorkspaceSchema,
  type MemoryPatch,
  type MemoryState,
  type PersistedWorkspace,
  type RoadmapTask,
  type WorkspaceObject,
} from "../domain/workspaceSchemas.js";

interface WorkspaceRow {
  id: string;
  memory: unknown;
}

function mergeMemory(current: MemoryState, patch: MemoryPatch): MemoryState {
  const unique = (base: string[], additions: string[] | undefined) => {
    if (!additions) return base;
    const next = [...base];
    for (const item of additions) {
      const trimmed = item.trim();
      if (trimmed && !next.includes(trimmed)) next.push(trimmed);
    }
    return next;
  };

  return {
    goals: unique(current.goals, patch.goals),
    savedUniversities: unique(current.savedUniversities, patch.savedUniversities),
    preferredPaths: unique(current.preferredPaths, patch.preferredPaths),
    avoidedPaths: unique(current.avoidedPaths, patch.avoidedPaths),
    openGaps: unique(current.openGaps, patch.openGaps),
    nextSteps: unique(current.nextSteps, patch.nextSteps),
  };
}

async function getOrCreateWorkspace(userId: string): Promise<{ id: string; memory: MemoryState }> {
  const existing = await supabaseAdmin
    .from("workspaces")
    .select("id, memory")
    .eq("user_id", userId)
    .maybeSingle<WorkspaceRow>();

  if (existing.error) throw badRequest(existing.error.message, "workspace_load_failed");
  if (existing.data) {
    return {
      id: existing.data.id,
      memory: MemoryStateSchema.parse(existing.data.memory ?? {}),
    };
  }

  const created = await supabaseAdmin
    .from("workspaces")
    .insert({ user_id: userId, memory: MemoryStateSchema.parse({}) })
    .select("id, memory")
    .single<WorkspaceRow>();

  if (created.error) throw badRequest(created.error.message, "workspace_create_failed");
  return {
    id: created.data.id,
    memory: MemoryStateSchema.parse(created.data.memory ?? {}),
  };
}

export async function loadWorkspace(userId: string): Promise<PersistedWorkspace> {
  const workspace = await getOrCreateWorkspace(userId);

  const [objectsResult, roadmapResult] = await Promise.all([
    supabaseAdmin
      .from("workspace_objects")
      .select("id, kind, data")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("roadmap_tasks")
      .select("id, label, status, priority, context")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: true }),
  ]);

  if (objectsResult.error) throw badRequest(objectsResult.error.message, "workspace_objects_load_failed");
  if (roadmapResult.error) throw badRequest(roadmapResult.error.message, "roadmap_load_failed");

  const objects = (objectsResult.data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind,
    data: row.data,
  })) as WorkspaceObject[];

  const roadmap = (roadmapResult.data ?? []) as RoadmapTask[];

  return PersistedWorkspaceSchema.parse({
    objects,
    memory: workspace.memory,
    roadmap,
  });
}

export async function saveWorkspace(userId: string, workspaceData: PersistedWorkspace): Promise<PersistedWorkspace> {
  const workspace = await getOrCreateWorkspace(userId);
  const parsed = PersistedWorkspaceSchema.parse(workspaceData);

  const memoryUpdate = await supabaseAdmin
    .from("workspaces")
    .update({ memory: parsed.memory })
    .eq("id", workspace.id)
    .eq("user_id", userId);

  if (memoryUpdate.error) throw badRequest(memoryUpdate.error.message, "workspace_memory_save_failed");

  const deleteObjects = await supabaseAdmin.from("workspace_objects").delete().eq("workspace_id", workspace.id);
  if (deleteObjects.error) throw badRequest(deleteObjects.error.message, "workspace_objects_delete_failed");

  if (parsed.objects.length) {
    const insertObjects = await supabaseAdmin.from("workspace_objects").insert(
      parsed.objects.map((object) => ({
        id: object.id,
        workspace_id: workspace.id,
        user_id: userId,
        kind: object.kind,
        data: object.data,
        source: "user",
      })),
    );
    if (insertObjects.error) throw badRequest(insertObjects.error.message, "workspace_objects_save_failed");
  }

  const deleteRoadmap = await supabaseAdmin.from("roadmap_tasks").delete().eq("workspace_id", workspace.id);
  if (deleteRoadmap.error) throw badRequest(deleteRoadmap.error.message, "roadmap_delete_failed");

  if (parsed.roadmap.length) {
    const insertRoadmap = await supabaseAdmin.from("roadmap_tasks").insert(
      parsed.roadmap.map((task) => ({
        id: task.id,
        workspace_id: workspace.id,
        user_id: userId,
        label: task.label,
        status: task.status,
        priority: task.priority,
        context: task.context,
      })),
    );
    if (insertRoadmap.error) throw badRequest(insertRoadmap.error.message, "roadmap_save_failed");
  }

  return loadWorkspace(userId);
}

export async function applyMemoryPatch(userId: string, patch: MemoryPatch): Promise<MemoryState> {
  const workspace = await getOrCreateWorkspace(userId);
  const next = mergeMemory(workspace.memory, patch);
  const result = await supabaseAdmin
    .from("workspaces")
    .update({ memory: next })
    .eq("id", workspace.id)
    .eq("user_id", userId);

  if (result.error) throw badRequest(result.error.message, "workspace_memory_patch_failed");
  return next;
}

export async function appendWorkspaceMessage(input: {
  userId: string;
  role: "user" | "system";
  text: string;
  resultKinds?: string[];
}) {
  const workspace = await getOrCreateWorkspace(input.userId);
  const result = await supabaseAdmin.from("workspace_messages").insert({
    workspace_id: workspace.id,
    user_id: input.userId,
    role: input.role,
    text: input.text,
    result_kinds: input.resultKinds ?? [],
  });

  if (result.error) throw badRequest(result.error.message, "workspace_message_save_failed");
}

export async function logPipelineRun(input: {
  userId: string;
  pipeline: string;
  model: string | null;
  usedFallback: boolean;
  status: "ok" | "fallback" | "error";
  request: unknown;
  response: unknown;
  latencyMs: number;
}) {
  const workspace = await getOrCreateWorkspace(input.userId);
  const result = await supabaseAdmin.from("ai_pipeline_runs").insert({
    user_id: input.userId,
    workspace_id: workspace.id,
    pipeline: input.pipeline,
    model: input.model,
    input: input.request,
    output: input.response,
    status: input.status,
    used_fallback: input.usedFallback,
    latency_ms: input.latencyMs,
  });

  if (result.error) throw badRequest(result.error.message, "pipeline_log_failed");
}
