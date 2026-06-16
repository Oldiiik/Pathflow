import { motion } from "motion/react";
import { GraduationCap, Compass, Radar, CalendarClock, FolderSearch, Loader } from "lucide-react";
import type { ObjectKind } from "../../lib/types";

const ICONS: Record<ObjectKind, typeof Radar> = {
  university: GraduationCap,
  majorFit: Compass,
  gapRadar: Radar,
  opportunity: CalendarClock,
  portfolio: FolderSearch,
};

// A tool chip shown in the chat while the system "runs" the tool. Shares a
// layoutId so it visually morphs into the workspace card.
export function ToolChip({
  layoutId,
  label,
  kind,
  processing = false,
}: {
  layoutId?: string;
  label: string;
  kind: ObjectKind;
  processing?: boolean;
}) {
  const Icon = ICONS[kind];
  return (
    <motion.div
      layoutId={layoutId}
      layout
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm"
      style={{
        backgroundColor: "var(--pf-accent-soft)",
        borderColor: "rgba(216,58,66,0.25)",
        color: "var(--pf-accent)",
      }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <Icon size={14} strokeWidth={2} />
      <span>{label}</span>
      {processing && (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="inline-flex"
        >
          <Loader size={13} strokeWidth={2} />
        </motion.span>
      )}
    </motion.div>
  );
}
