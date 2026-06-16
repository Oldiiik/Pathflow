import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();
const PREFIX = "/make-server-6885b96b";

// Service-role client (server-only — never expose the service key to the frontend).
const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// The single model used for every generative function in this app.
const GEMINI_MODEL = "gemini-3.1-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

app.get(`${PREFIX}/health`, (c) => c.json({ status: "ok", model: GEMINI_MODEL }));

// ---- Gemini helper -------------------------------------------------------

async function callGemini(systemPrompt: string, userPrompt: string): Promise<unknown> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in the server environment.");
  }

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.6,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Gemini API error (${res.status}) using ${GEMINI_MODEL}: ${detail}`);
  }

  const json = await res.json();
  const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error(`Gemini returned no text. Raw response: ${JSON.stringify(json).slice(0, 800)}`);
  }

  try {
    return JSON.parse(text);
  } catch (_e) {
    // Strip code fences if the model wrapped the JSON.
    const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    return JSON.parse(cleaned);
  }
}

// ---- University decision-profile bio -------------------------------------

const BIO_SYSTEM = `You are Pathflow's admissions intelligence engine. You produce a "decision profile" for a university tailored to one student — not a Wikipedia summary. The student must learn: should I target this, why, what are the risks, and what should I do next.

Rules:
- Be honest. Always include real downsides. If everything looks amazing the profile is useless.
- Personalise the "Fit For You" and strategy sections using the student context provided (goals, avoided paths, preferred majors, hackathon/builder background).
- NEVER invent precise statistics. If a number is not reliably known, set its value to "Not publicly reported" and confidence to "unknown". Only mark confidence "high" for well-established facts.
- Keep prose tight and concrete. No filler like "vibrant and diverse".
- Respond with ONLY a JSON object matching this exact shape:
{
  "positioning": string,                       // one punchy line
  "fitScore": number,                          // 0-100 for THIS student
  "difficulty": "Likely" | "Target" | "Reach" | "Extreme",
  "snapshot": [ { "label": string, "value": string, "confidence": "high"|"medium"|"unknown" } ],  // 6-8 items
  "fitForYou": string[],                        // 3-5 personalised reasons it fits
  "fitConcerns": string[],                      // 3-5 personalised reasons it may not
  "pros": string[],                             // 4-6
  "minuses": string[],                          // 4-6
  "academicMatch": [ { "program": string, "note": string } ], // 3 best-fit programs for THIS student
  "studentLife": { "goodFor": string[], "badFor": string[] }, // 3-4 each
  "cost": { "sticker": string, "aidForInternationals": string, "financialRisk": "Low"|"Medium"|"High", "note": string },
  "outcomes": { "summary": string, "caveat": string },
  "gapRadar": [ { "axis": string, "severity": "Critical"|"High"|"Medium"|"Low"|"Unknown" } ], // 5-7 axes
  "recommendedFixes": string[],                 // 3-5 concrete next steps for THIS student
  "strategy": string,                           // 2-3 sentences: how to position yourself here
  "evidence": [ { "dataPoint": string, "value": string, "source": string, "confidence": "high"|"medium"|"unknown" } ] // 3-5
}`;

app.post(`${PREFIX}/university-bio`, async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const name: string = body?.name ?? "";
    const country: string = body?.country ?? "";
    const city: string = body?.city ?? "";
    const context = body?.context ?? {};

    if (!name) {
      return c.json({ error: "Missing 'name' in request body." }, 400);
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    // Cache key includes a light hash of the student context so personalised
    // bios refresh when the student's memory meaningfully changes.
    const ctxKey = JSON.stringify({
      goals: context?.goals ?? [],
      avoided: context?.avoidedPaths ?? [],
      preferred: context?.preferredPaths ?? [],
    });
    let ctxHash = 0;
    for (let i = 0; i < ctxKey.length; i++) ctxHash = (ctxHash * 31 + ctxKey.charCodeAt(i)) | 0;
    const cacheKey = `bio:${slug}:${ctxHash >>> 0}`;

    const cached = await kv.get(cacheKey);
    if (cached) {
      return c.json({ bio: cached, cached: true, model: GEMINI_MODEL });
    }

    const userPrompt = `University: ${name}\nLocation: ${city}, ${country}\n\nStudent context:\n- Goals: ${(context?.goals ?? []).join("; ") || "not stated"}\n- Avoided paths (dislikes): ${(context?.avoidedPaths ?? []).join("; ") || "none"}\n- Preferred majors: ${(context?.preferredPaths ?? []).join("; ") || "none yet"}\n- Background: builder with hackathon certificates, wants business/analytics in Asia, dislikes olympiad-style competitions.\n\nProduce the personalised decision profile JSON now.`;

    const bio = await callGemini(BIO_SYSTEM, userPrompt);
    await kv.set(cacheKey, bio);

    return c.json({ bio, cached: false, model: GEMINI_MODEL });
  } catch (err) {
    console.log(`Error generating university bio with ${GEMINI_MODEL}: ${err}`);
    return c.json({ error: `Failed to generate university bio: ${err}` }, 500);
  }
});

// ---- Project / website review (AI) ----------------------------------------

const REVIEW_SYSTEM = `You are Pathflow's admissions project reviewer. A student gives you a project (name + description, maybe a link). Judge it ONLY for university-admission value — honestly, like a selective admissions reader.

Rules:
- Be specific and concrete. No generic praise. If it's weak, say so.
- Focus on what makes a project stand out for admissions: real problem, measurable impact, the student's personal contribution, evidence, and connection to their intended field.
- Respond with ONLY a JSON object of this exact shape:
{
  "admissionValue": "Strong" | "Moderate" | "Weak" | "Under-explained",
  "summary": string,                 // one sentence verdict
  "strengths": string[],             // 3-5
  "weaknesses": string[],            // 3-5
  "improvements": string[],          // 4-6 concrete, ordered next steps
  "rewrite": string                  // a tight, portfolio-ready 2-3 sentence description the student can reuse
}`;

app.post(`${PREFIX}/project-review`, async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { name, description, link, context } = body ?? {};
    if (!description && !name) {
      return c.json({ error: "Describe the project so it can be reviewed." }, 400);
    }
    const userPrompt = `Project name: ${name || "(unnamed)"}\nLink: ${link || "none"}\nDescription:\n${description || "(none)"}\n\nStudent context: intended field ${context?.field || "unknown"}, prefers ${(context?.preferredPaths || []).join(", ") || "project-based work"}.\n\nReturn the admission-value review JSON now.`;
    const review = await callGemini(REVIEW_SYSTEM, userPrompt);
    return c.json({ review, model: GEMINI_MODEL });
  } catch (err) {
    console.log(`Error generating project review with ${GEMINI_MODEL}: ${err}`);
    return c.json({ error: `Failed to review project: ${err}` }, 500);
  }
});

// ---- Auth: signup + profile ----------------------------------------------

interface Profile {
  name: string;
  field: string;
  region: string;
  avoid: string;
  createdAt: string;
}

app.post(`${PREFIX}/signup`, async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { email, password, name, field, region, avoid } = body ?? {};
    if (!email || !password || !name) {
      return c.json({ error: "Missing required fields: email, password, name." }, 400);
    }

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Auto-confirm the email since no email server is configured in this environment.
      email_confirm: true,
    });
    if (error) {
      console.log(`Signup error while creating user ${email}: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    const profile: Profile = {
      name,
      field: field ?? "",
      region: region ?? "",
      avoid: avoid ?? "",
      createdAt: new Date().toISOString(),
    };
    await kv.set(`user:${data.user.id}:profile`, profile);

    return c.json({ ok: true, userId: data.user.id });
  } catch (err) {
    console.log(`Unexpected signup error: ${err}`);
    return c.json({ error: `Signup failed: ${err}` }, 500);
  }
});

async function requireUser(c: { req: { header: (k: string) => string | undefined } }) {
  const accessToken = c.req.header("Authorization")?.split(" ")[1];
  if (!accessToken) return { id: null as string | null };
  const { data } = await admin.auth.getUser(accessToken);
  return { id: data?.user?.id ?? null };
}

app.get(`${PREFIX}/profile`, async (c) => {
  try {
    const { id } = await requireUser(c);
    if (!id) return c.json({ error: "Unauthorized" }, 401);
    const profile = await kv.get(`user:${id}:profile`);
    return c.json({ profile: profile ?? null });
  } catch (err) {
    console.log(`Error loading profile: ${err}`);
    return c.json({ error: `Failed to load profile: ${err}` }, 500);
  }
});

Deno.serve(app.fetch);
