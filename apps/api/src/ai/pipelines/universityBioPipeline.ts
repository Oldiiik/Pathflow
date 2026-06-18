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

const OUTPUT_CONTRACT = `Return exactly one JSON object with these exact top-level keys and value types:
{
  "positioning": "Short one-sentence fit positioning.",
  "fitScore": 82,
  "difficulty": "Reach",
  "snapshot": [
    { "label": "Location", "value": "Singapore", "confidence": "high" },
    { "label": "Admissions", "value": "Highly selective", "confidence": "medium" }
  ],
  "fitForYou": ["Specific reason this university fits the student."],
  "fitConcerns": ["Specific concern or mismatch."],
  "pros": ["Concrete advantage."],
  "minuses": ["Concrete downside."],
  "academicMatch": [
    { "program": "Business Analytics", "note": "Why it fits the student's goals." }
  ],
  "studentLife": {
    "goodFor": ["Student preference this environment supports."],
    "badFor": ["Student preference this environment may not support."]
  },
  "cost": {
    "sticker": "Not publicly reported",
    "aidForInternationals": "Limited or uncertain",
    "financialRisk": "High",
    "note": "Use cautious language if exact cost is unknown."
  },
  "outcomes": {
    "summary": "Outcome profile in cautious terms.",
    "caveat": "Important evidence limitation."
  },
  "gapRadar": [
    { "axis": "Project impact", "severity": "High" }
  ],
  "recommendedFixes": ["Action the student can take."],
  "strategy": "Concise application strategy.",
  "evidence": [
    { "dataPoint": "Program availability", "value": "Known or uncertain", "source": "Official university site or unknown", "confidence": "medium" }
  ]
}

Use difficulty only: "Likely", "Target", "Reach", or "Extreme".
Use confidence only: "high", "medium", or "unknown".
Do not omit any top-level key. Do not return an array. Do not wrap the object in another key.`;

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

${OUTPUT_CONTRACT}

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
