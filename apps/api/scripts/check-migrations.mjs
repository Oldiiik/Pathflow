import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../../..");
const migrationsDir = resolve(root, "supabase/migrations");
const sql = readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .map((file) => readFileSync(resolve(migrationsDir, file), "utf8"))
  .join("\n\n");

const checks = [
  ["table profiles", /create table if not exists public\.profiles\b/i],
  ["table workspaces", /create table if not exists public\.workspaces\b/i],
  ["table workspace_messages", /create table if not exists public\.workspace_messages\b/i],
  ["table workspace_objects", /create table if not exists public\.workspace_objects\b/i],
  ["table roadmap_tasks", /create table if not exists public\.roadmap_tasks\b/i],
  ["table ai_pipeline_runs", /create table if not exists public\.ai_pipeline_runs\b/i],
  ["table ai_usage_daily", /create table if not exists public\.ai_usage_daily\b/i],
  ["ai_pipeline_runs.error_message", /\bai_pipeline_runs\b[\s\S]*?\berror_message\s+text\b/i],
  ["workspace_messages.result_kinds", /\bworkspace_messages\b[\s\S]*?\bresult_kinds\s+text\[\]/i],
  ["workspace_objects.kind check", /\bkind\s+text\s+not null\s+check\s*\(\s*kind\s+in\s*\([^)]*university[^)]*portfolio[^)]*\)\s*\)/i],
  ["roadmap_tasks.status check", /\bstatus\s+text\s+not null\s+default\s+'todo'\s+check\s*\(\s*status\s+in\s*\([^)]*todo[^)]*doing[^)]*done[^)]*\)\s*\)/i],
  ["function reserve_ai_usage_daily", /create or replace function public\.reserve_ai_usage_daily\s*\(\s*p_user_id uuid,\s*p_usage_date date,\s*p_limit integer\s*\)/i],
  ["function save_workspace_atomic", /create or replace function public\.save_workspace_atomic\s*\(\s*p_user_id uuid,\s*p_memory jsonb,\s*p_objects jsonb,\s*p_roadmap jsonb\s*\)/i],
  ["function pathflow_backend_readiness", /create or replace function public\.pathflow_backend_readiness\s*\(\s*\)/i],
  ["save_workspace_atomic advisory lock", /pg_advisory_xact_lock\s*\(\s*hashtextextended\s*\(\s*p_user_id::text,\s*0\s*\)\s*\)/i],
  ["grant reserve_ai_usage_daily to service_role", /grant execute on function public\.reserve_ai_usage_daily\(uuid,\s*date,\s*integer\) to service_role/i],
  ["grant save_workspace_atomic to service_role", /grant execute on function public\.save_workspace_atomic\(uuid,\s*jsonb,\s*jsonb,\s*jsonb\) to service_role/i],
  ["grant pathflow_backend_readiness to service_role", /grant execute on function public\.pathflow_backend_readiness\(\) to service_role/i],
  ["readiness checks ai_usage_daily", /'ai_usage_daily',\s*to_regclass\('public\.ai_usage_daily'\) is not null/i],
  ["readiness checks reserve_ai_usage_daily", /to_regprocedure\('public\.reserve_ai_usage_daily\(uuid,date,integer\)'\) is not null/i],
  ["readiness checks save_workspace_atomic", /to_regprocedure\('public\.save_workspace_atomic\(uuid,jsonb,jsonb,jsonb\)'\) is not null/i],
];

let failed = false;

for (const [name, pattern] of checks) {
  const ok = pattern.test(sql);
  console.log(`${ok ? "PASS" : "FAIL"} migration ${name}`);
  if (!ok) failed = true;
}

if (failed) {
  process.exitCode = 1;
}
