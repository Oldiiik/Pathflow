// Shared domain types for the Pathflow workspace.

export type ObjectKind =
  | "university"
  | "majorFit"
  | "gapRadar"
  | "opportunity"
  | "portfolio";

export type EvidenceStatus = "verified" | "claimed" | "unknown";

export interface Evidence {
  source: string;
  sourceType: string;
  verified: string[];
  unknown: string[];
  lastChecked: string;
  confidence: number; // 0-100
}

export interface ProgramEntry {
  name: string;
  level: string; // e.g. "Undergraduate"
  duration: string;
  focus: string;
  fitNote: string;
}

export interface ProofItem {
  label: string;
  status: EvidenceStatus;
  source: string;
  note: string;
}

export interface UniversityData {
  name: string;
  short: string; // acronym for compact UI
  country: string;
  city: string;
  fitScore: number;
  difficulty: "Reach" | "Target" | "Likely";
  acceptanceNote: string;
  tuition: string;
  programs: string[];
  catalogue: ProgramEntry[];
  proofs: ProofItem[];
  risks: string[];
  gaps: string[];
  evidenceStatus: EvidenceStatus;
  lastChecked: string;
  evidence: Evidence;
}

export interface MajorFitData {
  major: string;
  fitScore: number;
  whyItFits: string[];
  risks: string[];
  requiredSkills: string[];
  recommendedCourses: string[];
  suggestedProjects: string[];
  evidence: Evidence;
}

export interface GapItem {
  label: string;
  priority: "high" | "medium" | "low";
  axis: string; // radar axis label
  current: number; // 0-100 current strength
  fix: string;
}

export interface GapRadarData {
  summary: string;
  gaps: GapItem[];
  evidence: Evidence;
}

export interface OpportunityData {
  name: string;
  type: string;
  deadline: string;
  cost: string;
  eligibility: string;
  impact: "high" | "medium" | "low";
  fixesGap: string;
  evidence: Evidence;
}

export interface PortfolioItem {
  label: string;
  status: EvidenceStatus;
}

export interface PortfolioData {
  verified: string[];
  claimed: string[];
  inferred: string[];
  missingProof: string[];
  weakAreas: string[];
  rewrite: string;
  evidence: Evidence;
}

export type ObjectData =
  | UniversityData
  | MajorFitData
  | GapRadarData
  | OpportunityData
  | PortfolioData;

export interface WorkspaceObject {
  id: string;
  kind: ObjectKind;
  data: ObjectData;
}

export interface ToolChip {
  id: string;
  label: string;
  kind: ObjectKind;
}

export interface ChatMessage {
  id: string;
  role: "user" | "system";
  text: string;
  resultKinds?: ObjectKind[];
}

// AI-generated decision profile (from gemini-3.1-flash-lite via the server).
export type Confidence = "high" | "medium" | "unknown";

export interface UniversityBio {
  positioning: string;
  fitScore: number;
  difficulty: string;
  snapshot: { label: string; value: string; confidence: Confidence }[];
  fitForYou: string[];
  fitConcerns: string[];
  pros: string[];
  minuses: string[];
  academicMatch: { program: string; note: string }[];
  studentLife: { goodFor: string[]; badFor: string[] };
  cost: { sticker: string; aidForInternationals: string; financialRisk: string; note: string };
  outcomes: { summary: string; caveat: string };
  gapRadar: { axis: string; severity: string }[];
  recommendedFixes: string[];
  strategy: string;
  evidence: { dataPoint: string; value: string; source: string; confidence: Confidence }[];
}

export type TaskStatus = "todo" | "doing" | "done";

export interface RoadmapTask {
  id: string;
  label: string;
  status: TaskStatus;
  priority: "high" | "medium" | "low";
  context: string;
}

export interface Course {
  id: string;
  title: string;
  fixes: string;
  why: string;
  duration: string;
  level: string;
  match: string[];
}

export interface ProjectReview {
  admissionValue: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  rewrite: string;
}

export interface UserProfile {
  name: string;
  field: string;
  region: string;
  avoid: string;
  createdAt?: string;
}

export interface MemoryState {
  goals: string[];
  savedUniversities: string[];
  preferredPaths: string[];
  avoidedPaths: string[];
  openGaps: string[];
  nextSteps: string[];
}
