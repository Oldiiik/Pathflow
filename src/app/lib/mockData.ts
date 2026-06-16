// Realistic seed data for Pathflow workspace objects.
// No lorem ipsum, no round/fake numbers, no placeholder people.

import type {
  GapRadarData,
  MajorFitData,
  ObjectKind,
  OpportunityData,
  PortfolioData,
  UniversityData,
  WorkspaceObject,
} from "./types";

let counter = 0;
export function uid(prefix = "id"): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

const CHECK_DATE = "16 Jun 2026";

const universities: UniversityData[] = [
  {
    name: "National University of Singapore",
    short: "NUS",
    country: "Singapore",
    city: "Singapore",
    fitScore: 87,
    difficulty: "Reach",
    acceptanceNote: "~6.8% for international business applicants",
    tuition: "S$38,200 / yr (non-subsidised)",
    programs: ["BBA (Business Administration)", "Business Analytics"],
    catalogue: [
      {
        name: "Bachelor of Business Analytics",
        level: "Undergraduate · 4 yr",
        duration: "Aug 2027 intake",
        focus: "Data, optimisation, decision science",
        fitNote: "Strongest match — rewards applied project work over contest medals",
      },
      {
        name: "BBA (Business Administration)",
        level: "Undergraduate · 3–4 yr",
        duration: "Aug 2027 intake",
        focus: "Strategy, finance, operations",
        fitNote: "Broad fit; specialise in analytics track in year 2",
      },
      {
        name: "Bachelor of Computing + Business (Double)",
        level: "Undergraduate · 4 yr",
        duration: "Aug 2027 intake",
        focus: "Software + management",
        fitNote: "Leverages hackathon background directly",
      },
    ],
    proofs: [
      {
        label: "Program list & structure",
        status: "verified",
        source: "nus.edu.sg/admissions",
        note: "Confirmed against the official 2027 intake catalogue.",
      },
      {
        label: "Application deadline window",
        status: "verified",
        source: "nus.edu.sg/admissions/key-dates",
        note: "International round closes late Feb 2027.",
      },
      {
        label: "2026 cohort acceptance rate",
        status: "unknown",
        source: "—",
        note: "NUS does not publish per-faculty rates; figure is an estimate band.",
      },
      {
        label: "Analytics scholarship cutoffs",
        status: "claimed",
        source: "Student forum thread (unverified)",
        note: "Needs confirmation from the financial aid office.",
      },
    ],
    risks: ["No quantified leadership proof", "Essay narrative still generic"],
    gaps: ["International recognition", "Math olympiad-free quant signal"],
    evidenceStatus: "verified",
    lastChecked: CHECK_DATE,
    evidence: {
      source: "nus.edu.sg/admissions — 2027 intake requirements",
      sourceType: "Official university page",
      verified: ["Program list", "Application deadline window", "English requirement"],
      unknown: ["Exact 2026 cohort acceptance rate", "Scholarship cutoffs"],
      lastChecked: CHECK_DATE,
      confidence: 82,
    },
  },
  {
    name: "Hong Kong University of Science & Technology",
    short: "HKUST",
    country: "Hong Kong",
    city: "Clear Water Bay",
    fitScore: 79,
    difficulty: "Target",
    acceptanceNote: "~12% non-local business intake",
    tuition: "HK$180,000 / yr (non-local)",
    programs: ["BBA in Global Business", "Economics & Finance"],
    catalogue: [
      {
        name: "BBA in Global Business",
        level: "Undergraduate · 4 yr",
        duration: "Sep 2027 intake",
        focus: "International strategy, exchange-heavy",
        fitNote: "Good fit; exchange year strengthens the international gap",
      },
      {
        name: "BSc in Economics & Finance",
        level: "Undergraduate · 4 yr",
        duration: "Sep 2027 intake",
        focus: "Quantitative finance",
        fitNote: "Quant-heavy — close a coursework gap first",
      },
      {
        name: "BSc in Data Science & Technology",
        level: "Undergraduate · 4 yr",
        duration: "Sep 2027 intake",
        focus: "ML, data engineering",
        fitNote: "Aligns with hackathon work; less business-forward",
      },
    ],
    proofs: [
      {
        label: "Program structure",
        status: "verified",
        source: "hkust.edu.hk/programs",
        note: "Matches the official undergraduate catalogue.",
      },
      {
        label: "Non-local admission track",
        status: "verified",
        source: "join.hkust.edu.hk",
        note: "Direct application route confirmed for non-local students.",
      },
      {
        label: "Interview weighting for 2027",
        status: "unknown",
        source: "—",
        note: "Weighting not disclosed publicly for the upcoming cycle.",
      },
    ],
    risks: ["Limited finance coursework", "No internship on record"],
    gaps: ["Quantitative coursework depth"],
    evidenceStatus: "verified",
    lastChecked: CHECK_DATE,
    evidence: {
      source: "hkust.edu.hk — Undergraduate programs catalogue",
      sourceType: "Official university page",
      verified: ["Program structure", "Non-local admission track"],
      unknown: ["Interview weighting for 2027"],
      lastChecked: CHECK_DATE,
      confidence: 76,
    },
  },
  {
    name: "Korea Advanced Institute of Science & Technology",
    short: "KAIST",
    country: "South Korea",
    city: "Daejeon",
    fitScore: 71,
    difficulty: "Reach",
    acceptanceNote: "Selective international track",
    tuition: "₩13,000,000 / yr (before aid)",
    programs: ["Business & Technology Management"],
    catalogue: [
      {
        name: "Business & Technology Management",
        level: "Undergraduate · 4 yr",
        duration: "Mar 2027 intake",
        focus: "Tech entrepreneurship, MOT",
        fitNote: "Best business-leaning option in a STEM-first institute",
      },
      {
        name: "Industrial & Systems Engineering",
        level: "Undergraduate · 4 yr",
        duration: "Mar 2027 intake",
        focus: "Operations, optimisation",
        fitNote: "Quant-intensive; strong analytics adjacency",
      },
    ],
    proofs: [
      {
        label: "Degree offered",
        status: "verified",
        source: "kaist.ac.kr",
        note: "BTM program confirmed in the official guide.",
      },
      {
        label: "English-taught track exists",
        status: "verified",
        source: "admission.kaist.ac.kr",
        note: "International undergraduate admission is English-medium.",
      },
      {
        label: "Hackathon work in technical review",
        status: "unknown",
        source: "—",
        note: "Unclear whether portfolio projects count toward the technical assessment.",
      },
    ],
    risks: ["STEM-heavy curriculum may clash with stated dislike of olympiads"],
    gaps: ["Research or technical project evidence"],
    evidenceStatus: "claimed",
    lastChecked: CHECK_DATE,
    evidence: {
      source: "kaist.ac.kr — International admissions guide",
      sourceType: "Official PDF (cached)",
      verified: ["Degree offered", "English-taught track exists"],
      unknown: ["Whether hackathon work counts toward technical review"],
      lastChecked: CHECK_DATE,
      confidence: 58,
    },
  },
];

const majorFits: MajorFitData[] = [
  {
    major: "Business Analytics",
    fitScore: 84,
    whyItFits: [
      "Hackathon certificates show applied problem-solving under time pressure",
      "Stated dislike of olympiads is fine — analytics rewards projects over contest medals",
      "Asia hubs (Singapore, Hong Kong) have deep analytics job markets",
    ],
    risks: ["No SQL or Python artifact on record yet", "Math signal currently inferred, not proven"],
    requiredSkills: ["Statistics", "SQL", "Python or R", "Data storytelling"],
    recommendedCourses: ["Intro to Statistical Learning", "Databases for Decisions"],
    suggestedProjects: ["Turn a hackathon prototype into a measured case study (cite impact %)"],
    evidence: {
      source: "Inferred from your stated interests + uploaded certificates",
      sourceType: "Model inference",
      verified: ["3 hackathon certificates referenced"],
      unknown: ["Final project metrics", "Quant test scores"],
      lastChecked: CHECK_DATE,
      confidence: 67,
    },
  },
  {
    major: "Information Systems",
    fitScore: 78,
    whyItFits: [
      "Bridges your building instinct with business context",
      "Less quant-gatekeeping than pure finance or CS",
      "Strong co-op and internship pipelines in Singapore and Hong Kong",
    ],
    risks: ["Can read as generic without a sharp project focus"],
    requiredSkills: ["Systems design", "SQL", "Product thinking", "Stakeholder comms"],
    recommendedCourses: ["Information Systems Analysis", "Product Management Foundations"],
    suggestedProjects: ["Ship a small internal tool and document adoption numbers"],
    evidence: {
      source: "Inferred from your stated interests + region preference",
      sourceType: "Model inference",
      verified: ["Builder profile signal"],
      unknown: ["Depth of technical coursework", "Test scores"],
      lastChecked: CHECK_DATE,
      confidence: 61,
    },
  },
  {
    major: "Management (Entrepreneurship)",
    fitScore: 66,
    whyItFits: [
      "Hackathon shipping maps to a founder narrative",
      "Rewards initiative over standardised contest results",
    ],
    risks: [
      "Weakest external validation of the three",
      "Needs a concrete venture or measurable outcome to stand out",
    ],
    requiredSkills: ["Go-to-market", "Finance basics", "Storytelling", "Resilience"],
    recommendedCourses: ["New Venture Creation", "Financial Accounting"],
    suggestedProjects: ["Convert a hackathon build into a 90-day micro-venture with revenue or users"],
    evidence: {
      source: "Inferred from your messages",
      sourceType: "Model inference",
      verified: ["Stated builder interest"],
      unknown: ["Any venture traction", "Leadership references"],
      lastChecked: CHECK_DATE,
      confidence: 49,
    },
  },
];

const gapRadar: GapRadarData = {
  summary:
    "Your profile reads as a capable builder without external validation. Three gaps are blocking Reach schools.",
  gaps: [
    {
      label: "No international achievement",
      priority: "high",
      axis: "Recognition",
      current: 28,
      fix: "Enter one regional case competition before October — non-olympiad, business-focused.",
    },
    {
      label: "Project metrics missing",
      priority: "high",
      axis: "Impact",
      current: 41,
      fix: "Add concrete numbers to a hackathon project (users reached, % improvement).",
    },
    {
      label: "Weak essay narrative",
      priority: "medium",
      axis: "Story",
      current: 52,
      fix: "Reframe the certificates into one throughline about applied problem-solving.",
    },
    {
      label: "Leadership proof thin",
      priority: "medium",
      axis: "Leadership",
      current: 47,
      fix: "Document a team role from a past hackathon with a verifiable reference.",
    },
    {
      label: "No standardised score",
      priority: "low",
      axis: "Testing",
      current: 35,
      fix: "Decide on SAT vs. local exam track by August — analytics programs vary.",
    },
  ],
  evidence: {
    source: "Synthesised from your messages + certificate metadata",
    sourceType: "Model inference",
    verified: ["Certificates present", "Stated region preference"],
    unknown: ["Current test scores", "Verifiable leadership records"],
    lastChecked: CHECK_DATE,
    confidence: 64,
  },
};

const opportunities: OpportunityData[] = [
  {
    name: "APAC Collegiate Case Challenge",
    type: "Business case competition",
    deadline: "12 Sep 2026",
    cost: "Free entry",
    eligibility: "Open to pre-university students in the Asia-Pacific region",
    impact: "high",
    fixesGap: "No international achievement",
    evidence: {
      source: "apac-casechallenge.org — 2026 call for teams",
      sourceType: "Event organiser page",
      verified: ["Eligibility window", "Entry cost"],
      unknown: ["2026 judging rubric"],
      lastChecked: CHECK_DATE,
      confidence: 71,
    },
  },
  {
    name: "Singapore FinData Hack",
    type: "Analytics hackathon",
    deadline: "03 Aug 2026",
    cost: "Free, travel not covered",
    eligibility: "Teams of 2-4, students welcome",
    impact: "medium",
    fixesGap: "Project metrics missing",
    evidence: {
      source: "findatahack.sg — registration page",
      sourceType: "Event organiser page",
      verified: ["Date", "Team size rules"],
      unknown: ["Prize details for 2026"],
      lastChecked: CHECK_DATE,
      confidence: 63,
    },
  },
  {
    name: "Leaders of Tomorrow Essay Prize",
    type: "Writing fellowship",
    deadline: "28 Jul 2026",
    cost: "Free entry",
    eligibility: "Students aged 16-19 worldwide",
    impact: "medium",
    fixesGap: "Weak essay narrative",
    evidence: {
      source: "lot-prize.org — submission guidelines",
      sourceType: "Foundation page",
      verified: ["Age window", "Submission format"],
      unknown: ["Shortlist size for 2026"],
      lastChecked: CHECK_DATE,
      confidence: 57,
    },
  },
  {
    name: "Junior Product Sprint (Remote)",
    type: "Mentored build program",
    deadline: "19 Oct 2026",
    cost: "US$0 — sponsored cohort",
    eligibility: "Application + short build sample",
    impact: "high",
    fixesGap: "Project metrics missing",
    evidence: {
      source: "productsprint.dev — cohort 7 page",
      sourceType: "Program page",
      verified: ["Cohort dates", "Cost waiver"],
      unknown: ["Acceptance ratio"],
      lastChecked: CHECK_DATE,
      confidence: 60,
    },
  },
];

const portfolio: PortfolioData = {
  verified: ["3 hackathon participation certificates"],
  claimed: ["Built a working prototype", "Led a small team"],
  inferred: ["Comfortable under deadline pressure", "Self-directed learner"],
  missingProof: ["Quantified project impact", "Leadership reference", "Standardised test score"],
  weakAreas: ["External recognition", "Essay narrative coherence"],
  rewrite:
    "Builder who turns weekend hackathons into shipped prototypes — now translating that momentum into measured, business-focused work across the Asia-Pacific region.",
  evidence: {
    source: "Uploaded certificates + your messages",
    sourceType: "User documents + inference",
    verified: ["Certificate count"],
    unknown: ["Outcome metrics", "References"],
    lastChecked: CHECK_DATE,
    confidence: 69,
  },
};

export function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Stable, slug-based ids so detail routes are durable and re-runs don't duplicate.
export function seedObject(kind: ObjectKind): WorkspaceObject[] {
  switch (kind) {
    case "university":
      return universities.map((u) => ({ id: `uni-${slug(u.short)}`, kind, data: u }));
    case "majorFit":
      return majorFits.map((m) => ({ id: `maj-${slug(m.major)}`, kind, data: m }));
    case "gapRadar":
      return [{ id: "gap-profile", kind, data: gapRadar }];
    case "opportunity":
      return opportunities.map((o) => ({ id: `opp-${slug(o.name)}`, kind, data: o }));
    case "portfolio":
      return [{ id: "pf-main", kind, data: portfolio }];
    default:
      return [];
  }
}

// Mentoria course catalogue — each maps to the gap keywords it addresses.
const COURSES: import("./types").Course[] = [
  { id: "c-essay", title: "Essay Strategy for Top Universities", fixes: "Weak essay narrative", why: "Turns scattered activities into one clear application story.", duration: "4 weeks", level: "Intermediate", match: ["essay", "narrative", "story"] },
  { id: "c-quant", title: "Quant Foundations for Analytics", fixes: "Quantitative proof", why: "Builds the math/data signal selective analytics programs expect.", duration: "6 weeks", level: "Beginner", match: ["quant", "math", "data", "standardised", "score", "sat"] },
  { id: "c-metrics", title: "Project Impact & Metrics", fixes: "Project metrics missing", why: "Teaches you to quantify a build (users, % change) so it reads as real impact.", duration: "3 weeks", level: "Beginner", match: ["project", "metric", "impact", "traction"] },
  { id: "c-intl", title: "International Competition Prep", fixes: "No international achievement", why: "Prepares you for case/startup competitions that add external validation.", duration: "5 weeks", level: "Intermediate", match: ["international", "achievement", "recognition", "competition"] },
  { id: "c-lead", title: "Leadership Story Builder", fixes: "Leadership proof thin", why: "Documents a verifiable leadership role from your existing work.", duration: "2 weeks", level: "Beginner", match: ["leadership"] },
  { id: "c-ielts", title: "IELTS / SAT Intensive", fixes: "Standardised testing", why: "Targeted prep to lift the score that gates many programs.", duration: "8 weeks", level: "All levels", match: ["test", "sat", "ielts", "exam", "standardised"] },
];

export function allCourses(): import("./types").Course[] {
  return COURSES;
}

// Rank courses by how well they match the student's open gaps.
export function recommendCourses(openGaps: string[]): { course: import("./types").Course; matched: boolean }[] {
  const text = openGaps.join(" ").toLowerCase();
  return COURSES.map((course) => ({
    course,
    matched: course.match.some((k) => text.includes(k)) || openGaps.some((g) => g.toLowerCase().includes(course.fixes.toLowerCase().slice(0, 6))),
  })).sort((a, b) => Number(b.matched) - Number(a.matched));
}

export const STARTER_PROMPTS: string[] = [
  "I want to study business in Asia, I don't like olympiads, and I have a few hackathon certificates.",
  "Find universities that fit a builder profile without contest medals.",
  "What gaps are blocking my Reach schools?",
  "Show opportunities that fix my missing international achievement.",
];
