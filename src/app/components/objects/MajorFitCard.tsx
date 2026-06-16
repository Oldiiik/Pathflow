import { Star, FileSearch } from "lucide-react";
import { CardShell, CardAction, Bullets } from "../shared/CardShell";
import { FitScore, CardSection } from "../shared/primitives";
import { useWorkspace } from "../../store/workspace";
import type { MajorFitData } from "../../lib/types";

export function MajorFitCard({
  id,
  data,
  layoutId,
}: {
  id: string;
  data: MajorFitData;
  layoutId?: string;
}) {
  const { mergeMemory, openEvidence, dismissObject } = useWorkspace();

  return (
    <CardShell
      layoutId={layoutId}
      kindLabel="Major Fit"
      title={data.major}
      onDismiss={() => dismissObject(id)}
      right={<FitScore value={data.fitScore} />}
      actions={
        <>
          <CardAction
            primary
            icon={Star}
            onClick={() => mergeMemory({ preferredPaths: [data.major] })}
          >
            Mark as Preferred
          </CardAction>
          <CardAction
            icon={FileSearch}
            onClick={() => openEvidence({ title: data.major, evidence: data.evidence })}
          >
            Show Evidence
          </CardAction>
        </>
      }
    >
      <CardSection title="Why it fits">
        <Bullets items={data.whyItFits} tone="var(--pf-success)" />
      </CardSection>

      <div className="grid gap-4 sm:grid-cols-2">
        <CardSection title="Risks">
          <Bullets items={data.risks} tone="var(--pf-warn)" />
        </CardSection>
        <CardSection title="Required skills">
          <div className="flex flex-wrap gap-1.5">
            {data.requiredSkills.map((s) => (
              <span
                key={s}
                className="rounded-md border px-2 py-0.5 text-xs"
                style={{ borderColor: "var(--pf-border)", color: "var(--pf-ink)" }}
              >
                {s}
              </span>
            ))}
          </div>
        </CardSection>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <CardSection title="Recommended courses">
          <Bullets items={data.recommendedCourses} />
        </CardSection>
        <CardSection title="Suggested projects">
          <Bullets items={data.suggestedProjects} tone="var(--pf-accent)" />
        </CardSection>
      </div>
    </CardShell>
  );
}
