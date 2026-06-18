import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { CommandRequestSchema, SaveWorkspaceRequestSchema } from "../domain/workspaceSchemas.js";
import { parseBody } from "../lib/validate.js";
import { runCommandPipeline } from "../ai/pipelines/commandPipeline.js";
import { reserveAiUsage } from "../repositories/aiUsageRepository.js";
import {
  appendWorkspaceMessage,
  applyMemoryPatch,
  appendRoadmapTasks,
  loadWorkspace,
  logPipelineRun,
  saveWorkspace,
} from "../repositories/workspaceRepository.js";

let taskCounter = 0;

function uid(prefix: string) {
  taskCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${taskCounter}`;
}

async function bestEffortLogPipelineRun(app: FastifyInstance, input: Parameters<typeof logPipelineRun>[0]) {
  try {
    await logPipelineRun(input);
  } catch (error) {
    app.log.warn({ err: error }, "Failed to record workspace command pipeline run");
  }
}

export const workspaceRoutes: FastifyPluginAsync = async (app) => {
  app.get("/workspace", async (request) => {
    const user = await app.requireUser(request);
    const workspace = await loadWorkspace(user.id);
    return { workspace };
  });

  app.put("/workspace", async (request) => {
    const user = await app.requireUser(request);
    const body = parseBody(request, SaveWorkspaceRequestSchema);
    const workspace = await saveWorkspace(user.id, body);
    return { workspace };
  });

  app.post("/workspace/command", async (request) => {
    const user = await app.requireUser(request);
    const body = parseBody(request, CommandRequestSchema);
    const start = Date.now();
    await reserveAiUsage(user.id);

    await appendWorkspaceMessage({
      userId: user.id,
      role: "user",
      text: body.message,
    });

    const currentWorkspace = await loadWorkspace(user.id);
    const result = await runCommandPipeline({
      message: body.message,
      memory: body.memory ?? currentWorkspace.memory,
    });
    const memory = await applyMemoryPatch(user.id, result.memoryPatch);
    const roadmapTasks = result.roadmapSuggestions.map((task) => ({
      id: uid("task"),
      label: task.label,
      status: "todo" as const,
      priority: task.priority,
      context: task.context,
    }));
    await appendRoadmapTasks({ userId: user.id, tasks: roadmapTasks });
    const response = {
      userId: user.id,
      message: {
        role: "system" as const,
        text: result.systemMessage,
        resultKinds: result.tools.map((tool) => tool.kind),
      },
      memory,
      memoryPatch: result.memoryPatch,
      tools: result.tools,
      roadmapSuggestions: roadmapTasks,
      ai: {
        model: result.model,
        usedFallback: result.usedFallback,
        fallbackReason: result.fallbackReason,
      },
    };

    await appendWorkspaceMessage({
      userId: user.id,
      role: "system",
      text: result.systemMessage,
      resultKinds: response.message.resultKinds,
    });

    await bestEffortLogPipelineRun(app, {
      userId: user.id,
      pipeline: "workspace_command",
      model: result.model,
      usedFallback: result.usedFallback,
      status: result.usedFallback ? "fallback" : "ok",
      request: { message: body.message, memory: body.memory ?? currentWorkspace.memory },
      response,
      latencyMs: Date.now() - start,
    });

    return response;
  });
};
