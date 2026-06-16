import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider, useAuth } from "./store/auth";
import { LandingPage } from "./components/landing/LandingPage";
import { Cube3D } from "./components/cube/Cube3D";

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}

function Gate() {
  const { session, loading } = useAuth();

  if (loading) return <Splash />;
  if (!session) return <LandingPage />;
  return <RouterProvider router={router} />;
}

function Splash() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-5" style={{ backgroundColor: "var(--pf-bg)" }}>
      <Cube3D size={92} />
      <span className="text-sm" style={{ color: "var(--pf-muted)" }}>Loading your workspace…</span>
    </div>
  );
}
