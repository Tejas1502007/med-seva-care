import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { PatientSidebar } from "@/components/PatientSidebar";

export const Route = createFileRoute("/_patient")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/_patient") throw redirect({ to: "/dashboard" });
  },
  component: PatientLayout,
});

function PatientLayout() {
  return (
    <div className="flex min-h-screen w-full" style={{ background: "#F7F8FA" }}>
      <PatientSidebar />
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
