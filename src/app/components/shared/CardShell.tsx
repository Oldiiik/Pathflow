import { motion } from "motion/react";
import { X } from "lucide-react";
import type { ReactNode } from "react";

// Consistent shell for every workspace object. Uses elevation only where it
// communicates that the card lifted out of the chat.
export function CardShell({
  layoutId,
  kindLabel,
  title,
  subtitle,
  right,
  children,
  actions,
  onDismiss,
}: {
  layoutId?: string;
  kindLabel: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  onDismiss?: () => void;
}) {
  return (
    <motion.article
      layoutId={layoutId}
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      whileHover={{ y: -3 }}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border bg-[var(--pf-card)] p-5"
      style={{
        borderColor: "var(--pf-border)",
        boxShadow:
          "0 24px 60px -28px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Accent hairline — signals this object came from the reasoning engine. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--pf-accent), transparent)",
          opacity: 0.5,
        }}
      />
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span
            className="text-[11px] uppercase tracking-[0.14em]"
            style={{ color: "var(--pf-accent)" }}
          >
            {kindLabel}
          </span>
          <h3 style={{ color: "var(--pf-ink)" }}>{title}</h3>
          {subtitle && (
            <span className="text-sm" style={{ color: "var(--pf-muted)" }}>
              {subtitle}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {right}
          {onDismiss && (
            <button
              onClick={onDismiss}
              aria-label="Dismiss card"
              className="rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 active:scale-[0.92]"
              style={{ color: "var(--pf-muted)" }}
            >
              <X size={16} strokeWidth={2} />
            </button>
          )}
        </div>
      </header>

      {children}

      {actions && (
        <footer
          className="flex flex-wrap gap-2 border-t pt-3"
          style={{ borderColor: "var(--pf-border)" }}
        >
          {actions}
        </footer>
      )}
    </motion.article>
  );
}

// Card action button — ghost by default, ruby when primary (a deliberate signal).
export function CardAction({
  children,
  onClick,
  primary = false,
  icon: Icon,
}: {
  children: ReactNode;
  onClick?: () => void;
  primary?: boolean;
  icon?: typeof X;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors active:translate-y-[1px]"
      style={
        primary
          ? {
              background: "linear-gradient(140deg, var(--pf-accent-hi), var(--pf-accent-deep))",
              borderColor: "transparent",
              color: "#fff",
              boxShadow: "0 8px 22px -10px var(--pf-glow), inset 0 1px 0 rgba(255,255,255,0.22)",
            }
          : { backgroundColor: "var(--pf-elevated)", borderColor: "var(--pf-border)", color: "var(--pf-ink-soft)" }
      }
    >
      {Icon && <Icon size={14} strokeWidth={2} />}
      {children}
    </button>
  );
}

// Bulleted list shared by several cards.
export function Bullets({ items, tone }: { items: string[]; tone?: string }) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm" style={{ color: "var(--pf-ink)" }}>
          <span
            className="mt-[7px] h-1 w-1 shrink-0 rounded-full"
            style={{ backgroundColor: tone ?? "var(--pf-muted)" }}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
