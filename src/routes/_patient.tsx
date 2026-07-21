import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { PatientSidebar } from "@/components/PatientSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Bell, Search } from "lucide-react";

let cachedSession: boolean | null = null;

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") cachedSession = null;
    if (event === "SIGNED_IN") cachedSession = true;
  });
}

export const Route = createFileRoute("/_patient")({
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;
    const { data: { session } } = await supabase.auth.getSession();
    cachedSession = !!session;
    if (!session) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    // Block admin and doctor from accessing patient routes
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();
    const role = profile?.role;
    if (role === "admin") throw redirect({ to: "/admin/" });
    if (role === "doctor") throw redirect({ to: "/doctor" });
  },
  component: PatientLayout,
});

function PatientLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { profile } = useAuth();

  const PAGE_TITLES: Record<string, string> = {
    "/dashboard":           "Dashboard",
    "/reports":             "Health Reports",
    "/care-plan":           "My Care Plan",
    "/discharge-protocol":  "Recovery Plan",
    "/appointments":        "Appointments",
    "/aara":                "Talk to AARA",
    "/profile":             "Profile",
  };
  const pageTitle = PAGE_TITLES[pathname] ?? "MedSeva";
  const displayName = profile?.full_name ?? "Patient";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <SidebarProvider>
      <PatientSidebar />
      <SidebarInset className="bg-[#F7F8FA] flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 h-14 bg-white border-b" style={{ borderColor: "#EEF0F3" }}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: "#1A2332" }}>{pageTitle}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#E8F5F1", color: "#0D7A5F" }}>MVP</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-lg border text-xs" style={{ borderColor: "#E8ECF0", color: "#9CA3AF", background: "#F7F8FA" }}>
              <Search size={13} />
              <span>Search</span>
              <kbd className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#E8ECF0", color: "#6B7280" }}>⌘K</kbd>
            </div>
            {/* Notification bell */}
            <button className="relative w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F7F8FA] transition-colors" style={{ border: "1px solid #EEF0F3" }}>
              <Bell size={15} color="#6B7280" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: "#0D7A5F" }} />
            </button>
            {/* Avatar */}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: "#E8F5F1", color: "#0D7A5F" }}>
              {initials}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
