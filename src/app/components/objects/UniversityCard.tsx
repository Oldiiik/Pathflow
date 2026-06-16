import { Plus, GitCompare, Route, FileSearch } from "lucide-react";
import { CardShell, CardAction, Bullets } from "../shared/CardShell";
import { FitScore, EvidenceChip, CardSection, Meta } from "../shared/primitives";
import { useWorkspace } from "../../store/workspace";
import type { UniversityData } from "../../lib/types";

export function UniversityCard({
  id,
  data,
  layoutId,
}: {
  id: string;
  data: UniversityData;
  layoutId?: string;
}) {
  const { mergeMemory, openEvidence, dismissObject } = useWorkspace();

  return (
    <CardShell
      layoutId={layoutId}
      kindLabel="University Match"
      title={data.name}
      subtitle={`${data.country} · last checked ${data.lastChecked}`}
      onDismiss={() => dismissObject(id)}
      right={
        <div className="flex items-center gap-3">
          <EvidenceChip status={data.evidenceStatus} />
          <FitScore value={data.fitScore} />
        </div>
      }
      actions={
        <>
          <CardAction
            primary
            icon={Plus}
            onClick={() => mergeMemory({ savedUniversities: [data.name] })}
          >
            Add to My Universities
          </CardAction>
          <CardAction icon={GitCompare}>Compare</CardAction>
          <CardAction
            icon={Route}
            onClick={() => mergeMemory({ nextSteps: [`Build roadmap for ${data.name}`] })}
          >
            Build Roadmap
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
        <Meta label="Difficulty" value={data.difficulty} />
        <Meta label="Best-fit programs" value={data.programs.join(" · ")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <CardSection title="Main risks">
          <Bullets items={data.risks} tone="var(--pf-warn)" />
        </CardSection>
        <CardSection title="Missing gaps">
          <Bullets items={data.gaps} tone="var(--pf-accent)" />
        </CardSection>
      </div>
    </CardShell>
  );
}
