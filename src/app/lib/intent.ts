// Mocked intent detection: maps a natural-language message to tool chips and
// memory side-effects. Keyword/phrase matching only — no backend.

import type { ObjectKind, ToolChip } from "./types";
import { uid } from "./mockData";

const CHIP_LABELS: Record<ObjectKind, string> = {
  university: "University Match",
  majorFit: "Major Fit",
  gapRadar: "Gap Radar",
  opportunity: "Opportunity",
  portfolio: "Portfolio Diagnosis",
};

interface IntentResult {
  chips: ToolChip[];
  avoidedPaths: string[];
  goals: string[];
  systemMessage: string;
}

const has = (text: string, words: string[]) =>
  words.some((w) => text.includes(w));

export function detectIntent(raw: string): IntentResult {
  const text = raw.toLowerCase();
  const kinds = new Set<ObjectKind>();
  const avoidedPaths: string[] = [];
  const goals: string[] = [];

  // University intent — region words or explicit mention.
  if (
    has(text, [
      "universit",
      "college",
      "school",
      "asia",
      "singapore",
      "hong kong",
      "korea",
      "japan",
      "abroad",
      "study in",
      "where should i",
    ])
  ) {
    kinds.add("university");
  }

  // Major / field of study.
  if (
    has(text, ["business", "major", "field", "study", "degree", "course", "program", "analytics", "finance", "engineering", "cs", "computer"])
  ) {
    kinds.add("majorFit");
  }

  // Gaps.
  if (
    has(text, ["gap", "missing", "don't have", "dont have", "weak", "lacking", "blocking", "reach school", "improve", "what do i need"])
  ) {
    kinds.add("gapRadar");
  }

  // Opportunities.
  if (
    has(text, ["opportunit", "event", "competition", "program me", "scholarship", "fix my", "what can i do", "deadline"])
  ) {
    kinds.add("opportunity");
  }

  // Portfolio.
  if (
    has(text, ["portfolio", "certificate", "achievement", "hackathon", "project", "experience", "resume", "cv", "profile"])
  ) {
    kinds.add("portfolio");
  }

  // Negation → avoided path. "I don't like X", "I hate X", "no X".
  const negationMatch = raw.match(
    /(?:don['’]?t|do not|dont)\s+(?:like|want|enjoy)\s+([a-z\s]+?)(?:[.,;!?]|and|but|$)/i
  );
  if (negationMatch) {
    const path = negationMatch[1].trim();
    if (path) avoidedPaths.push(capitalize(path));
  } else if (/\bno olympiad|hate olympiad|avoid olympiad/i.test(raw)) {
    avoidedPaths.push("Olympiads");
  }

  // Goal capture from "I want to ...".
  const goalMatch = raw.match(/i want to\s+([a-z\s]+?)(?:[.,;!?]|,|$)/i);
  if (goalMatch) goals.push(capitalize(goalMatch[1].trim()));

  // Fallback: if nothing matched, give a Major Fit starting point.
  if (kinds.size === 0) kinds.add("majorFit");

  const chips: ToolChip[] = [...kinds].map((kind) => ({
    id: uid("chip"),
    label: CHIP_LABELS[kind],
    kind,
  }));

  const systemMessage = buildSystemMessage(chips, avoidedPaths);

  return { chips, avoidedPaths, goals, systemMessage };
}

function buildSystemMessage(chips: ToolChip[], avoided: string[]): string {
  const tools = chips.map((c) => c.label).join(", ");
  let msg = `Detected intent. Running ${chips.length} tool${chips.length > 1 ? "s" : ""}: ${tools}.`;
  if (avoided.length) msg += ` Noting avoided path: ${avoided.join(", ")}.`;
  return msg;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
