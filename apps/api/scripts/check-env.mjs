import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(import.meta.dirname, "../.env") });

const urlKeys = ["FRONTEND_ORIGIN", "SUPABASE_URL", "PATHFLOW_API_BASE"];
const requiredForApi = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GEMINI_API_KEY",
  "OPS_TOKEN",
];
const requiredForConnectedSmoke = [
  "SUPABASE_ANON_KEY",
];
const mode = process.env.ENV_CHECK_MODE ?? "connected";
const productionMode = mode === "production";

function hasValue(key) {
  return typeof process.env[key] === "string" && process.env[key].trim().length > 0;
}

function isPlaceholder(value) {
  return /your-|replace-with|example\.com|your-project/i.test(value);
}

function printResult(name, ok, detail) {
  const mark = ok ? "PASS" : "FAIL";
  console.log(`${mark} ${name}${detail ? ` - ${detail}` : ""}`);
}

function checkRequired(key) {
  if (!hasValue(key)) {
    return { ok: false, detail: "missing" };
  }
  if (isPlaceholder(process.env[key])) {
    return { ok: false, detail: "still looks like a placeholder" };
  }
  return { ok: true, detail: "configured" };
}

function checkUrl(key) {
  if (!hasValue(key)) return { ok: true, detail: "not set" };
  try {
    new URL(process.env[key]);
    return { ok: true, detail: "valid URL" };
  } catch {
    return { ok: false, detail: "invalid URL" };
  }
}

function frontendOrigins() {
  if (!hasValue("FRONTEND_ORIGIN")) return [];
  return process.env.FRONTEND_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function frontendOriginPatterns() {
  if (!hasValue("FRONTEND_ORIGIN_PATTERNS")) return [];
  return process.env.FRONTEND_ORIGIN_PATTERNS.split(",")
    .map((pattern) => pattern.trim())
    .filter(Boolean);
}

function checkRegexList(key, values) {
  for (const value of values) {
    try {
      new RegExp(value);
    } catch {
      return { ok: false, detail: `invalid regex: ${value}` };
    }
  }

  return { ok: true, detail: values.length ? `${values.length} configured` : "not set" };
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

function projectRefFromUrl() {
  if (!hasValue("SUPABASE_URL")) return null;
  try {
    return new URL(process.env.SUPABASE_URL).hostname.split(".")[0] || null;
  } catch {
    return null;
  }
}

function checkSupabaseJwt(key, expectedRole) {
  if (!hasValue(key)) return { ok: false, detail: "missing" };
  const payload = decodeJwtPayload(process.env[key]);
  if (!payload) return { ok: false, detail: "not a Supabase JWT" };
  if (payload.role !== expectedRole) {
    return { ok: false, detail: `expected role ${expectedRole}, got ${payload.role ?? "unknown"}` };
  }
  const expectedRef = projectRefFromUrl();
  if (expectedRef && payload.ref && payload.ref !== expectedRef) {
    return { ok: false, detail: `project ref mismatch: expected ${expectedRef}, got ${payload.ref}` };
  }
  return { ok: true, detail: `role ${expectedRole}` };
}

let failed = false;

for (const key of requiredForApi) {
  const result = checkRequired(key);
  printResult(`env ${key}`, result.ok, result.detail);
  if (!result.ok) failed = true;
}

if (mode === "connected") {
  for (const key of requiredForConnectedSmoke) {
    const result = checkRequired(key);
    printResult(`connected smoke env ${key}`, result.ok, result.detail);
    if (!result.ok) failed = true;
  }
} else {
  printResult("connected smoke env", true, `skipped in ${mode} mode`);
}

for (const key of urlKeys) {
  const result = checkUrl(key);
  printResult(`url ${key}`, result.ok, result.detail);
  if (!result.ok) failed = true;
}

const originPatternCheck = checkRegexList("FRONTEND_ORIGIN_PATTERNS", frontendOriginPatterns());
printResult("regex FRONTEND_ORIGIN_PATTERNS", originPatternCheck.ok, originPatternCheck.detail);
if (!originPatternCheck.ok) failed = true;

const serviceRole = checkSupabaseJwt("SUPABASE_SERVICE_ROLE_KEY", "service_role");
printResult("supabase SUPABASE_SERVICE_ROLE_KEY role", serviceRole.ok, serviceRole.detail);
if (!serviceRole.ok) failed = true;

const anonRole = checkSupabaseJwt("SUPABASE_ANON_KEY", "anon");
printResult("supabase SUPABASE_ANON_KEY role", anonRole.ok, anonRole.detail);
if (!anonRole.ok) failed = true;

const opsToken = process.env.OPS_TOKEN ?? "";
const opsTokenOk = !opsToken || opsToken.length >= 16;
printResult("env OPS_TOKEN length", opsTokenOk, opsTokenOk ? "ok" : "must be at least 16 characters");
if (!opsTokenOk) failed = true;

const aiLimit = Number(process.env.AI_DAILY_REQUEST_LIMIT ?? "40");
const aiLimitOk = Number.isInteger(aiLimit) && aiLimit > 0;
printResult("env AI_DAILY_REQUEST_LIMIT", aiLimitOk, aiLimitOk ? String(aiLimit) : "must be a positive integer");
if (!aiLimitOk) failed = true;

const model = process.env.GEMINI_PIPELINE_MODEL ?? "gemini-3.1-flash-lite";
printResult("env GEMINI_PIPELINE_MODEL", Boolean(model.trim()), model);

if (productionMode) {
  const nodeEnvOk = process.env.NODE_ENV === "production";
  printResult("production NODE_ENV", nodeEnvOk, nodeEnvOk ? "production" : "must be production");
  if (!nodeEnvOk) failed = true;

  const host = process.env.HOST ?? "127.0.0.1";
  const hostOk = host !== "127.0.0.1" && host !== "localhost";
  printResult("production HOST", hostOk, hostOk ? host : "must not bind only to localhost");
  if (!hostOk) failed = true;

  const origins = frontendOrigins();
  const publicHttpsOrigins = origins.filter((origin) => {
    try {
      const url = new URL(origin);
      return url.protocol === "https:" && !["localhost", "127.0.0.1"].includes(url.hostname);
    } catch {
      return false;
    }
  });
  const frontendOk = publicHttpsOrigins.length > 0;
  printResult(
    "production FRONTEND_ORIGIN",
    frontendOk,
    frontendOk ? `${publicHttpsOrigins.length} public HTTPS origin(s)` : "must include deployed HTTPS frontend origin",
  );
  if (!frontendOk) failed = true;
}

if (failed) {
  process.exitCode = 1;
}
