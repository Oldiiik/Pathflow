import { useMemo } from "react";
import { motion } from "motion/react";
import { Radar as RadarIcon, ArrowRight } from "lucide-react";
import { useWorkspace } from "../../store/workspace";
import { PageContainer, PageHeader, PageEmpty, PageGenerating } from "./page-kit";
import { PriorityBadge } from "../shared/primitives";
import type { GapItem, GapRadarData } from "../../lib/types";

const TONE: Record<string, string> = {
  high: "var(--pf-accent)",
  medium: "var(--pf-warn)",
  low: "var(--pf-unknown)",
};
const PRIO_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export function GapsPage() {
  const { objects, addTasks, processing, generateKind } = useWorkspace();
  const generating = processing.includes("gapRadar");
  const data = objects.find((o) => o.kind === "gapRadar")?.data as GapRadarData | undefined;

  const queue = useMemo(
    () => (data ? [...data.gaps].sort((a, b) => PRIO_ORDER[a.priority] - PRIO_ORDER[b.priority]) : []),
    [data]
  );

  return (
    <PageContainer>
      <PageHeader
        icon={RadarIcon}
        eyebrow="Diagnosis"
        title="Gap radar"
        subtitle="A live scan of your profile. Blips closer to the rim are stronger; the ones near the core are what's holding you back."
      />

      {!data ? (
        generating ? (
          <PageGenerating />
        ) : (
          <PageEmpty label="Scan your profile for what's blocking your reach schools." onGenerate={() => generateKind("gapRadar")} generateLabel="Run gap radar" />
        )
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <div
            className="relative flex items-center justify-center overflow-hidden rounded-3xl border p-4"
            style={{ borderColor: "var(--pf-border)", backgroundColor: "var(--pf-surface)" }}
          >
            <SweepRadar gaps={data.gaps} />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--pf-muted)" }}>
                Fix queue
              </span>
              <button
                onClick={() => addTasks(queue.filter((g) => g.priority === "high").map((g) => ({ label: g.fix, priority: "high" as const, context: "Gap" })))}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm"
                style={{ background: "linear-gradient(140deg, var(--pf-accent-hi), var(--pf-accent-deep))", color: "#fff" }}
              >
                Queue high-priority fixes <ArrowRight size={14} />
              </button>
            </div>

            {queue.map((g, i) => (
              <motion.div
                key={g.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 110, damping: 20 }}
                className="flex items-start gap-3 rounded-2xl border p-4"
                style={{ borderColor: "var(--pf-border)", backgroundColor: "var(--pf-card)" }}
              >
                <StrengthDial value={g.current} tone={TONE[g.priority]} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span style={{ color: "var(--pf-ink)" }}>{g.label}</span>
                    <PriorityBadge level={g.priority} />
                  </div>
                  <span className="text-sm leading-relaxed" style={{ color: "var(--pf-muted)" }}>{g.fix}</span>
                  <button
                    onClick={() => addTasks([{ label: g.fix, priority: g.priority, context: "Gap" }])}
                    className="mt-1 inline-flex w-fit items-center gap-1 text-xs transition-colors hover:text-[var(--pf-accent-hi)]"
                    style={{ color: "var(--pf-accent)" }}
                  >
                    Add to roadmap <ArrowRight size={12} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  );
}

function SweepRadar({ gaps }: { gaps: GapItem[] }) {
  const S = 320;
  const c = S / 2;
  const R = 132;
  const rings = [0.25, 0.5, 0.75, 1];

  const points = gaps.map((g, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / gaps.length;
    const rr = (g.current / 100) * R;
    return {
      g,
      x: c + rr * Math.cos(ang),
      y: c + rr * Math.sin(ang),
      lx: c + (R + 4) * Math.cos(ang),
      ly: c + (R + 4) * Math.sin(ang),
      ang,
    };
  });

  return (
    <div className="relative" style={{ width: S, height: S }}>
      {/* rotating sweep */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "conic-gradient(from 0deg, transparent 0deg, var(--pf-glow) 38deg, transparent 60deg)",
          maskImage: "radial-gradient(circle, #000 70%, transparent 71%)",
          WebkitMaskImage: "radial-gradient(circle, #000 70%, transparent 71%)",
        }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
      />

      <svg width={S} height={S} className="relative">
        {rings.map((f) => (
          <circle key={f} cx={c} cy={c} r={R * f} fill="none" stroke="var(--pf-border)" strokeWidth={1} />
        ))}
        {points.map((p) => (
          <line key={`spoke-${p.g.label}`} x1={c} y1={c} x2={c + R * Math.cos(p.ang)} y2={c + R * Math.sin(p.ang)} stroke="var(--pf-border)" strokeWidth={1} />
        ))}
        {/* polygon connecting blips */}
        <motion.polygon
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="var(--pf-accent-soft)"
          stroke="var(--pf-accent)"
          strokeWidth={1.5}
        />
        {points.map((p, i) => (
          <motion.circle
            key={`blip-${p.g.label}`}
            cx={p.x}
            cy={p.y}
            initial={{ r: 0 }}
            animate={{ r: 5 }}
            transition={{ delay: 0.5 + i * 0.08, type: "spring", stiffness: 200, damping: 12 }}
            fill={TONE[p.g.priority]}
            stroke="var(--pf-bg)"
            strokeWidth={2}
          />
        ))}
        {points.map((p) => {
          const anchor = Math.cos(p.ang) > 0.3 ? "start" : Math.cos(p.ang) < -0.3 ? "end" : "middle";
          return (
            <text
              key={`label-${p.g.label}`}
              x={p.lx}
              y={p.ly}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize="10"
              fill="var(--pf-muted)"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {p.g.axis}
            </text>
          );
        })}
        <circle cx={c} cy={c} r={3} fill="var(--pf-accent-hi)" />
      </svg>
    </div>
  );
}

function StrengthDial({ value, tone }: { value: number; tone: string }) {
  const size = 44;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--pf-elevated)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (value / 100) * circ }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-xs" style={{ color: "var(--pf-ink)" }}>
        {value}
      </span>
    </div>
  );
}
