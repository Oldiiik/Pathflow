import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../ui/sheet";
import { Check, HelpCircle, Link2, FileBadge, CalendarCheck } from "lucide-react";
import { ConfidenceTag, CardSection } from "../shared/primitives";
import { useWorkspace } from "../../store/workspace";

// Shared evidence drawer, opened by any factual card.
export function EvidenceDrawer() {
  const { evidence, closeEvidence } = useWorkspace();
  const open = evidence !== null;

  return (
    <Sheet open={open} onOpenChange={(o) => (!o ? closeEvidence() : undefined)}>
      <SheetContent
        side="right"
        className="gap-0 sm:max-w-md"
        style={{ backgroundColor: "var(--pf-bg)" }}
      >
        <SheetHeader className="border-b p-5" style={{ borderColor: "var(--pf-border)" }}>
          <span
            className="text-[11px] uppercase tracking-[0.14em]"
            style={{ color: "var(--pf-accent)" }}
          >
            Evidence
          </span>
          <SheetTitle style={{ color: "var(--pf-ink)" }}>{evidence?.title}</SheetTitle>
          <SheetDescription>Where this came from and what is still open.</SheetDescription>
        </SheetHeader>

        {evidence && (
          <div className="flex flex-col gap-5 overflow-y-auto p-5">
            <div className="flex flex-col gap-3 rounded-xl border bg-[var(--pf-card)] p-4" style={{ borderColor: "var(--pf-border)" }}>
              <Row icon={Link2} label="Source" value={evidence.evidence.source} />
              <Row icon={FileBadge} label="Source type" value={evidence.evidence.sourceType} />
              <Row icon={CalendarCheck} label="Last checked" value={evidence.evidence.lastChecked} />
              <div className="border-t pt-3" style={{ borderColor: "var(--pf-border)" }}>
                <ConfidenceTag value={evidence.evidence.confidence} />
              </div>
            </div>

            <CardSection title="Verified">
              <ul className="flex flex-col gap-2">
                {evidence.evidence.verified.map((v, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--pf-ink)" }}>
                    <Check size={15} strokeWidth={2.4} style={{ color: "var(--pf-success)", marginTop: 2 }} />
                    {v}
                  </li>
                ))}
              </ul>
            </CardSection>

            <CardSection title="Still unknown">
              <ul className="flex flex-col gap-2">
                {evidence.evidence.unknown.map((u, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--pf-muted)" }}>
                    <HelpCircle size={15} strokeWidth={2} style={{ color: "var(--pf-unknown)", marginTop: 2 }} />
                    {u}
                  </li>
                ))}
              </ul>
            </CardSection>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Link2; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={16} strokeWidth={2} style={{ color: "var(--pf-muted)", marginTop: 2 }} />
      <div className="flex flex-col">
        <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--pf-muted)" }}>
          {label}
        </span>
        <span className="text-sm" style={{ color: "var(--pf-ink)" }}>{value}</span>
      </div>
    </div>
  );
}
