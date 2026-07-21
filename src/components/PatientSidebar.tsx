import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, FileText, ClipboardList, MessageCircle, User, PanelLeftClose, PanelLeftOpen, LogOut, CalendarDays, ShieldCheck } from "lucide-react";
import { MedSevaLogo } from "./MedSevaLogo";
import { useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth, signOut } from "@/lib/auth";
import { useTranslation } from "react-i18next";

function PatientSidebarInner() {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { profile } = useAuth();

  const items = [
    { to: "/dashboard",    label: t("sidebar.dashboard"),    icon: LayoutDashboard },
    { to: "/reports",      label: t("sidebar.healthReports"), icon: FileText },
    { to: "/drug-safety",  label: "Drug Safety",              icon: ShieldCheck },
    { to: "/care-plan",    label: t("sidebar.carePlan"),      icon: ClipboardList },
    { to: "/appointments", label: t("sidebar.appointments") ?? "Appointments", icon: CalendarDays },
    { to: "/aara",         label: t("sidebar.aara"),          icon: MessageCircle },
    { to: "/profile",      label: t("sidebar.profile"),       icon: User },
  ];

  const displayName = profile?.full_name ?? "Patient";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className="flex flex-col h-screen sticky top-0 shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out"
        style={{
          width: isCollapsed ? 56 : 240,
          background: "#FFFFFF",
          borderRight: "1px solid #E8ECF0",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center overflow-hidden border-b border-[#E8ECF0]"
          style={{ height: 64, minHeight: 64, paddingLeft: isCollapsed ? 0 : 20, paddingRight: isCollapsed ? 0 : 12 }}
        >
          {!isCollapsed && (
            <Link to="/" className="flex-1 min-w-0">
              <MedSevaLogo />
            </Link>
          )}
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center rounded-lg transition-colors hover:bg-[#E8F5F1] text-[#5A6472] hover:text-[#0D7A5F]"
            style={{
              width: 36,
              height: 36,
              marginLeft: isCollapsed ? "auto" : undefined,
              marginRight: isCollapsed ? "auto" : undefined,
            }}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
          {items.map(({ to, label, icon: Icon }) => {
            const active =
              pathname === to || (to === "/dashboard" && pathname === "/");

            const btn = (
              <Link
                to={to}
                className="relative flex items-center rounded-lg transition-colors"
                style={{
                  height: 44,
                  gap: 12,
                  marginBottom: 2,
                  marginLeft: isCollapsed ? "auto" : 8,
                  marginRight: isCollapsed ? "auto" : 8,
                  paddingLeft: isCollapsed ? 0 : 12,
                  paddingRight: isCollapsed ? 0 : 12,
                  width: isCollapsed ? 40 : "auto",
                  justifyContent: isCollapsed ? "center" : undefined,
                  background: active ? "#E8F5F1" : "transparent",
                  color: active ? "#0D7A5F" : "#5A6472",
                }}
              >
                {active && !isCollapsed && (
                  <span
                    className="absolute left-0 top-2 bottom-2 rounded-r"
                    style={{ width: 3, background: "#0D7A5F" }}
                  />
                )}
                <Icon size={18} color={active ? "#0D7A5F" : "#8A94A6"} style={{ flexShrink: 0 }} />
                {!isCollapsed && (
                  <span className="text-sm font-medium truncate">{label}</span>
                )}
              </Link>
            );

            return isCollapsed ? (
              <Tooltip key={to}>
                <TooltipTrigger asChild>{btn}</TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            ) : (
              <div key={to}>{btn}</div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-[#E8ECF0] p-3 space-y-1">
          {/* User info row */}
          <div
            className="flex items-center rounded-lg"
            style={{
              gap: isCollapsed ? 0 : 12,
              paddingLeft: isCollapsed ? 0 : 8,
              paddingRight: isCollapsed ? 0 : 8,
              paddingTop: 8,
              paddingBottom: 8,
              justifyContent: isCollapsed ? "center" : undefined,
            }}
          >
            <div
              className="shrink-0 rounded-full flex items-center justify-center font-semibold text-sm"
              style={{ width: 36, height: 36, background: "#E8F5F1", color: "#0D7A5F" }}
            >
              {initials}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: "#1A2332" }}>
                  {displayName}
                </div>
                <div className="text-[11px]" style={{ color: "#6B7280" }}>Patient</div>
              </div>
            )}
          </div>

          {/* Logout button */}
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center rounded-lg transition-colors hover:bg-red-50 text-[#8A94A6] hover:text-red-500"
                  style={{ width: 40, height: 40, margin: "0 auto" }}
                  aria-label="Log out"
                >
                  <LogOut size={17} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{t("sidebar.logout")}</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full rounded-lg transition-colors hover:bg-red-50 text-[#8A94A6] hover:text-red-500"
              style={{ height: 40, paddingLeft: 8, paddingRight: 8 }}
            >
              <LogOut size={17} style={{ flexShrink: 0 }} />
              <span className="text-sm font-medium">{t("sidebar.logout")}</span>
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}

export function PatientSidebar() {
  return <PatientSidebarInner />;
}
