import type { FastifyPluginAsync } from "fastify";
import { CommandRequestSchema, SaveWorkspaceRequestSchema } from "../domain/workspaceSchemas.js";
import { parseBody } from "../lib/validate.js";
import { runCommandPipeline } from "../ai/pipelines/commandPipeline.js";
import {
  appendWorkspaceMessage,
  applyMemoryPatch,
  loadWorkspace,
  logPipelineRun,
  saveWorkspace,
} from "../repositories/workspaceRepository.js";

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
      roadmapSuggestions: result.roadmapSuggestions,
      ai: {
        model: result.model,
        usedFallback: result.usedFallback,
      },
    };

    await appendWorkspaceMessage({
      userId: user.id,
      role: "system",
      text: result.systemMessage,
      resultKinds: response.message.resultKinds,
    });

    await logPipelineRun({
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
