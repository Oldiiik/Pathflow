import { useMemo } from "react";
import { motion } from "motion/react";
import { CalendarClock, Target, CalendarPlus, CheckCircle2, FileSearch } from "lucide-react";
import { useWorkspace } from "../../store/workspace";
import { PageContainer, PageHeader, PageEmpty, PageGenerating } from "./page-kit";
import { PriorityBadge } from "../shared/primitives";
import type { OpportunityData } from "../../lib/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TODAY = new Date(2026, 5, 16).getTime();
function parseDeadline(s: string): number {
  const m = s.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
  return m ? new Date(Number(m[3]), MONTHS.indexOf(m[2]), Number(m[1])).getTime() : Number.MAX_SAFE_INTEGER;
}
const daysLeft = (ms: number) => Math.round((ms - TODAY) / 86_400_000);

export function OpportunitiesPage() {
  const { objects, roadmap, addTasks, openEvidence, processing, generateKind } = useWorkspace();
  const generating = processing.includes("opportunity");

  const items = useMemo(
    () =>
      objects
        .filter((o) => o.kind === "opportunity")
        .map((o) => ({ id: o.id, d: o.data as OpportunityData, ts: parseDeadline((o.data as OpportunityData).deadline) }))
        .sort((a, b) => a.ts - b.ts),
    [objects]
  );

  return (
    <PageContainer>
      <PageHeader
        icon={CalendarClock}
        eyebrow="Runway"
        title="Opportunities"
        subtitle="Your deadlines on a runway, soonest first. Each ring shows how much runway is left before the gate closes."
      />

      {items.length === 0 ? (
        generating ? (
          <PageGenerating />
        ) : (
          <PageEmpty label="Line up programs and events that fix your gaps, by deadline." onGenerate={() => generateKind("opportunity")} generateLabel="Find opportunities" />
        )
      ) : (
        <div className="relative -mx-1 overflow-x-auto pb-4">
          {/* runway baseline */}
          <div className="relative min-w-max px-1 pt-2">
            <div
              className="absolute left-0 right-0 top-[150px] h-px"
              style={{ background: "linear-gradient(90deg, transparent, var(--pf-border-strong) 6%, var(--pf-border-strong) 94%, transparent)" }}
            />
            <div className="flex items-start gap-5">
              {items.map(({ id, d, ts }, i) => {
                const dl = daysLeft(ts);
                const saved = roadmap.some((t) => t.label.startsWith(d.name));
                const urgent = dl <= 45;
                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20, delay: i * 0.07 }}
                    className="flex w-[290px] shrink-0 flex-col"
                  >
                    {/* card */}
                    <div
                      className="relative flex flex-col gap-3 rounded-2xl border p-4"
                      style={{
                        borderColor: urgent ? "var(--pf-accent)" : "var(--pf-border)",
                        backgroundColor: "var(--pf-card)",
                        boxShadow: "0 24px 60px -34px rgba(0,0,0,0.7)",
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <Countdown days={dl} urgent={urgent} />
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate" style={{ color: "var(--pf-ink)" }}>{d.name}</span>
                          <span className="text-xs" style={{ color: "var(--pf-muted)" }}>{d.type}</span>
                          <span className="mt-1 inline-flex items-center gap-1">
                            <PriorityBadge level={d.impact} />
                          </span>
                        </div>
                      </div>

                      <div
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs"
                        style={{ backgroundColor: "var(--pf-accent-soft)", color: "var(--pf-accent-hi)" }}
                      >
                        <Target size={12} /> {d.fixesGap}
                      </div>

                      <div className="flex flex-col gap-0.5 text-xs" style={{ color: "var(--pf-muted)" }}>
                        <span>{d.cost}</span>
                        <span>{d.eligibility}</span>
                      </div>

                      <div className="flex gap-2 border-t pt-2.5" style={{ borderColor: "var(--pf-border)" }}>
                        <button
                          onClick={() => addTasks([{ label: `${d.name} — due ${d.deadline}`, priority: d.impact, context: "Opportunity" }])}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs transition-transform active:translate-y-[1px]"
                          style={
                            saved
                              ? { backgroundColor: "var(--pf-elevated)", color: "var(--pf-success)" }
                              : { background: "linear-gradient(140deg, var(--pf-accent-hi), var(--pf-accent-deep))", color: "#fff" }
                          }
                        >
                          {saved ? <CheckCircle2 size={13} /> : <CalendarPlus size={13} />}
                          {saved ? "In roadmap" : "Save"}
                        </button>
                        <button
                          onClick={() => openEvidence({ title: d.name, evidence: d.evidence })}
                          aria-label="Evidence"
                          className="inline-flex items-center justify-center rounded-lg border px-2.5"
                          style={{ borderColor: "var(--pf-border)", backgroundColor: "var(--pf-elevated)", color: "var(--pf-ink-soft)" }}
                        >
                          <FileSearch size={14} />
                        </button>
                      </div>
                    </div>

                    {/* stem + node + date */}
                    <div className="flex flex-col items-center">
                      <span className="h-5 w-px" style={{ backgroundColor: "var(--pf-border-strong)" }} />
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: urgent ? "var(--pf-accent)" : "var(--pf-muted)", boxShadow: "0 0 0 4px var(--pf-bg)" }}
                      />
                      <span className="mt-2 font-mono text-xs" style={{ color: urgent ? "var(--pf-accent-hi)" : "var(--pf-muted)" }}>
                        {d.deadline}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

function Countdown({ days, urgent }: { days: number; urgent: boolean }) {
  const size = 52;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, days / 120));
  const tone = urgent ? "var(--pf-accent)" : "var(--pf-muted)";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--pf-elevated)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - frac * c }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-sm leading-none" style={{ color: "var(--pf-ink)" }}>{days > 0 ? days : 0}</span>
        <span className="text-[8px] uppercase tracking-wide" style={{ color: "var(--pf-muted)" }}>days</span>
      </div>
    </div>
  );
}
