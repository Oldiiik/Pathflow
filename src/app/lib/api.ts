import { projectId, publicAnonKey } from "/utils/supabase/info";
import type { MemoryState, ProjectReview, UniversityBio, UniversityData, UserProfile } from "./types";

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-6885b96b`;

// Calls the server, which generates the bio with gemini-3.1-flash-lite and caches it.
export async function fetchUniversityBio(
  uni: Pick<UniversityData, "name" | "country" | "city">,
  memory: MemoryState,
): Promise<UniversityBio> {
  const res = await fetch(`${BASE}/university-bio`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify({
      name: uni.name,
      country: uni.country,
      city: uni.city,
      context: {
        goals: memory.goals,
        avoidedPaths: memory.avoidedPaths,
        preferredPaths: memory.preferredPaths,
      },
    }),
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
  const res = await fetch(`${BASE}/project-review`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
    body: JSON.stringify({
      ...input,
      context: { field: profile?.field, preferredPaths: profile ? [profile.field] : [] },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && data.error) || `Project review failed with status ${res.status}`;
    console.error("fetchProjectReview error:", msg);
    throw new Error(msg);
  }
  return data.review as ProjectReview;
}
