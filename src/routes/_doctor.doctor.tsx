import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, AlertOctagon, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { RiskBadge } from "@/components/RiskBadge";
import { supabase } from "@/lib/supabase";
import type { RiskLevel } from "@/lib/mock-data";

export const Route = createFileRoute("/_doctor/doctor")({
  component: DoctorSection,
});

function DoctorSection() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname === "/doctor") return <PatientQueue />;
  return <Outlet />;
}

interface QueuePatient {
  id: string;
  name: string;
  age: number | null;
  gender: string | null;
  condition: string;
  risk: RiskLevel;
  bloodSugar: string | null;
  bloodPressure: string | null;
  critical: boolean;
}

type Filter = "All" | "HIGH" | "MODERATE" | "STABLE";

function PatientQueue() {
  const [patients, setPatients] = useState<QueuePatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("All");

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Get patients assigned to this doctor
    const { data: pp } = await supabase
      .from("patient_profiles")
      .select("id, age, gender, conditions, risk_level, assigned_doctor_id")
      .eq("assigned_doctor_id", user.id);

    if (!pp?.length) { setPatients([]); setLoading(false); return; }

    const ids = pp.map((p) => p.id);

    // Get base profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", ids);

    // Get latest vitals for each patient
    const { data: vitals } = await supabase
      .from("vitals")
      .select("patient_id, type, value, notes, recorded_at")
      .in("patient_id", ids)
      .in("type", ["blood_sugar", "blood_pressure"])
      .order("recorded_at", { ascending: false });

    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

    // Group latest vital per patient per type
    const vitalsMap: Record<string, { blood_sugar?: string; blood_pressure?: string }> = {};
    for (const v of vitals ?? []) {
      if (!vitalsMap[v.patient_id]) vitalsMap[v.patient_id] = {};
      if (v.type === "blood_sugar" && !vitalsMap[v.patient_id].blood_sugar) {
        vitalsMap[v.patient_id].blood_sugar = `${v.value} mg/dL`;
      }
      if (v.type === "blood_pressure" && !vitalsMap[v.patient_id].blood_pressure) {
        const dia = v.notes?.match(/Diastolic:\s*(\d+)/)?.[1];
        vitalsMap[v.patient_id].blood_pressure = dia ? `${v.value}/${dia} mmHg` : `${v.value} mmHg`;
      }
    }

    setPatients(pp.map((p) => {
      const risk = (p.risk_level as RiskLevel) ?? "STABLE";
      const sugar = vitalsMap[p.id]?.blood_sugar ?? null;
      const sugarVal = sugar ? parseFloat(sugar) : 0;
      return {
        id: p.id,
        name: profileMap[p.id]?.full_name ?? "Unknown Patient",
        age: p.age ?? null,
        gender: p.gender ?? null,
        condition: (p.conditions ?? []).join(", ") || "—",
        risk,
        bloodSugar: sugar,
        bloodPressure: vitalsMap[p.id]?.blood_pressure ?? null,
        critical: risk === "HIGH" || sugarVal > 250,
      };
    }));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = patients.filter((p) => filter === "All" || p.risk === filter);

  const high = patients.filter((p) => p.risk === "HIGH").length;
  const moderate = patients.filter((p) => p.risk === "MODERATE").length;
  const stable = patients.filter((p) => p.risk === "STABLE").length;

  return (
    <div className="px-8 py-7 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-[22px] font-bold" style={{ color: "#1A2332" }}>Patient Queue</h1>
        <button onClick={load}
          className="flex items-center gap-2 h-9 px-4 rounded-xl border text-sm font-medium hover:bg-gray-50 transition-colors"
          style={{ borderColor: "#E8ECF0", color: "#374151" }}>
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>
      <p className="text-sm mt-1 mb-6" style={{ color: "#6B7280" }}>
        {loading ? "Loading…" : `Managing ${patients.length} active monitoring cases.`}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={String(patients.length).padStart(2, "0")} icon={Users} />
        <StatCard label="High Risk" value={String(high).padStart(2, "0")} icon={AlertOctagon} />
        <StatCard label="Moderate" value={String(moderate).padStart(2, "0")} icon={AlertTriangle} />
        <StatCard label="Stable" value={String(stable).padStart(2, "0")} icon={CheckCircle} />
      </div>

      <div className="flex items-center gap-3 mt-7 mb-5 flex-wrap">
        <span className="label-caps">Quick Filters:</span>
        {(["All", "HIGH", "MODERATE", "STABLE"] as Filter[]).map((f) => {
          const active = filter === f;
          return (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 h-8 rounded-full border text-xs font-semibold transition-colors"
              style={
                active && f === "HIGH"
                  ? { background: "#FEF2F2", color: "#B91C1C", borderColor: "#FECACA" }
                  : active
                  ? { background: "#E8F5F1", color: "#0D7A5F", borderColor: "#0D7A5F" }
                  : { background: "#FFFFFF", color: "#374151", borderColor: "#D1D5DB" }
              }>
              {f === "HIGH" ? "High Risk" : f === "MODERATE" ? "Moderate" : f === "STABLE" ? "Stable" : f}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-48 skeleton rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-base flex flex-col items-center justify-center py-16 gap-3">
          <Users size={28} color="#D1D5DB" />
          <p className="text-sm font-medium" style={{ color: "#6B7280" }}>
            {patients.length === 0 ? "No patients assigned to you yet." : "No patients match this filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((p) => <PatientCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}

function PatientCard({ p }: { p: QueuePatient }) {
  const initials = p.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="card-base p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm shrink-0"
          style={{ background: "#E8F5F1", color: "#0D7A5F" }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="text-base font-semibold truncate" style={{ color: "#1A2332" }}>{p.name}</div>
            <RiskBadge level={p.risk as RiskLevel} />
          </div>
          <div className="text-[13px]" style={{ color: "#6B7280" }}>
            {[p.age ? `${p.age}y` : null, p.gender].filter(Boolean).join(" · ")}
            {p.condition !== "—" && ` • ${p.condition}`}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5 mt-4">
        {p.bloodSugar && (
          <div>
            <div className="label-caps">GLUCOSE</div>
            <div className="text-sm font-semibold mt-0.5"
              style={{ color: parseFloat(p.bloodSugar) > 140 ? "#B91C1C" : "#15803D" }}>
              {p.bloodSugar}
            </div>
          </div>
        )}
        {p.bloodPressure && (
          <div>
            <div className="label-caps">BP</div>
            <div className="text-sm font-semibold mt-0.5" style={{ color: "#374151" }}>
              {p.bloodPressure}
            </div>
          </div>
        )}
        {!p.bloodSugar && !p.bloodPressure && (
          <p className="text-xs" style={{ color: "#9CA3AF" }}>No vitals recorded yet</p>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: "#EEF0F3" }}>
        <Link to="/doctor/patient/$id" params={{ id: p.id }}
          className="h-9 px-3 rounded-md border text-xs font-semibold"
          style={{ borderColor: "#0D7A5F", color: "#0D7A5F" }}>
          View Patient
        </Link>
        {p.critical && (
          <span className="text-xs font-semibold" style={{ color: "#B91C1C" }}>
            ⚠ High Risk — Review Needed
          </span>
        )}
      </div>
    </div>
  );
}
