import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { DoctorSidebar } from "@/components/DoctorSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { supabase } from "@/lib/supabase";

let cachedRole: string | null = null;

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") { cachedRole = null; }
  });
}

export const Route = createFileRoute("/_doctor")({
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/login" });

    if (!cachedRole) {
      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", user.id).single();
      cachedRole = profile?.role ?? null;
    }

    if (cachedRole === "admin") throw redirect({ to: "/admin/" });
    if (cachedRole === "patient") throw redirect({ to: "/dashboard" });

    // Always fresh-fetch verification status (admin can change it anytime)
    const { data: dp } = await supabase
      .from("doctor_profiles")
      .select("verification_status, profile_completed")
      .eq("id", user.id)
      .maybeSingle();
    const completed = dp?.profile_completed ?? false;
    const status = dp?.verification_status ?? null;
    const isProfileRoute = location.pathname === "/doctor/profile";
    const isScanQrRoute = location.pathname === "/doctor/scan-qr";

    // Not completed or not approved → force to profile page
    if (!completed || status !== "approved") {
      if (!isProfileRoute && !isScanQrRoute) throw redirect({ to: "/doctor/profile" });
    }
    // Approved doctors can access everything including /doctor/profile
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
