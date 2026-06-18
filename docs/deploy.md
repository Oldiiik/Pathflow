# Pathflow MVP Deploy

This deploy path optimizes for a reliable friend-testable MVP:

- Frontend: Vercel static Vite app.
- API: Render Node web service from `apps/api`.
- Database/Auth: Supabase hosted project.
- AI: Gemini via the Node API only.

## Why This Split

Vercel is a good fit for the Vite SPA and can rewrite deep links to `index.html`.
Render is a better fit for this Fastify API because it runs as a normal long-lived Node web service with `/health`.

## Required State Before Deploy

- Supabase migrations are applied.
- `npm run verify` passes locally.
- `SMOKE_AI_FEATURES=true npm run smoke:connected --prefix apps/api` passes locally.
- Root frontend env and `apps/api/.env` point at the same Supabase project.

Generate lockfiles before the final production deploy:

```bash
npm install
npm install --prefix apps/api
```

Sync local frontend Supabase env from `apps/api/.env` before local hosted-mode checks:

```bash
npm run env:sync:frontend
```

## API On Render

Use the checked-in `render.yaml` blueprint.

The blueprint uses Render's free plan for MVP testing. Expect cold starts after inactivity; the first request can be slow while the API wakes up.

Service settings:

```text
Root directory: apps/api
Build command: npm ci && npm run deploy:check && npm run build
Start command: npm run start
Health check path: /health
```

Required Render environment variables:

```text
NODE_ENV=production
HOST=0.0.0.0
FRONTEND_ORIGIN=https://your-vercel-domain.vercel.app
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...
GEMINI_API_KEY=...
GEMINI_PIPELINE_MODEL=gemini-3.1-flash-lite
AI_DAILY_REQUEST_LIMIT=40
OPS_TOKEN=generate-a-long-random-value
```

Do not put secret values in `render.yaml`.

If the Vercel domain changes after the first deploy, update `FRONTEND_ORIGIN` on Render and redeploy the API.

Practical first deploy order:

1. Create the Render API service with the env above. Use a temporary HTTPS frontend origin if Vercel is not deployed yet.
2. Deploy Vercel with `VITE_PATHFLOW_API_BASE` set to the Render API URL.
3. Update Render `FRONTEND_ORIGIN` to the final Vercel URL.
4. Redeploy Render and run post-deploy smoke.

## Frontend On Vercel

Use the checked-in `vercel.json`.

Vercel production environment variables:

```text
VITE_PATHFLOW_API_BASE=https://your-render-api.onrender.com
VITE_USE_NODE_WORKSPACE_API=true
VITE_SUPABASE_PROJECT_ID=your-project-ref
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

The Vercel build command runs `npm run deploy:check:frontend` before `npm run build`, so production deploy fails early if the frontend points at localhost, uses the legacy Supabase project, or leaves backend workspace mode disabled.

## Supabase Auth Settings

In Supabase Auth URL settings, add the deployed frontend domain:

```text
Site URL: https://your-vercel-domain.vercel.app
Redirect URLs: https://your-vercel-domain.vercel.app/**
```

## Post-Deploy Smoke

Check public API health:

```bash
curl https://your-render-api.onrender.com/health
```

Check private readiness:

```bash
PATHFLOW_API_BASE=https://your-render-api.onrender.com OPS_TOKEN=your-ops-token npm run smoke:api
```

Check connected auth/workspace/AI flow:

```bash
PATHFLOW_API_BASE=https://your-render-api.onrender.com OPS_TOKEN=your-ops-token SMOKE_AI_FEATURES=true npm run smoke:connected
```

Then manually test:

- sign up / sign in on the Vercel URL
- submit a command
- generate and save workspace objects
- refresh the page and confirm the workspace reloads
- open university bio and project review

## Rollback

- Frontend: use Vercel deployment rollback or redeploy the previous commit.
- API: use Render rollback or redeploy the previous successful commit.
- If only CORS fails, update `FRONTEND_ORIGIN` first; do not rotate keys unless a key leaked.

## When To Use Extra-High Reasoning

Use extra-high for:

- changing Supabase schema or RLS
- rotating production secrets
- changing auth/session logic
- moving hosting providers
- debugging unexplained production failures
