import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { FileSearch, ArrowRight } from "lucide-react";
import { CardShell, CardAction } from "../shared/CardShell";
import { PriorityBadge, CardSection } from "../shared/primitives";
import { useWorkspace } from "../../store/workspace";
import type { GapRadarData } from "../../lib/types";

export function GapRadar({
  id,
  data,
  layoutId,
}: {
  id: string;
  data: GapRadarData;
  layoutId?: string;
}) {
  const { openEvidence, dismissObject, addTasks } = useWorkspace();

  // Radar plots strength (100 - current would be the gap); we show current strength.
  const chartData = data.gaps.map((g) => ({ axis: g.axis, strength: g.current }));

  return (
    <CardShell
      layoutId={layoutId}
      kindLabel="Gap Radar"
      title="Profile gaps"
      subtitle={data.summary}
      onDismiss={() => dismissObject(id)}
      actions={
        <>
          <CardAction
            primary
            icon={ArrowRight}
            onClick={() =>
              addTasks(data.gaps.filter((g) => g.priority === "high").map((g) => ({ label: g.fix, priority: "high" as const, context: "Gap" })))
            }
          >
            Send fixes to roadmap
          </CardAction>
          <CardAction
            icon={FileSearch}
            onClick={() => openEvidence({ title: "Profile gaps", evidence: data.evidence })}
          >
            Show Evidence
          </CardAction>
        </>
      }
    >
      <div className="grid gap-5 md:grid-cols-[200px_minmax(0,1fr)] md:items-center">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData} outerRadius="72%">
              <PolarGrid stroke="var(--pf-border)" />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fontSize: 10, fill: "var(--pf-muted)" }}
              />
              <Radar
                dataKey="strength"
                stroke="var(--pf-accent)"
                fill="var(--pf-accent)"
                fillOpacity={0.18}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col divide-y" style={{ borderColor: "var(--pf-border)" }}>
          {data.gaps.map((g) => (
            <div key={g.label} className="flex flex-col gap-1 py-2.5 first:pt-0">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm" style={{ color: "var(--pf-ink)" }}>{g.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs" style={{ color: "var(--pf-muted)" }}>
                    {g.current}/100
                  </span>
                  <PriorityBadge level={g.priority} />
                </div>
              </div>
              <span className="text-xs" style={{ color: "var(--pf-muted)" }}>{g.fix}</span>
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  );
}
