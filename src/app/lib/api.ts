import { projectId, publicAnonKey } from "/utils/supabase/info";
import { backendPublicRequest, useNodeWorkspaceApi } from "./backendClient";
import type { MemoryState, ProjectReview, UniversityBio, UniversityData, UserProfile } from "./types";

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-6885b96b`;

// Calls the server, which generates the bio with gemini-3.1-flash-lite and caches it.
export async function fetchUniversityBio(
  uni: Pick<UniversityData, "name" | "country" | "city">,
  memory: MemoryState,
): Promise<UniversityBio> {
  const payload = {
    name: uni.name,
    country: uni.country,
    city: uni.city,
    context: {
      goals: memory.goals,
      avoidedPaths: memory.avoidedPaths,
      preferredPaths: memory.preferredPaths,
      openGaps: memory.openGaps,
    },
  };

  if (useNodeWorkspaceApi) {
    const data = await backendPublicRequest<{ bio: UniversityBio }>("/ai/university-bio", {
      method: "POST",
      body: payload,
    });
    return data.bio;
  }

  const res = await fetch(`${BASE}/university-bio`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && data.error) || `University bio request failed with status ${res.status}`;
    console.error("fetchUniversityBio error:", msg);
    throw new Error(msg);
  }
  return data.bio as UniversityBio;
}

// AI project/website review (gemini-3.1-flash-lite via the server).
export async function fetchProjectReview(
  input: { name: string; description: string; link: string },
  profile: UserProfile | null,
): Promise<ProjectReview> {
  const payload = {
    ...input,
    context: { field: profile?.field, preferredPaths: profile ? [profile.field] : [] },
  };

  if (useNodeWorkspaceApi) {
    const data = await backendPublicRequest<{ review: ProjectReview }>("/ai/project-review", {
      method: "POST",
      body: payload,
    });
    return data.review;
  }

  const res = await fetch(`${BASE}/project-review`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && data.error) || `Project review failed with status ${res.status}`;
    console.error("fetchProjectReview error:", msg);
    throw new Error(msg);
  }
  return data.review as ProjectReview;
}
