import { useMemo, useState } from "react";
import { Link } from "react-router";
import { GitCompare, Check, Crown, ArrowUpRight } from "lucide-react";
import { useWorkspace } from "../../store/workspace";
import { PageContainer, PageHeader, PageEmpty, PageGenerating } from "./page-kit";
import { FitScore, EvidenceChip } from "../shared/primitives";
import type { UniversityData, WorkspaceObject } from "../../lib/types";

interface Row {
  label: string;
  get: (d: UniversityData) => string;
}

const ROWS: Row[] = [
  { label: "Difficulty", get: (d) => d.difficulty },
  { label: "Acceptance", get: (d) => d.acceptanceNote },
  { label: "Tuition", get: (d) => d.tuition },
  { label: "Best programs", get: (d) => d.programs.join(", ") },
  { label: "Main gap", get: (d) => d.gaps[0] ?? "—" },
  { label: "Location", get: (d) => `${d.city}, ${d.country}` },
];

export function ComparePage() {
  const { objects, processing, generateKind } = useWorkspace();
  const universities = useMemo(() => objects.filter((o) => o.kind === "university"), [objects]);
  const generating = processing.includes("university");

  const [selected, setSelected] = useState<string[]>(() => universities.slice(0, 3).map((o) => o.id));
  const chosen = universities.filter((o) => selected.includes(o.id));
  const bestId = useMemo(() => {
    let id = "";
    let best = -1;
    for (const o of chosen) {
      const f = (o.data as UniversityData).fitScore;
      if (f > best) { best = f; id = o.id; }
    }
    return id;
  }, [chosen]);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <PageContainer>
      <PageHeader
        icon={GitCompare}
        eyebrow="Compare mode"
        title="Weigh your shortlist side by side."
        subtitle="Pick the schools to compare. The strongest fit for your profile is crowned."
      />

      {universities.length === 0 ? (
        generating ? (
          <PageGenerating />
        ) : (
          <PageEmpty label="Bring in universities, then weigh them side by side." onGenerate={() => generateKind("university")} generateLabel="Find universities" />
        )
      ) : (
        <>
          {/* selectors */}
          <div className="flex flex-wrap gap-2">
            {universities.map((o) => {
              const d = o.data as UniversityData;
              const on = selected.includes(o.id);
              return (
                <button
                  key={o.id}
                  onClick={() => toggle(o.id)}
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors"
                  style={{
                    borderColor: on ? "var(--pf-accent)" : "var(--pf-border)",
                    backgroundColor: on ? "var(--pf-accent-soft)" : "var(--pf-card)",
                    color: on ? "var(--pf-accent-hi)" : "var(--pf-ink-soft)",
                  }}
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded border" style={{ borderColor: on ? "var(--pf-accent)" : "var(--pf-border)", backgroundColor: on ? "var(--pf-accent)" : "transparent" }}>
                    {on && <Check size={11} color="#fff" />}
                  </span>
                  {d.short}
                </button>
              );
            })}
          </div>

          {chosen.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--pf-muted)" }}>Select at least one school above.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "var(--pf-border)" }}>
              <div style={{ minWidth: Math.max(560, chosen.length * 220) }}>
                {/* header */}
                <div className="grid" style={{ gridTemplateColumns: `160px repeat(${chosen.length}, minmax(0,1fr))` }}>
                  <div className="p-4" style={{ borderBottom: "1px solid var(--pf-border)" }} />
                  {chosen.map((o) => (
                    <ColHead key={o.id} obj={o} best={o.id === bestId} />
                  ))}
                </div>
                {ROWS.map((row, ri) => (
                  <div key={row.label} className="grid" style={{ gridTemplateColumns: `160px repeat(${chosen.length}, minmax(0,1fr))`, borderBottom: ri < ROWS.length - 1 ? "1px solid var(--pf-borderSoft, var(--pf-border))" : "none" }}>
                    <div className="p-4 text-xs uppercase tracking-wide" style={{ color: "var(--pf-muted)" }}>{row.label}</div>
                    {chosen.map((o) => (
                      <div key={o.id} className="p-4 text-sm" style={{ color: "var(--pf-ink-soft)", backgroundColor: o.id === bestId ? "rgba(76,130,251,0.04)" : "transparent" }}>
                        {row.get(o.data as UniversityData)}
                      </div>
                    ))}
                  </div>
                ))}
                {/* evidence row */}
                <div className="grid" style={{ gridTemplateColumns: `160px repeat(${chosen.length}, minmax(0,1fr))`, borderTop: "1px solid var(--pf-border)" }}>
                  <div className="p-4 text-xs uppercase tracking-wide" style={{ color: "var(--pf-muted)" }}>Evidence</div>
                  {chosen.map((o) => (
                    <div key={o.id} className="p-4" style={{ backgroundColor: o.id === bestId ? "rgba(76,130,251,0.04)" : "transparent" }}>
                      <EvidenceChip status={(o.data as UniversityData).evidenceStatus} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}

function ColHead({ obj, best }: { obj: WorkspaceObject; best: boolean }) {
  const d = obj.data as UniversityData;
  return (
    <div className="flex flex-col items-start gap-2 p-4" style={{ borderBottom: "1px solid var(--pf-border)", backgroundColor: best ? "rgba(76,130,251,0.05)" : "transparent" }}>
      <div className="flex w-full items-center justify-between">
        <span className="font-mono text-xs" style={{ color: "var(--pf-accent-hi)" }}>{d.short}</span>
        {best && (
          <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] uppercase tracking-wide" style={{ backgroundColor: "var(--pf-accent-soft)", color: "var(--pf-accent-hi)" }}>
            <Crown size={11} /> Best fit
          </span>
        )}
      </div>
      <FitScore value={d.fitScore} size={44} />
      <Link to={`/universities/${obj.id}`} className="inline-flex items-center gap-1 text-xs transition-colors hover:text-[var(--pf-accent-hi)]" style={{ color: "var(--pf-muted)" }}>
        Open <ArrowUpRight size={12} />
      </Link>
    </div>
  );
}
