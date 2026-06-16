import { Link, useParams } from "react-router";
import { motion } from "motion/react";
import {
  ChevronLeft,
  MapPin,
  Plus,
  Check,
  FileSearch,
  Route,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Heart,
  AlertTriangle,
  Wallet,
  GraduationCap,
  Compass,
  ArrowRight,
  RefreshCw,
  Quote,
} from "lucide-react";
import { useWorkspace } from "../../store/workspace";
import { useUniversityBio } from "../../lib/useUniversityBio";
import { PageContainer, PageEmpty } from "./page-kit";
import { FitScore } from "../shared/primitives";
import type { Confidence, UniversityBio, UniversityData } from "../../lib/types";

const SEVERITY: Record<string, string> = {
  Critical: "#e0556b",
  High: "var(--pf-accent-hi)",
  Medium: "var(--pf-warn)",
  Low: "var(--pf-success)",
  Unknown: "var(--pf-unknown)",
};
const CONF: Record<Confidence, string> = {
  high: "var(--pf-success)",
  medium: "var(--pf-warn)",
  unknown: "var(--pf-unknown)",
};

const fade = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 90, damping: 18 } },
};

export function UniversityDetailPage() {
  const { id } = useParams();
  const { objects, memory, mergeMemory, addTasks, openEvidence } = useWorkspace();
  const obj = objects.find((o) => o.id === id && o.kind === "university");
  const d = obj?.data as UniversityData | undefined;
  const { bio, loading, fallback, retry } = useUniversityBio(d, memory);

  if (!obj || !d) {
    return (
      <PageContainer>
        <BackLink />
        <PageEmpty label="This university isn't in your workspace. Run a university match from Command to bring it back." />
      </PageContainer>
    );
  }

  const saved = memory.savedUniversities.includes(d.name);
  const fitScore = bio?.fitScore ?? d.fitScore;
  const difficulty = bio?.difficulty ?? d.difficulty;

  return (
    <PageContainer>
      <BackLink />

      {/* HERO */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 80, damping: 18 }}
        className="relative overflow-hidden rounded-[28px] border p-7 sm:p-9"
        style={{ borderColor: "var(--pf-border)", backgroundColor: "var(--pf-card)", boxShadow: "0 30px 80px -40px rgba(0,0,0,0.8)" }}
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full"
          style={{ background: "radial-gradient(circle, var(--pf-glow), transparent 70%)" }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="flex max-w-2xl items-start gap-4">
            <span
              className="flex h-16 w-20 shrink-0 items-center justify-center rounded-2xl font-mono text-lg"
              style={{ backgroundColor: "var(--pf-elevated)", color: "var(--pf-accent-hi)" }}
            >
              {d.short}
            </span>
            <div className="flex flex-col gap-2">
              <h1 style={{ color: "var(--pf-ink)", fontSize: "2rem", lineHeight: 1.1, letterSpacing: "-0.02em" }}>{d.name}</h1>
              <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--pf-muted)" }}>
                <MapPin size={14} /> {d.city}, {d.country}
              </span>
              {bio ? (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1 text-[15px] leading-relaxed" style={{ color: "var(--pf-ink-soft)" }}>
                  {bio.positioning}
                </motion.p>
              ) : (
                <ShimmerLine w="80%" />
              )}
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <FitScore value={fitScore} size={76} />
            <span
              className="rounded-full px-3 py-1 text-xs uppercase tracking-wide"
              style={{ backgroundColor: "var(--pf-elevated)", color: "var(--pf-ink-soft)" }}
            >
              {difficulty}
            </span>
          </div>
        </div>

        <div className="relative mt-6 flex flex-wrap gap-2">
          <HeroButton primary onClick={() => mergeMemory({ savedUniversities: [d.name] })} icon={saved ? Check : Plus} active={saved}>
            {saved ? "On your shortlist" : "Add to shortlist"}
          </HeroButton>
          <HeroButton onClick={() => addTasks([{ label: `Build roadmap for ${d.name}`, context: `University: ${d.short}` }])} icon={Route}>
            Build roadmap
          </HeroButton>
          <HeroButton onClick={() => openEvidence({ title: d.name, evidence: d.evidence })} icon={FileSearch}>
            Evidence summary
          </HeroButton>
        </div>
      </motion.section>

      {/* AI status */}
      {fallback ? (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4"
          style={{ borderColor: "var(--pf-border)", backgroundColor: "var(--pf-surface)" }}
        >
          <span className="flex items-center gap-2 text-sm" style={{ color: "var(--pf-ink-soft)" }}>
            <Sparkles size={14} style={{ color: "var(--pf-muted)" }} />
            Built-in profile shown. Add a valid Gemini key for a personalised AI profile.
          </span>
          <button onClick={retry} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm" style={{ backgroundColor: "var(--pf-elevated)", color: "var(--pf-accent-hi)" }}>
            <RefreshCw size={14} /> Retry AI
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-1 text-xs" style={{ color: "var(--pf-muted)" }}>
          <Sparkles size={13} style={{ color: "var(--pf-accent-hi)" }} />
          {loading ? "Generating a personalised decision profile…" : "Personalised by Pathflow · gemini-3.1-flash-lite"}
        </div>
      )}

      {loading && <BioSkeleton />}

      {bio && <DecisionProfile bio={bio} d={d} onSendFixes={(fixes) => addTasks(fixes.map((f) => ({ label: f, priority: "high" as const, context: `University: ${d.short}` })))} />}
    </PageContainer>
  );
}

function DecisionProfile({ bio, d, onSendFixes }: { bio: UniversityBio; d: UniversityData; onSendFixes: (f: string[]) => void }) {
  return (
    <motion.div
      variants={{ show: { transition: { staggerChildren: 0.08 } } }}
      initial="hidden"
      animate="show"
      className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]"
    >
      {/* LEFT RAIL */}
      <div className="flex flex-col gap-5 lg:sticky lg:top-5 lg:self-start">
        <Card title="Quick decision snapshot" icon={Compass}>
          <div className="flex flex-col divide-y" style={{ borderColor: "var(--pf-border)" }}>
            {bio.snapshot.map((s) => (
              <div key={s.label} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="text-sm" style={{ color: "var(--pf-muted)" }}>{s.label}</span>
                <span className="flex items-center gap-1.5 text-right text-sm" style={{ color: "var(--pf-ink)" }}>
                  {s.value}
                  <span className="h-1.5 w-1.5 rounded-full" title={s.confidence} style={{ backgroundColor: CONF[s.confidence] }} />
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Cost & aid" icon={Wallet}>
          <div className="flex flex-col gap-2">
            <Row label="Sticker price" value={bio.cost.sticker} />
            <Row label="Aid for internationals" value={bio.cost.aidForInternationals} />
            <Row label="Financial risk" value={bio.cost.financialRisk} tone={bio.cost.financialRisk === "High" ? "#e0556b" : bio.cost.financialRisk === "Medium" ? "var(--pf-warn)" : "var(--pf-success)"} />
            <p className="pt-1 text-sm leading-relaxed" style={{ color: "var(--pf-muted)" }}>{bio.cost.note}</p>
          </div>
        </Card>

        <Card title="Evidence" icon={FileSearch}>
          <div className="flex flex-col gap-3">
            {bio.evidence.map((e) => (
              <div key={e.dataPoint} className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm" style={{ color: "var(--pf-ink)" }}>{e.dataPoint}</span>
                  <ConfidencePill c={e.confidence} />
                </div>
                <span className="text-sm" style={{ color: "var(--pf-ink-soft)" }}>{e.value}</span>
                <span className="font-mono text-[11px]" style={{ color: "var(--pf-unknown)" }}>{e.source}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* MAIN */}
      <div className="flex flex-col gap-5">
        {/* Fit for you */}
        <motion.div variants={fade} className="grid gap-5 md:grid-cols-2">
          <Card title="Why it fits you" icon={Heart} tone="var(--pf-success)">
            <IconList items={bio.fitForYou} icon={ThumbsUp} tone="var(--pf-success)" />
          </Card>
          <Card title="Why it may not" icon={AlertTriangle} tone="var(--pf-warn)">
            <IconList items={bio.fitConcerns} icon={ThumbsDown} tone="var(--pf-warn)" />
          </Card>
        </motion.div>

        {/* Pros / minuses */}
        <motion.div variants={fade}>
          <Card title="Honest pros & minuses" icon={Sparkles}>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Tag tone="var(--pf-success)">Pros</Tag>
                <IconList items={bio.pros} icon={ThumbsUp} tone="var(--pf-success)" />
              </div>
              <div className="flex flex-col gap-2">
                <Tag tone="#e0556b">Minuses</Tag>
                <IconList items={bio.minuses} icon={ThumbsDown} tone="#e0556b" />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Academic match */}
        <motion.div variants={fade}>
          <Card title="Best-fit programs for you" icon={GraduationCap}>
            <div className="flex flex-col gap-3">
              {bio.academicMatch.map((a, i) => (
                <div key={a.program} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs" style={{ backgroundColor: "var(--pf-elevated)", color: "var(--pf-accent-hi)" }}>{i + 1}</span>
                  <div className="flex flex-col">
                    <span style={{ color: "var(--pf-ink)" }}>{a.program}</span>
                    <span className="text-sm" style={{ color: "var(--pf-muted)" }}>{a.note}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Gap radar for this uni */}
        <motion.div variants={fade}>
          <Card title="Gap radar for this university" icon={AlertTriangle}>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {bio.gapRadar.map((g) => (
                <div key={g.axis} className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2" style={{ borderColor: "var(--pf-border)" }}>
                  <span className="text-sm" style={{ color: "var(--pf-ink-soft)" }}>{g.axis}</span>
                  <span className="rounded-md px-2 py-0.5 text-[11px] uppercase tracking-wide" style={{ color: SEVERITY[g.severity] ?? "var(--pf-muted)", backgroundColor: "var(--pf-elevated)" }}>
                    {g.severity}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-2 border-t pt-4" style={{ borderColor: "var(--pf-border)" }}>
              <Tag tone="var(--pf-accent-hi)">Recommended fixes</Tag>
              <IconList items={bio.recommendedFixes} icon={ArrowRight} tone="var(--pf-accent-hi)" />
              <button
                onClick={() => onSendFixes(bio.recommendedFixes)}
                className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm"
                style={{ background: "linear-gradient(140deg, var(--pf-accent-hi), var(--pf-accent-deep))", color: "#fff" }}
              >
                Send fixes to roadmap <ArrowRight size={14} />
              </button>
            </div>
          </Card>
        </motion.div>

        {/* Student life */}
        <motion.div variants={fade} className="grid gap-5 md:grid-cols-2">
          <Card title="Good for students who want" icon={ThumbsUp} tone="var(--pf-success)">
            <IconList items={bio.studentLife.goodFor} icon={Check} tone="var(--pf-success)" />
          </Card>
          <Card title="Bad for students who want" icon={ThumbsDown} tone="var(--pf-warn)">
            <IconList items={bio.studentLife.badFor} icon={AlertTriangle} tone="var(--pf-warn)" />
          </Card>
        </motion.div>

        {/* Outcomes */}
        <motion.div variants={fade}>
          <Card title="Outcomes" icon={Route}>
            <p className="text-sm leading-relaxed" style={{ color: "var(--pf-ink-soft)" }}>{bio.outcomes.summary}</p>
            <p className="mt-2 rounded-lg px-3 py-2 text-sm leading-relaxed" style={{ backgroundColor: "var(--pf-elevated)", color: "var(--pf-muted)" }}>
              {bio.outcomes.caveat}
            </p>
          </Card>
        </motion.div>

        {/* Strategy */}
        <motion.div variants={fade}>
          <div
            className="relative overflow-hidden rounded-2xl border p-6"
            style={{ borderColor: "var(--pf-accent)", backgroundColor: "var(--pf-card)" }}
          >
            <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(520px 200px at 100% 0%, var(--pf-accent-soft), transparent 70%)" }} />
            <Quote size={20} style={{ color: "var(--pf-accent-hi)" }} />
            <p className="relative mt-3 leading-relaxed" style={{ color: "var(--pf-ink)", fontSize: "1.15rem", lineHeight: 1.55 }}>
              {bio.strategy}
            </p>
            <span className="relative mt-3 block text-[11px] uppercase tracking-wide" style={{ color: "var(--pf-accent-hi)" }}>
              Your application strategy
            </span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------ small parts */

function BackLink() {
  return (
    <Link to="/universities" className="inline-flex w-fit items-center gap-1 text-sm transition-colors hover:text-[var(--pf-accent-hi)]" style={{ color: "var(--pf-muted)" }}>
      <ChevronLeft size={15} /> All universities
    </Link>
  );
}

function Card({ title, icon: Icon, tone, children }: { title: string; icon: typeof Compass; tone?: string; children: React.ReactNode }) {
  return (
    <motion.div variants={fade} className="flex flex-col gap-3 rounded-2xl border p-5" style={{ borderColor: "var(--pf-border)", backgroundColor: "var(--pf-card)" }}>
      <div className="flex items-center gap-2">
        <Icon size={15} style={{ color: tone ?? "var(--pf-accent-hi)" }} />
        <span className="text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--pf-muted)" }}>{title}</span>
      </div>
      {children}
    </motion.div>
  );
}

function IconList({ items, icon: Icon, tone }: { items: string[]; icon: typeof Check; tone: string }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((it, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0, x: -6 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.04 }}
          className="flex items-start gap-2 text-sm leading-relaxed"
          style={{ color: "var(--pf-ink-soft)" }}
        >
          <Icon size={14} strokeWidth={2.2} style={{ color: tone, marginTop: 3, flexShrink: 0 }} />
          {it}
        </motion.li>
      ))}
    </ul>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm" style={{ color: "var(--pf-muted)" }}>{label}</span>
      <span className="text-right text-sm" style={{ color: tone ?? "var(--pf-ink)" }}>{value}</span>
    </div>
  );
}

function Tag({ children, tone }: { children: React.ReactNode; tone: string }) {
  return (
    <span className="inline-flex w-fit items-center gap-1.5 text-[11px] uppercase tracking-wide" style={{ color: "var(--pf-muted)" }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone }} />
      {children}
    </span>
  );
}

function ConfidencePill({ c }: { c: Confidence }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: CONF[c] }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: CONF[c] }} />
      {c}
    </span>
  );
}

function HeroButton({ children, onClick, icon: Icon, primary, active }: { children: React.ReactNode; onClick: () => void; icon: typeof Plus; primary?: boolean; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm transition-transform active:translate-y-[1px]"
      style={
        active
          ? { backgroundColor: "var(--pf-elevated)", color: "var(--pf-success)" }
          : primary
            ? { background: "linear-gradient(140deg, var(--pf-accent-hi), var(--pf-accent-deep))", color: "#fff", boxShadow: "0 8px 22px -10px var(--pf-glow)" }
            : { borderWidth: 1, borderColor: "var(--pf-border)", backgroundColor: "var(--pf-elevated)", color: "var(--pf-ink-soft)" }
      }
    >
      <Icon size={15} /> {children}
    </button>
  );
}

function ShimmerLine({ w = "100%" }: { w?: string }) {
  return (
    <div className="relative h-4 overflow-hidden rounded-md" style={{ width: w, backgroundColor: "var(--pf-elevated)" }}>
      <motion.div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent, rgba(120,160,255,0.12), transparent)" }} animate={{ x: ["-100%", "100%"] }} transition={{ repeat: Infinity, duration: 1.4 }} />
    </div>
  );
}

function BioSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
      <div className="flex flex-col gap-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-3 rounded-2xl border p-5" style={{ borderColor: "var(--pf-border)", backgroundColor: "var(--pf-card)" }}>
            <ShimmerLine w="50%" />
            {[0, 1, 2].map((j) => <ShimmerLine key={j} w={`${90 - j * 12}%`} />)}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-3 rounded-2xl border p-5" style={{ borderColor: "var(--pf-border)", backgroundColor: "var(--pf-card)" }}>
            <ShimmerLine w="40%" />
            <ShimmerLine w="92%" />
            <ShimmerLine w="78%" />
            <ShimmerLine w="85%" />
          </div>
        ))}
      </div>
    </div>
  );
}
