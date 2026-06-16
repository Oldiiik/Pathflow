import { useMemo, useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { GraduationCap, MapPin, ArrowUpRight, Star } from "lucide-react";
import { useWorkspace } from "../../store/workspace";
import { PageContainer, PageHeader, PageEmpty, PageGenerating } from "./page-kit";
import { EvidenceChip } from "../shared/primitives";
import type { UniversityData, WorkspaceObject } from "../../lib/types";

const COL: Record<string, number> = { Likely: 20, Target: 50, Reach: 80 };

interface Node {
  obj: WorkspaceObject;
  d: UniversityData;
  x: number;
  y: number;
}

export function UniversitiesPage() {
  const { objects, memory, processing, generateKind } = useWorkspace();
  const universities = objects.filter((o) => o.kind === "university");
  const generating = processing.includes("university");
  const [active, setActive] = useState<string | null>(null);

  // Lay nodes out by difficulty (x) and fit (y), spreading collisions in a column.
  const nodes = useMemo<Node[]>(() => {
    const byCol: Record<string, WorkspaceObject[]> = {};
    for (const o of universities) {
      const k = (o.data as UniversityData).difficulty;
      (byCol[k] ||= []).push(o);
    }
    const out: Node[] = [];
    for (const [col, list] of Object.entries(byCol)) {
      list.forEach((o, i) => {
        const d = o.data as UniversityData;
        const spread = list.length > 1 ? (i - (list.length - 1) / 2) * 13 : 0;
        out.push({
          obj: o,
          d,
          x: COL[col] + spread,
          y: 92 - ((d.fitScore - 55) / 40) * 78, // higher fit → higher up
        });
      });
    }
    return out;
  }, [universities]);

  const ranked = useMemo(
    () => [...universities].sort((a, b) => (b.data as UniversityData).fitScore - (a.data as UniversityData).fitScore),
    [universities]
  );

  return (
    <PageContainer>
      <PageHeader
        icon={GraduationCap}
        eyebrow="Positioning"
        title="Fit map"
        subtitle="Your matches plotted by admission difficulty and fit. Higher is a stronger fit; further right is a longer reach."
      />

      {universities.length === 0 ? (
        generating ? (
          <PageGenerating />
        ) : (
          <PageEmpty
            label="Map universities matched to your profile by fit and difficulty."
            onGenerate={() => generateKind("university")}
            generateLabel="Find universities"
          />
        )
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* The map */}
          <div
            className="relative hidden overflow-hidden rounded-3xl border md:block"
            style={{
              borderColor: "var(--pf-border)",
              backgroundColor: "var(--pf-surface)",
              height: 460,
              backgroundImage:
                "linear-gradient(var(--pf-border) 1px, transparent 1px), linear-gradient(90deg, var(--pf-border) 1px, transparent 1px)",
              backgroundSize: "100% 25%, 33.33% 100%",
              backgroundPosition: "center",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(700px 300px at 80% -10%, var(--pf-accent-soft), transparent 65%)" }}
            />

            {/* axis labels */}
            <span className="absolute left-3 top-3 text-[11px] uppercase tracking-wide" style={{ color: "var(--pf-muted)" }}>
              ↑ Stronger fit
            </span>
            {(["Likely", "Target", "Reach"] as const).map((c) => (
              <span
                key={c}
                className="absolute bottom-2 -translate-x-1/2 text-[11px] uppercase tracking-wide"
                style={{ left: `${COL[c]}%`, color: "var(--pf-muted)" }}
              >
                {c}
              </span>
            ))}

            {nodes.map((n, i) => (
              <MapNode
                key={n.obj.id}
                node={n}
                index={i}
                active={active === n.obj.id}
                saved={memory.savedUniversities.includes(n.d.name)}
                onHover={setActive}
              />
            ))}
          </div>

          {/* Ranked rail (and the only view on mobile) */}
          <div className="flex flex-col gap-2">
            <span className="px-1 text-[11px] uppercase tracking-wide" style={{ color: "var(--pf-muted)" }}>
              Ranked by fit
            </span>
            {ranked.map((o, i) => {
              const d = o.data as UniversityData;
              return (
                <Link
                  key={o.id}
                  to={`/universities/${o.id}`}
                  onMouseEnter={() => setActive(o.id)}
                  onMouseLeave={() => setActive(null)}
                  className="group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors"
                  style={{
                    borderColor: active === o.id ? "var(--pf-accent)" : "var(--pf-border)",
                    backgroundColor: active === o.id ? "var(--pf-accent-soft)" : "var(--pf-card)",
                  }}
                >
                  <span className="font-mono text-sm" style={{ color: "var(--pf-muted)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="flex h-8 w-11 items-center justify-center rounded-md font-mono text-[11px]"
                    style={{ backgroundColor: "var(--pf-elevated)", color: "var(--pf-accent-hi)" }}
                  >
                    {d.short}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm" style={{ color: "var(--pf-ink)" }}>{d.short} · {d.city}</span>
                    <span className="text-xs" style={{ color: "var(--pf-muted)" }}>{d.difficulty}</span>
                  </div>
                  <span className="font-mono text-sm" style={{ color: "var(--pf-ink)" }}>{d.fitScore}</span>
                  {memory.savedUniversities.includes(d.name) && (
                    <Star size={12} fill="var(--pf-accent)" color="var(--pf-accent)" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </PageContainer>
  );
}

function MapNode({
  node,
  index,
  active,
  saved,
  onHover,
}: {
  node: Node;
  index: number;
  active: boolean;
  saved: boolean;
  onHover: (id: string | null) => void;
}) {
  const { d, obj } = node;
  const size = 44 + (d.fitScore - 55) * 0.7; // size encodes fit too

  return (
    <motion.div
      className="absolute"
      style={{ left: `${node.x}%`, top: `${node.y}%`, zIndex: active ? 20 : 10 }}
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 16, delay: index * 0.08 }}
      onMouseEnter={() => onHover(obj.id)}
      onMouseLeave={() => onHover(null)}
    >
      <Link
        to={`/universities/${obj.id}`}
        className="group relative block -translate-x-1/2 -translate-y-1/2"
      >
        {/* halo */}
        <motion.span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          animate={{ scale: active ? [1, 1.25, 1] : 1, opacity: active ? 0.5 : 0.25 }}
          transition={{ duration: 1.6, repeat: active ? Infinity : 0 }}
          style={{ width: size + 16, height: size + 16, background: "var(--pf-glow)" }}
        />
        <span
          className="relative flex flex-col items-center justify-center rounded-full font-mono"
          style={{
            width: size,
            height: size,
            background: "linear-gradient(150deg, var(--pf-accent-hi), var(--pf-accent-deep))",
            color: "#fff",
            boxShadow: "0 10px 26px -10px var(--pf-glow), inset 0 1px 0 rgba(255,255,255,0.25)",
            border: active ? "2px solid #fff" : "2px solid transparent",
          }}
        >
          <span className="text-[11px] leading-none">{d.short}</span>
          <span className="text-[13px] leading-none">{d.fitScore}</span>
        </span>
        {saved && (
          <Star size={12} fill="#fff" color="#fff" className="absolute -right-0.5 -top-0.5" />
        )}

        {/* hover detail */}
        {active && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute left-1/2 top-full z-30 mt-3 w-56 -translate-x-1/2 rounded-xl border p-3"
            style={{ borderColor: "var(--pf-border-strong)", backgroundColor: "var(--pf-elevated)", boxShadow: "0 24px 50px -20px rgba(0,0,0,0.8)" }}
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-sm" style={{ color: "var(--pf-ink)" }}>{d.name}</span>
            </div>
            <span className="mb-2 flex items-center gap-1 text-xs" style={{ color: "var(--pf-muted)" }}>
              <MapPin size={11} /> {d.city}, {d.country}
            </span>
            <div className="mb-2 flex items-center gap-2">
              <EvidenceChip status={d.evidenceStatus} />
              <span className="text-xs" style={{ color: "var(--pf-muted)" }}>{d.difficulty}</span>
            </div>
            <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--pf-accent-hi)" }}>
              Open profile <ArrowUpRight size={12} />
            </span>
          </motion.div>
        )}
      </Link>
    </motion.div>
  );
}
