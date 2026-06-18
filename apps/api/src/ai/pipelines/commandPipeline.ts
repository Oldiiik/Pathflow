import { z } from "zod";
import { generateJson } from "../geminiClient.js";
import {
  CommandPipelineResultSchema,
  MemoryStateSchema,
  type CommandPipelineResult,
  type MemoryState,
  type ObjectKind,
} from "../../domain/workspaceSchemas.js";

const SYSTEM = `You are Pathflow's cheap pipeline model.

You do not write long advice. You classify a student's admissions message into structured backend actions.

Rules:
- Return JSON only.
- Use only these tool kinds: university, majorFit, gapRadar, opportunity, portfolio.
- Extract durable student memory only when the user clearly states it.
- Prefer precise, compact labels.
- Do not invent facts, universities, scores, or deadlines.
- If the message is vague, choose majorFit as a useful starting tool.`;

const OUTPUT_CONTRACT = `Return exactly one JSON object with this shape:
{
  "systemMessage": "Detected intent. Running 2 tools.",
  "memoryPatch": {
    "goals": ["Study business in Asia"],
    "avoidedPaths": ["Olympiads"]
  },
  "tools": [
    { "kind": "university", "reason": "The student mentioned studying in Asia.", "priority": "medium" },
    { "kind": "majorFit", "reason": "The student mentioned business.", "priority": "medium" }
  ],
  "roadmapSuggestions": [
    { "label": "Add measurable project outcomes", "priority": "high", "context": "Command" }
  ]
}

Do not return an array. Do not wrap the object in another key. Use only valid tool kinds.`;

const KEYWORDS: Record<ObjectKind, string[]> = {
  university: ["universit", "college", "school", "asia", "singapore", "hong kong", "korea", "japan", "usa", "abroad"],
  majorFit: ["major", "field", "study", "degree", "business", "analytics", "finance", "engineering", "computer", "cs"],
  gapRadar: ["gap", "missing", "weak", "lacking", "improve", "risk", "reach", "what do i need"],
  opportunity: ["opportunit", "competition", "event", "program", "scholarship", "deadline", "internship"],
  portfolio: ["portfolio", "certificate", "achievement", "hackathon", "project", "resume", "cv", "experience"],
};

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).trim();
}

function cleanAvoidedPath(value: string): string {
  return value
    .replace(/\b(?:and|but)\b.*$/i, "")
    .replace(/\b(?:competitions?|projects?|programs?|events?)\b.*$/i, "$1")
    .trim();
}

function fallbackPipeline(message: string): CommandPipelineResult {
  const lower = message.toLowerCase();
  const kinds = new Set<ObjectKind>();

  for (const [kind, words] of Object.entries(KEYWORDS) as [ObjectKind, string[]][]) {
    if (includesAny(lower, words)) kinds.add(kind);
  }
  if (kinds.size === 0) kinds.add("majorFit");

  const avoidedPaths: string[] = [];
  const negation = message.match(/(?:don['’]?t|do not|dont)\s+(?:like|want|enjoy)\s+([a-z\s]+?)(?:[.,;!?]|$)/i);
  if (negation?.[1]) {
    const path = cleanAvoidedPath(negation[1]);
    if (path) avoidedPaths.push(titleCase(path));
  }
  if (/\b(no|avoid|hate)\s+olympiad/i.test(message)) avoidedPaths.push("Olympiads");

  const goals: string[] = [];
  const goal = message.match(/i want to\s+([a-z\s]+?)(?:[.,;!?]|$)/i);
  if (goal?.[1]) goals.push(titleCase(goal[1]));

  const tools = [...kinds].map((kind) => ({
    kind,
    reason: `Detected ${kind} intent from the message.`,
    priority: "medium" as const,
  }));

  return CommandPipelineResultSchema.parse({
    systemMessage: `Detected intent. Running ${tools.length} tool${tools.length > 1 ? "s" : ""}.`,
    memoryPatch: {
      ...(goals.length ? { goals } : {}),
      ...(avoidedPaths.length ? { avoidedPaths } : {}),
    },
    tools,
    roadmapSuggestions: [],
  });
}

export async function runCommandPipeline(input: {
  message: string;
  memory?: Partial<MemoryState>;
}): Promise<CommandPipelineResult & { usedFallback: boolean; model: string | null; fallbackReason?: string }> {
  const memory = MemoryStateSchema.parse(input.memory ?? {});

  const prompt = `Student message:
${input.message}

Current memory:
${JSON.stringify(memory, null, 2)}

${OUTPUT_CONTRACT}

Return the command pipeline JSON now.`;

  try {
    const result = await generateJson({
      task: "classify_command_and_plan_tools",
      system: SYSTEM,
      prompt,
      schema: CommandPipelineResultSchema,
      temperature: 0.1,
    });
    return { ...result.data, usedFallback: false, model: result.model };
  } catch (error) {
    const fallback = fallbackPipeline(input.message);
    const fallbackReason = error instanceof Error ? error.message : String(error);
    return { ...fallback, usedFallback: true, model: null, fallbackReason };
  }
}

export const CommandPipelineResponseSchema = CommandPipelineResultSchema.extend({
  usedFallback: z.boolean(),
  model: z.string().nullable(),
});
