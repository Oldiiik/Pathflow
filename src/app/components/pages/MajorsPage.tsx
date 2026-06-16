import { useMemo } from "react";
import { motion } from "motion/react";
import { Compass, Star, FileSearch, FlaskConical } from "lucide-react";
import { useWorkspace } from "../../store/workspace";
import { PageContainer, PageHeader, PageEmpty, PageGenerating } from "./page-kit";
import { Bullets } from "../shared/CardShell";
import { TiltCard } from "../cube/TiltCard";
import type { MajorFitData } from "../../lib/types";

export function MajorsPage() {
  const { objects, memory, mergeMemory, openEvidence, processing, generateKind } = useWorkspace();
  const generating = processing.includes("majorFit");

  const items = useMemo(
    () =>
      objects
        .filter((o) => o.kind === "majorFit")
        .map((o) => ({ id: o.id, d: o.data as MajorFitData }))
        .sort((a, b) => b.d.fitScore - a.d.fitScore),
    [objects]
  );

  const [lead, ...rest] = items;

  return (
    <PageContainer>
      <PageHeader
        icon={Compass}
        eyebrow="Leaderboard"
        title="Major fit"
        subtitle="Ranked against your profile. The lead recommendation is featured; the chasing pack is shown as a fit race."
      />

      {items.length === 0 ? (
        generating ? (
          <PageGenerating />
        ) : (
          <PageEmpty label="Rank fields of study against your profile." onGenerate={() => generateKind("majorFit")} generateLabel="Run major fit" />
        )
      ) : (
        <>
          {/* Featured lead */}
          {lead && (
            <TiltCard
              max={5}
              className="relative overflow-hidden rounded-3xl border p-6 sm:p-8"
              style={{ borderColor: "var(--pf-accent)", backgroundColor: "var(--pf-card)" }}
            >
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(620px 280px at 100% 0%, var(--pf-accent-soft), transparent 70%)" }}
              />
              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-stretch">
                <div className="flex flex-col justify-between gap-4 lg:w-1/2">
                  <div className="flex flex-col gap-2">
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] uppercase tracking-wide"
                      style={{ backgroundColor: "var(--pf-accent-soft)", color: "var(--pf-accent-hi)" }}>
                      <Star size={12} fill="var(--pf-accent)" color="var(--pf-accent)" /> Lead recommendation
                    </span>
                    <h2 style={{ color: "var(--pf-ink)", fontSize: "1.9rem", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                      {lead.d.major}
                    </h2>
                  </div>
                  <Bullets items={lead.d.whyItFits} tone="var(--pf-success)" />
                  <div className="flex flex-wrap gap-2 pt-1">
                    <PrefButton major={lead.d.major} preferred={memory.preferredPaths.includes(lead.d.major)} onClick={() => mergeMemory({ preferredPaths: [lead.d.major] })} />
                    <GhostButton onClick={() => openEvidence({ title: lead.d.major, evidence: lead.d.evidence })}>
                      <FileSearch size={14} /> Evidence
                    </GhostButton>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border lg:w-1/2"
                  style={{ borderColor: "var(--pf-border)", backgroundColor: "var(--pf-surface)", padding: "1.5rem" }}>
                  <BigGauge value={lead.d.fitScore} />
                  <div className="flex w-full flex-wrap justify-center gap-1.5">
                    {lead.d.requiredSkills.map((s) => (
                      <span key={s} className="rounded-md border px-2 py-0.5 text-xs"
                        style={{ borderColor: "var(--pf-border)", color: "var(--pf-ink-soft)" }}>{s}</span>
                    ))}
                  </div>
                  <div className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-sm"
                    style={{ backgroundColor: "var(--pf-accent-soft)", color: "var(--pf-accent-hi)" }}>
                    <FlaskConical size={15} className="mt-0.5 shrink-0" /> {lead.d.suggestedProjects[0]}
                  </div>
                </div>
              </div>
            </TiltCard>
          )}

          {/* The chasing pack — fit race */}
          {rest.length > 0 && (
            <div className="flex flex-col">
              <span className="px-1 pb-2 text-[11px] uppercase tracking-wide" style={{ color: "var(--pf-muted)" }}>
                The chasing pack
              </span>
              <div className="flex flex-col">
                {rest.map(({ id, d }, i) => {
                  const preferred = memory.preferredPaths.includes(d.major);
                  return (
                    <motion.div
                      key={id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: "spring", stiffness: 100, damping: 20, delay: i * 0.06 }}
                      className="group relative flex items-center gap-4 border-b py-5"
                      style={{ borderColor: "var(--pf-border)" }}
                    >
                      {/* ghost numeral */}
                      <span
                        className="select-none font-mono leading-none"
                        style={{ fontSize: "3.2rem", color: "var(--pf-elevated)", width: "2.4ch", textAlign: "center" }}
                      >
                        {i + 2}
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex items-baseline justify-between gap-3">
                          <span style={{ color: "var(--pf-ink)" }}>{d.major}</span>
                          <span className="font-mono text-sm" style={{ color: "var(--pf-muted)" }}>{d.fitScore}<span style={{ color: "var(--pf-unknown)" }}>/100</span></span>
                        </div>
                        {/* animated race bar */}
                        <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--pf-elevated)" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${d.fitScore}%` }}
                            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 + i * 0.06 }}
                            className="h-full rounded-full"
                            style={{ background: "linear-gradient(90deg, var(--pf-accent-deep), var(--pf-accent-hi))" }}
                          />
                        </div>
                        <div className="text-xs" style={{ color: "var(--pf-muted)" }}>
                          {d.requiredSkills.slice(0, 4).join("  ·  ")}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1.5">
                        <PrefButton compact major={d.major} preferred={preferred} onClick={() => mergeMemory({ preferredPaths: [d.major] })} />
                        <GhostButton compact onClick={() => openEvidence({ title: d.major, evidence: d.evidence })}>
                          <FileSearch size={13} /> Why
                        </GhostButton>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}

function BigGauge({ value }: { value: number }) {
  const size = 140;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--pf-elevated)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="url(#majorGauge)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (value / 100) * c }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
        <defs>
          <linearGradient id="majorGauge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--pf-accent-deep)" />
            <stop offset="100%" stopColor="var(--pf-accent-hi)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono leading-none" style={{ fontSize: "2.4rem", color: "var(--pf-ink)" }}>{value}</span>
        <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--pf-muted)" }}>fit score</span>
      </div>
    </div>
  );
}

function PrefButton({ major, preferred, onClick, compact }: { major: string; preferred: boolean; onClick: () => void; compact?: boolean }) {
  void major;
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg ${compact ? "px-2.5 py-1 text-xs" : "px-3.5 py-2 text-sm"} transition-transform active:translate-y-[1px]`}
      style={
        preferred
          ? { backgroundColor: "var(--pf-elevated)", color: "var(--pf-success)" }
          : { background: "linear-gradient(140deg, var(--pf-accent-hi), var(--pf-accent-deep))", color: "#fff" }
      }
    >
      <Star size={compact ? 12 : 14} fill={preferred ? "var(--pf-success)" : "none"} />
      {preferred ? "Preferred" : "Prefer"}
    </button>
  );
}

function GhostButton({ children, onClick, compact }: { children: React.ReactNode; onClick: () => void; compact?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border ${compact ? "px-2.5 py-1 text-xs" : "px-3.5 py-2 text-sm"}`}
      style={{ borderColor: "var(--pf-border)", backgroundColor: "var(--pf-elevated)", color: "var(--pf-ink-soft)" }}
    >
      {children}
    </button>
  );
}
