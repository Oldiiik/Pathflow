// ───────────────────────────────────────────────────────────────────────────
// Pathflow service layer.
//
// Pages and the store NEVER touch mock data, localStorage, or fetch directly —
// they go through these two interfaces. To connect a real backend later, write
// classes that implement `WorkspaceService` and `DataService` against your API
// and swap the two exports at the bottom. Nothing else in the app changes.
// ───────────────────────────────────────────────────────────────────────────

import { seedObject, recommendCourses as recommendCoursesLocal, allCourses, uid } from "../mockData";
import { detectIntent } from "../intent";
import { fetchUniversityBio, fetchProjectReview } from "../api";
import { backendRequest, useNodeWorkspaceApi } from "../backendClient";
import type {
  Course,
  ChatMessage,
  MemoryState,
  ObjectKind,
  ProjectReview,
  RoadmapTask,
  UniversityBio,
  UniversityData,
  UserProfile,
  WorkspaceObject,
} from "../types";

const CHIP_LABELS: Record<ObjectKind, string> = {
  university: "University Match",
  majorFit: "Major Fit",
  gapRadar: "Gap Radar",
  opportunity: "Opportunity",
  portfolio: "Portfolio Diagnosis",
};

// What a user's workspace looks like when persisted.
export interface PersistedWorkspace {
  messages?: ChatMessage[];
  objects: WorkspaceObject[];
  memory: MemoryState;
  roadmap: RoadmapTask[];
}

// Persistence — load/save/clear a user's workspace.
export interface WorkspaceService {
  load(userId: string): Promise<PersistedWorkspace | null>;
  save(userId: string, data: PersistedWorkspace): Promise<void>;
  clear(userId: string): Promise<void>;
  patchMemory(userId: string, patch: Partial<MemoryState>): Promise<void>;
  addTasks(userId: string, tasks: RoadmapTask[]): Promise<void>;
  setTaskStatus(userId: string, id: string, status: RoadmapTask["status"]): Promise<void>;
  removeTask(userId: string, id: string): Promise<void>;
  removeObject(userId: string, id: string): Promise<void>;
}

export interface CommandPlan {
  systemMessage: string;
  memoryPatch: Partial<MemoryState>;
  chips: { id: string; label: string; kind: ObjectKind }[];
  roadmapSuggestions: {
    label: string;
    priority?: "high" | "medium" | "low";
    context?: string;
  }[];
}

// Data + AI — generates workspace objects and runs AI features.
export interface DataService {
  planCommand(message: string, memory: MemoryState): Promise<CommandPlan>;
  generate(kind: ObjectKind): Promise<WorkspaceObject[]>;
  universityBio(uni: Pick<UniversityData, "name" | "country" | "city">, memory: MemoryState): Promise<UniversityBio>;
  reviewProject(input: { name: string; description: string; link: string }, profile: UserProfile | null): Promise<ProjectReview>;
  listCourses(): Course[];
  recommendCourses(openGaps: string[]): { course: Course; matched: boolean }[];
}

// ── Local implementations ───────────────────────────────────────────────────

const KEY = (userId: string) => `pathflow:ws:${userId}`;

function emptyMemory(): MemoryState {
  return {
    goals: [],
    savedUniversities: [],
    preferredPaths: [],
    avoidedPaths: [],
    openGaps: [],
    nextSteps: [],
  };
}

function mergeMemory(current: MemoryState | undefined, patch: Partial<MemoryState>): MemoryState {
  const base = current ?? emptyMemory();
  const unique = (items: string[], additions: string[] | undefined) => {
    if (!additions) return items;
    const next = [...items];
    for (const item of additions) {
      const trimmed = item.trim();
      if (trimmed && !next.includes(trimmed)) next.push(trimmed);
    }
    return next;
  };

  return {
    goals: unique(base.goals, patch.goals),
    savedUniversities: unique(base.savedUniversities, patch.savedUniversities),
    preferredPaths: unique(base.preferredPaths, patch.preferredPaths),
    avoidedPaths: unique(base.avoidedPaths, patch.avoidedPaths),
    openGaps: unique(base.openGaps, patch.openGaps),
    nextSteps: unique(base.nextSteps, patch.nextSteps),
  };
}

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
  async patchMemory(userId, patch) {
    const current = await this.load(userId);
    await this.save(userId, {
      messages: current?.messages,
      objects: current?.objects ?? [],
      memory: mergeMemory(current?.memory, patch),
      roadmap: current?.roadmap ?? [],
    });
  },
  async addTasks(userId, tasks) {
    const current = await this.load(userId);
    await this.save(userId, {
      messages: current?.messages,
      objects: current?.objects ?? [],
      memory: current?.memory ?? emptyMemory(),
      roadmap: [...(current?.roadmap ?? []), ...tasks],
    });
  },
  async setTaskStatus(userId, id, status) {
    const current = await this.load(userId);
    await this.save(userId, {
      messages: current?.messages,
      objects: current?.objects ?? [],
      memory: current?.memory ?? emptyMemory(),
      roadmap: (current?.roadmap ?? []).map((task) => (task.id === id ? { ...task, status } : task)),
    });
  },
  async removeTask(userId, id) {
    const current = await this.load(userId);
    await this.save(userId, {
      messages: current?.messages,
      objects: current?.objects ?? [],
      memory: current?.memory ?? emptyMemory(),
      roadmap: (current?.roadmap ?? []).filter((task) => task.id !== id),
    });
  },
  async removeObject(userId, id) {
    const current = await this.load(userId);
    await this.save(userId, {
      messages: current?.messages,
      objects: (current?.objects ?? []).filter((object) => object.id !== id),
      memory: current?.memory ?? emptyMemory(),
      roadmap: current?.roadmap ?? [],
    });
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
        messages: [],
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
  async patchMemory(_userId, patch) {
    await backendRequest<{ memory: MemoryState }>("/workspace/memory", {
      method: "PATCH",
      body: patch,
    });
  },
  async addTasks(_userId, tasks) {
    await backendRequest<{ tasks: RoadmapTask[] }>("/workspace/roadmap", {
      method: "POST",
      body: { tasks },
    });
  },
  async setTaskStatus(_userId, id, status) {
    await backendRequest<{ ok: true }>(`/workspace/roadmap/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { status },
    });
  },
  async removeTask(_userId, id) {
    await backendRequest<{ ok: true }>(`/workspace/roadmap/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
  async removeObject(_userId, id) {
    await backendRequest<{ ok: true }>(`/workspace/objects/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};

// Mock generation is synchronous today, but the interface is async so a backend
// implementation can fetch over the network without touching callers.
export const mockDataService: DataService = {
  async planCommand(message) {
    const intent = detectIntent(message);
    return {
      systemMessage: intent.systemMessage,
      memoryPatch: {
        avoidedPaths: intent.avoidedPaths,
        goals: intent.goals,
      },
      chips: intent.chips,
      roadmapSuggestions: [],
    };
  },
  async generate(kind) {
    return seedObject(kind);
  },
  universityBio: fetchUniversityBio,
  reviewProject: fetchProjectReview,
  listCourses: allCourses,
  recommendCourses: recommendCoursesLocal,
};

interface ApiCommandResponse {
  message: {
    text: string;
    resultKinds: ObjectKind[];
  };
  memoryPatch?: Partial<MemoryState>;
  tools: {
    kind: ObjectKind;
    reason: string;
    priority: "high" | "medium" | "low";
  }[];
  roadmapSuggestions?: {
    label: string;
    priority?: "high" | "medium" | "low";
    context?: string;
  }[];
}

export const apiDataService: DataService = {
  async planCommand(message, memory) {
    const data = await backendRequest<ApiCommandResponse>("/workspace/command", {
      method: "POST",
      body: { message, memory },
    });
    return {
      systemMessage: data.message.text,
      memoryPatch: data.memoryPatch ?? {},
      chips: data.tools.map((tool) => ({
        id: uid("chip"),
        label: CHIP_LABELS[tool.kind],
        kind: tool.kind,
      })),
      roadmapSuggestions: data.roadmapSuggestions ?? [],
    };
  },
  async generate(kind) {
    const data = await backendRequest<{ objects: WorkspaceObject[] }>("/data/generate", {
      method: "POST",
      body: { kind },
    });
    return data.objects;
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
export const dataService: DataService = useNodeWorkspaceApi ? apiDataService : mockDataService;
