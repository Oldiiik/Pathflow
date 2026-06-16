import { NavLink, useLocation } from "react-router";
import { motion } from "motion/react";
import { ChevronRight, Star, LogOut } from "lucide-react";
import { useWorkspace } from "../store/workspace";
import { useAuth } from "../store/auth";
import { MiniCube } from "./cube/RubikCube";
import { NAV_ITEMS, NAV_SECTIONS } from "../lib/nav";
import type { NavItem } from "../lib/nav";
import type { UniversityData, WorkspaceObject } from "../lib/types";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { objects, memory, roadmap } = useWorkspace();
  const location = useLocation();

  const counts: Record<string, number> = {};
  for (const o of objects) counts[o.kind] = (counts[o.kind] ?? 0) + 1;
  const openTasks = roadmap.filter((t) => t.status !== "done").length;

  const universities = objects.filter((o) => o.kind === "university");

  const countFor = (item: NavItem) =>
    item.path === "/roadmap" ? openTasks : item.kind ? counts[item.kind] ?? 0 : 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 border-b px-4 py-4" style={{ borderColor: "var(--pf-border)" }}>
        <MiniCube size={24} />
        <div className="flex flex-col">
          <span style={{ color: "var(--pf-ink)" }}>Pathflow</span>
          <span className="text-[11px]" style={{ color: "var(--pf-muted)" }}>Admission Intelligence</span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section} className="flex flex-col gap-0.5">
            <span className="px-2.5 pb-1.5 text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--pf-muted)" }}>
              {section}
            </span>
            {NAV_ITEMS.filter((i) => i.section === section).map((item) => (
              <NavRow key={item.path} item={item} count={countFor(item)} onNavigate={onNavigate} />
            ))}
          </div>
        ))}

        {universities.length > 0 && (
          <div className="flex flex-col gap-0.5">
            <span className="px-2.5 pb-1.5 text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--pf-muted)" }}>
              Your shortlist
            </span>
            {universities.map((o) => (
              <UniRow
                key={o.id}
                obj={o}
                active={location.pathname === `/universities/${o.id}`}
                saved={memory.savedUniversities.includes((o.data as UniversityData).name)}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </nav>

      <Identity />
    </div>
  );
}

function NavRow({ item, count, onNavigate }: { item: NavItem; count: number; onNavigate?: () => void }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === "/"}
      onClick={onNavigate}
      className="group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors"
      style={({ isActive }) => ({
        backgroundColor: isActive ? "var(--pf-accent-soft)" : "transparent",
        color: isActive ? "var(--pf-accent-hi)" : "var(--pf-ink-soft)",
      })}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="nav-active"
              className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full"
              style={{ backgroundColor: "var(--pf-accent)" }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
          )}
          <item.icon size={16} strokeWidth={2} className="transition-transform group-hover:scale-110" />
          <span className="flex-1">{item.label}</span>
          {count > 0 && (
            <span className="rounded-md px-1.5 py-0.5 font-mono text-[11px]" style={{ backgroundColor: "var(--pf-elevated)", color: "var(--pf-muted)" }}>
              {count}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

function Identity() {
  const { profile, session, signOut } = useAuth();
  const name = profile?.name || session?.user?.email?.split("@")[0] || "Student";
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="border-t p-3" style={{ borderColor: "var(--pf-border)" }}>
      <div className="flex items-center gap-2.5 rounded-xl border p-2.5" style={{ borderColor: "var(--pf-border)", backgroundColor: "var(--pf-card)" }}>
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm"
          style={{ background: "linear-gradient(140deg, var(--pf-accent-hi), var(--pf-accent-deep))", color: "#fff" }}
        >
          {initials}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm" style={{ color: "var(--pf-ink)" }}>{name}</span>
          <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--pf-muted)" }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--pf-success)" }} /> Online
          </span>
        </div>
        <button
          onClick={signOut}
          aria-label="Sign out"
          className="rounded-lg p-1.5 transition-colors hover:text-[var(--pf-accent-hi)]"
          style={{ color: "var(--pf-muted)" }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}

function UniRow({
  obj,
  active,
  saved,
  onNavigate,
}: {
  obj: WorkspaceObject;
  active: boolean;
  saved: boolean;
  onNavigate?: () => void;
}) {
  const data = obj.data as UniversityData;
  return (
    <NavLink
      to={`/universities/${obj.id}`}
      onClick={onNavigate}
      className="group flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors"
      style={{
        backgroundColor: active ? "var(--pf-accent-soft)" : "transparent",
        color: active ? "var(--pf-accent-hi)" : "var(--pf-ink-soft)",
      }}
    >
      <span
        className="flex h-5 w-9 shrink-0 items-center justify-center rounded font-mono text-[10px]"
        style={{ backgroundColor: "var(--pf-elevated)", color: "var(--pf-muted)" }}
      >
        {data.short}
      </span>
      <span className="flex-1 truncate">{data.city}</span>
      {saved && <Star size={12} fill="var(--pf-accent)" color="var(--pf-accent)" />}
      <ChevronRight size={13} className="opacity-0 transition-opacity group-hover:opacity-60" />
    </NavLink>
  );
}
