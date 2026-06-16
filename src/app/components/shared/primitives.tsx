// Small reusable presentation primitives for Pathflow cards.
import { ShieldCheck, CircleHelp, FileText } from "lucide-react";
import type { EvidenceStatus } from "../../lib/types";

// Fit score: graphite ring with the number; red only when fit is strong (a signal).
export function FitScore({ value, size = 56 }: { value: number; size?: number }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const strong = value >= 80;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--pf-border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={strong ? "var(--pf-accent)" : "var(--pf-ink)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono leading-none"
          style={{ fontSize: size * 0.28, color: "var(--pf-ink)" }}
        >
          {value}
        </span>
        <span className="text-[9px] uppercase tracking-wider" style={{ color: "var(--pf-muted)" }}>
          fit
        </span>
      </div>
    </div>
  );
}

const STATUS_META: Record<
  EvidenceStatus,
  { label: string; color: string; bg: string; Icon: typeof ShieldCheck }
> = {
  verified: { label: "Verified", color: "var(--pf-success)", bg: "rgba(31,122,77,0.08)", Icon: ShieldCheck },
  claimed: { label: "Claimed", color: "var(--pf-warn)", bg: "rgba(196,122,27,0.10)", Icon: FileText },
  unknown: { label: "Unverified", color: "var(--pf-unknown)", bg: "rgba(139,143,151,0.12)", Icon: CircleHelp },
};

export function EvidenceChip({ status }: { status: EvidenceStatus }) {
  const m = STATUS_META[status];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
      style={{ color: m.color, backgroundColor: m.bg }}
    >
      <m.Icon size={12} strokeWidth={2} />
      {m.label}
    </span>
  );
}

export function ConfidenceTag({ value }: { value: number }) {
  const tone =
    value >= 75 ? "var(--pf-success)" : value >= 55 ? "var(--pf-warn)" : "var(--pf-unknown)";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--pf-muted)" }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone }} />
      <span className="font-mono" style={{ color: "var(--pf-ink)" }}>{value}%</span>
      confidence
    </span>
  );
}

const PRIORITY_META: Record<string, { label: string; color: string; bg: string }> = {
  high: { label: "High", color: "var(--pf-accent)", bg: "var(--pf-accent-soft)" },
  medium: { label: "Medium", color: "var(--pf-warn)", bg: "rgba(196,122,27,0.10)" },
  low: { label: "Low", color: "var(--pf-muted)", bg: "rgba(139,143,151,0.10)" },
};

export function PriorityBadge({ level }: { level: "high" | "medium" | "low" }) {
  const m = PRIORITY_META[level];
  return (
    <span
      className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] uppercase tracking-wide"
      style={{ color: m.color, backgroundColor: m.bg }}
    >
      {m.label}
    </span>
  );
}

// A labelled metadata pair used densely across cards.
export function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--pf-muted)" }}>
        {label}
      </span>
      <span className="text-sm" style={{ color: "var(--pf-ink)" }}>{value}</span>
    </div>
  );
}

// Section label inside a card.
export function CardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--pf-muted)" }}>
        {title}
      </span>
      {children}
    </div>
  );
}
