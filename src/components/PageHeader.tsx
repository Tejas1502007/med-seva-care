import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
  badge,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6 pb-5" style={{ borderBottom: "1px solid #EEF0F3" }}>
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-bold tracking-tight" style={{ color: "#1A2332" }}>{title}</h1>
          {badge}
        </div>
        {subtitle && (
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
