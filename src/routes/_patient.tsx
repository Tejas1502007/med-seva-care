import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { PatientSidebar } from "@/components/PatientSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_patient")({
  beforeLoad: async ({ location }) => {
    // Skip auth check on server — session lives in browser localStorage only
    if (typeof window === "undefined") return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: PatientLayout,
});

function PatientLayout() {
  return (
    <SidebarProvider>
      <PatientSidebar />
      <SidebarInset className="bg-[#F7F8FA]">
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
