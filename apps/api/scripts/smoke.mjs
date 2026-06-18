import "dotenv/config";

const apiBase = process.env.PATHFLOW_API_BASE ?? "http://127.0.0.1:8787";
const opsToken = process.env.OPS_TOKEN;

async function request(path, options = {}) {
  try {
    const res = await fetch(`${apiBase}${path}`, options);
    const body = await res.json().catch(() => null);
    return { res, body, error: null };
  } catch (error) {
    return { res: null, body: null, error };
  }
}

function printResult(name, ok, detail) {
  const mark = ok ? "PASS" : "FAIL";
  console.log(`${mark} ${name}${detail ? ` - ${detail}` : ""}`);
}

let failed = false;

const health = await request("/health");
printResult(
  "GET /health",
  Boolean(health.res?.ok),
  health.error instanceof Error ? health.error.message : health.body ? JSON.stringify(health.body) : "no json",
);
if (!health.res?.ok) failed = true;

if (opsToken) {
  const readiness = await request("/ops/readiness", {
    headers: {
      Authorization: `Bearer ${opsToken}`,
    },
  });
  const status = readiness.body?.status ?? "unknown";
  printResult(
    "GET /ops/readiness",
    Boolean(readiness.res?.ok && status === "ok"),
    readiness.error instanceof Error ? readiness.error.message : JSON.stringify(readiness.body),
  );
  if (!readiness.res?.ok || status !== "ok") failed = true;
} else {
  console.log("SKIP GET /ops/readiness - set OPS_TOKEN to check database/schema readiness");
}

if (failed) {
  process.exitCode = 1;
}
