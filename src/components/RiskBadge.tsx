import type { RiskLevel } from "@/lib/mock-data";

const styles: Record<RiskLevel, string> = {
  HIGH: "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]",
  MODERATE: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]",
  STABLE: "bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-wider ${styles[level]}`}
    >
      {level}
    </span>
  );
}
