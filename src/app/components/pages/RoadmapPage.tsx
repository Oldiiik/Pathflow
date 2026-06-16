import { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Route, Circle, Clock, CheckCircle2, X } from "lucide-react";
import { useWorkspace } from "../../store/workspace";
import { PageContainer, PageHeader, PageEmpty, MiniBar } from "./page-kit";
import { PriorityBadge } from "../shared/primitives";
import type { RoadmapTask, TaskStatus } from "../../lib/types";

const NEXT: Record<TaskStatus, TaskStatus> = { todo: "doing", doing: "done", done: "todo" };
const STATUS_ICON = { todo: Circle, doing: Clock, done: CheckCircle2 } as const;
const STATUS_TONE = { todo: "var(--pf-unknown)", doing: "var(--pf-warn)", done: "var(--pf-success)" } as const;
const PRIO_ORDER = { high: 0, medium: 1, low: 2 } as const;
const STATUS_ORDER = { doing: 0, todo: 1, done: 2 } as const;

export function RoadmapPage() {
  const { roadmap, setTaskStatus, removeTask } = useWorkspace();

  const sorted = useMemo(
    () =>
      [...roadmap].sort(
        (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || PRIO_ORDER[a.priority] - PRIO_ORDER[b.priority]
      ),
    [roadmap]
  );
  const done = roadmap.filter((t) => t.status === "done").length;
  const pct = roadmap.length ? Math.round((done / roadmap.length) * 100) : 0;

  return (
    <PageContainer>
      <PageHeader
        icon={Route}
        eyebrow="Living roadmap"
        title="Your roadmap"
        subtitle="Everything you save — gap fixes, opportunities, university plans — lands here as a step you can track to done."
      />

      {roadmap.length === 0 ? (
        <PageEmpty label="Save a gap fix, an opportunity, or a university plan and it becomes a tracked step here." />
      ) : (
        <>
          <div className="flex flex-col gap-3 rounded-2xl border p-5" style={{ borderColor: "var(--pf-border)", backgroundColor: "var(--pf-surface)" }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--pf-muted)" }}>Progress</span>
              <span className="font-mono text-sm" style={{ color: "var(--pf-ink)" }}>
                {done}<span style={{ color: "var(--pf-unknown)" }}>/{roadmap.length} done · {pct}%</span>
              </span>
            </div>
            <MiniBar value={pct} tone="linear-gradient(90deg, var(--pf-accent-deep), var(--pf-success))" />
          </div>

          <div className="relative flex flex-col gap-2.5 pl-6">
            <span className="absolute bottom-3 left-[7px] top-3 w-px" style={{ backgroundColor: "var(--pf-border)" }} />
            <AnimatePresence initial={false}>
              {sorted.map((t) => (
                <TaskRow key={t.id} task={t} onCycle={() => setTaskStatus(t.id, NEXT[t.status])} onRemove={() => removeTask(t.id)} />
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </PageContainer>
  );
}

function TaskRow({ task, onCycle, onRemove }: { task: RoadmapTask; onCycle: () => void; onRemove: () => void }) {
  const Icon = STATUS_ICON[task.status];
  const tone = STATUS_TONE[task.status];
  const done = task.status === "done";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
      className="group relative flex items-center gap-3 rounded-2xl border p-4"
      style={{ borderColor: "var(--pf-border)", backgroundColor: "var(--pf-card)" }}
    >
      <span className="absolute -left-[22px] h-3 w-3 rounded-full" style={{ backgroundColor: tone, boxShadow: "0 0 0 4px var(--pf-bg)" }} />
      <button onClick={onCycle} aria-label="Cycle status" className="shrink-0 transition-transform active:scale-90">
        <Icon size={20} strokeWidth={2} style={{ color: tone }} fill={done ? tone : "none"} />
      </button>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm" style={{ color: done ? "var(--pf-muted)" : "var(--pf-ink)", textDecoration: done ? "line-through" : "none" }}>
          {task.label}
        </span>
        <span className="text-[11px]" style={{ color: "var(--pf-unknown)" }}>{task.context}</span>
      </div>
      <PriorityBadge level={task.priority} />
      <button onClick={onRemove} aria-label="Remove task" className="rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--pf-muted)" }}>
        <X size={15} />
      </button>
    </motion.div>
  );
}
