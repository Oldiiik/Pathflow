import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const rootEnvPath = resolve(import.meta.dirname, "../.env");
const apiEnvPath = resolve(import.meta.dirname, "../apps/api/.env");

function parseDotenv(path) {
  if (!existsSync(path)) return {};

  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        if (index === -1) return [line, ""];
        return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^["']|["']$/g, "")];
      }),
  );
}

function projectRefFromUrl(value) {
  try {
    return new URL(value).hostname.split(".")[0] || "";
  } catch {
    return "";
  }
}

function mergeEnv(existing, updates) {
  const keys = new Set([...Object.keys(existing), ...Object.keys(updates)]);
  return [...keys]
    .sort()
    .map((key) => `${key}=${updates[key] ?? existing[key] ?? ""}`)
    .join("\n")
    .concat("\n");
}

const apiEnv = parseDotenv(apiEnvPath);
const rootEnv = parseDotenv(rootEnvPath);
const projectRef = projectRefFromUrl(apiEnv.SUPABASE_URL);

const required = {
  SUPABASE_URL: apiEnv.SUPABASE_URL,
  SUPABASE_ANON_KEY: apiEnv.SUPABASE_ANON_KEY,
};

const missing = Object.entries(required)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (!projectRef) missing.push("valid SUPABASE_URL project ref");

if (missing.length) {
  console.error(`Cannot sync frontend env. Missing: ${missing.join(", ")}`);
  process.exitCode = 1;
} else {
  writeFileSync(
    rootEnvPath,
    mergeEnv(rootEnv, {
      VITE_PATHFLOW_API_BASE: rootEnv.VITE_PATHFLOW_API_BASE ?? "http://127.0.0.1:8787",
      VITE_SUPABASE_ANON_KEY: apiEnv.SUPABASE_ANON_KEY,
      VITE_SUPABASE_PROJECT_ID: projectRef,
      VITE_USE_NODE_WORKSPACE_API: rootEnv.VITE_USE_NODE_WORKSPACE_API ?? "false",
    }),
  );

  console.log("Synced frontend env from apps/api/.env without printing secret values.");
}
