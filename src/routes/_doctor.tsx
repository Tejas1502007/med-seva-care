import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { DoctorSidebar } from "@/components/DoctorSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_doctor")({
  beforeLoad: async () => {
    // Skip auth check on server — session lives in browser localStorage only
    if (typeof window === "undefined") return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
  },
  component: DoctorLayout,
});

function DoctorLayout() {
  return (
    <SidebarProvider>
      <DoctorSidebar />
      <SidebarInset className="bg-[#F7F8FA]">
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
