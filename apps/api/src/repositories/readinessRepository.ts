import { env } from "../config/env.js";
import { supabaseAdmin } from "../db/supabase.js";

export interface BackendReadinessSchemaStatus {
  tables: Record<string, boolean>;
  functions: Record<string, boolean>;
}

export async function loadBackendReadinessSchema(): Promise<BackendReadinessSchemaStatus> {
  if (env.NODE_ENV === "test") {
    return {
      tables: {
        profiles: true,
        workspaces: true,
        workspace_messages: true,
        workspace_objects: true,
        roadmap_tasks: true,
        ai_pipeline_runs: true,
        ai_usage_daily: true,
      },
      functions: {
        reserve_ai_usage_daily: true,
        save_workspace_atomic: true,
      },
    };
  }

  const result = await supabaseAdmin.rpc("pathflow_backend_readiness");
  if (result.error) {
    throw new Error(result.error.message);
  }
  return result.data as BackendReadinessSchemaStatus;
}
