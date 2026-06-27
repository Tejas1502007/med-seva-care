import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  children,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  icon: LucideIcon;
  children?: ReactNode;
}) {
  return (
    <div className="card-base p-5 relative overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* subtle teal glow top-left */}
      <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full" style={{ background: "rgba(13,122,95,0.06)" }} />
      <div className="flex items-start justify-between relative">
        <div className="label-caps">{label}</div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #E8F5F1 0%, #F0FDF9 100%)" }}>
          <Icon size={18} color="#0D7A5F" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5 relative">
        <span className="text-[30px] font-bold leading-none" style={{ color: "#1A2332" }}>{value}</span>
        {unit && <span className="text-sm font-medium" style={{ color: "#6B7280" }}>{unit}</span>}
      </div>
      {children && <div className="mt-2.5">{children}</div>}
    </div>
  );
}
