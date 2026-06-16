import { useState } from "react";
import { Outlet, useLocation } from "react-router";
import { motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { WorkspaceProvider } from "../store/workspace";
import { Sidebar } from "./Sidebar";
import { EvidenceDrawer } from "./objects/EvidenceDrawer";
import { MiniCube } from "./cube/RubikCube";

export function RootLayout() {
  return (
    <WorkspaceProvider>
      <Shell />
    </WorkspaceProvider>
  );
}

function Shell() {
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-[100dvh]" style={{ color: "var(--pf-ink)" }}>
      {/* Desktop sidebar */}
      <aside
        className="hidden w-[264px] shrink-0 border-r lg:block"
        style={{ borderColor: "var(--pf-border)", backgroundColor: "var(--pf-surface)" }}
      >
        <div className="sticky top-0 h-[100dvh]">
          <Sidebar />
        </div>
      </aside>

      {/* Mobile sidebar */}
      {navOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/55" onClick={() => setNavOpen(false)} />
          <div
            className="absolute inset-y-0 left-0 w-[80%] max-w-[280px] border-r"
            style={{ borderColor: "var(--pf-border)", backgroundColor: "var(--pf-surface)" }}
          >
            <button
              onClick={() => setNavOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-4 z-10 rounded-md p-1"
              style={{ color: "var(--pf-muted)" }}
            >
              <X size={18} />
            </button>
            <Sidebar onNavigate={() => setNavOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header
          className="sticky top-0 z-30 flex items-center gap-3 border-b px-4 py-3 lg:hidden"
          style={{
            borderColor: "var(--pf-border)",
            backgroundColor: "rgba(7,10,17,0.8)",
            backdropFilter: "blur(12px)",
          }}
        >
          <button
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
            className="rounded-lg border p-1.5"
            style={{ borderColor: "var(--pf-border)", color: "var(--pf-ink)" }}
          >
            <Menu size={18} />
          </button>
          <MiniCube size={26} />
          <span style={{ color: "var(--pf-ink)" }}>Pathflow</span>
        </header>

        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="min-w-0 flex-1"
        >
          <Outlet />
        </motion.main>
      </div>

      <EvidenceDrawer />
    </div>
  );
}
