import { generateJson } from "../geminiClient.js";
import {
  ProjectReviewSchema,
  type ProjectReview,
} from "../../domain/aiFeatureSchemas.js";

const SYSTEM = `You are Pathflow's admissions project reviewer. Judge a student's project only for university-admission value, honestly, like a selective admissions reader.

Rules:
- Be specific and concrete. No generic praise.
- Focus on real problem, measurable impact, student's personal contribution, evidence, and connection to intended field.
- If it is weak or under-explained, say so.
- Return JSON only.`;

const OUTPUT_CONTRACT = `Return exactly one JSON object with this shape:
{
  "admissionValue": "Moderate",
  "summary": "Concise assessment.",
  "strengths": ["Specific strength."],
  "weaknesses": ["Specific weakness."],
  "improvements": ["Concrete improvement."],
  "rewrite": "Stronger admissions-facing rewrite."
}

Use admissionValue only: "Strong", "Moderate", "Weak", or "Under-explained".
Do not return an array. Do not wrap the object in another key.`;

export async function reviewProject(input: {
  name?: string;
  description?: string;
  link?: string;
  context?: {
    field?: string;
    preferredPaths?: string[];
  };
}): Promise<{ review: ProjectReview; model: string }> {
  const prompt = `Project name: ${input.name || "(unnamed)"}
Link: ${input.link || "none"}
Description:
${input.description || "(none)"}

Student context:
- Intended field: ${input.context?.field || "unknown"}
- Preferred paths: ${(input.context?.preferredPaths ?? []).join(", ") || "project-based work"}

${OUTPUT_CONTRACT}

Return the admission-value review JSON now.`;

  const result = await generateJson({
    task: "review_project_for_admissions_value",
    system: SYSTEM,
    prompt,
    schema: ProjectReviewSchema,
    temperature: 0.35,
  });

  return { review: result.data, model: result.model };
}
