# Pathflow Backend Implementation Plan

## Goal

Build a secure Node.js backend that turns Pathflow from a mocked frontend into a reliable admissions workspace:

```text
student message -> pipeline model -> validated tool plan -> backend tools -> saved workspace objects
```

Gemini Flash-Lite is the default pipeline model. It should classify, extract, route, normalize, and draft structured objects cheaply. The backend remains the authority for auth, persistence, validation, evidence, and allowed actions.

## Stack

- Node.js + TypeScript
- Fastify for HTTP
- Zod for request/response validation
- Supabase Auth for user identity
- Supabase Postgres for app data
- Gemini API for low-cost pipeline steps
- Later: queue/worker layer for long-running AI jobs

## Phases

### 1. API Foundation

- Create `apps/api` as a separate workspace package.
- Add config validation.
- Add health route.
- Add auth middleware.
- Add strict error handling.
- Add request schema validation.

### 2. Pipeline Foundation

- Add a Gemini client wrapper.
- Add typed schemas for command intent, memory patches, tool plans, and workspace objects.
- Add a first `POST /workspace/command` route.
- Keep model outputs JSON-only and validate every response with Zod.

### 3. Persistence

- Add proper Postgres tables:
  - `profiles`
  - `workspaces`
  - `workspace_messages`
  - `workspace_objects`
  - `workspace_memory`
  - `roadmap_tasks`
  - `ai_pipeline_runs`
  - `ai_generations`
  - `evidence_sources`
- Move workspace state out of localStorage.

### 4. Frontend Switch

- Implement `apiWorkspaceService`.
- Implement `apiDataService`.
- Replace the active service exports in `src/app/lib/services/index.ts`.

### 5. Evidence System

- Store source-backed admissions facts separately from AI prose.
- Let Gemini synthesize from provided evidence, not invent facts.
- Every factual card should expose source, confidence, retrieval date, and unknown fields.

### 6. Hardening

- Add rate limits and body size limits.
- Add per-user AI budget tracking.
- Add route-level ownership checks.
- Add pipeline logs and retry strategy.
- Add tests for schemas, auth, command pipeline, and model fallback behavior.
