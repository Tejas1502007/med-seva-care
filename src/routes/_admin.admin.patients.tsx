import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, ChevronDown, ChevronUp, RefreshCw, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_admin/admin/patients")({
  head: () => ({ meta: [{ title: "Patients — Admin" }] }),
  component: AdminPatients,
});

interface Patient {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  // patient_profiles
  age: number | null;
  dob: string | null;
  gender: string | null;
  blood_group: string | null;
  height: number | null;
  weight: number | null;
  alternate_phone: string | null;
  address: string | null;
  conditions: string[];
  allergies: string[];
  addictions: string[];
  risk_level: string | null;
  risk_score: number | null;
  emergency_contact: { name?: string; phone?: string } | null;
  language_pref: string | null;
}

const RISK_FILTERS = ["All", "HIGH", "MODERATE", "STABLE"];

function AdminPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);

    // Fetch all patient_profiles directly (admin can read own row only via profiles,
    // but patient_profiles has no role filter so we use an API route approach:
    // query patient_profiles first, then enrich with profiles)
    const { data: pp } = await supabase
      .from("patient_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!pp?.length) { setPatients([]); setLoading(false); return; }

    const ids = pp.map((p) => p.id);
    const { data: baseProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, avatar_url, created_at")
      .in("id", ids);

    const baseMap = Object.fromEntries((baseProfiles ?? []).map((p) => [p.id, p]));

    setPatients(pp.map((p) => {
      const base = baseMap[p.id] ?? {};
      return {
        id: p.id,
        full_name: (base as { full_name?: string | null }).full_name ?? null,
        email: (base as { email?: string }).email ?? "—",
        phone: (base as { phone?: string | null }).phone ?? null,
        avatar_url: (base as { avatar_url?: string | null }).avatar_url ?? null,
        created_at: (base as { created_at?: string }).created_at ?? p.created_at,
        age: p.age ?? null,
        dob: (p as never as { dob: string | null }).dob ?? null,
        gender: p.gender ?? null,
        blood_group: p.blood_group ?? null,
        height: (p as never as { height: number | null }).height ?? null,
        weight: (p as never as { weight: number | null }).weight ?? null,
        alternate_phone: (p as never as { alternate_phone: string | null }).alternate_phone ?? null,
        address: (p as never as { address: string | null }).address ?? null,
        conditions: p.conditions ?? [],
        allergies: p.allergies ?? [],
        addictions: (p as never as { addictions: string[] }).addictions ?? [],
        risk_level: p.risk_level ?? null,
        risk_score: p.risk_score ?? null,
        emergency_contact: p.emergency_contact as { name?: string; phone?: string } | null,
        language_pref: p.language_pref ?? null,
      };
    }));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (p.full_name ?? "").toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
    const matchRisk = riskFilter === "All" || p.risk_level === riskFilter;
    return matchSearch && matchRisk;
  });

  return (
    <div className="p-6 space-y-5 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A2332" }}>Patients</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>{patients.length} registered patients</p>
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
            placeholder="Search by name or email…"
            className="w-full h-10 pl-9 pr-3 rounded-xl border text-sm outline-none"
            style={{ borderColor: "#D1D5DB" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#0D7A5F"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13,122,95,0.1)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#D1D5DB"; e.currentTarget.style.boxShadow = "none"; }} />
        </div>
        <div className="flex gap-2">
          {RISK_FILTERS.map((r) => (
            <button key={r} onClick={() => setRiskFilter(r)}
              className="h-10 px-4 rounded-xl border text-sm font-medium transition-all"
              style={{
                background: riskFilter === r ? "#0D7A5F" : "#fff",
                borderColor: riskFilter === r ? "#0D7A5F" : "#E8ECF0",
                color: riskFilter === r ? "#fff" : "#374151",
              }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} label="No patients found" />
      ) : (
        <div className="card-base overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1.5fr_80px_90px_40px] gap-4 px-5 py-3 border-b text-xs font-semibold uppercase tracking-wide"
            style={{ borderColor: "#EEF0F3", color: "#9CA3AF", background: "#FAFAFA" }}>
            <span>Patient</span>
            <span>Contact</span>
            <span>Risk</span>
            <span>Joined</span>
            <span />
          </div>

          {filtered.map((p) => (
            <div key={p.id} className="border-b last:border-0" style={{ borderColor: "#EEF0F3" }}>
              {/* Row */}
              <div
                className="grid grid-cols-[1fr_1.5fr_80px_90px_40px] gap-4 px-5 py-3.5 items-center hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setExpanded(expanded === p.id ? null : p.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <PatientAvatar name={p.full_name ?? p.email} url={p.avatar_url} />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: "#1A2332" }}>{p.full_name ?? "—"}</div>
                    <div className="text-xs truncate" style={{ color: "#6B7280" }}>{p.gender ?? "—"} {p.age ? `· ${p.age}y` : ""}</div>
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-sm truncate" style={{ color: "#374151" }}>{p.email}</div>
                  <div className="text-xs truncate" style={{ color: "#9CA3AF" }}>{p.phone ?? "—"}</div>
                </div>
                <RiskBadge level={p.risk_level} />
                <span className="text-xs" style={{ color: "#9CA3AF" }}>
                  {new Date(p.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}
                </span>
                <div className="flex justify-center">
                  {expanded === p.id ? <ChevronUp size={16} color="#9CA3AF" /> : <ChevronDown size={16} color="#9CA3AF" />}
                </div>
              </div>

              {/* Expanded detail */}
              {expanded === p.id && (
                <div className="px-5 pb-5 pt-1" style={{ background: "#FAFBFC" }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <DetailSection title="Personal">
                      <DetailRow label="Date of Birth" value={p.dob ? new Date(p.dob).toLocaleDateString("en-IN") : "—"} />
                      <DetailRow label="Blood Group" value={p.blood_group ?? "—"} />
                      <DetailRow label="Height" value={p.height ? `${p.height} cm` : "—"} />
                      <DetailRow label="Weight" value={p.weight ? `${p.weight} kg` : "—"} />
                      <DetailRow label="Language" value={p.language_pref ?? "—"} />
                    </DetailSection>

                    <DetailSection title="Contact">
                      <DetailRow label="Email" value={p.email} />
                      <DetailRow label="Mobile" value={p.phone ?? "—"} />
                      <DetailRow label="Alternate" value={p.alternate_phone ?? "—"} />
                      <DetailRow label="Address" value={p.address ?? "—"} />
                    </DetailSection>

                    <DetailSection title="Emergency Contact">
                      <DetailRow label="Name" value={p.emergency_contact?.name ?? "—"} />
                      <DetailRow label="Phone" value={p.emergency_contact?.phone ?? "—"} />
                    </DetailSection>

                    <DetailSection title="Medical">
                      <DetailRow label="Risk Score" value={p.risk_score != null ? `${p.risk_score}/100` : "—"} />
                      <div>
                        <span className="text-xs font-medium" style={{ color: "#6B7280" }}>Conditions</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {p.conditions.length ? p.conditions.map((c) => <Tag key={c} label={c} color="#0D7A5F" bg="#E8F5F1" />) : <span className="text-xs" style={{ color: "#9CA3AF" }}>None</span>}
                        </div>
                      </div>
                    </DetailSection>

                    <DetailSection title="Allergies">
                      <div className="flex flex-wrap gap-1">
                        {p.allergies.length ? p.allergies.map((a) => <Tag key={a} label={a} color="#B45309" bg="#FFFBEB" />) : <span className="text-xs" style={{ color: "#9CA3AF" }}>None</span>}
                      </div>
                    </DetailSection>

                    <DetailSection title="Addictions">
                      <div className="flex flex-wrap gap-1">
                        {p.addictions.length ? p.addictions.map((a) => <Tag key={a} label={a} color="#B91C1C" bg="#FEF2F2" />) : <span className="text-xs" style={{ color: "#9CA3AF" }}>None</span>}
                      </div>
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

function PatientAvatar({ name, url }: { name: string; url: string | null }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  if (url) return <img src={url} alt={name} className="w-9 h-9 rounded-full object-cover shrink-0" />;
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
      style={{ background: "#E8F5F1", color: "#0D7A5F" }}>{initials}</div>
  );
}

function RiskBadge({ level }: { level: string | null }) {
  if (!level) return <span className="text-xs" style={{ color: "#9CA3AF" }}>—</span>;
  const map: Record<string, { bg: string; color: string }> = {
    HIGH:     { bg: "#FEF2F2", color: "#B91C1C" },
    MODERATE: { bg: "#FFFBEB", color: "#B45309" },
    STABLE:   { bg: "#F0FDF4", color: "#15803D" },
  };
  const s = map[level] ?? map.STABLE;
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block"
      style={{ background: s.bg, color: s.color }}>{level}</span>
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

function Tag({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: bg, color }}>{label}</span>
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
          <div className="h-5 w-16 skeleton rounded-full" />
          <div className="h-3 w-16 skeleton rounded" />
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
