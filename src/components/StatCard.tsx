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
    <div className="card-base p-5 relative">
      <div className="flex items-start justify-between">
        <div className="label-caps">{label}</div>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "#E8F5F1" }}
        >
          <Icon size={18} color="#0D7A5F" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-[28px] font-bold leading-none" style={{ color: "#1A2332" }}>{value}</span>
        {unit && <span className="text-sm" style={{ color: "#6B7280" }}>{unit}</span>}
      </div>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
