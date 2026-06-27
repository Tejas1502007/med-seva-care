import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Droplet, HeartPulse, Pill, Footprints, Sparkles,
  Upload, Activity, MessageCircle, Salad, Check,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip, RadialBarChart, RadialBar, PolarAngleAxis,
} from "recharts";
import { StatCard } from "@/components/StatCard";
import { RiskBadge } from "@/components/RiskBadge";
import { RealtimeVitalsGraph } from "@/components/RealtimeVitalsGraph";
import { medications as mockMeds } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import type { RiskLevel } from "@/lib/mock-data";

export const Route = createFileRoute("/_patient/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — MedSeva" },
      { name: "description", content: "Your daily health summary, vitals, and AI insights." },
    ],
  }),
  component: Dashboard,
});

type DashboardData = {
  patientName: string;
  greeting: string;
  riskLevel: RiskLevel;
  riskScore: number;
  bloodSugar: { value: number; unit: string; status: "elevated" | "normal" } | null;
  bloodPressure: { value: string; unit: string; status: "elevated" | "normal" } | null;
  aiInsight: string;
  aiInsightDate: string | null;
  weeklyChart: { day: string; sugar: number | null; bp: number | null }[];
};

const EMPTY: DashboardData = {
  patientName: "Patient",
  greeting: "Patient ji",
  riskLevel: "STABLE",
  riskScore: 50,
  bloodSugar: null,
  bloodPressure: null,
  aiInsight: "Upload a health report to get AI-powered insights.",
  aiInsightDate: null,
  weeklyChart: [],
};

function Dashboard() {
  const [view, setView] = useState<"sugar" | "bp">("sugar");
  const [meds, setMeds] = useState(mockMeds);
  const [data, setData] = useState<DashboardData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userIdRef.current = user.id;
      setUserId(user.id);
      await refresh(user.id);
      setLoading(false);

      // Realtime: filter by current user only
      channel = supabase
        .channel(`dashboard:${user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "vitals", filter: `patient_id=eq.${user.id}` },
          () => refresh(user.id)
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "patient_profiles", filter: `id=eq.${user.id}` },
          () => refresh(user.id)
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "health_reports", filter: `patient_id=eq.${user.id}` },
          () => refresh(user.id)
        )
        .subscribe();
    };

    init();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  const refresh = async (userId: string) => {
    const [profileRes, patientRes, vitalsRes, reportRes] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", userId).single(),
      supabase.from("patient_profiles").select("risk_level, risk_score").eq("id", userId).single(),
      supabase.from("vitals")
        .select("type, value, unit, notes, recorded_at")
        .eq("patient_id", userId)
        .in("type", ["blood_sugar", "blood_pressure"])
        .order("recorded_at", { ascending: false })
        .limit(30),
      supabase.from("health_reports")
        .select("ai_summary, report_date")
        .eq("patient_id", userId)
        .in("status", ["Analyzed", "Flagged"])
        .order("report_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const fullName = profileRes.data?.full_name ?? "Patient";
    const firstName = fullName.split(" ")[0];
    const riskLevel = (patientRes.data?.risk_level as RiskLevel) ?? "STABLE";
    const riskScore = patientRes.data?.risk_score ?? 50;

    // Latest vitals
    const allVitals = vitalsRes.data ?? [];
    const latestSugar = allVitals.find((v) => v.type === "blood_sugar");
    const latestBP = allVitals.find((v) => v.type === "blood_pressure");

    let bpDisplay: string | null = null;
    let bpSystolic = 0;
    if (latestBP) {
      const diastolic = latestBP.notes?.match(/Diastolic:\s*(\d+)/)?.[1];
      bpDisplay = diastolic ? `${latestBP.value}/${diastolic}` : `${latestBP.value}`;
      bpSystolic = Number(latestBP.value);
    }

    // Build weekly chart from last 7 blood sugar + BP readings
    const last7Days = getLast7Days();
    const weeklyChart = last7Days.map(({ label, dateStr }) => {
      const sugar = allVitals.find(
        (v) => v.type === "blood_sugar" && v.recorded_at.startsWith(dateStr)
      );
      const bp = allVitals.find(
        (v) => v.type === "blood_pressure" && v.recorded_at.startsWith(dateStr)
      );
      return {
        day: label,
        sugar: sugar ? Number(sugar.value) : null,
        bp: bp ? Number(bp.value) : null,
      };
    });

    setData({
      patientName: fullName,
      greeting: `${firstName} ji`,
      riskLevel,
      riskScore,
      bloodSugar: latestSugar
        ? { value: Number(latestSugar.value), unit: latestSugar.unit, status: Number(latestSugar.value) > 140 ? "elevated" : "normal" }
        : null,
      bloodPressure: bpDisplay
        ? { value: bpDisplay, unit: "mmHg", status: bpSystolic > 140 ? "elevated" : "normal" }
        : null,
      aiInsight: reportRes.data?.ai_summary ?? "Upload a health report to get AI-powered insights.",
      aiInsightDate: reportRes.data?.report_date ?? null,
      weeklyChart,
    });
  };

  const markTaken = async (id: string, name: string) => {
    const userIdRef = useRef<string | null>(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not authenticated");
      return;
    }

    try {
      // Insert medication log
      const { error: logError } = await supabase
        .from("medication_logs")
        .insert([
          {
            medication_id: id,
            patient_id: user.id,
            status: "Taken",
            logged_at: new Date().toISOString(),
          },
        ]);

      if (logError) {
        console.error("Error logging medication:", logError);
        toast.error("Error marking medication");
        return;
      }

      // Update medication streak
      const currentMed = meds.find(m => m.id === id);
      if (currentMed) {
        const { error: updateError } = await supabase
          .from("medications")
          .update({ 
            streak: (currentMed.streak || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq("id", id);

        if (updateError) {
          console.error("Error updating streak:", updateError);
        }
      }

      // Update local state
      setMeds(meds.map((m) => (m.id === id ? { ...m, status: "Taken", streak: (m.streak || 0) + 1 } : m)));
      toast.success(`✓ ${name} marked as taken`);
    } catch (err) {
      console.error("Exception marking as taken:", err);
      toast.error("Failed to mark medication");
    }
  };

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-[22px] font-bold" style={{ color: "#1A2332" }}>
          Namaste, {data.greeting} 🙏
        </h1>
        <RiskBadge level={data.riskLevel} />
      </div>
      <div className="text-xs mb-6" style={{ color: "#6B7280" }}>{today}</div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Blood Sugar */}
        <StatCard
          label="Blood Sugar"
          value={loading ? "…" : data.bloodSugar ? data.bloodSugar.value : "—"}
          unit={data.bloodSugar ? data.bloodSugar.unit : ""}
          icon={Droplet}
        >
          {data.bloodSugar ? (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${data.bloodSugar.status === "elevated" ? "risk-high" : "risk-stable"}`}>
              {data.bloodSugar.status === "elevated" ? "Elevated" : "Normal"}
            </span>
          ) : (
            <span className="text-xs" style={{ color: "#9CA3AF" }}>Upload a report</span>
          )}
        </StatCard>

        {/* Blood Pressure */}
        <StatCard
          label="Blood Pressure"
          value={loading ? "…" : data.bloodPressure ? data.bloodPressure.value : "—"}
          unit={data.bloodPressure ? "mmHg" : ""}
          icon={HeartPulse}
        >
          {data.bloodPressure ? (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${data.bloodPressure.status === "elevated" ? "risk-mod" : "risk-stable"}`}>
              {data.bloodPressure.status === "elevated" ? "Elevated" : "Normal"}
            </span>
          ) : (
            <span className="text-xs" style={{ color: "#9CA3AF" }}>Upload a report</span>
          )}
        </StatCard>

        {/* Med Adherence */}
        <StatCard label="Med Adherence" value="85%" icon={Pill}>
          <div className="h-1 rounded-full mt-1" style={{ background: "#EEF0F3" }}>
            <div className="h-1 rounded-full" style={{ width: "85%", background: "#0D7A5F" }} />
          </div>
        </StatCard>

        {/* Risk Score */}
        <StatCard
          label="Risk Score"
          value={loading ? "…" : data.riskScore}
          unit="/ 100"
          icon={Footprints}
        >
          <RiskBadge level={data.riskLevel} />
        </StatCard>
      </div>

      {/* Row 2: Real-time graph + risk gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        {/* Real-time Vitals Monitor */}
        {userId && (
          <div className="card-base p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity size={18} color="#0D7A5F" />
                <h3 className="text-base font-semibold" style={{ color: "#1A2332" }}>Real-time Monitor</h3>
              </div>
              <div className="flex p-1 rounded-full" style={{ background: "#F3F4F6" }}>
                {(["sugar", "bp"] as const).map((v) => (
                  <button key={v} onClick={() => setView(v)}
                    className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                    style={{ background: view === v ? "#FFFFFF" : "transparent", color: view === v ? "#0D7A5F" : "#6B7280" }}>
                    {v === "sugar" ? "Sugar" : "BP"}
                  </button>
                ))}
              </div>
            </div>
            <RealtimeVitalsGraph userId={userId} view={view} hoursToShow={24} />
          </div>
        )}

        <div className="card-base p-6 flex flex-col">
          <h3 className="text-base font-semibold mb-4" style={{ color: "#1A2332" }}>Risk Score</h3>
          <div style={{ height: 160, flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="95%"
                data={[{ value: data.riskScore }]} startAngle={180} endAngle={0}>
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar
                  background={{ fill: "#EEF0F3" }}
                  dataKey="value"
                  cornerRadius={8}
                  fill={data.riskLevel === "HIGH" ? "#B91C1C" : data.riskLevel === "MODERATE" ? "#B45309" : "#0D7A5F"}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-2">
            <div className="text-2xl font-bold" style={{ color: "#1A2332" }}>{data.riskScore}</div>
            <RiskBadge level={data.riskLevel} />
          </div>
        </div>
      </div>

      {/* Row 3: Weekly chart */}
      <div className="card-base p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: "#1A2332" }}>Vitals This Week</h3>
        </div>
        <div style={{ height: 240 }}>
          {data.weeklyChart.some((d) => d[view] !== null) ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.weeklyChart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0D7A5F" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#0D7A5F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="day" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E8ECF0", fontSize: 12 }} />
                <Area type="monotone" dataKey={view} stroke="#0D7A5F" strokeWidth={2.5}
                  fill="url(#g)" connectNulls />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Upload size={24} color="#D1D5DB" />
              <p className="text-sm text-center" style={{ color: "#9CA3AF" }}>
                Upload a report to see your vitals chart
              </p>
              <Link to="/reports" className="text-xs font-semibold" style={{ color: "#0D7A5F" }}>
                Upload Report →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Row 4: meds + AI insight */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <div className="card-base p-6" style={{ borderLeft: "4px solid #B45309" }}>
          <h3 className="text-base font-semibold mb-4" style={{ color: "#1A2332" }}>Today's Medications</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {meds.length > 0 ? (
              meds.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3 p-3 rounded-lg" style={{ background: "#F7F8FA" }}>
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#E8F5F1" }}>
                      <Pill size={16} color="#0D7A5F" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: "#1A2332" }}>
                        {m.name} <span style={{ color: "#6B7280", fontWeight: 500 }}>({m.quantity}{m.unit})</span>
                      </div>
                      <div className="text-xs truncate" style={{ color: "#6B7280" }}>
                        {Array.isArray(m.times) ? m.times.join(", ") : m.times}
                      </div>
                    </div>
                  </div>
                  {m.status === "Taken" ? (
                    <span className="inline-flex items-center gap-1 text-[12px] font-semibold flex-shrink-0" style={{ color: "#15803D" }}>
                      <Check size={14} /> Taken
                    </span>
                  ) : (
                    <button onClick={() => markTaken(m.id, m.name)}
                      className="h-8 px-3 rounded-md border text-xs font-semibold hover:opacity-90 transition-opacity flex-shrink-0 whitespace-nowrap"
                      style={{ borderColor: "#0D7A5F", color: "#0D7A5F" }}>
                      Mark
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p style={{ color: "#9CA3AF" }} className="text-sm text-center py-4">No medications today</p>
            )}
          </div>
        </div>

        {/* AI Insight — live from latest report */}
        <div className="card-base p-6 flex flex-col" style={{ background: "linear-gradient(135deg, rgba(13, 122, 95, 0.05) 0%, rgba(13, 122, 95, 0.02) 100%)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} color="#0D7A5F" />
            <h3 className="text-base font-semibold" style={{ color: "#0D7A5F" }}>AI Insight</h3>
            {data.aiInsightDate && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold ml-auto"
                style={{ background: "#E8F5F1", color: "#0D7A5F" }}>
                {new Date(data.aiInsightDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </span>
            )}
          </div>
          <p className="text-sm flex-1 leading-relaxed" style={{ color: "#374151" }}>
            {data.aiInsight}
          </p>
          {!data.aiInsightDate && (
            <Link to="/reports"
              className="mt-4 h-9 px-4 rounded-lg text-white text-xs font-semibold inline-flex items-center gap-2 self-start transition-opacity hover:opacity-90"
              style={{ background: "#0D7A5F" }}>
              <Upload size={13} /> Upload Report
            </Link>
          )}
        </div>
      </div>

      {/* Row 5: Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 mb-8">
        {[
          { icon: Upload, label: "Upload Report", to: "/reports" as const },
          { icon: Activity, label: "Log Vitals", to: "/dashboard" as const },
          { icon: MessageCircle, label: "Talk to AARA", to: "/aara" as const },
          { icon: Salad, label: "View Diet Plan", to: "/care-plan" as const },
        ].map(({ icon: Icon, label, to }) => (
          <Link key={label} to={to} className="card-base p-4 flex items-center gap-3 hover:border-[#0D7A5F] hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#E8F5F1" }}>
              <Icon size={18} color="#0D7A5F" />
            </div>
            <span className="text-sm font-medium" style={{ color: "#374151" }}>{label}</span>
          </Link>
        ))}
      </div>

      <Link to="/aara"
        className="fixed bottom-6 right-6 inline-flex items-center gap-2 px-4 py-3 rounded-full text-white shadow-lg font-semibold text-sm"
        style={{ background: "#0D7A5F" }}>
        💬 Talk to AARA
      </Link>
    </div>
  );
}

/** Get last 7 days as { label: "Mon", dateStr: "2026-06-25" } */
function getLast7Days() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      label: days[d.getDay()],
      dateStr: d.toISOString().split("T")[0],
    };
  });
}
