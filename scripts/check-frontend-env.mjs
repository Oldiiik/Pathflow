import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(import.meta.dirname, "../.env");
const mode = process.env.ENV_CHECK_MODE ?? "local";
const productionMode = mode === "production";

function readDotenv(path) {
  if (!existsSync(path)) return {};

  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        if (index === -1) return [line, ""];
        const key = line.slice(0, index).trim();
        const value = line.slice(index + 1).trim().replace(/^["']|["']$/g, "");
        return [key, value];
      }),
  );
}

const env = { ...readDotenv(envPath), ...process.env };
let failed = false;

function hasValue(key) {
  return typeof env[key] === "string" && env[key].trim().length > 0;
}

function isPlaceholder(value) {
  return /your-|replace-with|example\.com|your-project/i.test(value);
}

function printResult(name, ok, detail) {
  const mark = ok ? "PASS" : "FAIL";
  console.log(`${mark} ${name}${detail ? ` - ${detail}` : ""}`);
}

function requireValue(key) {
  if (!hasValue(key)) {
    printResult(`frontend env ${key}`, false, "missing");
    failed = true;
    return;
  }
  if (isPlaceholder(env[key])) {
    printResult(`frontend env ${key}`, false, "still looks like a placeholder");
    failed = true;
    return;
  }
  printResult(`frontend env ${key}`, true, "configured");
}

function decodeJwtPayload(value) {
  const [, payload] = value.split(".");
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(Buffer.from(normalized, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

requireValue("VITE_PATHFLOW_API_BASE");
requireValue("VITE_SUPABASE_PROJECT_ID");
requireValue("VITE_SUPABASE_ANON_KEY");

if (hasValue("VITE_PATHFLOW_API_BASE")) {
  try {
    const url = new URL(env.VITE_PATHFLOW_API_BASE);
    const publicHttps = url.protocol === "https:" && !["localhost", "127.0.0.1"].includes(url.hostname);
    const ok = productionMode ? publicHttps : true;
    printResult(
      "frontend API base URL",
      ok,
      productionMode && !publicHttps ? "must be deployed HTTPS API URL" : "valid URL",
    );
    if (!ok) failed = true;
  } catch {
    printResult("frontend API base URL", false, "invalid URL");
    failed = true;
  }
}

const workspaceApiEnabled = env.VITE_USE_NODE_WORKSPACE_API === "true";
printResult(
  "frontend workspace API flag",
  productionMode ? workspaceApiEnabled : true,
  workspaceApiEnabled ? "true" : "false",
);
if (productionMode && !workspaceApiEnabled) failed = true;

if (hasValue("VITE_SUPABASE_ANON_KEY")) {
  const payload = decodeJwtPayload(env.VITE_SUPABASE_ANON_KEY);
  const roleOk = payload?.role === "anon";
  printResult("frontend Supabase anon role", roleOk, roleOk ? "anon" : "expected anon JWT");
  if (!roleOk) failed = true;

  const refOk = !payload?.ref || payload.ref === env.VITE_SUPABASE_PROJECT_ID;
  printResult(
    "frontend Supabase project match",
    refOk,
    refOk ? "matches project ref" : "anon JWT ref does not match VITE_SUPABASE_PROJECT_ID",
  );
  if (!refOk) failed = true;
}

if (failed) {
  process.exitCode = 1;
}
