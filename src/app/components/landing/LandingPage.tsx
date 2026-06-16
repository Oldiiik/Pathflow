import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  MessagesSquare,
  Cpu,
  LayoutDashboard,
  GraduationCap,
  Radar,
  CalendarClock,
  FolderSearch,
  Check,
  X,
} from "lucide-react";
import { MiniCube } from "../cube/RubikCube";
import { Cube3D } from "../cube/Cube3D";
import { AuthCard } from "../auth/AuthCard";

// Restrained palette: neutral charcoal base, ONE flat accent. No glows, no gradients.
const C = {
  base: "#0a0a0c",
  surf: "#101013",
  raise: "#17171b",
  border: "#26262d",
  borderSoft: "#1b1b20",
  ink: "#f1f1f2",
  inkSoft: "#c4c5ca",
  mut: "#83848c",
  accent: "#4f7cff",
  accentSoft: "rgba(79,124,255,0.12)",
};

const rise = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 80, damping: 18 } },
};

export function LandingPage() {
  const [auth, setAuth] = useState<null | "signin" | "signup">(null);

  return (
    <div className="min-h-[100dvh] overflow-x-hidden" style={{ backgroundColor: C.base, color: C.ink }}>
      <Nav onAuth={setAuth} />
      <Hero onAuth={setAuth} />
      <Concept />
      <Features />
      <Compare />
      <FinalCTA onAuth={setAuth} />
      <Footer />
      <AnimatePresence>{auth && <AuthModal mode={auth} onClose={() => setAuth(null)} />}</AnimatePresence>
    </div>
  );
}

function Shell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1200px] px-6 lg:px-8 ${className}`}>{children}</div>;
}

/* ------------------------------------------------------------------- nav */

function Nav({ onAuth }: { onAuth: (m: "signin" | "signup") => void }) {
  return (
    <header className="sticky top-0 z-40 border-b" style={{ borderColor: C.borderSoft, backgroundColor: "rgba(10,10,12,0.7)", backdropFilter: "blur(12px)" }}>
      <Shell className="flex items-center justify-between py-3.5">
        <div className="flex items-center gap-2.5">
          <MiniCube size={22} />
          <span style={{ color: C.ink, letterSpacing: "-0.01em" }}>Pathflow</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm md:flex" style={{ color: C.mut }}>
          <a href="#concept" className="transition-colors hover:text-white">Concept</a>
          <a href="#features" className="transition-colors hover:text-white">Workspace</a>
          <a href="#compare" className="transition-colors hover:text-white">Why Pathflow</a>
        </nav>
        <div className="flex items-center gap-1.5">
          <button onClick={() => onAuth("signin")} className="rounded-lg px-3 py-1.5 text-sm transition-colors hover:text-white" style={{ color: C.inkSoft }}>
            Sign in
          </button>
          <AccentButton small onClick={() => onAuth("signup")}>Get started</AccentButton>
        </div>
      </Shell>
    </header>
  );
}

/* ------------------------------------------------------------------ hero */

function Hero({ onAuth }: { onAuth: (m: "signin" | "signup") => void }) {
  return (
    <Shell className="relative grid items-center gap-12 overflow-hidden py-20 lg:grid-cols-[1.45fr_minmax(0,1fr)] lg:py-28">
      {/* left, asymmetric */}
      <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="flex flex-col items-start gap-6">
        <motion.span variants={rise} className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em]" style={{ color: C.mut }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.accent }} />
          Admission intelligence
        </motion.span>
        <motion.h1 variants={rise} style={{ color: C.ink, fontSize: "clamp(2.6rem, 6vw, 4.6rem)", lineHeight: 0.98, letterSpacing: "-0.04em", fontWeight: 600, maxWidth: "13ch" }}>
          Decide where to apply, with proof.
        </motion.h1>
        <motion.p variants={rise} className="text-[15px] leading-relaxed" style={{ color: C.mut, maxWidth: "52ch" }}>
          Most tools sell you every school. Pathflow turns what you say into honest decision profiles — fit, risks, evidence, and the exact gaps to close — then builds the roadmap.
        </motion.p>
        <motion.div variants={rise} className="flex flex-wrap items-center gap-3 pt-1">
          <AccentButton onClick={() => onAuth("signup")}>Build my workspace<ArrowRight size={16} /></AccentButton>
          <a href="#compare" className="group inline-flex items-center gap-1.5 px-1 py-3 text-sm" style={{ color: C.inkSoft }}>
            See how it's different
            <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </motion.div>

        {/* kinetic capability strip */}
        <motion.div variants={rise} className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-4 text-xs" style={{ color: C.mut }}>
          {["Decision profiles", "Gap radar", "Opportunity runway", "Portfolio x-ray", "Living roadmap"].map((w, i) => (
            <span key={w} className="inline-flex items-center gap-2">
              {i > 0 && <span style={{ color: C.border }}>/</span>}
              {w}
            </span>
          ))}
        </motion.div>
      </motion.div>

      {/* right asset: a large 3D cube bleeding toward the edge */}
      <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15, type: "spring", stiffness: 65, damping: 16 }} className="relative hidden h-[380px] items-center justify-center lg:flex">
        <div className="absolute right-[-14%] top-1/2 -translate-y-1/2">
          <Cube3D size={360} />
        </div>
      </motion.div>
    </Shell>
  );
}

/* --------------------------------------------------------------- concept */

const STEPS = [
  { n: "01", icon: MessagesSquare, title: "You speak", body: "“Business in Asia, I dislike olympiads, I have hackathon certificates.”" },
  { n: "02", icon: Cpu, title: "Pathflow reasons", body: "It reads intent, runs the right tools, and verifies what it can." },
  { n: "03", icon: LayoutDashboard, title: "You act", body: "Answers become pages: matches, gaps, opportunities, a roadmap." },
];

function Concept() {
  return (
    <section id="concept" className="border-t" style={{ borderColor: C.borderSoft }}>
      <Shell className="py-20">
        <Head eyebrow="The concept" title="Chat is the command layer. The workspace is the product." />
        <div className="mt-12 grid divide-y md:grid-cols-3 md:divide-x md:divide-y-0" style={{ borderColor: C.borderSoft }}>
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex flex-col gap-3 py-6 md:px-8 md:py-2 md:first:pl-0"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm" style={{ color: C.accent }}>{s.n}</span>
                <s.icon size={18} strokeWidth={1.75} style={{ color: C.inkSoft }} />
              </div>
              <span style={{ color: C.ink }}>{s.title}</span>
              <p className="text-sm leading-relaxed" style={{ color: C.mut, maxWidth: "32ch" }}>{s.body}</p>
            </motion.div>
          ))}
        </div>
      </Shell>
    </section>
  );
}

/* -------------------------------------------------------------- features */

function Features() {
  return (
    <section id="features" className="border-t" style={{ borderColor: C.borderSoft }}>
      <Shell className="py-20">
        <Head eyebrow="Inside the workspace" title="Five instruments, one decision." />
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl md:grid-cols-3" style={{ backgroundColor: C.borderSoft }}>
          <Tile className="md:col-span-2" icon={GraduationCap} title="University decision profiles" big
            body="Not catalogue pages. Honest fit, real downsides, an evidence layer with sources and confidence, and a personalised application strategy." />
          <Tile icon={Radar} title="Gap radar" body="What blocks your reach schools, by priority, with concrete fixes." />
          <Tile icon={CalendarClock} title="Opportunity runway" body="Deadlines on a timeline, each tied to a gap it closes." />
          <Tile icon={FolderSearch} title="Portfolio x-ray" body="Verified vs claimed, plus a portfolio-ready rewrite." />
          <Tile icon={LayoutDashboard} title="Fit map" body="Matches plotted by fit and difficulty." />
        </div>
      </Shell>
    </section>
  );
}

function Tile({ icon: Icon, title, body, className = "", big }: { icon: typeof Radar; title: string; body: string; className?: string; big?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      whileHover={{ backgroundColor: C.raise }}
      className={`flex flex-col gap-3 p-7 ${big ? "justify-between sm:p-9" : ""} ${className}`}
      style={{ backgroundColor: C.surf }}
    >
      <Icon size={20} strokeWidth={1.75} style={{ color: C.accent }} />
      <div className="flex flex-col gap-2">
        <span style={{ color: C.ink, fontSize: big ? "1.3rem" : "1rem", letterSpacing: "-0.01em" }}>{title}</span>
        <p className="text-sm leading-relaxed" style={{ color: C.mut, maxWidth: big ? "42ch" : "30ch" }}>{body}</p>
      </div>
    </motion.div>
  );
}

/* ---------------------------------------------------------------- compare */

const ROWS = [
  { label: "The question answered", them: "“What is this university?”", us: "“Should I target it — why, what's the risk, what's next?”" },
  { label: "Tone", them: "Sells every school", us: "Honest — shows real downsides" },
  { label: "Numbers", them: "Invented, hallucinated", us: "Sourced, with confidence and marked unknowns" },
  { label: "Personalisation", them: "One-size-fits-all", us: "Built from your goals and what you avoid" },
  { label: "Output", them: "Walls of text", us: "Structured pages and a roadmap" },
  { label: "After the answer", them: "You're on your own", us: "Gap radar to concrete fixes" },
];

function Compare() {
  return (
    <section id="compare" className="border-t" style={{ borderColor: C.borderSoft }}>
      <Shell className="py-20">
        <Head eyebrow="Why Pathflow" title="Not another college-info bot." />
        <div className="mt-12 overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[1.2fr_1fr_1.1fr] pb-3 text-xs uppercase tracking-[0.14em]" style={{ color: C.mut, borderBottom: `1px solid ${C.border}` }}>
              <span />
              <span className="px-4">Typical admission AI</span>
              <span className="flex items-center gap-1.5 px-4" style={{ color: C.ink }}><MiniCube size={15} /> Pathflow</span>
            </div>
            {ROWS.map((r, i) => (
              <motion.div
                key={r.label}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="grid grid-cols-[1.2fr_1fr_1.1fr] items-start py-4 text-sm"
                style={{ borderBottom: `1px solid ${C.borderSoft}` }}
              >
                <span style={{ color: C.ink }}>{r.label}</span>
                <span className="flex items-start gap-2 px-4" style={{ color: C.mut }}>
                  <X size={14} style={{ color: "#7c7d85", marginTop: 2, flexShrink: 0 }} />{r.them}
                </span>
                <span className="flex items-start gap-2 px-4" style={{ color: C.inkSoft }}>
                  <Check size={14} style={{ color: C.accent, marginTop: 2, flexShrink: 0 }} />{r.us}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </Shell>
    </section>
  );
}

/* -------------------------------------------------------------- final CTA */

function FinalCTA({ onAuth }: { onAuth: (m: "signin" | "signup") => void }) {
  return (
    <section className="border-t" style={{ borderColor: C.borderSoft }}>
      <Shell className="flex flex-col items-start justify-between gap-8 py-20 md:flex-row md:items-end">
        <h2 style={{ color: C.ink, fontSize: "clamp(2rem, 4.5vw, 3.2rem)", letterSpacing: "-0.04em", lineHeight: 1, fontWeight: 600, maxWidth: "16ch" }}>
          Stop guessing your shortlist.
        </h2>
        <div className="flex flex-col items-start gap-3">
          <AccentButton onClick={() => onAuth("signup")}>Create your account<ArrowRight size={16} /></AccentButton>
          <span className="text-xs" style={{ color: C.mut }}>Personalised from day one. Evidence over hype.</span>
        </div>
      </Shell>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t" style={{ borderColor: C.borderSoft }}>
      <Shell className="flex flex-wrap items-center justify-between gap-3 py-8 text-sm" >
        <div className="flex items-center gap-2" style={{ color: C.inkSoft }}><MiniCube size={18} /> Pathflow</div>
        <span style={{ color: C.mut }}>Evidence over hype</span>
      </Shell>
    </footer>
  );
}

/* ----------------------------------------------------------------- parts */

function Head({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex max-w-[24ch] flex-col gap-3">
      <span className="text-xs uppercase tracking-[0.18em]" style={{ color: C.accent }}>{eyebrow}</span>
      <h2 style={{ color: C.ink, fontSize: "clamp(1.7rem, 3.6vw, 2.5rem)", letterSpacing: "-0.035em", lineHeight: 1.05, fontWeight: 600 }}>{title}</h2>
    </div>
  );
}

// Flat accent button — no gradient, no glow. Subtle inner highlight + tinted shadow only.
function AccentButton({ children, onClick, small }: { children: React.ReactNode; onClick: () => void; small?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg ${small ? "px-3.5 py-1.5 text-sm" : "px-5 py-3 text-sm"} transition-transform active:translate-y-[1px]`}
      style={{
        backgroundColor: C.accent,
        color: "#fff",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 8px 22px -14px rgba(79,124,255,0.55)",
      }}
    >
      {children}
    </button>
  );
}

function AuthModal({ mode, onClose }: { mode: "signin" | "signup"; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 90, damping: 18 }}
        className="relative w-full max-w-[420px] rounded-2xl border p-7"
        style={{ borderColor: C.border, backgroundColor: C.surf }}
      >
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-md p-1" style={{ color: C.mut }}>
          <X size={18} />
        </button>
        <div className="mb-5 flex items-center gap-2.5">
          <MiniCube size={24} />
          <span style={{ color: C.ink }}>Pathflow</span>
        </div>
        <AuthCard initialMode={mode} />
      </motion.div>
    </motion.div>
  );
}
