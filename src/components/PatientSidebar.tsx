import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, FileText, ClipboardList, MessageCircle, User } from "lucide-react";
import { MedSevaLogo } from "./MedSevaLogo";
import { patient } from "@/lib/mock-data";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/reports", label: "Health Reports", icon: FileText },
  { to: "/care-plan", label: "My Care Plan", icon: ClipboardList },
  { to: "/aara", label: "AARA", icon: MessageCircle },
  { to: "/profile", label: "Profile", icon: User },
];

export function PatientSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside
      className="hidden md:flex flex-col h-screen sticky top-0"
      style={{ width: 240, background: "#FFFFFF", borderRight: "1px solid #E8ECF0" }}
    >
      <div className="px-6 pt-6 pb-4">
        <MedSevaLogo />
      </div>
      <nav className="flex-1 px-2 mt-2">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || (to === "/dashboard" && pathname === "/");
          return (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 h-11 px-3 mx-2 mb-1 rounded-lg relative transition-colors"
              style={{
                background: active ? "#E8F5F1" : "transparent",
                color: active ? "#0D7A5F" : "#5A6472",
              }}
            >
              {active && (
                <span
                  className="absolute left-0 top-2 bottom-2 rounded-r"
                  style={{ width: 3, background: "#0D7A5F" }}
                />
              )}
              <Icon size={18} color={active ? "#0D7A5F" : "#8A94A6"} />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t" style={{ borderColor: "#E8ECF0" }}>
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm"
            style={{ background: "#E8F5F1", color: "#0D7A5F" }}
          >
            RS
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: "#1A2332" }}>
              {patient.name}
            </div>
            <div className="text-[11px]" style={{ color: "#6B7280" }}>Patient</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
