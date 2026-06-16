import { CalendarPlus, FileSearch, Target } from "lucide-react";
import { CardShell, CardAction } from "../shared/CardShell";
import { PriorityBadge, Meta } from "../shared/primitives";
import { useWorkspace } from "../../store/workspace";
import type { OpportunityData } from "../../lib/types";

export function OpportunityCard({
  id,
  data,
  layoutId,
}: {
  id: string;
  data: OpportunityData;
  layoutId?: string;
}) {
  const { openEvidence, dismissObject, mergeMemory } = useWorkspace();

  return (
    <CardShell
      layoutId={layoutId}
      kindLabel="Opportunity"
      title={data.name}
      subtitle={data.type}
      onDismiss={() => dismissObject(id)}
      right={
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--pf-muted)" }}>
            Impact
          </span>
          <PriorityBadge level={data.impact} />
        </div>
      }
      actions={
        <>
          <CardAction
            primary
            icon={CalendarPlus}
            onClick={() => mergeMemory({ nextSteps: [`${data.name} — due ${data.deadline}`] })}
          >
            Save to Roadmap
          </CardAction>
          <CardAction
            icon={FileSearch}
            onClick={() => openEvidence({ title: data.name, evidence: data.evidence })}
          >
            Show Evidence
          </CardAction>
        </>
      }
    >
      <div className="flex flex-wrap gap-6">
        <Meta label="Deadline" value={data.deadline} />
        <Meta label="Cost" value={data.cost} />
        <Meta label="Eligibility" value={data.eligibility} />
      </div>

      <div
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
        style={{ backgroundColor: "var(--pf-accent-soft)", color: "var(--pf-accent)" }}
      >
        <Target size={15} strokeWidth={2} />
        Fixes gap: {data.fixesGap}
      </div>
    </CardShell>
  );
}
