import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Droplet,
  HeartPulse,
  Pill,
  Footprints,
  Sparkles,
  Upload,
  Activity,
  MessageCircle,
  Salad,
  Check,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import { StatCard } from "@/components/StatCard";
import { RiskBadge } from "@/components/RiskBadge";
import { patient, vitals, weeklyVitals, medications } from "@/lib/mock-data";

export const Route = createFileRoute("/_patient/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — MedSeva" },
      { name: "description", content: "Your daily health summary, vitals, and AI insights." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [view, setView] = useState<"sugar" | "bp">("sugar");
  const [meds, setMeds] = useState(medications);

  const markTaken = (id: string) => {
    setMeds(meds.map((m) => (m.id === id ? { ...m, status: "Taken" } : m)));
    toast.success("Medication marked as taken ✓");
  };

  return (
    <div className="px-8 py-7 max-w-[1280px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-[22px] font-bold" style={{ color: "#1A2332" }}>
          Namaste, {patient.greeting} 🙏
        </h1>
        <RiskBadge level={patient.riskLevel} />
      </div>
      <div className="text-xs mb-6" style={{ color: "#6B7280" }}>
        Wednesday, 24 June 2026
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Blood Sugar" value={vitals.bloodSugar.value} unit={vitals.bloodSugar.unit} icon={Droplet}>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold risk-high">
            {vitals.bloodSugar.trend} this week
          </span>
        </StatCard>
        <StatCard label="Blood Pressure" value={vitals.bp.value} unit={vitals.bp.unit} icon={HeartPulse}>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold risk-stable">
            Within range
          </span>
        </StatCard>
        <StatCard label="Med Adherence" value={`${vitals.adherence.value}%`} icon={Pill}>
          <div className="h-1 rounded-full mt-1" style={{ background: "#EEF0F3" }}>
            <div className="h-1 rounded-full" style={{ width: `${vitals.adherence.value}%`, background: "#0D7A5F" }} />
          </div>
        </StatCard>
        <StatCard label="Daily Steps" value={vitals.steps.value.toLocaleString()} unit={`/ ${vitals.steps.goal.toLocaleString()}`} icon={Footprints}>
          <span className="text-xs" style={{ color: "#6B7280" }}>
            {(vitals.steps.goal - vitals.steps.value).toLocaleString()} to go
          </span>
        </StatCard>
      </div>

      {/* Row 2: chart + risk gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-5">
        <div className="card-base p-6 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold" style={{ color: "#1A2332" }}>
              Your Vitals This Week
            </h3>
            <div className="flex p-1 rounded-full" style={{ background: "#F3F4F6" }}>
              {(["sugar", "bp"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: view === v ? "#FFFFFF" : "transparent",
                    color: view === v ? "#0D7A5F" : "#6B7280",
                  }}
                >
                  {v === "sugar" ? "Sugar" : "BP"}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <AreaChart data={weeklyVitals} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
                <Area type="monotone" dataKey={view} stroke="#0D7A5F" strokeWidth={2.5} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-base p-6 lg:col-span-2">
          <h3 className="text-base font-semibold mb-2" style={{ color: "#1A2332" }}>
            Health Risk Score
          </h3>
          <div style={{ height: 180 }}>
            <ResponsiveContainer>
              <RadialBarChart
                cx="50%"
                cy="55%"
                innerRadius="70%"
                outerRadius="100%"
                data={[{ value: patient.riskScore, fill: "#0D7A5F" }]}
                startAngle={180}
                endAngle={0}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background={{ fill: "#EEF0F3" }} dataKey="value" cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="text-center -mt-20">
              <div className="text-[32px] font-bold" style={{ color: "#1A2332" }}>{patient.riskScore}</div>
              <RiskBadge level={patient.riskLevel} />
            </div>
          </div>
          <p className="text-sm mt-12" style={{ color: "#374151" }}>
            Slightly elevated fasting glucose. Maintain your evening walk routine.
          </p>
        </div>
      </div>

      {/* Row 3: meds + insight */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
        <div className="card-base p-6" style={{ borderLeft: "3px solid #B45309" }}>
          <h3 className="text-base font-semibold mb-4" style={{ color: "#1A2332" }}>Today's Medications</h3>
          <div className="space-y-3">
            {meds.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 p-3 rounded-lg" style={{ background: "#F7F8FA" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#E8F5F1" }}>
                    <Pill size={16} color="#0D7A5F" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "#1A2332" }}>{m.name} {m.dose}</div>
                    <div className="text-xs" style={{ color: "#6B7280" }}>at {m.time}</div>
                  </div>
                </div>
                {m.status === "Taken" ? (
                  <span className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: "#15803D" }}>
                    <Check size={14} /> Taken
                  </span>
                ) : (
                  <button
                    onClick={() => markTaken(m.id)}
                    className="h-8 px-3 rounded-md border text-xs font-semibold"
                    style={{ borderColor: "#0D7A5F", color: "#0D7A5F" }}
                  >
                    Mark Taken
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="insight-card p-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} color="#0D7A5F" />
            <span className="label-caps" style={{ color: "#0D7A5F" }}>AI Insight</span>
          </div>
          <p className="text-base" style={{ color: "#1A2332", lineHeight: 1.5 }}>
            Your blood pressure has stabilized over 3 days. Excellent progress, {patient.greeting}!
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
        {[
          { icon: Upload, label: "Upload Report", to: "/reports" as const },
          { icon: Activity, label: "Log Vitals", to: "/dashboard" as const },
          { icon: MessageCircle, label: "Talk to AARA", to: "/aara" as const },
          { icon: Salad, label: "View Diet Plan", to: "/care-plan" as const },
        ].map(({ icon: Icon, label, to }) => (
          <Link
            key={label}
            to={to}
            className="card-base p-4 flex items-center gap-3 hover:border-[#0D7A5F] transition-colors"
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#E8F5F1" }}>
              <Icon size={16} color="#0D7A5F" />
            </div>
            <span className="text-sm font-medium" style={{ color: "#374151" }}>{label}</span>
          </Link>
        ))}
      </div>

      {/* Floating AARA pill */}
      <Link
        to="/aara"
        className="fixed bottom-6 right-6 inline-flex items-center gap-2 px-4 py-3 rounded-full text-white shadow-lg font-semibold text-sm"
        style={{ background: "#0D7A5F" }}
      >
        💬 Talk to AARA
      </Link>
    </div>
  );
}
