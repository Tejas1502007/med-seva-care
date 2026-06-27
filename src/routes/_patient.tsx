import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { PatientSidebar } from "@/components/PatientSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { supabase } from "@/lib/supabase";

let cachedSession: boolean | null = null;

// Register auth listener once at module level
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") cachedSession = null;
    if (event === "SIGNED_IN") cachedSession = true;
  });
}

export const Route = createFileRoute("/_patient")({
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;
    if (cachedSession === null) {
      const { data: { session } } = await supabase.auth.getSession();
      cachedSession = !!session;
    }
    if (!cachedSession) {
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
