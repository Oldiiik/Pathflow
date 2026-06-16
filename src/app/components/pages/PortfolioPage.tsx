import { useMemo } from "react";
import { motion } from "motion/react";
import { FolderSearch, ShieldCheck, FileText, Sparkle, Copy, AlertTriangle, ArrowRight } from "lucide-react";
import { useWorkspace } from "../../store/workspace";
import { PageContainer, PageHeader, PageEmpty, PageGenerating } from "./page-kit";
import type { PortfolioData } from "../../lib/types";

export function PortfolioPage() {
  const { objects, openEvidence, processing, generateKind } = useWorkspace();
  const generating = processing.includes("portfolio");
  const d = objects.find((o) => o.kind === "portfolio")?.data as PortfolioData | undefined;

  // Composite "portfolio strength" — verified counts most, missing proof drags it down.
  const score = useMemo(() => {
    if (!d) return 0;
    const raw = d.verified.length * 20 + d.claimed.length * 9 + d.inferred.length * 4 - d.missingProof.length * 7;
    return Math.max(8, Math.min(100, Math.round(raw + 28)));
  }, [d]);

  const layers = d
    ? [
        { key: "Verified", tone: "var(--pf-success)", items: d.verified, icon: ShieldCheck },
        { key: "Claimed", tone: "var(--pf-warn)", items: d.claimed, icon: FileText },
        { key: "Inferred", tone: "var(--pf-unknown)", items: d.inferred, icon: Sparkle },
      ]
    : [];

  return (
    <PageContainer>
      <PageHeader
        icon={FolderSearch}
        eyebrow="X-ray"
        title="Portfolio"
        subtitle="A layered read of your profile — what holds up under scrutiny, what's only asserted, and how to rewrite it."
      />

      {!d ? (
        generating ? (
          <PageGenerating />
        ) : (
          <PageEmpty label="X-ray your profile — what's verified, claimed, and missing." onGenerate={() => generateKind("portfolio")} generateLabel="Analyze portfolio" />
        )
      ) : (
        <>
          {/* Strength core + layered evidence */}
          <div
            className="grid items-center gap-6 overflow-hidden rounded-3xl border p-6 sm:p-8 lg:grid-cols-[260px_minmax(0,1fr)]"
            style={{ borderColor: "var(--pf-border)", backgroundColor: "var(--pf-card)" }}
          >
            <div className="relative flex flex-col items-center justify-center">
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(circle, var(--pf-accent-soft), transparent 70%)" }}
              />
              <StrengthCore score={score} />
              <span className="mt-2 text-sm" style={{ color: "var(--pf-muted)" }}>Portfolio strength</span>
            </div>

            <div className="flex flex-col gap-4">
              {layers.map((l, li) => (
                <div key={l.key} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <l.icon size={14} style={{ color: l.tone }} />
                    <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--pf-muted)" }}>
                      {l.key}
                    </span>
                    <span className="h-px flex-1" style={{ backgroundColor: "var(--pf-border)" }} />
                    <span className="font-mono text-xs" style={{ color: "var(--pf-muted)" }}>{l.items.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {l.items.map((item, i) => (
                      <motion.span
                        key={item}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 + li * 0.08 + i * 0.05, type: "spring", stiffness: 200, damping: 18 }}
                        className="rounded-lg border px-2.5 py-1 text-sm"
                        style={{ borderColor: "var(--pf-border)", backgroundColor: "var(--pf-surface)", color: "var(--pf-ink-soft)" }}
                      >
                        {item}
                      </motion.span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Diagnostic faults */}
          <div className="grid gap-4 md:grid-cols-2">
            <FaultPanel title="Missing proof" tone="var(--pf-accent)" items={d.missingProof} />
            <FaultPanel title="Weak areas" tone="var(--pf-warn)" items={d.weakAreas} />
          </div>

          {/* Rewrite */}
          <div
            className="relative overflow-hidden rounded-3xl border p-6 sm:p-8"
            style={{ borderColor: "var(--pf-accent)", backgroundColor: "var(--pf-card)" }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(560px 220px at 100% 0%, var(--pf-accent-soft), transparent 70%)" }}
            />
            <div className="relative flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wide" style={{ color: "var(--pf-accent-hi)" }}>
                <Sparkle size={13} /> Portfolio-ready rewrite
              </span>
              <button
                onClick={() => navigator.clipboard?.writeText(d.rewrite)}
                className="inline-flex items-center gap-1 text-xs active:scale-95"
                style={{ color: "var(--pf-accent-hi)" }}
              >
                <Copy size={13} /> Copy
              </button>
            </div>
            <p
              className="relative mt-4 leading-relaxed"
              style={{ color: "var(--pf-ink)", fontSize: "1.35rem", lineHeight: 1.5, letterSpacing: "-0.01em" }}
            >
              "{d.rewrite}"
            </p>
            <button
              onClick={() => openEvidence({ title: "Portfolio diagnosis", evidence: d.evidence })}
              className="relative mt-4 inline-flex items-center gap-1.5 text-sm transition-colors hover:text-[var(--pf-accent-hi)]"
              style={{ color: "var(--pf-accent)" }}
            >
              How this was derived <ArrowRight size={14} />
            </button>
          </div>
        </>
      )}
    </PageContainer>
  );
}

function StrengthCore({ score }: { score: number }) {
  const size = 196;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const band = score >= 70 ? "var(--pf-success)" : score >= 45 ? "var(--pf-warn)" : "var(--pf-accent)";
  const label = score >= 70 ? "Strong" : score >= 45 ? "Developing" : "Needs work";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--pf-elevated)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={band} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (score / 100) * c }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono leading-none" style={{ fontSize: "3.2rem", color: "var(--pf-ink)" }}>{score}</span>
        <span className="rounded-full px-2 py-0.5 text-[11px] uppercase tracking-wide" style={{ color: band }}>
          {label}
        </span>
      </div>
    </div>
  );
}

function FaultPanel({ title, tone, items }: { title: string; tone: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border p-5" style={{ borderColor: "var(--pf-border)", backgroundColor: "var(--pf-surface)" }}>
      <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wide" style={{ color: "var(--pf-muted)" }}>
        <AlertTriangle size={13} style={{ color: tone }} /> {title}
      </span>
      <div className="flex flex-col divide-y" style={{ borderColor: "var(--pf-border)" }}>
        {items.map((it) => (
          <div key={it} className="flex items-center gap-2 py-2 text-sm" style={{ color: "var(--pf-ink)" }}>
            <span className="h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: tone }} />
            {it}
          </div>
        ))}
      </div>
    </div>
  );
}
