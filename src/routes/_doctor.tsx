import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DoctorSidebar } from "@/components/DoctorSidebar";

export const Route = createFileRoute("/_doctor")({
  component: DoctorLayout,
});

function DoctorLayout() {
  return (
    <div className="flex min-h-screen w-full" style={{ background: "#F7F8FA" }}>
      <DoctorSidebar />
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
