import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, Stethoscope, LogOut, Shield, Menu } from "lucide-react";
import { useState } from "react";
import { MedSevaLogo } from "@/components/MedSevaLogo";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/lib/auth";

export const Route = createFileRoute("/_admin")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/login" });
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();
    if (profile?.role !== "admin") throw redirect({ to: "/login" });
  },
  component: AdminLayout,
});

const NAV = [
  { to: "/admin/",        label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/patients", label: "Patients",  icon: Users },
  { to: "/admin/doctors",  label: "Doctors",   icon: Stethoscope },
] as const;

function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F7F8FA" }}>
      {/* Sidebar desktop */}
      <div className="hidden lg:flex">
        <Sidebar onNav={() => {}} />
      </div>

      {/* Sidebar mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50">
            <Sidebar onNav={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header
          className="h-14 bg-white border-b flex items-center justify-between px-5 shrink-0"
          style={{ borderColor: "#EEF0F3" }}
        >
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu size={20} color="#6B7280" />
            </button>
            <div className="flex items-center gap-2">
              <Shield size={15} color="#0D7A5F" />
              <span className="text-sm font-semibold" style={{ color: "#1A2332" }}>Admin Panel</span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide"
                style={{ background: "#E8F5F1", color: "#0D7A5F" }}
              >
                SUPER ADMIN
              </span>
            </div>
          </div>
          <button
            onClick={async () => { await signOut(); window.location.href = "/login"; }}
            className="flex items-center gap-2 text-sm font-medium px-3 h-8 rounded-lg hover:bg-red-50 transition-colors"
            style={{ color: "#EF4444" }}
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </header>

        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function Sidebar({ onNav }: { onNav: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (to: string) => {
    if (to === "/admin/") return pathname === "/admin" || pathname === "/admin/";
    return pathname.startsWith(to);
  };

  return (
    <aside
      className="flex flex-col h-screen w-60 shrink-0 bg-white border-r"
      style={{ borderColor: "#E8ECF0" }}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b" style={{ borderColor: "#E8ECF0" }}>
        <MedSevaLogo />
      </div>

      {/* Section label */}
      <div className="px-5 pt-5 pb-2">
        <span className="label-caps">Navigation</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={onNav}
              className="relative flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium transition-all w-full"
              style={{
                background: active ? "#E8F5F1" : "transparent",
                color: active ? "#0D7A5F" : "#5A6472",
              }}
            >
              {active && (
                <span
                  className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r"
                  style={{ background: "#0D7A5F" }}
                />
              )}
              <Icon size={17} color={active ? "#0D7A5F" : "#8A94A6"} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer user card */}
      <div className="p-4 border-t" style={{ borderColor: "#E8ECF0" }}>
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
          style={{ background: "#F7F8FA" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: "#0D7A5F", color: "#fff" }}
          >
            SA
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: "#1A2332" }}>Super Admin</div>
            <div className="text-[11px]" style={{ color: "#6B7280" }}>admin@medseva.in</div>
            
          </div>
        </div>
      </div>
    </aside>
  );
}
