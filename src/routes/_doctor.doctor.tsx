import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Users, AlertOctagon, AlertTriangle, CheckCircle } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { RiskBadge } from "@/components/RiskBadge";
import { patientQueue, queueStats, type RiskLevel } from "@/lib/mock-data";

export const Route = createFileRoute("/_doctor/doctor")({
  head: () => ({ meta: [{ title: "Patient Queue — MedSeva for Doctors" }] }),
  component: PatientQueue,
});

type Filter = "All" | "High Risk" | "Diabetes" | "Hypertension" | "Post-Op";

function PatientQueue() {
  const [filter, setFilter] = useState<Filter>("All");

  const filtered = patientQueue.filter((p) => {
    if (filter === "All") return true;
    if (filter === "High Risk") return p.risk === "HIGH";
    return p.condition.toLowerCase().includes(filter.toLowerCase());
  });

  return (
    <div className="px-8 py-7 max-w-[1400px] mx-auto">
      <h1 className="text-[22px] font-bold" style={{ color: "#1A2332" }}>Patient Queue</h1>
      <p className="text-sm mt-1 mb-6" style={{ color: "#6B7280" }}>
        Managing {queueStats.total} active monitoring cases today.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={String(queueStats.total).padStart(2, "0")} icon={Users} />
        <StatCard label="High Risk" value={String(queueStats.high).padStart(2, "0")} icon={AlertOctagon} />
        <StatCard label="Moderate" value={String(queueStats.moderate).padStart(2, "0")} icon={AlertTriangle} />
        <StatCard label="Stable" value={String(queueStats.stable).padStart(2, "0")} icon={CheckCircle} />
      </div>

      <div className="flex items-center gap-3 mt-7 mb-5 flex-wrap">
        <span className="label-caps">Quick Filters:</span>
        {(["All", "High Risk", "Diabetes", "Hypertension", "Post-Op"] as Filter[]).map((f) => {
          const active = filter === f;
          const isHigh = f === "High Risk";
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 h-8 rounded-full border text-xs font-semibold transition-colors"
              style={
                active && isHigh
                  ? { background: "#FEF2F2", color: "#B91C1C", borderColor: "#FECACA" }
                  : active
                  ? { background: "#E8F5F1", color: "#0D7A5F", borderColor: "#0D7A5F" }
                  : { background: "#FFFFFF", color: "#374151", borderColor: "#D1D5DB" }
              }
            >
              {f}
            </button>
          );
        })}
        <button className="ml-auto text-xs font-medium" style={{ color: "#0D7A5F" }}>Advanced Filters</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((p) => (
          <PatientCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}

function PatientCard({ p }: { p: typeof patientQueue[number] }) {
  const initials = p.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
  return (
    <div className="card-base p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm shrink-0" style={{ background: "#E8F5F1", color: "#0D7A5F" }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="text-base font-semibold truncate" style={{ color: "#1A2332" }}>{p.name}</div>
            <RiskBadge level={p.risk as RiskLevel} />
          </div>
          <div className="text-[13px]" style={{ color: "#6B7280" }}>
            {p.age}{p.gender} • {p.condition}
          </div>
        </div>
      </div>

      <div
        className="mt-4 p-3 rounded-lg"
        style={p.critical ? { background: "#FFF8F8", borderLeft: "3px solid #B91C1C" } : { background: "#F7F8FA" }}
      >
        <div className="label-caps mb-1" style={p.critical ? { color: "#B91C1C" } : undefined}>
          {p.critical ? "AI Critical Alert" : "AI Insight"}
        </div>
        <p className="text-sm" style={{ color: "#374151", lineHeight: 1.5 }}>{p.insight}</p>
      </div>

      <div className="flex items-center gap-5 mt-4">
        {p.vitals.map((v) => (
          <div key={v.label}>
            <div className="label-caps">{v.label}</div>
            <div className="text-sm font-semibold mt-0.5" style={{ color: v.high ? "#B91C1C" : "#15803D" }}>
              {v.value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: "#EEF0F3" }}>
        <Link
          to="/doctor/patient/$id"
          params={{ id: p.id }}
          className="h-9 px-3 rounded-md border text-xs font-semibold"
          style={{ borderColor: "#0D7A5F", color: "#0D7A5F" }}
        >
          View Patient
        </Link>
        {p.risk === "HIGH" && (
          <button className="text-xs font-semibold" style={{ color: "#B91C1C" }}>
            Take Immediate Action →
          </button>
        )}
      </div>
    </div>
  );
}
