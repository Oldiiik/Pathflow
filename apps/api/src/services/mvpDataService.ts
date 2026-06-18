import type { ObjectKind, WorkspaceObject } from "../domain/workspaceSchemas.js";

let counter = 0;

function uid(prefix: string) {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

const CHECK_DATE = "18 Jun 2026";

const evidence = {
  source: "Pathflow MVP seed data",
  sourceType: "MVP internal dataset",
  verified: ["Object shape", "Display-ready fields"],
  unknown: ["Live admissions verification"],
  lastChecked: CHECK_DATE,
  confidence: 42,
};

export function generateMvpWorkspaceObjects(kind: ObjectKind): WorkspaceObject[] {
  switch (kind) {
    case "university":
      return [
        {
          id: uid("uni"),
          kind,
          data: {
            name: "National University of Singapore",
            short: "NUS",
            country: "Singapore",
            city: "Singapore",
            fitScore: 87,
            difficulty: "Reach",
            acceptanceNote: "Highly selective international admissions",
            tuition: "S$38,200 / yr estimate",
            programs: ["Business Analytics", "Business Administration", "Information Systems"],
            catalogue: [
              {
                name: "Bachelor of Business Analytics",
                level: "Undergraduate",
                duration: "4 yr",
                focus: "Data, optimisation, decision science",
                fitNote: "Strong fit for a business plus technology profile",
              },
            ],
            proofs: [
              {
                label: "Program availability",
                status: "verified",
                source: "MVP seed",
                note: "Replace with official source-backed record before production decisions.",
              },
            ],
            risks: ["Reach-level selectivity", "Needs stronger quantified project impact"],
            gaps: ["International recognition", "Project metrics"],
            evidenceStatus: "claimed",
            lastChecked: CHECK_DATE,
            evidence,
          },
        },
      ];
    case "majorFit":
      return [
        {
          id: uid("major"),
          kind,
          data: {
            major: "Business Analytics",
            fitScore: 84,
            whyItFits: [
              "Combines business goals with technical project work",
              "Works well for students who prefer building over olympiad tracks",
            ],
            risks: ["Math/data proof still needs evidence", "Projects need measurable outcomes"],
            requiredSkills: ["Statistics", "SQL", "Python", "Data storytelling"],
            recommendedCourses: ["Intro Statistics", "Databases for Decisions"],
            suggestedProjects: ["Turn a hackathon prototype into a measured case study"],
            evidence,
          },
        },
      ];
    case "gapRadar":
      return [
        {
          id: uid("gap"),
          kind,
          data: {
            summary: "Your MVP profile reads as promising but under-evidenced for reach schools.",
            gaps: [
              {
                label: "Project metrics missing",
                priority: "high",
                axis: "Impact",
                current: 41,
                fix: "Add users, outcome, or before/after metrics to one project.",
              },
              {
                label: "International achievement thin",
                priority: "high",
                axis: "Recognition",
                current: 28,
                fix: "Target a regional case competition or startup program.",
              },
            ],
            evidence,
          },
        },
      ];
    case "opportunity":
      return [
        {
          id: uid("opp"),
          kind,
          data: {
            name: "APAC Case Challenge",
            type: "Business case competition",
            deadline: "Sep 2026 estimate",
            cost: "Free or low cost",
            eligibility: "Pre-university students in Asia-Pacific",
            impact: "high",
            fixesGap: "International achievement",
            evidence,
          },
        },
      ];
    case "portfolio":
      return [
        {
          id: uid("portfolio"),
          kind,
          data: {
            verified: ["Hackathon participation"],
            claimed: ["Startup interest", "Business analytics interest"],
            inferred: ["Builder profile", "Project-based path preference"],
            missingProof: ["Project metrics", "External validation", "Role clarity"],
            weakAreas: ["Impact evidence", "Narrative focus"],
            rewrite:
              "I build applied tools at the intersection of business and technology, and I am now turning hackathon work into measurable portfolio projects.",
            evidence,
          },
        },
      ];
  }
}
