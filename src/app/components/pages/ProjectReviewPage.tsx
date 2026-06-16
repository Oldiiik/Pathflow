import { useState } from "react";
import { motion } from "motion/react";
import { FlaskConical, Sparkles, Loader2, Copy, ThumbsUp, ThumbsDown, ArrowRight, Plus } from "lucide-react";
import { useWorkspace } from "../../store/workspace";
import { useAuth } from "../../store/auth";
import { dataService } from "../../lib/services";
import { PageContainer, PageHeader } from "./page-kit";
import type { ProjectReview } from "../../lib/types";

const VALUE_TONE: Record<string, string> = {
  Strong: "var(--pf-success)",
  Moderate: "var(--pf-warn)",
  "Under-explained": "var(--pf-warn)",
  Weak: "#e0556b",
};

export function ProjectReviewPage() {
  const { profile } = useAuth();
  const { addTasks } = useWorkspace();
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<ProjectReview | null>(null);

  const run = async () => {
    if (!description.trim() && !name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const r = await dataService.reviewProject({ name: name.trim(), link: link.trim(), description: description.trim() }, profile);
      setReview(r);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        icon={FlaskConical}
        eyebrow="Project reviewer"
        title="Get the admission value of your project."
        subtitle="Describe a project, build, or website. Pathflow judges it like a selective admissions reader and rewrites it for your portfolio."
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* input */}
        <div className="flex flex-col gap-3 rounded-2xl border p-5" style={{ borderColor: "var(--pf-border)", backgroundColor: "var(--pf-card)" }}>
          <Field label="Project name" value={name} onChange={setName} placeholder="e.g. AI tourism platform" />
          <Field label="Link (optional)" value={link} onChange={setLink} placeholder="https://…" />
          <div className="flex flex-col gap-2">
            <label className="text-[11px] uppercase tracking-wide" style={{ color: "var(--pf-muted)" }}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="What it does, the problem it solves, your role, any results…"
              className="resize-none rounded-xl border bg-transparent px-3.5 py-3 text-sm outline-none focus:border-[var(--pf-accent)]"
              style={{ borderColor: "var(--pf-border)", color: "var(--pf-ink)" }}
            />
          </div>
          {error && (
            <div className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: "rgba(224,85,107,0.1)", color: "#f2a3b0" }}>{error}</div>
          )}
          <button
            onClick={run}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm transition-transform active:translate-y-[1px] disabled:opacity-60"
            style={{ backgroundColor: "var(--pf-accent)", color: "#fff" }}
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {busy ? "Reviewing…" : "Review my project"}
          </button>
        </div>

        {/* output */}
        <div className="min-h-[200px]">
          {busy && <ReviewSkeleton />}
          {!busy && !review && (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-6 text-center" style={{ borderColor: "var(--pf-border)" }}>
              <FlaskConical size={22} style={{ color: "var(--pf-accent-hi)" }} />
              <span className="text-sm" style={{ color: "var(--pf-muted)" }}>Your review will appear here.</span>
            </div>
          )}
          {!busy && review && <ReviewResult review={review} onSave={() => addTasks(review.improvements.map((f) => ({ label: f, context: "Project", priority: "medium" as const })))} />}
        </div>
      </div>
    </PageContainer>
  );
}

function ReviewResult({ review, onSave }: { review: ProjectReview; onSave: () => void }) {
  const tone = VALUE_TONE[review.admissionValue] ?? "var(--pf-muted)";
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 rounded-2xl border p-5" style={{ borderColor: "var(--pf-border)", backgroundColor: "var(--pf-card)" }}>
      <div className="flex items-center justify-between">
        <span className="rounded-full px-3 py-1 text-xs uppercase tracking-wide" style={{ backgroundColor: "var(--pf-elevated)", color: tone }}>
          {review.admissionValue}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--pf-muted)" }}>
          <Sparkles size={12} style={{ color: "var(--pf-accent-hi)" }} /> gemini-3.1-flash-lite
        </span>
      </div>
      <p className="leading-relaxed" style={{ color: "var(--pf-ink)" }}>{review.summary}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Block icon={ThumbsUp} tone="var(--pf-success)" title="Strengths" items={review.strengths} />
        <Block icon={ThumbsDown} tone="#e0556b" title="Weaknesses" items={review.weaknesses} />
      </div>

      <div className="flex flex-col gap-2 border-t pt-3" style={{ borderColor: "var(--pf-border)" }}>
        <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--pf-muted)" }}>How to improve</span>
        <ol className="flex flex-col gap-1.5">
          {review.improvements.map((it, i) => (
            <li key={i} className="flex gap-2 text-sm" style={{ color: "var(--pf-ink-soft)" }}>
              <span className="font-mono" style={{ color: "var(--pf-accent-hi)" }}>{i + 1}.</span> {it}
            </li>
          ))}
        </ol>
        <button onClick={onSave} className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm" style={{ backgroundColor: "var(--pf-accent)", color: "#fff" }}>
          <Plus size={14} /> Send improvements to roadmap
        </button>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border p-4" style={{ borderColor: "var(--pf-border)", backgroundColor: "var(--pf-surface)" }}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--pf-accent-hi)" }}>Portfolio-ready rewrite</span>
          <button onClick={() => navigator.clipboard?.writeText(review.rewrite)} className="inline-flex items-center gap-1 text-xs active:scale-95" style={{ color: "var(--pf-accent-hi)" }}>
            <Copy size={13} /> Copy
          </button>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--pf-ink)" }}>{review.rewrite}</p>
      </div>
    </motion.div>
  );
}

function Block({ icon: Icon, tone, title, items }: { icon: typeof ThumbsUp; tone: string; title: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wide" style={{ color: "var(--pf-muted)" }}>
        <Icon size={13} style={{ color: tone }} /> {title}
      </span>
      <ul className="flex flex-col gap-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm" style={{ color: "var(--pf-ink-soft)" }}>
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: tone }} /> {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] uppercase tracking-wide" style={{ color: "var(--pf-muted)" }}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-xl border bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-[var(--pf-accent)]"
        style={{ borderColor: "var(--pf-border)", color: "var(--pf-ink)" }}
      />
    </div>
  );
}

function ReviewSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border p-5" style={{ borderColor: "var(--pf-border)", backgroundColor: "var(--pf-card)" }}>
      {[60, 90, 80, 70].map((w, i) => (
        <div key={i} className="relative h-3 overflow-hidden rounded-md" style={{ width: `${w}%`, backgroundColor: "var(--pf-elevated)" }}>
          <motion.div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent, rgba(120,160,255,0.12), transparent)" }} animate={{ x: ["-100%", "100%"] }} transition={{ repeat: Infinity, duration: 1.4 }} />
        </div>
      ))}
    </div>
  );
}
