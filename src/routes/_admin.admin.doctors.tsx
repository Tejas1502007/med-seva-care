import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, ChevronDown, ChevronUp, RefreshCw, Stethoscope, CheckCircle, XCircle, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/doctors")({
  head: () => ({ meta: [{ title: "Doctors — Admin" }] }),
  component: AdminDoctors,
});

interface Doctor {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  // doctor_profiles
  registration_number: string;
  qualification: string;
  specialization: string;
  years_of_experience: number | null;
  hospital_clinic: string | null;
  license_file_url: string | null;
  verification_status: "pending_review" | "approved" | "rejected";
  verified_at: string | null;
}

const STATUS_FILTERS = ["All", "pending_review", "approved", "rejected"];
const STATUS_LABELS: Record<string, string> = {
  All: "All",
  pending_review: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

function AdminDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);

    const { data: dp } = await supabase
      .from("doctor_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!dp?.length) { setDoctors([]); setLoading(false); return; }

    const ids = dp.map((d) => d.id);
    const { data: baseProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, avatar_url, created_at")
      .in("id", ids);

    const baseMap = Object.fromEntries((baseProfiles ?? []).map((p) => [p.id, p]));

    setDoctors(dp.map((d) => {
      const base = baseMap[d.id] ?? {};
      return {
        id: d.id,
        full_name: (base as { full_name?: string | null }).full_name ?? null,
        email: (base as { email?: string }).email ?? "—",
        phone: (base as { phone?: string | null }).phone ?? null,
        avatar_url: (base as { avatar_url?: string | null }).avatar_url ?? null,
        created_at: (base as { created_at?: string }).created_at ?? d.created_at,
        registration_number: d.registration_number ?? "—",
        qualification: d.qualification ?? "—",
        specialization: d.specialization ?? "—",
        years_of_experience: d.years_of_experience ?? null,
        hospital_clinic: d.hospital_clinic ?? null,
        license_file_url: d.license_file_url ?? null,
        verification_status: d.verification_status ?? "pending_review",
        verified_at: d.verified_at ?? null,
      };
    }));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    setUpdating(id);
    const { error } = await supabase
      .from("doctor_profiles")
      .update({
        verification_status: status,
        verified_at: status === "approved" ? new Date().toISOString() : null,
      })
      .eq("id", id);
    if (error) { toast.error("Failed to update status"); }
    else {
      toast.success(`Doctor ${status === "approved" ? "approved" : "rejected"} successfully`);
      setDoctors((prev) => prev.map((d) => d.id === id ? { ...d, verification_status: status } : d));
    }
    setUpdating(null);
  };

  const filtered = doctors.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (d.full_name ?? "").toLowerCase().includes(q) || d.email.toLowerCase().includes(q) || d.specialization.toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || d.verification_status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 space-y-5 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A2332" }}>Doctors</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>{doctors.length} registered doctors</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 h-9 px-4 rounded-xl border text-sm font-medium hover:bg-gray-50 transition-colors"
          style={{ borderColor: "#E8ECF0", color: "#374151" }}>
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color="#9CA3AF" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or specialization…"
            className="w-full h-10 pl-9 pr-3 rounded-xl border text-sm outline-none"
            style={{ borderColor: "#D1D5DB" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#0D7A5F"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13,122,95,0.1)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#D1D5DB"; e.currentTarget.style.boxShadow = "none"; }} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="h-10 px-4 rounded-xl border text-sm font-medium transition-all"
              style={{
                background: statusFilter === s ? "#0D7A5F" : "#fff",
                borderColor: statusFilter === s ? "#0D7A5F" : "#E8ECF0",
                color: statusFilter === s ? "#fff" : "#374151",
              }}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Stethoscope} label="No doctors found" />
      ) : (
        <div className="card-base overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_1.2fr_1fr_110px_40px] gap-4 px-5 py-3 border-b text-xs font-semibold uppercase tracking-wide"
            style={{ borderColor: "#EEF0F3", color: "#9CA3AF", background: "#FAFAFA" }}>
            <span>Doctor</span>
            <span>Specialization</span>
            <span>Hospital</span>
            <span>Status</span>
            <span />
          </div>

          {filtered.map((d) => (
            <div key={d.id} className="border-b last:border-0" style={{ borderColor: "#EEF0F3" }}>
              {/* Row */}
              <div
                className="grid grid-cols-[1fr_1.2fr_1fr_110px_40px] gap-4 px-5 py-3.5 items-center hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setExpanded(expanded === d.id ? null : d.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <DoctorAvatar name={d.full_name ?? d.email} url={d.avatar_url} />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: "#1A2332" }}>{d.full_name ?? "—"}</div>
                    <div className="text-xs truncate" style={{ color: "#6B7280" }}>{d.qualification}</div>
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-sm truncate" style={{ color: "#374151" }}>{d.specialization}</div>
                  {d.years_of_experience != null && (
                    <div className="text-xs" style={{ color: "#9CA3AF" }}>{d.years_of_experience} yrs exp</div>
                  )}
                </div>
                <div className="text-sm truncate" style={{ color: "#374151" }}>{d.hospital_clinic ?? "—"}</div>
                <VerifBadge status={d.verification_status} />
                <div className="flex justify-center">
                  {expanded === d.id ? <ChevronUp size={16} color="#9CA3AF" /> : <ChevronDown size={16} color="#9CA3AF" />}
                </div>
              </div>

              {/* Expanded */}
              {expanded === d.id && (
                <div className="px-5 pb-5 pt-1" style={{ background: "#FAFBFC" }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <DetailSection title="Professional">
                      <DetailRow label="Registration No." value={d.registration_number} />
                      <DetailRow label="Qualification" value={d.qualification} />
                      <DetailRow label="Specialization" value={d.specialization} />
                      <DetailRow label="Experience" value={d.years_of_experience != null ? `${d.years_of_experience} years` : "—"} />
                      <DetailRow label="Hospital / Clinic" value={d.hospital_clinic ?? "—"} />
                    </DetailSection>

                    <DetailSection title="Contact">
                      <DetailRow label="Email" value={d.email} />
                      <DetailRow label="Phone" value={d.phone ?? "—"} />
                      <DetailRow label="Joined" value={new Date(d.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} />
                      {d.verified_at && (
                        <DetailRow label="Verified On" value={new Date(d.verified_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} />
                      )}
                    </DetailSection>

                    <DetailSection title="Verification">
                      <div className="mb-3">
                        <VerifBadge status={d.verification_status} large />
                      </div>
                      {d.license_file_url && (
                        <a href={d.license_file_url} target="_blank" rel="noreferrer"
                          className="block text-xs font-medium mb-3 underline" style={{ color: "#0D7A5F" }}>
                          View License Document ↗
                        </a>
                      )}
                      {d.verification_status !== "approved" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); updateStatus(d.id, "approved"); }}
                          disabled={updating === d.id}
                          className="w-full h-9 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 mb-2 disabled:opacity-60 transition-opacity hover:opacity-90"
                          style={{ background: "#0D7A5F" }}>
                          <CheckCircle size={14} />
                          {updating === d.id ? "Updating…" : "Approve Doctor"}
                        </button>
                      )}
                      {d.verification_status !== "rejected" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); updateStatus(d.id, "rejected"); }}
                          disabled={updating === d.id}
                          className="w-full h-9 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity hover:opacity-90 border"
                          style={{ color: "#B91C1C", borderColor: "#FECACA", background: "#FEF2F2" }}>
                          <XCircle size={14} />
                          {updating === d.id ? "Updating…" : "Reject Doctor"}
                        </button>
                      )}
                    </DetailSection>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function DoctorAvatar({ name, url }: { name: string; url: string | null }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  if (url) return <img src={url} alt={name} className="w-9 h-9 rounded-full object-cover shrink-0" />;
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
      style={{ background: "#EFF6FF", color: "#2563EB" }}>{initials}</div>
  );
}

function VerifBadge({ status, large = false }: { status: string; large?: boolean }) {
  const map: Record<string, { bg: string; color: string; label: string; icon: React.ElementType }> = {
    approved:       { bg: "#F0FDF4", color: "#15803D", label: "Approved",       icon: CheckCircle },
    pending_review: { bg: "#FFFBEB", color: "#B45309", label: "Pending Review", icon: Clock },
    rejected:       { bg: "#FEF2F2", color: "#B91C1C", label: "Rejected",       icon: XCircle },
  };
  const s = map[status] ?? map.pending_review;
  const Icon = s.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full ${large ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[10px]"}`}
      style={{ background: s.bg, color: s.color }}>
      <Icon size={large ? 12 : 10} />
      {s.label}
    </span>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-base p-4 space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#9CA3AF" }}>{title}</h4>
      {children}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-xs" style={{ color: "#6B7280" }}>{label}</span>
      <span className="text-xs font-medium text-right" style={{ color: "#1A2332" }}>{value}</span>
    </div>
  );
}

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="card-base overflow-hidden">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4 border-b last:border-0" style={{ borderColor: "#EEF0F3" }}>
          <div className="w-9 h-9 rounded-full skeleton shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-40 skeleton rounded" />
            <div className="h-3 w-28 skeleton rounded" />
          </div>
          <div className="h-5 w-20 skeleton rounded-full" />
          <div className="h-5 w-16 skeleton rounded-full" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="card-base flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#F3F4F6" }}>
        <Icon size={22} color="#9CA3AF" />
      </div>
      <p className="text-sm font-medium" style={{ color: "#6B7280" }}>{label}</p>
    </div>
  );
}
