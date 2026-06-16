import { FileSearch, Copy } from "lucide-react";
import { CardShell, CardAction, Bullets } from "../shared/CardShell";
import { CardSection } from "../shared/primitives";
import { useWorkspace } from "../../store/workspace";
import type { PortfolioData } from "../../lib/types";

export function PortfolioDiagnosis({
  id,
  data,
  layoutId,
}: {
  id: string;
  data: PortfolioData;
  layoutId?: string;
}) {
  const { openEvidence, dismissObject } = useWorkspace();

  return (
    <CardShell
      layoutId={layoutId}
      kindLabel="Portfolio Diagnosis"
      title="Your profile, read honestly"
      onDismiss={() => dismissObject(id)}
      actions={
        <CardAction
          icon={FileSearch}
          onClick={() => openEvidence({ title: "Portfolio diagnosis", evidence: data.evidence })}
        >
          Show Evidence
        </CardAction>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Column title="Verified" tone="var(--pf-success)" items={data.verified} />
        <Column title="Claimed" tone="var(--pf-warn)" items={data.claimed} />
        <Column title="Inferred" tone="var(--pf-unknown)" items={data.inferred} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <CardSection title="Missing proof">
          <Bullets items={data.missingProof} tone="var(--pf-accent)" />
        </CardSection>
        <CardSection title="Weak areas">
          <Bullets items={data.weakAreas} tone="var(--pf-warn)" />
        </CardSection>
      </div>

      <div
        className="flex flex-col gap-2 rounded-xl border p-4"
        style={{ borderColor: "var(--pf-border)", backgroundColor: "var(--pf-elevated)" }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--pf-muted)" }}>
            Portfolio-ready rewrite
          </span>
          <button
            onClick={() => navigator.clipboard?.writeText(data.rewrite)}
            className="inline-flex items-center gap-1 text-xs active:scale-95"
            style={{ color: "var(--pf-accent)" }}
          >
            <Copy size={13} strokeWidth={2} /> Copy
          </button>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--pf-ink)" }}>
          {data.rewrite}
        </p>
      </div>
    </CardShell>
  );
}

function Column({ title, tone, items }: { title: string; tone: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-2 border-t pt-2" style={{ borderColor: tone }}>
      <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--pf-muted)" }}>
        {title}
      </span>
      <Bullets items={items} tone={tone} />
    </div>
  );
}
