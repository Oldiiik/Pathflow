import { Link } from "react-router";
import { motion } from "motion/react";
import { Sparkles, ArrowRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

// Page content reveals as a staggered block — gives every page a sense of motion.
export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } } }}
      className="mx-auto flex w-full max-w-[1180px] flex-col gap-8 px-5 py-10 sm:px-10"
    >
      {children}
    </motion.div>
  );
}

const headerReveal = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 90, damping: 18 } },
};

export function PageHeader({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  action,
}: {
  icon?: LucideIcon;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <motion.header variants={headerReveal} className="flex flex-col gap-5 border-b pb-6" style={{ borderColor: "var(--pf-border)" }}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-3.5">
          {Icon && (
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl border"
              style={{ borderColor: "var(--pf-border)", backgroundColor: "var(--pf-elevated)", color: "var(--pf-accent-hi)" }}
            >
              <Icon size={20} strokeWidth={1.9} />
            </div>
          )}
          <div className="flex flex-col gap-1">
            {eyebrow && (
              <span className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--pf-accent)" }}>
                {eyebrow}
              </span>
            )}
            <h1 style={{ color: "var(--pf-ink)", fontSize: "clamp(1.6rem, 3vw, 2.1rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
              {title}
            </h1>
          </div>
        </div>
        {action}
      </div>
      {subtitle && (
        <p className="max-w-[64ch] text-sm leading-relaxed" style={{ color: "var(--pf-muted)" }}>
          {subtitle}
        </p>
      )}
    </motion.header>
  );
}

// A row of metrics separated by hairlines (no boxes) — reads as a finished header.
export function StatStrip({ stats }: { stats: { label: string; value: ReactNode; tone?: string }[] }) {
  return (
    <div
      className="flex flex-wrap items-stretch divide-x overflow-hidden rounded-2xl border"
      style={{ borderColor: "var(--pf-border)", backgroundColor: "var(--pf-surface)" }}
    >
      {stats.map((s) => (
        <div key={s.label} className="flex min-w-[120px] flex-1 flex-col gap-1 px-5 py-4" style={{ borderColor: "var(--pf-border)" }}>
          <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--pf-muted)" }}>
            {s.label}
          </span>
          <span className="font-mono text-2xl leading-none" style={{ color: s.tone ?? "var(--pf-ink)" }}>
            {s.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// Shown while a page generates its own objects (no chat needed).
export function PageGenerating() {
  return (
    <div className="flex flex-col gap-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-3 rounded-2xl border p-5" style={{ borderColor: "var(--pf-border)", backgroundColor: "var(--pf-card)" }}>
          {[40, 92, 76].map((w, j) => (
            <div key={j} className="relative h-3 overflow-hidden rounded-md" style={{ width: `${w}%`, backgroundColor: "var(--pf-elevated)" }}>
              <motion.div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent, rgba(120,150,255,0.12), transparent)" }} animate={{ x: ["-100%", "100%"] }} transition={{ repeat: Infinity, duration: 1.3, delay: (i + j) * 0.1 }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Thin progress bar used for fit / strength visualisations.
export function MiniBar({ value, tone }: { value: number; tone?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--pf-elevated)" }}>
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.max(4, Math.min(100, value))}%`,
          background: tone ?? "linear-gradient(90deg, var(--pf-accent-deep), var(--pf-accent-hi))",
          transition: "width 0.7s cubic-bezier(0.16,1,0.3,1)",
        }}
      />
    </div>
  );
}

// Empty state. Offers a direct generate action (pages work without the chat),
// with "describe it in Command" as a secondary path.
export function PageEmpty({
  label,
  onGenerate,
  generateLabel = "Generate",
}: {
  label: string;
  onGenerate?: () => void;
  generateLabel?: string;
}) {
  return (
    <motion.div
      variants={headerReveal}
      className="flex flex-col items-center gap-4 rounded-2xl border px-6 py-16 text-center"
      style={{ borderColor: "var(--pf-border)", backgroundColor: "var(--pf-surface)" }}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--pf-accent-soft)", color: "var(--pf-accent-hi)" }}>
        <Sparkles size={22} strokeWidth={1.8} />
      </div>
      <div className="flex max-w-sm flex-col gap-1">
        <h3 style={{ color: "var(--pf-ink)" }}>Nothing here yet</h3>
        <p className="text-sm leading-relaxed" style={{ color: "var(--pf-muted)" }}>{label}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onGenerate && (
          <button
            onClick={onGenerate}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm transition-transform active:translate-y-[1px]"
            style={{ backgroundColor: "var(--pf-accent)", color: "#fff", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)" }}
          >
            <Sparkles size={15} /> {generateLabel}
          </button>
        )}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm transition-colors hover:text-[var(--pf-accent-hi)]"
          style={{ color: "var(--pf-muted)" }}
        >
          or describe it in Command <ArrowRight size={14} />
        </Link>
      </div>
    </motion.div>
  );
}
