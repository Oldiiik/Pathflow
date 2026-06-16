import type { MemoryState, UniversityBio, UniversityData } from "./types";

// Built-in fallback decision profile, composed from the data we already have.
// Used when the AI (gemini-3.1-flash-lite) is unavailable so the page still works.
export function localBio(d: UniversityData, memory: MemoryState): UniversityBio {
  const avoided = memory.avoidedPaths[0];
  return {
    positioning: `${d.short} is a ${d.difficulty.toLowerCase()} target for your profile, strong in ${d.programs[0] ?? "your field"}.`,
    fitScore: d.fitScore,
    difficulty: d.difficulty,
    snapshot: [
      { label: "Acceptance", value: d.acceptanceNote, confidence: "medium" },
      { label: "Tuition", value: d.tuition, confidence: "high" },
      { label: "Difficulty", value: d.difficulty, confidence: "high" },
      { label: "Best programs", value: d.programs.join(", "), confidence: "high" },
      { label: "Last checked", value: d.lastChecked, confidence: "high" },
    ],
    fitForYou: [
      `Recognised programs in ${d.programs.join(" and ")}.`,
      `Located in ${d.city}, ${d.country} — matches your regional interest.`,
      avoided ? `Project- and portfolio-led paths work here, so avoiding ${avoided.toLowerCase()} isn't a blocker.` : "Rewards applied, project-led profiles.",
    ],
    fitConcerns: d.risks.length ? d.risks : ["Competitive admissions — your profile needs clear external proof."],
    pros: [
      `Best-fit programs: ${d.programs.join(", ")}.`,
      `Evidence on file is ${d.evidenceStatus}.`,
      "Clear application requirements published.",
    ],
    minuses: d.risks.length ? d.risks : ["High competition from international applicants."],
    academicMatch: d.catalogue.slice(0, 3).map((p) => ({ program: p.name, note: p.fitNote })),
    studentLife: {
      goodFor: ["An ambitious peer group", "Strong academic intensity", "Networking and internships"],
      badFor: ["A relaxed, low-pressure pace", "A cheap city", "A simple admissions process"],
    },
    cost: {
      sticker: d.tuition,
      aidForInternationals: "Not specified — check the official site",
      financialRisk: "Medium",
      note: "Built-in estimate. Verify cost and aid on the university's official page.",
    },
    outcomes: {
      summary: `${d.short} graduates place well into industry and graduate study in ${d.programs[0] ?? "the field"}.`,
      caveat: "Outcomes vary by program and cohort; treat figures as directional, not guarantees.",
    },
    gapRadar: d.gaps.map((g) => ({ axis: g, severity: "High" })),
    recommendedFixes: d.gaps.map((g) => `Close gap: ${g}`),
    strategy:
      d.difficulty === "Reach"
        ? "Position yourself with one external, measurable achievement and a single clear narrative — don't present as a generic applicant."
        : "Lead with your strongest verified work and connect it directly to the program; close the listed gaps before applying.",
    evidence: [
      {
        dataPoint: "Programs & requirements",
        value: d.evidence.verified.join(", ") || "Program list",
        source: d.evidence.source,
        confidence: "high",
      },
      ...d.proofs.slice(0, 3).map((p) => ({
        dataPoint: p.label,
        value: p.note,
        source: p.source || "—",
        confidence: p.status === "verified" ? ("high" as const) : p.status === "claimed" ? ("medium" as const) : ("unknown" as const),
      })),
    ],
  };
}
