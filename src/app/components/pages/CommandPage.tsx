import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUp, Sparkle, ArrowRight, Command } from "lucide-react";
import { useWorkspace } from "../../store/workspace";
import { useAuth } from "../../store/auth";
import { STARTER_PROMPTS } from "../../lib/mockData";
import { KIND_META } from "../../lib/nav";
import { ToolChip } from "../shared/ToolChip";
import type { ChatMessage } from "../../lib/types";

export function CommandPage() {
  const { messages, chips, processing, submitMessage } = useWorkspace();
  const [value, setValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, chips, processing]);

  const send = () => {
    if (!value.trim()) return;
    submitMessage(value);
    setValue("");
  };

  return (
    <div className="flex h-[calc(100dvh-53px)] flex-col lg:h-[100dvh]">
      <header
        className="flex items-center gap-2.5 border-b px-6 py-4"
        style={{ borderColor: "var(--pf-border)" }}
      >
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{
            background: "linear-gradient(140deg, var(--pf-accent-hi), var(--pf-accent-deep))",
            color: "#fff",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
          }}
        >
          <Command size={15} strokeWidth={2.2} />
        </div>
        <div className="flex flex-col">
          <span style={{ color: "var(--pf-ink)" }}>Command</span>
          <span className="text-xs" style={{ color: "var(--pf-muted)" }}>
            Describe your goal — Pathflow routes it into the workspace
          </span>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-[760px]">
          {messages.length === 0 ? (
            <EmptyState onPick={submitMessage} />
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((m) => (
                <MessageRow key={m.id} message={m} />
              ))}

              <AnimatePresence>
                {chips.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-wrap gap-2 pl-7"
                  >
                    {chips.map((c) => (
                      <ToolChip
                        key={c.id}
                        layoutId={`chip-${c.id}`}
                        label={c.label}
                        kind={c.kind}
                        processing={processing.includes(c.kind)}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <div className="border-t px-4 py-3 sm:px-6" style={{ borderColor: "var(--pf-border)" }}>
        <div className="mx-auto w-full max-w-[760px]">
          <div
            className="flex items-end gap-2 rounded-xl border p-2"
            style={{ borderColor: "var(--pf-border-strong)", backgroundColor: "var(--pf-elevated)" }}
          >
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="e.g. I want to study business in Asia…"
              className="max-h-32 flex-1 resize-none bg-transparent px-1.5 py-1 text-sm outline-none"
              style={{ color: "var(--pf-ink)" }}
            />
            <button
              onClick={send}
              disabled={!value.trim()}
              aria-label="Send"
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-transform active:scale-90 disabled:opacity-40"
              style={{
                background: "linear-gradient(140deg, var(--pf-accent-hi), var(--pf-accent-deep))",
                color: "#fff",
                boxShadow: "0 6px 16px -8px var(--pf-glow)",
              }}
            >
              <ArrowUp size={16} strokeWidth={2.4} />
            </button>
          </div>
          <div className="mt-1.5 flex items-center justify-between px-1">
            <span className="text-[11px]" style={{ color: "var(--pf-muted)" }}>
              Results open as pages in the left navigation
            </span>
            <span className="hidden text-[11px] sm:inline" style={{ color: "var(--pf-muted)" }}>
              <kbd className="font-mono">↵</kbd> send · <kbd className="font-mono">⇧↵</kbd> newline
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageRow({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="self-end rounded-2xl rounded-br-md px-3.5 py-2 text-sm"
        style={{
          background: "linear-gradient(140deg, var(--pf-accent-hi), var(--pf-accent-deep))",
          color: "#fff",
          maxWidth: "85%",
          boxShadow: "0 10px 24px -12px var(--pf-glow)",
        }}
      >
        {message.text}
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2.5">
      <div className="flex items-start gap-2 text-sm" style={{ color: "var(--pf-ink-soft)" }}>
        <Sparkle size={14} strokeWidth={2} style={{ color: "var(--pf-accent)", marginTop: 3 }} />
        <span>{message.text}</span>
      </div>
      {message.resultKinds && message.resultKinds.length > 0 && (
        <div className="flex flex-wrap gap-2 pl-6">
          {message.resultKinds.map((kind) => {
            const meta = KIND_META[kind];
            return (
              <Link
                key={kind}
                to={meta.path}
                className="group inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors hover:border-[var(--pf-accent)]"
                style={{ borderColor: "var(--pf-border)", backgroundColor: "var(--pf-card)", color: "var(--pf-ink)" }}
              >
                <meta.icon size={15} strokeWidth={2} style={{ color: "var(--pf-accent-hi)" }} />
                Open {meta.plural}
                <ArrowRight size={13} className="opacity-50 transition-transform group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

function EmptyState({ onPick }: { onPick: (p: string) => void }) {
  const { profile } = useAuth();
  const first = profile?.name?.split(" ")[0];
  return (
    <div className="flex flex-col gap-5 pt-6">
      <div className="flex flex-col gap-1.5">
        <h1 style={{ color: "var(--pf-ink)" }}>{first ? `${first}, tell Pathflow your goal` : "Tell Pathflow your goal"}</h1>
        <p className="max-w-[60ch] text-sm leading-relaxed" style={{ color: "var(--pf-muted)" }}>
          Describe what you want, what you have, and what you'd rather avoid. Pathflow
          detects intent, runs the right tools, and files the results into pages you can
          open from the sidebar.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {STARTER_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => onPick(p)}
            className="rounded-xl border px-3.5 py-3 text-left text-sm transition-colors hover:border-[var(--pf-accent)] active:translate-y-[1px]"
            style={{ borderColor: "var(--pf-border)", backgroundColor: "var(--pf-card)", color: "var(--pf-ink-soft)" }}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
