import { supabaseAdmin } from "../db/supabase.js";

export interface BackendReadinessSchemaStatus {
  tables: Record<string, boolean>;
  functions: Record<string, boolean>;
}

export async function loadBackendReadinessSchema(): Promise<BackendReadinessSchemaStatus> {
  const result = await supabaseAdmin.rpc("pathflow_backend_readiness");
  if (result.error) {
    throw new Error(result.error.message);
  }
  return result.data as BackendReadinessSchemaStatus;
}
