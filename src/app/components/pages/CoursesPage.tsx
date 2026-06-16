import { useMemo } from "react";
import { motion } from "motion/react";
import { GraduationCap, Clock, Plus, Check, Sparkles } from "lucide-react";
import { useWorkspace } from "../../store/workspace";
import { PageContainer, PageHeader } from "./page-kit";
import { dataService } from "../../lib/services";

export function CoursesPage() {
  const { memory, roadmap, addTasks } = useWorkspace();
  const ranked = useMemo(() => dataService.recommendCourses(memory.openGaps), [memory.openGaps]);
  const hasGaps = memory.openGaps.length > 0;

  return (
    <PageContainer>
      <PageHeader
        icon={GraduationCap}
        eyebrow="Mentoria courses"
        title="Courses that close your gaps."
        subtitle={hasGaps ? "Matched to your open gaps first — each one targets a specific weakness in your profile." : "Run a gap analysis and these reorder to target exactly what's holding you back."}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {ranked.map(({ course, matched }, i) => {
          const inRoadmap = roadmap.some((t) => t.label === `Course: ${course.title}`);
          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col gap-3 rounded-2xl border p-5"
              style={{
                borderColor: matched && hasGaps ? "var(--pf-accent)" : "var(--pf-border)",
                backgroundColor: "var(--pf-card)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <span style={{ color: "var(--pf-ink)", fontSize: "1.05rem", letterSpacing: "-0.01em" }}>{course.title}</span>
                {matched && hasGaps && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] uppercase tracking-wide" style={{ backgroundColor: "var(--pf-accent-soft)", color: "var(--pf-accent-hi)" }}>
                    <Sparkles size={11} /> For you
                  </span>
                )}
              </div>

              <span className="inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-0.5 text-xs" style={{ backgroundColor: "var(--pf-elevated)", color: "var(--pf-warn)" }}>
                Fixes: {course.fixes}
              </span>

              <p className="text-sm leading-relaxed" style={{ color: "var(--pf-muted)" }}>{course.why}</p>

              <div className="mt-auto flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--pf-border)" }}>
                <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--pf-muted)" }}>
                  <Clock size={13} /> {course.duration} · {course.level}
                </span>
                <button
                  onClick={() => addTasks([{ label: `Course: ${course.title}`, context: "Course", priority: matched && hasGaps ? "high" : "medium" }])}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-transform active:translate-y-[1px]"
                  style={
                    inRoadmap
                      ? { backgroundColor: "var(--pf-elevated)", color: "var(--pf-success)" }
                      : { backgroundColor: "var(--pf-accent)", color: "#fff" }
                  }
                >
                  {inRoadmap ? <Check size={14} /> : <Plus size={14} />}
                  {inRoadmap ? "In roadmap" : "Add to roadmap"}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </PageContainer>
  );
}
