import { backendRequest } from "./backendClient";
import type { MemoryState, ProjectReview, UniversityBio, UniversityData, UserProfile } from "./types";

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

  const data = await backendRequest<{ bio: UniversityBio }>("/ai/university-bio", {
    method: "POST",
    body: payload,
  });
  return data.bio;
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

  const data = await backendRequest<{ review: ProjectReview }>("/ai/project-review", {
    method: "POST",
    body: payload,
  });
  return data.review;
}
