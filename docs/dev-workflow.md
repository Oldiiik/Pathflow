# Pathflow Dev Workflow

## What Runs Where

Pathflow uses two local processes:

- Frontend website: `http://127.0.0.1:5173`
- Node API: `http://127.0.0.1:8787`

If Firefox cannot connect to `127.0.0.1:8787`, that only means the API is not running or you opened the API port expecting the website. The website is served by Vite on port `5173`.

## First-Time Setup

Install frontend dependencies:

```bash
npm install
```

Install API dependencies:

```bash
npm install --prefix apps/api
```

Create local env files from the examples:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
```

Keep the frontend workspace API flag off until backend persistence is intentionally being tested:

```bash
VITE_USE_NODE_WORKSPACE_API=false
```

## Daily Local Development

Run the website:

```bash
npm run dev
```

Open the Vite URL, usually:

```text
http://127.0.0.1:5173
```

Run the API in another terminal:

```bash
npm run dev:api
```

Check API health:

```bash
curl http://127.0.0.1:8787/health
```

Expected response:

```json
{"status":"ok","service":"pathflow-api","model":"gemini-3.1-flash-lite"}
```

Run the API smoke check:

```bash
npm run smoke:api
```

If `OPS_TOKEN` is configured, include it to check database/schema readiness too:

```bash
OPS_TOKEN=your-local-ops-token npm run smoke:api
```

## Verification

Before and after meaningful changes:

```bash
npm run verify
```

This includes frontend build, API typecheck/tests/build, and a static migration contract check.

Equivalent commands:

```bash
npm run build
npm run typecheck:api
npm run build:api
```

Run the migration contract check directly:

```bash
npm run migrations:check --prefix apps/api
```

## Environment Rules

Frontend `.env`:

```bash
VITE_PATHFLOW_API_BASE=http://127.0.0.1:8787
VITE_USE_NODE_WORKSPACE_API=false
```

API `.env`:

```bash
PORT=8787
HOST=127.0.0.1
FRONTEND_ORIGIN=http://localhost:5173
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...
GEMINI_API_KEY=...
GEMINI_PIPELINE_MODEL=gemini-3.1-flash-lite
AI_DAILY_REQUEST_LIMIT=40
OPS_TOKEN=...
```

Check API/connected smoke env before a real backend run:

```bash
npm run env:check --prefix apps/api
```

For an API-only check that does not require `SUPABASE_ANON_KEY`:

```bash
ENV_CHECK_MODE=api npm run env:check --prefix apps/api
```

Only set `VITE_USE_NODE_WORKSPACE_API=true` when all of these are true:

- Supabase migration is applied.
- `apps/api/.env` has real Supabase and Gemini values.
- Node API is running.
- Auth/session flow is confirmed.

## Connected MVP Testing

You can invite friends to test the connected frontend + backend loop after this checklist passes:

- Supabase migrations are applied.
- `apps/api/.env` has real `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, and `OPS_TOKEN`.
- API is deployed or running on a reachable machine.
- `npm run smoke:api` passes against the API URL:

```bash
PATHFLOW_API_BASE=https://your-api-host OPS_TOKEN=your-ops-token npm run smoke:api
```

Then run the connected smoke test. It checks `/ops/readiness` when `OPS_TOKEN` is provided, creates a temporary smoke user, signs in through Supabase Auth, generates an MVP university object, saves workspace state, reloads it, and exercises `/workspace/command` once:

```bash
PATHFLOW_API_BASE=https://your-api-host OPS_TOKEN=your-ops-token npm run smoke:connected
```

For automatically generated smoke users, the script deletes the user at the end when `SUPABASE_SERVICE_ROLE_KEY` is available. Set `SMOKE_KEEP_USER=true` if you want to inspect the created account after a run.

The command smoke step consumes one AI request reservation for the smoke user. Keep `AI_DAILY_REQUEST_LIMIT` at `1` or higher.

To also test Gemini-backed AI feature routes, run:

```bash
SMOKE_AI_FEATURES=true npm run smoke:connected
```

- Frontend env points at that API:

```bash
VITE_PATHFLOW_API_BASE=https://your-api-host
VITE_USE_NODE_WORKSPACE_API=true
```

For the first friend test, verify these flows only:

- sign up / sign in
- submit a command
- generate university, major, gaps, opportunity, and portfolio objects
- save/reload workspace
- open university bio and project review

## Debug Protocol

If the browser cannot connect to `127.0.0.1:8787`:

- Confirm whether you meant API or frontend.
- For the website, open `http://127.0.0.1:5173`.
- For API, run `npm run dev:api`, then check `/health`.

If the frontend fails:

- Confirm `npm run dev` is running.
- Open the Vite URL printed by the terminal.
- Check the browser console.

If login or workspace persistence fails:

- Keep `VITE_USE_NODE_WORKSPACE_API=false` unless backend persistence is intentionally being tested.
- If testing backend persistence, confirm Supabase migration, API env, and a valid signed-in session.

## Working With Codex

Use medium reasoning for routine implementation, UI fixes, service wiring, and small backend routes.

Ask for deeper reasoning before:

- database migrations
- auth/security boundaries
- production hosting/deploy
- AI pipeline schemas and cost controls
- evidence/fact-verification logic
- unexplained runtime failures

Best prompt shape:

```text
Symptom:
Command:
URL:
Browser console:
Server output:
What I expected:
```

Keep tasks focused: “fix local dev”, “connect workspace API”, “design pipeline schema”, or “debug auth”.
