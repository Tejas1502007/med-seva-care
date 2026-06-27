"use client";
import { Activity } from "lucide-react";

export function MedSevaLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const iconSize = size === "lg" ? "w-12 h-12" : size === "sm" ? "w-7 h-7" : "w-9 h-9";
  const textSize = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl";
  const subtextSize = size === "lg" ? "text-xs" : size === "sm" ? "hidden" : "text-xs";

  return (
    <div className="flex items-center gap-2.5 group">
      <div className={`${iconSize} rounded-xl bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/25`}>
        <Activity className="w-5 h-5 text-white" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className={`${textSize} font-bold text-teal-700 dark:text-teal-400`}>
          MedSeva
        </span>
        {size !== "sm" && (
          <span className={`${subtextSize} text-slate-500 dark:text-slate-400 font-medium`}>
            Continuous Care
          </span>
        )}
      </div>
    </div>
  );
}
