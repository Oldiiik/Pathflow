import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

config({ path: resolve(import.meta.dirname, "../.env") });

const apiBase = process.env.PATHFLOW_API_BASE ?? "http://127.0.0.1:8787";
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const opsToken = process.env.OPS_TOKEN;
const smokeAiFeatures = process.env.SMOKE_AI_FEATURES === "true";

const generatedEmail = !process.env.SMOKE_EMAIL;
const email = process.env.SMOKE_EMAIL ?? `pathflow-smoke-${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
const password = process.env.SMOKE_PASSWORD ?? `Smoke-${randomUUID()}-9a`;
const shouldCleanupUser =
  process.env.SMOKE_DELETE_USER === "true" ||
  (generatedEmail && process.env.SMOKE_KEEP_USER !== "true");

function printResult(name, ok, detail) {
  const mark = ok ? "PASS" : "FAIL";
  console.log(`${mark} ${name}${detail ? ` - ${detail}` : ""}`);
}

async function jsonRequest(path, options = {}) {
  try {
    const res = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    });
    const body = await res.json().catch(() => null);
    return { res, body, error: null };
  } catch (error) {
    return { res: null, body: null, error };
  }
}

let failed = false;

if (!supabaseUrl || !supabaseAnonKey) {
  printResult(
    "connected smoke env",
    false,
    "SUPABASE_URL and SUPABASE_ANON_KEY are required",
  );
  process.exit(1);
}

const health = await jsonRequest("/health");
printResult(
  "GET /health",
  Boolean(health.res?.ok),
  health.error instanceof Error ? health.error.message : JSON.stringify(health.body),
);
if (!health.res?.ok) failed = true;

if (opsToken) {
  const readiness = await jsonRequest("/ops/readiness", {
    headers: {
      Authorization: `Bearer ${opsToken}`,
    },
  });
  const ready = readiness.res?.ok && readiness.body?.status === "ok";
  printResult(
    "GET /ops/readiness",
    Boolean(ready),
    readiness.error instanceof Error ? readiness.error.message : JSON.stringify(readiness.body),
  );
  if (!ready) failed = true;
} else {
  printResult("GET /ops/readiness", true, "skipped because OPS_TOKEN is not set");
}

const signup = await jsonRequest("/auth/signup", {
  method: "POST",
  body: JSON.stringify({
    email,
    password,
    name: "Pathflow Smoke",
    field: "Business Analytics",
    region: "Asia",
    avoid: "Olympiads",
  }),
});
const smokeUserId = signup.body?.userId;
printResult(
  "POST /auth/signup",
  Boolean(signup.res?.ok),
  signup.error instanceof Error ? signup.error.message : JSON.stringify(signup.body),
);
if (!signup.res?.ok) failed = true;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const sessionResult = await supabase.auth.signInWithPassword({ email, password });
const accessToken = sessionResult.data.session?.access_token;
printResult(
  "Supabase signInWithPassword",
  Boolean(accessToken),
  sessionResult.error?.message ?? sessionResult.data.user?.id,
);
if (!accessToken) failed = true;

async function authed(path, options = {}) {
  return jsonRequest(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers ?? {}),
    },
  });
}

if (accessToken) {
  const profile = await authed("/profile");
  printResult("GET /profile", Boolean(profile.res?.ok && profile.body?.profile?.name), JSON.stringify(profile.body));
  if (!profile.res?.ok || !profile.body?.profile?.name) failed = true;

  const generated = await authed("/data/generate", {
    method: "POST",
    body: JSON.stringify({ kind: "university" }),
  });
  const generatedObject = generated.body?.objects?.[0];
  printResult(
    "POST /data/generate",
    Boolean(generated.res?.ok && generatedObject?.kind === "university"),
    JSON.stringify(generated.body),
  );
  if (!generated.res?.ok || generatedObject?.kind !== "university") failed = true;

  const workspaceAfterGenerate = await authed("/workspace");
  const generatedPersisted = workspaceAfterGenerate.body?.workspace?.objects?.some(
    (object) => object.id === generatedObject?.id && object.kind === generatedObject?.kind,
  );
  printResult(
    "GET /workspace after /data/generate",
    Boolean(workspaceAfterGenerate.res?.ok && generatedPersisted),
    JSON.stringify(workspaceAfterGenerate.body),
  );
  if (!workspaceAfterGenerate.res?.ok || !generatedPersisted) failed = true;

  const save = await authed("/workspace", {
    method: "PUT",
    body: JSON.stringify({
      objects: generatedObject ? [generatedObject] : [],
      memory: {
        goals: ["Smoke test connected backend"],
        savedUniversities: [],
        preferredPaths: [],
        avoidedPaths: ["Olympiads"],
        openGaps: [],
        nextSteps: [],
      },
      roadmap: [
        {
          id: `smoke-task-${Date.now()}`,
          label: "Verify connected backend",
          status: "todo",
          priority: "medium",
          context: "Smoke test",
        },
      ],
    }),
  });
  printResult("PUT /workspace", Boolean(save.res?.ok), JSON.stringify(save.body));
  if (!save.res?.ok) failed = true;

  const workspace = await authed("/workspace");
  const savedObject = workspace.body?.workspace?.objects?.[0];
  printResult(
    "GET /workspace",
    Boolean(workspace.res?.ok && savedObject?.kind === "university"),
    JSON.stringify(workspace.body),
  );
  if (!workspace.res?.ok || savedObject?.kind !== "university") failed = true;

  const command = await authed("/workspace/command", {
    method: "POST",
    body: JSON.stringify({
      message: "I want to study business in Asia but avoid olympiads.",
      memory: workspace.body?.workspace?.memory,
    }),
  });
  const commandTools = command.body?.tools ?? [];
  printResult(
    "POST /workspace/command",
    Boolean(
      command.res?.ok &&
        command.body?.message?.text &&
        Array.isArray(commandTools) &&
        commandTools.length > 0,
    ),
    JSON.stringify(command.body),
  );
  if (!command.res?.ok || !command.body?.message?.text || !commandTools.length) failed = true;

  const workspaceAfterCommand = await authed("/workspace");
  const commandMessagePersisted = workspaceAfterCommand.body?.workspace?.messages?.some(
    (message) => message.role === "system" && message.text === command.body?.message?.text,
  );
  const commandRoadmapPersisted = workspaceAfterCommand.body?.workspace?.roadmap?.some(
    (task) => command.body?.roadmapSuggestions?.some((suggestion) => suggestion.id === task.id),
  );
  printResult(
    "GET /workspace after /workspace/command",
    Boolean(workspaceAfterCommand.res?.ok && commandMessagePersisted && commandRoadmapPersisted),
    JSON.stringify(workspaceAfterCommand.body),
  );
  if (!workspaceAfterCommand.res?.ok || !commandMessagePersisted || !commandRoadmapPersisted) failed = true;

  if (smokeAiFeatures) {
    const universityBio = await authed("/ai/university-bio", {
      method: "POST",
      body: JSON.stringify({
        name: "National University of Singapore",
        country: "Singapore",
        city: "Singapore",
        context: workspace.body?.workspace?.memory,
      }),
    });
    printResult(
      "POST /ai/university-bio",
      Boolean(universityBio.res?.ok && universityBio.body?.bio?.positioning),
      JSON.stringify(universityBio.body),
    );
    if (!universityBio.res?.ok || !universityBio.body?.bio?.positioning) failed = true;
  } else {
    printResult("POST /ai/university-bio", true, "skipped because SMOKE_AI_FEATURES is not true");
  }
}

if (shouldCleanupUser && smokeUserId && supabaseServiceRoleKey) {
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  const cleanup = await supabaseAdmin.auth.admin.deleteUser(smokeUserId);
  printResult(
    "cleanup smoke user",
    !cleanup.error,
    cleanup.error?.message ?? smokeUserId,
  );
} else if (shouldCleanupUser && smokeUserId) {
  printResult(
    "cleanup smoke user",
    true,
    "skipped because SUPABASE_SERVICE_ROLE_KEY is not set",
  );
}

if (failed) {
  process.exitCode = 1;
}
