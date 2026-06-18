import { generateJson } from "../geminiClient.js";
import {
  UniversityBioSchema,
  type UniversityBio,
} from "../../domain/aiFeatureSchemas.js";
import { MemoryStateSchema, type MemoryState } from "../../domain/workspaceSchemas.js";

const SYSTEM = `You are Pathflow's admissions intelligence engine. You produce a decision profile for a university tailored to one student, not a Wikipedia summary.

Rules:
- Be honest. Always include real downsides.
- Personalise fit, concerns, gaps, and strategy from the student context.
- NEVER invent precise statistics. If a number is not reliably known, use "Not publicly reported" and confidence "unknown".
- Only mark confidence "high" for well-established facts.
- Keep prose tight and concrete.
- Return JSON only.`;

export async function generateUniversityBio(input: {
  name: string;
  country?: string;
  city?: string;
  context?: Partial<MemoryState>;
}): Promise<{ bio: UniversityBio; model: string }> {
  const context = MemoryStateSchema.parse(input.context ?? {});
  const prompt = `University: ${input.name}
Location: ${input.city || "unknown city"}, ${input.country || "unknown country"}

Student context:
- Goals: ${context.goals.join("; ") || "not stated"}
- Avoided paths: ${context.avoidedPaths.join("; ") || "none"}
- Preferred paths: ${context.preferredPaths.join("; ") || "none yet"}
- Open gaps: ${context.openGaps.join("; ") || "not known"}

Produce the personalised decision profile JSON now.`;

  const result = await generateJson({
    task: "generate_university_decision_profile",
    system: SYSTEM,
    prompt,
    schema: UniversityBioSchema,
    temperature: 0.4,
  });

  return { bio: result.data, model: result.model };
}
