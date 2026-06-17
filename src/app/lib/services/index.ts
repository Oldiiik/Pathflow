// ───────────────────────────────────────────────────────────────────────────
// Pathflow service layer.
//
// Pages and the store NEVER touch mock data, localStorage, or fetch directly —
// they go through these two interfaces. To connect a real backend later, write
// classes that implement `WorkspaceService` and `DataService` against your API
// and swap the two exports at the bottom. Nothing else in the app changes.
// ───────────────────────────────────────────────────────────────────────────

import { seedObject, recommendCourses as recommendCoursesLocal, allCourses } from "../mockData";
import { fetchUniversityBio, fetchProjectReview } from "../api";
import { backendRequest, useNodeWorkspaceApi } from "../backendClient";
import type {
  Course,
  MemoryState,
  ObjectKind,
  ProjectReview,
  RoadmapTask,
  UniversityBio,
  UniversityData,
  UserProfile,
  WorkspaceObject,
} from "../types";

// What a user's workspace looks like when persisted.
export interface PersistedWorkspace {
  objects: WorkspaceObject[];
  memory: MemoryState;
  roadmap: RoadmapTask[];
}

// Persistence — load/save/clear a user's workspace.
export interface WorkspaceService {
  load(userId: string): Promise<PersistedWorkspace | null>;
  save(userId: string, data: PersistedWorkspace): Promise<void>;
  clear(userId: string): Promise<void>;
}

// Data + AI — generates workspace objects and runs AI features.
export interface DataService {
  generate(kind: ObjectKind): Promise<WorkspaceObject[]>;
  universityBio(uni: Pick<UniversityData, "name" | "country" | "city">, memory: MemoryState): Promise<UniversityBio>;
  reviewProject(input: { name: string; description: string; link: string }, profile: UserProfile | null): Promise<ProjectReview>;
  listCourses(): Course[];
  recommendCourses(openGaps: string[]): { course: Course; matched: boolean }[];
}

// ── Local implementations ───────────────────────────────────────────────────

const KEY = (userId: string) => `pathflow:ws:${userId}`;

export const localWorkspaceService: WorkspaceService = {
  async load(userId) {
    try {
      const raw = localStorage.getItem(KEY(userId));
      return raw ? (JSON.parse(raw) as PersistedWorkspace) : null;
    } catch (err) {
      console.error("workspace load failed:", err);
      return null;
    }
  },
  async save(userId, data) {
    try {
      localStorage.setItem(KEY(userId), JSON.stringify(data));
    } catch (err) {
      console.error("workspace save failed:", err);
    }
  },
  async clear(userId) {
    try {
      localStorage.removeItem(KEY(userId));
    } catch (err) {
      console.error("workspace clear failed:", err);
    }
  },
};

// Backend-backed persistence. Keep this small: pages and stores continue using
// WorkspaceService, while the transport can move from localStorage to Node API.
export const apiWorkspaceService: WorkspaceService = {
  async load() {
    const data = await backendRequest<{ workspace: PersistedWorkspace }>("/workspace");
    return data.workspace;
  },
  async save(_userId, data) {
    await backendRequest<{ workspace: PersistedWorkspace }>("/workspace", {
      method: "PUT",
      body: data,
    });
  },
  async clear(_userId) {
    await backendRequest<{ workspace: PersistedWorkspace }>("/workspace", {
      method: "PUT",
      body: {
        objects: [],
        memory: {
          goals: [],
          savedUniversities: [],
          preferredPaths: [],
          avoidedPaths: [],
          openGaps: [],
          nextSteps: [],
        },
        roadmap: [],
      },
    });
  },
};

// Mock generation is synchronous today, but the interface is async so a backend
// implementation can fetch over the network without touching callers.
export const mockDataService: DataService = {
  async generate(kind) {
    return seedObject(kind);
  },
  universityBio: fetchUniversityBio,
  reviewProject: fetchProjectReview,
  listCourses: allCourses,
  recommendCourses: recommendCoursesLocal,
};

// ── Active services (the single swap point for a real backend) ───────────────
export const workspaceService: WorkspaceService = useNodeWorkspaceApi
  ? apiWorkspaceService
  : localWorkspaceService;
export const dataService: DataService = mockDataService;
