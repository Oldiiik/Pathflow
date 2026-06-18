import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { useAuth } from "./auth";
import { uid } from "../lib/mockData";
import { workspaceService, dataService, type PersistedWorkspace } from "../lib/services";
import type {
  ChatMessage,
  Evidence,
  MemoryState,
  ObjectKind,
  RoadmapTask,
  TaskStatus,
  ToolChip,
  WorkspaceObject,
} from "../lib/types";

interface EvidenceTarget {
  title: string;
  evidence: Evidence;
}

export interface TaskInput {
  label: string;
  priority?: "high" | "medium" | "low";
  context?: string;
}

interface State {
  messages: ChatMessage[];
  chips: ToolChip[];
  processing: ObjectKind[];
  objects: WorkspaceObject[];
  memory: MemoryState;
  roadmap: RoadmapTask[];
  evidence: EvidenceTarget | null;
}

const initialMemory: MemoryState = {
  goals: [],
  savedUniversities: [],
  preferredPaths: [],
  avoidedPaths: [],
  openGaps: [],
  nextSteps: [],
};

const initialState: State = {
  messages: [],
  chips: [],
  processing: [],
  objects: [],
  memory: initialMemory,
  roadmap: [],
  evidence: null,
};

type Action =
  | { type: "ADD_MESSAGE"; message: ChatMessage }
  | { type: "ADD_CHIPS"; chips: ToolChip[] }
  | { type: "START_PROCESSING"; kinds: ObjectKind[] }
  | { type: "RESOLVE_CHIP"; chipId: string; kind: ObjectKind; objects: WorkspaceObject[] }
  | { type: "RESOLVE_TOOL"; kind: ObjectKind; objects: WorkspaceObject[] }
  | { type: "MERGE_MEMORY"; patch: Partial<MemoryState> }
  | { type: "HYDRATE"; data: PersistedWorkspace }
  | { type: "ADD_TASKS"; tasks: TaskInput[] }
  | { type: "SET_TASK_STATUS"; id: string; status: TaskStatus }
  | { type: "REMOVE_TASK"; id: string }
  | { type: "DISMISS_OBJECT"; id: string }
  | { type: "OPEN_EVIDENCE"; target: EvidenceTarget }
  | { type: "CLOSE_EVIDENCE" };

function uniquePush(list: string[], items: string[]): string[] {
  const next = [...list];
  for (const item of items) if (item && !next.includes(item)) next.push(item);
  return next;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.message] };
    case "ADD_CHIPS":
      return { ...state, chips: [...state.chips, ...action.chips] };
    case "START_PROCESSING":
      return {
        ...state,
        processing: uniquePushKinds(state.processing, action.kinds),
      };
    case "RESOLVE_CHIP": {
      const existingIds = new Set(state.objects.map((o) => o.id));
      const fresh = action.objects.filter((o) => !existingIds.has(o.id));
      return {
        ...state,
        chips: state.chips.filter((c) => c.id !== action.chipId),
        processing: state.processing.filter((k) => k !== action.kind),
        objects: [...fresh, ...state.objects],
      };
    }
    case "RESOLVE_TOOL": {
      const ids = new Set(state.objects.map((o) => o.id));
      const fresh = action.objects.filter((o) => !ids.has(o.id));
      return {
        ...state,
        processing: state.processing.filter((k) => k !== action.kind),
        objects: [...fresh, ...state.objects],
      };
    }
    case "MERGE_MEMORY": {
      const m = state.memory;
      const p = action.patch;
      return {
        ...state,
        memory: {
          goals: p.goals ? uniquePush(m.goals, p.goals) : m.goals,
          savedUniversities: p.savedUniversities
            ? uniquePush(m.savedUniversities, p.savedUniversities)
            : m.savedUniversities,
          preferredPaths: p.preferredPaths
            ? uniquePush(m.preferredPaths, p.preferredPaths)
            : m.preferredPaths,
          avoidedPaths: p.avoidedPaths
            ? uniquePush(m.avoidedPaths, p.avoidedPaths)
            : m.avoidedPaths,
          openGaps: p.openGaps ? uniquePush(m.openGaps, p.openGaps) : m.openGaps,
          nextSteps: p.nextSteps ? uniquePush(m.nextSteps, p.nextSteps) : m.nextSteps,
        },
      };
    }
    case "HYDRATE":
      return {
        ...state,
        objects: action.data.objects ?? [],
        memory: { ...initialMemory, ...action.data.memory },
        roadmap: action.data.roadmap ?? [],
      };
    case "ADD_TASKS": {
      const existing = new Set(state.roadmap.map((t) => t.label));
      const fresh: RoadmapTask[] = action.tasks
        .filter((t) => t.label && !existing.has(t.label))
        .map((t) => ({
          id: uid("task"),
          label: t.label,
          status: "todo" as TaskStatus,
          priority: t.priority ?? "medium",
          context: t.context ?? "Task",
        }));
      return { ...state, roadmap: [...state.roadmap, ...fresh] };
    }
    case "SET_TASK_STATUS":
      return {
        ...state,
        roadmap: state.roadmap.map((t) => (t.id === action.id ? { ...t, status: action.status } : t)),
      };
    case "REMOVE_TASK":
      return { ...state, roadmap: state.roadmap.filter((t) => t.id !== action.id) };
    case "DISMISS_OBJECT":
      return {
        ...state,
        objects: state.objects.filter((o) => o.id !== action.id),
      };
    case "OPEN_EVIDENCE":
      return { ...state, evidence: action.target };
    case "CLOSE_EVIDENCE":
      return { ...state, evidence: null };
    default:
      return state;
  }
}

function uniquePushKinds(list: ObjectKind[], items: ObjectKind[]): ObjectKind[] {
  const next = [...list];
  for (const k of items) if (!next.includes(k)) next.push(k);
  return next;
}

interface WorkspaceContextValue extends State {
  submitMessage: (text: string) => void;
  generateKind: (kind: ObjectKind) => void;
  mergeMemory: (patch: Partial<MemoryState>) => void;
  addTasks: (tasks: TaskInput[]) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  removeTask: (id: string) => void;
  dismissObject: (id: string) => void;
  openEvidence: (target: EvidenceTarget) => void;
  closeEvidence: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { profile, session } = useAuth();
  const userId = session?.user?.id;

  const hydrated = useRef(false);
  const loadedExisting = useRef(false);
  const seeded = useRef(false);
  const memoryRef = useRef(initialMemory);

  useEffect(() => {
    memoryRef.current = state.memory;
  }, [state.memory]);

  // Load this user's persisted workspace (or start fresh).
  useEffect(() => {
    if (!userId) return;
    let active = true;
    hydrated.current = false;
    loadedExisting.current = false;
    workspaceService.load(userId).then((data) => {
      if (!active) return;
      if (data) {
        dispatch({ type: "HYDRATE", data });
        loadedExisting.current = true;
      }
      hydrated.current = true;
    });
    return () => {
      active = false;
    };
  }, [userId]);

  // Seed from profile only for a brand-new workspace (nothing was persisted).
  useEffect(() => {
    if (!profile || seeded.current || !hydrated.current || loadedExisting.current) return;
    seeded.current = true;
    const goals: string[] = [];
    if (profile.field) goals.push(`Study ${profile.field}`);
    if (profile.region) goals.push(`Target ${profile.region}`);
    dispatch({
      type: "MERGE_MEMORY",
      patch: { goals, avoidedPaths: profile.avoid ? [profile.avoid] : [] },
    });
  }, [profile, state.memory]);

  // Persist on every meaningful change (once hydration has settled).
  useEffect(() => {
    if (!userId || !hydrated.current) return;
    workspaceService.save(userId, {
      objects: state.objects,
      memory: state.memory,
      roadmap: state.roadmap,
    });
  }, [userId, state.objects, state.memory, state.roadmap]);

  const submitMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    dispatch({
      type: "ADD_MESSAGE",
      message: { id: uid("msg"), role: "user", text: trimmed },
    });

    // System acknowledgement.
    window.setTimeout(async () => {
      try {
        const plan = await dataService.planCommand(trimmed, memoryRef.current);
        dispatch({
          type: "MERGE_MEMORY",
          patch: plan.memoryPatch,
        });

        dispatch({
          type: "ADD_MESSAGE",
          message: {
            id: uid("msg"),
            role: "system",
            text: plan.systemMessage,
            resultKinds: [...new Set(plan.chips.map((c) => c.kind))],
          },
        });
        if (plan.roadmapSuggestions.length) {
          dispatch({ type: "ADD_TASKS", tasks: plan.roadmapSuggestions });
        }
        dispatch({ type: "ADD_CHIPS", chips: plan.chips });
        dispatch({
          type: "START_PROCESSING",
          kinds: plan.chips.map((c) => c.kind),
        });

        // Each chip expands into its workspace object after a short stagger.
        plan.chips.forEach((chip, i) => {
          window.setTimeout(async () => {
            try {
              const objects = await dataService.generate(chip.kind);
              dispatch({ type: "RESOLVE_CHIP", chipId: chip.id, kind: chip.kind, objects });
              if (chip.kind === "gapRadar") {
                dispatch({
                  type: "MERGE_MEMORY",
                  patch: {
                    openGaps: [
                      "No international achievement",
                      "Project metrics missing",
                      "Weak essay narrative",
                    ],
                  },
                });
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : "Tool generation failed.";
              dispatch({ type: "RESOLVE_CHIP", chipId: chip.id, kind: chip.kind, objects: [] });
              dispatch({
                type: "ADD_MESSAGE",
                message: {
                  id: uid("msg"),
                  role: "system",
                  text: `I couldn't generate ${chip.label}: ${message}`,
                },
              });
            }
          }, 900 + i * 650);
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Command failed.";
        dispatch({
          type: "ADD_MESSAGE",
          message: {
            id: uid("msg"),
            role: "system",
            text: `I couldn't run that command: ${message}`,
          },
        });
      }
    }, 450);
  }, []);

  // Generate a tool's objects directly — pages are usable without the chat.
  const generateKind = useCallback((kind: ObjectKind) => {
    dispatch({ type: "START_PROCESSING", kinds: [kind] });
    window.setTimeout(async () => {
      try {
        const objects = await dataService.generate(kind);
        dispatch({ type: "RESOLVE_TOOL", kind, objects });
        if (kind === "gapRadar") {
          dispatch({
            type: "MERGE_MEMORY",
            patch: { openGaps: ["No international achievement", "Project metrics missing", "Weak essay narrative"] },
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Tool generation failed.";
        dispatch({ type: "RESOLVE_TOOL", kind, objects: [] });
        dispatch({
          type: "ADD_MESSAGE",
          message: {
            id: uid("msg"),
            role: "system",
            text: `I couldn't generate ${kind}: ${message}`,
          },
        });
      }
    }, 550);
  }, []);

  const mergeMemory = useCallback(
    (patch: Partial<MemoryState>) => dispatch({ type: "MERGE_MEMORY", patch }),
    []
  );
  const addTasks = useCallback((tasks: TaskInput[]) => dispatch({ type: "ADD_TASKS", tasks }), []);
  const setTaskStatus = useCallback(
    (id: string, status: TaskStatus) => dispatch({ type: "SET_TASK_STATUS", id, status }),
    []
  );
  const removeTask = useCallback((id: string) => dispatch({ type: "REMOVE_TASK", id }), []);
  const dismissObject = useCallback(
    (id: string) => dispatch({ type: "DISMISS_OBJECT", id }),
    []
  );
  const openEvidence = useCallback(
    (target: EvidenceTarget) => dispatch({ type: "OPEN_EVIDENCE", target }),
    []
  );
  const closeEvidence = useCallback(() => dispatch({ type: "CLOSE_EVIDENCE" }), []);

  return (
    <WorkspaceContext.Provider
      value={{
        ...state,
        submitMessage,
        generateKind,
        mergeMemory,
        addTasks,
        setTaskStatus,
        removeTask,
        dismissObject,
        openEvidence,
        closeEvidence,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
