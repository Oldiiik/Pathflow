import { z } from "zod";
import { MemoryStateSchema } from "./workspaceSchemas.js";

const ConfidenceSchema = z.enum(["high", "medium", "unknown"]);

export const UniversityBioSchema = z.object({
  positioning: z.string(),
  fitScore: z.number().min(0).max(100),
  difficulty: z.enum(["Likely", "Target", "Reach", "Extreme"]),
  snapshot: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
      confidence: ConfidenceSchema,
    }),
  ),
  fitForYou: z.array(z.string()),
  fitConcerns: z.array(z.string()),
  pros: z.array(z.string()),
  minuses: z.array(z.string()),
  academicMatch: z.array(
    z.object({
      program: z.string(),
      note: z.string(),
    }),
  ),
  studentLife: z.object({
    goodFor: z.array(z.string()),
    badFor: z.array(z.string()),
  }),
  cost: z.object({
    sticker: z.string(),
    aidForInternationals: z.string(),
    financialRisk: z.enum(["Low", "Medium", "High"]),
    note: z.string(),
  }),
  outcomes: z.object({
    summary: z.string(),
    caveat: z.string(),
  }),
  gapRadar: z.array(
    z.object({
      axis: z.string(),
      severity: z.enum(["Critical", "High", "Medium", "Low", "Unknown"]),
    }),
  ),
  recommendedFixes: z.array(z.string()),
  strategy: z.string(),
  evidence: z.array(
    z.object({
      dataPoint: z.string(),
      value: z.string(),
      source: z.string(),
      confidence: ConfidenceSchema,
    }),
  ),
});

export type UniversityBio = z.infer<typeof UniversityBioSchema>;

export const UniversityBioRequestSchema = z.object({
  name: z.string().trim().min(1).max(180),
  country: z.string().trim().max(120).default(""),
  city: z.string().trim().max(120).default(""),
  context: MemoryStateSchema.partial().optional(),
});

export const ProjectReviewSchema = z.object({
  admissionValue: z.enum(["Strong", "Moderate", "Weak", "Under-explained"]),
  summary: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  improvements: z.array(z.string()),
  rewrite: z.string(),
});

export type ProjectReview = z.infer<typeof ProjectReviewSchema>;

export const ProjectReviewRequestSchema = z.object({
  name: z.string().trim().max(180).default(""),
  description: z.string().trim().max(6000).default(""),
  link: z.string().trim().max(500).default(""),
  context: z
    .object({
      field: z.string().trim().max(160).optional(),
      preferredPaths: z.array(z.string()).optional(),
    })
    .optional(),
});
