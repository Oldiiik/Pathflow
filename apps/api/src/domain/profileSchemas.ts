import { z } from "zod";

export const ProfileSchema = z.object({
  name: z.string(),
  field: z.string(),
  region: z.string(),
  avoid: z.string(),
  createdAt: z.string().optional(),
});

export type Profile = z.infer<typeof ProfileSchema>;

export const SignUpRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(256),
  name: z.string().trim().min(1).max(120),
  field: z.string().trim().max(160).default(""),
  region: z.string().trim().max(160).default(""),
  avoid: z.string().trim().max(240).default(""),
});

export const UpdateProfileRequestSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  field: z.string().trim().max(160).optional(),
  region: z.string().trim().max(160).optional(),
  avoid: z.string().trim().max(240).optional(),
});
