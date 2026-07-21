import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Users, Stethoscope, Activity, TrendingUp,
  AlertTriangle, CheckCircle, Clock, UserCheck,
  ArrowRight, RefreshCw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_admin/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — MedSeva" }] }),
  component: AdminDashboard,
});

interface Stats {
  totalPatients: number;
  totalDoctors: number;
  totalReports: number;
  totalConsultations: number;
  highRisk: number;
  moderateRisk: number;
  stableRisk: number;
  pendingDoctors: number;
  approvedDoctors: number;
  reportsToday: number;
}

interface RecentPatient {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  risk_level: string | null;
  conditions: string[];
}

interface RecentDoctor {
  id: string;
  full_name: string | null;
  email: string;
  specialization: string;
  verification_status: string;
  created_at: string;
}

interface PatientRow { id: string; created_at: string; }
interface DoctorRow { id: string; specialization: string; verification_status: string; created_at: string; }

function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
  const [recentDoctors, setRecentDoctors] = useState<RecentDoctor[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];

    const [
      { count: totalPatients },
      { count: totalDoctors },
      { count: totalReports },
      { count: totalConsultations },
      { count: highRisk },
      { count: moderateRisk },
      { count: stableRisk },
      { count: pendingDoctors },
      { count: approvedDoctors },
      { count: reportsToday },
      patientRes,
      doctorRes,
    ] = await Promise.all([
      supabase.from("patient_profiles").select("*", { count: "exact", head: true }),
      supabase.from("doctor_profiles").select("*", { count: "exact", head: true }),
      supabase.from("health_reports").select("*", { count: "exact", head: true }),
      supabase.from("consultations").select("*", { count: "exact", head: true }),
      supabase.from("patient_profiles").select("*", { count: "exact", head: true }).eq("risk_level", "HIGH"),
      supabase.from("patient_profiles").select("*", { count: "exact", head: true }).eq("risk_level", "MODERATE"),
      supabase.from("patient_profiles").select("*", { count: "exact", head: true }).eq("risk_level", "STABLE"),
      supabase.from("doctor_profiles").select("*", { count: "exact", head: true }).eq("verification_status", "pending_review"),
      supabase.from("doctor_profiles").select("*", { count: "exact", head: true }).eq("verification_status", "approved"),
      supabase.from("health_reports").select("*", { count: "exact", head: true }).gte("created_at", today),
      supabase.from("patient_profiles").select("id, created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("doctor_profiles").select("id, specialization, verification_status, created_at").order("created_at", { ascending: false }).limit(5),
    ]);
    const patientRows = (patientRes.data ?? []) as PatientRow[];
    const doctorRows = (doctorRes.data ?? []) as DoctorRow[];

    setStats({
      totalPatients: totalPatients ?? 0,
      totalDoctors: totalDoctors ?? 0,
      totalReports: totalReports ?? 0,
      totalConsultations: totalConsultations ?? 0,
      highRisk: highRisk ?? 0,
      moderateRisk: moderateRisk ?? 0,
      stableRisk: stableRisk ?? 0,
      pendingDoctors: pendingDoctors ?? 0,
      approvedDoctors: approvedDoctors ?? 0,
      reportsToday: reportsToday ?? 0,
    });

    // Enrich patients with base profiles
    if (patientRows.length > 0) {
      const ids = patientRows.map((p) => p.id);
      const { data: baseRows } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ids);
      const { data: ppRows } = await supabase
        .from("patient_profiles")
        .select("id, risk_level, conditions")
        .in("id", ids);
      const baseMap = Object.fromEntries((baseRows ?? []).map((p) => [p.id, p]));
      const ppMap = Object.fromEntries((ppRows ?? []).map((p) => [p.id, p]));
      setRecentPatients(patientRows.map((p) => ({
        id: p.id,
        full_name: baseMap[p.id]?.full_name ?? null,
        email: baseMap[p.id]?.email ?? "—",
        created_at: p.created_at,
        risk_level: ppMap[p.id]?.risk_level ?? null,
        conditions: ppMap[p.id]?.conditions ?? [],
      })));
    }

    // Enrich doctors with base profiles
    if (doctorRows.length > 0) {
      const ids = doctorRows.map((d) => d.id);
      const { data: baseRows } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ids);
      const baseMap = Object.fromEntries((baseRows ?? []).map((d) => [d.id, d]));
      setRecentDoctors(doctorRows.map((d) => ({
        id: d.id,
        full_name: baseMap[d.id]?.full_name ?? null,
        email: baseMap[d.id]?.email ?? "—",
        created_at: d.created_at,
        specialization: d.specialization ?? "—",
        verification_status: d.verification_status ?? "pending_review",
      })));
    }

    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <PageLoader />;

  const s = stats!;

  return (
    <div className="p-6 space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A2332" }}>Dashboard Overview</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 h-9 px-4 rounded-xl border text-sm font-medium hover:bg-gray-50 transition-colors"
          style={{ borderColor: "#E8ECF0", color: "#374151" }}>
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Primary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} iconBg="#E8F5F1" iconColor="#0D7A5F"
          label="Total Patients" value={s.totalPatients} sub="Registered patients" />
        <StatCard icon={Stethoscope} iconBg="#EFF6FF" iconColor="#2563EB"
          label="Total Doctors" value={s.totalDoctors} sub={`${s.approvedDoctors} approved`} />
        <StatCard icon={Activity} iconBg="#FFF7ED" iconColor="#EA580C"
          label="Health Reports" value={s.totalReports} sub={`${s.reportsToday} today`} />
        <StatCard icon={TrendingUp} iconBg="#F0FDF4" iconColor="#16A34A"
          label="Consultations" value={s.totalConsultations} sub="All time" />
      </div>

      {/* Risk breakdown + Doctor verification */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Risk */}
        <div className="card-base p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#1A2332" }}>Patient Risk Distribution</h3>
          <div className="space-y-3">
            <RiskBar label="High Risk" count={s.highRisk} total={s.totalPatients} color="#EF4444" bg="#FEF2F2" textColor="#B91C1C" />
            <RiskBar label="Moderate Risk" count={s.moderateRisk} total={s.totalPatients} color="#F59E0B" bg="#FFFBEB" textColor="#B45309" />
            <RiskBar label="Stable" count={s.stableRisk} total={s.totalPatients} color="#10B981" bg="#F0FDF4" textColor="#15803D" />
          </div>
        </div>

        {/* Doctor verification */}
        <div className="card-base p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#1A2332" }}>Doctor Verification Status</h3>
          <div className="space-y-3">
            <VerifRow icon={Clock} iconColor="#F59E0B" bg="#FFFBEB"
              label="Pending Review" count={s.pendingDoctors} />
            <VerifRow icon={CheckCircle} iconColor="#10B981" bg="#F0FDF4"
              label="Approved" count={s.approvedDoctors} />
            <VerifRow icon={AlertTriangle} iconColor="#EF4444" bg="#FEF2F2"
              label="Rejected" count={Math.max(0, s.totalDoctors - s.pendingDoctors - s.approvedDoctors)} />
          </div>
        </div>
      </div>

      {/* Recent patients + doctors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent patients */}
        <div className="card-base p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "#1A2332" }}>Recent Patients</h3>
            <Link to="/admin/patients"
              className="flex items-center gap-1 text-xs font-medium" style={{ color: "#0D7A5F" }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {recentPatients.length === 0 && <Empty label="No patients yet" />}
            {recentPatients.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <Avatar name={p.full_name ?? p.email} bg="#E8F5F1" color="#0D7A5F" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: "#1A2332" }}>{p.full_name ?? "—"}</div>
                  <div className="text-xs truncate" style={{ color: "#6B7280" }}>{p.email}</div>
                </div>
                <RiskBadge level={p.risk_level} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent doctors */}
        <div className="card-base p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "#1A2332" }}>Recent Doctors</h3>
            <Link to="/admin/doctors"
              className="flex items-center gap-1 text-xs font-medium" style={{ color: "#0D7A5F" }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {recentDoctors.length === 0 && <Empty label="No doctors yet" />}
            {recentDoctors.map((d) => (
              <div key={d.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <Avatar name={d.full_name ?? d.email} bg="#EFF6FF" color="#2563EB" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: "#1A2332" }}>{d.full_name ?? "—"}</div>
                  <div className="text-xs truncate" style={{ color: "#6B7280" }}>{d.specialization}</div>
                </div>
                <VerifBadge status={d.verification_status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, iconBg, iconColor, label, value, sub }: {
  icon: React.ElementType; iconBg: string; iconColor: string;
  label: string; value: number; sub: string;
}) {
  return (
    <div className="card-base p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
          <Icon size={18} color={iconColor} />
        </div>
      </div>
      <div className="text-2xl font-bold" style={{ color: "#1A2332" }}>{value.toLocaleString()}</div>
      <div className="text-sm font-medium mt-0.5" style={{ color: "#374151" }}>{label}</div>
      <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{sub}</div>
    </div>
  );
}

function RiskBar({ label, count, total, color, bg, textColor }: {
  label: string; count: number; total: number; color: string; bg: string; textColor: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium" style={{ color: textColor }}>{label}</span>
        <span className="text-xs font-semibold" style={{ color: "#374151" }}>{count} <span style={{ color: "#9CA3AF" }}>({pct}%)</span></span>
      </div>
      <div className="h-2 rounded-full" style={{ background: "#F3F4F6" }}>
        <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function VerifRow({ icon: Icon, iconColor, bg, label, count }: {
  icon: React.ElementType; iconColor: string; bg: string; label: string; count: number;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: bg }}>
      <div className="flex items-center gap-2.5">
        <Icon size={15} color={iconColor} />
        <span className="text-sm font-medium" style={{ color: "#374151" }}>{label}</span>
      </div>
      <span className="text-sm font-bold" style={{ color: "#1A2332" }}>{count}</span>
    </div>
  );
}

function Avatar({ name, bg, color }: { name: string; bg: string; color: string }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: bg, color }}>
      {initials}
    </div>
  );
}

function RiskBadge({ level }: { level: string | null }) {
  if (!level) return null;
  const map: Record<string, { bg: string; color: string }> = {
    HIGH:     { bg: "#FEF2F2", color: "#B91C1C" },
    MODERATE: { bg: "#FFFBEB", color: "#B45309" },
    STABLE:   { bg: "#F0FDF4", color: "#15803D" },
  };
  const s = map[level] ?? map.STABLE;
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: s.bg, color: s.color }}>
      {level}
    </span>
  );
}

function VerifBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    approved:       { bg: "#F0FDF4", color: "#15803D", label: "Approved" },
    pending_review: { bg: "#FFFBEB", color: "#B45309", label: "Pending" },
    rejected:       { bg: "#FEF2F2", color: "#B91C1C", label: "Rejected" },
  };
  const s = map[status] ?? map.pending_review;
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="text-sm text-center py-4" style={{ color: "#9CA3AF" }}>{label}</p>;
}

function PageLoader() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-8 w-64 skeleton rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-48 skeleton rounded-2xl" />)}
      </div>
    </div>
  );
}
