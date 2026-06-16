# Pathflow — Fluid Admission Workspace

## Context

The user wants to build **Pathflow**, an AI admission workspace where natural-language
chat is a *command layer* that spawns structured, actionable UI objects into a living
workspace — not a chatbot, not a static dashboard. The detailed spec
(`src/imports/pasted_text/pathflow-workspace-guide.md`) defines the feeling (clean,
intelligent, calm, premium-but-practical), an exact color system, Poppins typography,
a three-zone layout, six core UI objects, and strict anti-AI-slop rules.

Decision (confirmed with user): **fully mocked frontend simulation** — intent detection
is keyword/phrase matching that maps to tool chips and seeds realistic card data. No
Supabase / LLM backend.

Project is a clean Figma Make slate (empty `App.tsx`) with Motion `12.x`, `lucide-react`,
Tailwind v4, and a full shadcn/Radix `ui` component library already installed. No
`@make-kits` design system.

## Design Tokens & Typography

- **`src/styles/fonts.css`**: add `@import` for Poppins (Google Fonts) at top of file.
- **`src/styles/theme.css`**: add Pathflow palette as CSS custom properties on `:root`
  and set `--font-sans` / body font to Poppins. Palette:
  - bg ivory `#F8F7F3`, text graphite `#171717`, secondary gray `#6B6F76`,
    card `#FFFFFF`, border warm gray `#E8E4DC`, accent ruby `#D83A42`,
    pale-red surface `#FFF1F2`, success `#1F7A4D`, warning `#C47A1B`, unknown `#8B8F97`.
  - Expose as `--pf-bg`, `--pf-ink`, `--pf-muted`, `--pf-card`, `--pf-border`,
    `--pf-accent`, `--pf-accent-soft`, `--pf-success`, `--pf-warn`, `--pf-unknown`.
  - Components reference these via Tailwind arbitrary values, e.g.
    `bg-[var(--pf-card)]`, `text-[var(--pf-ink)]`, `border-[var(--pf-border)]`.
  - Red is a signal only — never the environment.

## Architecture

Pure React/Vite (no RSC). Central state via a `WorkspaceProvider` context + `useReducer`
to avoid prop-drilling across the three panels.

### State (`src/app/store/workspace.tsx`)
- `messages`: chat log (user + system intent messages).
- `pendingChips`: tool chips currently animating in chat before they expand.
- `objects`: ordered array of workspace UI objects (typed: `university` | `majorFit` |
  `gapRadar` | `opportunity` | `portfolio`).
- `memory`: `{ goals, savedUniversities, preferredPaths, avoidedPaths, openGaps, nextSteps }`.
- `evidenceDrawer`: currently open evidence target (or null).
- Actions: `submitMessage`, `resolveChip` (chip → workspace object), `saveToMemory`,
  `addAvoidedPath`, `openEvidence`, `closeEvidence`, `dismissObject`.

### Mock intelligence (`src/app/lib/intent.ts`)
- `detectIntent(text)` → array of tool chips (`{ id, label, kind }`) via keyword/phrase
  matching (e.g. "business"/"major" → Major Fit; "university"/region words → University
  Match; "gap"/"don't have"/"missing" → Gap Radar; "hackathon"/"certificate"/"portfolio"
  → Portfolio Diagnosis; "event"/"olympiad"/"opportunity" → Opportunity; negations like
  "I don't like X" → avoided path into memory).
- `seedObject(kind, context)` → realistic seed data for each card type
  (`src/app/lib/mockData.ts`): real public universities (NUS, HKU, KAIST, NTU, HKUST),
  fit scores, evidence with source/last-checked/confidence, organic non-round numbers
  per anti-slop rules. No lorem ipsum, no "John Doe", no fake avatars.

### Layout (`src/app/App.tsx`)
- `min-h-[100dvh]` ivory background, three-zone grid:
  `grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)_300px]`. On `< lg` the panels stack /
  collapse to single column (chat + workspace; memory becomes a drawer/sheet).
- Wraps everything in `WorkspaceProvider`.

### Panels (`src/app/components/`)
- `panels/ChatCommandPanel.tsx` — command-console styled chat (not a ChatGPT clone):
  input with send, message list, and animated **tool chips** that appear after a message,
  then morph/expand into the workspace via Motion shared `layoutId`. Includes a few
  starter prompt suggestions and an empty state.
- `panels/DynamicWorkspace.tsx` — center; renders `objects` with `AnimatePresence` +
  spring `layout`; staggered reveal; skeleton loading state while a chip "processes";
  composed empty state ("Talk to Pathflow to build your workspace").
- `panels/MemoryRoadmap.tsx` — right; persistent memory sections (goals, saved
  universities, preferred/avoided paths, open gaps, next steps) with section dividers
  (`divide-y`/`border-t`) rather than boxed cards; empty states per section.

### UI Object cards (`src/app/components/objects/`)
One file each, all driven by typed props, each with hover elevation, evidence access, and
contextual actions:
- `UniversityCard.tsx` — name, country, fit score, difficulty, best-fit programs, risks,
  missing gaps, evidence status, last-checked; actions: Add to My Universities, Compare,
  Build Roadmap, Show Evidence.
- `MajorFitCard.tsx` — major, fit score, why it fits, risks, required skills, recommended
  courses, suggested projects.
- `GapRadar.tsx` — prioritized missing items with priority levels + recommended fixes
  (use a small radar/visual via recharts `RadarChart` or a custom bar list; meaningful,
  not decorative).
- `OpportunityCard.tsx` — event/program, type, deadline, cost, eligibility, impact,
  which gap it fixes, evidence source; action: save into roadmap.
- `PortfolioDiagnosis.tsx` — verified vs claimed vs inferred achievements, missing proof,
  weak areas, portfolio-ready rewrite.
- `EvidenceDrawer.tsx` — uses `ui/sheet.tsx`; source, source type, what was verified,
  what is unknown, last-checked, confidence score. Shared across all factual cards.
- `shared/` small primitives: `FitScore`, `ConfidenceTag`, `EvidenceChip`,
  `PriorityBadge`, `ToolChip` (reused in chat + workspace via `layoutId`).

## Motion

- Spring transitions (`type: "spring", stiffness ~100, damping ~20`) for card entrance
  and chip→card expansion; shared-element `layoutId` so a tool chip in chat visually
  becomes the card in the workspace.
- Staggered list reveals, gentle hover elevation, animated progress/fit bars, skeleton
  loaders. No bounce, no glow, no spinning AI icons, no particles. Animate only
  `transform`/`opacity`.

## Key files to create / modify

- Modify: `src/styles/fonts.css`, `src/styles/theme.css`, `src/app/App.tsx`
- Create: `src/app/store/workspace.tsx`, `src/app/lib/intent.ts`, `src/app/lib/mockData.ts`
- Create: `src/app/components/panels/{ChatCommandPanel,DynamicWorkspace,MemoryRoadmap}.tsx`
- Create: `src/app/components/objects/{UniversityCard,MajorFitCard,GapRadar,OpportunityCard,PortfolioDiagnosis,EvidenceDrawer}.tsx`
- Create: `src/app/components/shared/{FitScore,ConfidenceTag,EvidenceChip,PriorityBadge,ToolChip}.tsx`
- Reuse existing `ui/` components: `sheet`, `button`, `badge`, `skeleton`, `progress`,
  `input`, `tooltip`, `scroll-area`, `chart`/recharts.

## Verification

- The Vite dev server is already running; review via the Figma Make preview surface
  (do not start a server or open localhost).
- Manual end-to-end check:
  1. App loads to the three-zone ivory layout with composed empty states.
  2. Type "I want to study business in Asia, I don't like olympiads, and I have a few
     hackathon certificates." → tool chips (Major Fit, University Match, Gap Radar,
     Portfolio) appear in chat, then expand into matching cards in the center.
  3. "I don't like olympiads" registers an avoided path in the right memory panel.
  4. Click **Add to My Universities** on a University Card → it appears under saved
     universities in memory.
  5. Click **Show Evidence** → evidence drawer opens with source/confidence/last-checked.
  6. Resize to mobile width → panels collapse to a single column without horizontal scroll.
- Confirm Poppins is applied, palette matches the spec, and red is used only for active
  states / priority / key actions.
