import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowRight, Mail, Lock, User, Compass, Globe2, Ban, Loader2 } from "lucide-react";
import { useAuth } from "../../store/auth";

export function AuthCard({ initialMode = "signup" }: { initialMode?: "signin" | "signup" }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [field, setField] = useState("");
  const [region, setRegion] = useState("");
  const [avoid, setAvoid] = useState("");

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        await signIn(email.trim(), password);
      } else {
        if (!name.trim()) throw new Error("Please tell us your name.");
        await signUp({ email: email.trim(), password, name: name.trim(), field: field.trim(), region: region.trim(), avoid: avoid.trim() });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex rounded-xl border p-1" style={{ borderColor: "var(--pf-border)" }}>
        {(["signup", "signin"] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(null); }}
            className="relative flex-1 rounded-lg py-2 text-sm transition-colors"
            style={{ color: mode === m ? "#fff" : "var(--pf-muted)" }}
          >
            {mode === m && (
              <motion.span
                layoutId="auth-tab"
                className="absolute inset-0 rounded-lg"
                style={{ background: "linear-gradient(140deg, var(--pf-accent-hi), var(--pf-accent-deep))" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative">{m === "signup" ? "Create account" : "Sign in"}</span>
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-col gap-1">
        <h2 style={{ color: "var(--pf-ink)", fontSize: "1.4rem", letterSpacing: "-0.01em" }}>
          {mode === "signup" ? "Start your admission workspace" : "Welcome back"}
        </h2>
        <p className="text-sm" style={{ color: "var(--pf-muted)" }}>
          {mode === "signup" ? "We'll tailor everything to your goals." : "Pick up where your workspace left off."}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <AnimatePresence initial={false} mode="popLayout">
          {mode === "signup" && (
            <motion.div key="name" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <Field icon={User} placeholder="Your name" value={name} onChange={setName} />
            </motion.div>
          )}
        </AnimatePresence>

        <Field icon={Mail} type="email" placeholder="Email" value={email} onChange={setEmail} />
        <Field icon={Lock} type="password" placeholder="Password" value={password} onChange={setPassword} />

        <AnimatePresence initial={false}>
          {mode === "signup" && (
            <motion.div key="onboarding" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex flex-col gap-3 overflow-hidden">
              <Field icon={Compass} placeholder="What you want to study (e.g. Business Analytics)" value={field} onChange={setField} />
              <Field icon={Globe2} placeholder="Target region (e.g. Asia)" value={region} onChange={setRegion} />
              <Field icon={Ban} placeholder="What you'd rather avoid (e.g. olympiads)" value={avoid} onChange={setAvoid} />
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: "rgba(224,85,107,0.1)", color: "#f2a3b0" }}>
            {error}
          </motion.div>
        )}

        <button
          onClick={submit}
          disabled={busy}
          className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm transition-transform active:translate-y-[1px] disabled:opacity-60"
          style={{ background: "linear-gradient(140deg, var(--pf-accent-hi), var(--pf-accent-deep))", color: "#fff", boxShadow: "0 14px 34px -14px var(--pf-glow)" }}
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {mode === "signup" ? "Create my workspace" : "Sign in"}
          {!busy && <ArrowRight size={15} />}
        </button>

        <p className="text-center text-xs" style={{ color: "var(--pf-muted)" }}>
          {mode === "signup" ? "Already have an account? " : "New to Pathflow? "}
          <button onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(null); }} style={{ color: "var(--pf-accent-hi)" }}>
            {mode === "signup" ? "Sign in" : "Create one"}
          </button>
        </p>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  icon: typeof Mail;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label
      className="flex items-center gap-2.5 rounded-xl border px-3.5 py-3 transition-colors focus-within:border-[var(--pf-accent)]"
      style={{ borderColor: "var(--pf-border)", backgroundColor: "var(--pf-elevated)" }}
    >
      <Icon size={16} style={{ color: "var(--pf-muted)" }} />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm outline-none placeholder:opacity-60"
        style={{ color: "var(--pf-ink)" }}
      />
    </label>
  );
}
