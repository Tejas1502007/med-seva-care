import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { DoctorSidebar } from "@/components/DoctorSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { supabase } from "@/lib/supabase";

let cachedSession: boolean | null = null;

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") cachedSession = null;
    if (event === "SIGNED_IN") cachedSession = true;
  });
}

export const Route = createFileRoute("/_doctor")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    if (cachedSession === null) {
      const { data: { session } } = await supabase.auth.getSession();
      cachedSession = !!session;
    }
    if (!cachedSession) {
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
