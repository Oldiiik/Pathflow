import { supabaseAdmin } from "../db/supabase.js";
import { badRequest } from "../lib/httpError.js";
import {
  MemoryStateSchema,
  PersistedWorkspaceSchema,
  mergeMemoryPatch,
  type MemoryPatch,
  type MemoryState,
  type PersistedWorkspace,
  type RoadmapTask,
  type WorkspaceObject,
  type ChatMessage,
} from "../domain/workspaceSchemas.js";

interface WorkspaceRow {
  id: string;
  memory: unknown;
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
  const messagesResult = await supabaseAdmin
    .from("workspace_messages")
    .select("id, role, text, result_kinds")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: true });

  if (objectsResult.error) throw badRequest(objectsResult.error.message, "workspace_objects_load_failed");
  if (roadmapResult.error) throw badRequest(roadmapResult.error.message, "roadmap_load_failed");
  if (messagesResult.error) throw badRequest(messagesResult.error.message, "workspace_messages_load_failed");

  const objects = (objectsResult.data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind,
    data: row.data,
  })) as WorkspaceObject[];

  const roadmap = (roadmapResult.data ?? []) as RoadmapTask[];
  const messages = (messagesResult.data ?? []).map((row) => ({
    id: row.id,
    role: row.role,
    text: row.text,
    resultKinds: row.result_kinds?.length ? row.result_kinds : undefined,
  })) as ChatMessage[];

  return PersistedWorkspaceSchema.parse({
    messages,
    objects,
    memory: workspace.memory,
    roadmap,
  });
}

export async function saveWorkspace(userId: string, workspaceData: PersistedWorkspace): Promise<PersistedWorkspace> {
  const parsed = PersistedWorkspaceSchema.parse(workspaceData);
  const result = await supabaseAdmin.rpc("save_workspace_atomic", {
    p_user_id: userId,
    p_memory: parsed.memory,
    p_objects: parsed.objects,
    p_roadmap: parsed.roadmap,
  });

  if (result.error) throw badRequest(result.error.message, "workspace_save_failed");

  return loadWorkspace(userId);
}

export async function appendWorkspaceObjects(input: {
  userId: string;
  objects: WorkspaceObject[];
}) {
  if (process.env.NODE_ENV === "test") return;
  if (!input.objects.length) return;
  const workspace = await getOrCreateWorkspace(input.userId);
  const result = await supabaseAdmin.from("workspace_objects").insert(
    input.objects.map((object) => ({
      id: object.id,
      workspace_id: workspace.id,
      user_id: input.userId,
      kind: object.kind,
      data: object.data,
    })),
  );

  if (result.error) throw badRequest(result.error.message, "workspace_objects_save_failed");
}

export async function appendRoadmapTasks(input: {
  userId: string;
  tasks: RoadmapTask[];
}) {
  if (process.env.NODE_ENV === "test") return;
  if (!input.tasks.length) return;
  const workspace = await getOrCreateWorkspace(input.userId);
  const result = await supabaseAdmin.from("roadmap_tasks").insert(
    input.tasks.map((task) => ({
      id: task.id,
      workspace_id: workspace.id,
      user_id: input.userId,
      label: task.label,
      status: task.status,
      priority: task.priority,
      context: task.context,
    })),
  );

  if (result.error) throw badRequest(result.error.message, "roadmap_tasks_save_failed");
}

export async function applyMemoryPatch(userId: string, patch: MemoryPatch): Promise<MemoryState> {
  const workspace = await getOrCreateWorkspace(userId);
  const next = mergeMemoryPatch(workspace.memory, patch);
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
  errorMessage?: string;
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
    error_message: input.errorMessage,
    latency_ms: input.latencyMs,
  });

  if (result.error) throw badRequest(result.error.message, "pipeline_log_failed");
}
