import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShieldCheck, Loader2, User, HeartPulse, Pill,
  FileText, AlertTriangle, X, Eye, EyeOff, Lock,
} from "lucide-react";
import { MedSevaLogo } from "@/components/MedSevaLogo";

export const Route = createFileRoute("/share/$token")({
  head: () => ({ meta: [{ title: "Secure Patient Records — MedSeva" }] }),
  component: ShareViewPage,
});

interface PatientData {
  profile: {
    full_name: string | null;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  } | null;
  patient: {
    age: number | null;
    dob: string | null;
    gender: string | null;
    blood_group: string | null;
    height: number | null;
    weight: number | null;
    conditions: string[];
    allergies: string[];
    risk_level: string;
    risk_score: number | null;
    emergency_contact: { name?: string; phone?: string } | null;
  } | null;
  vitals: { type: string; value: number; unit: string; notes: string | null; recorded_at: string }[];
  reports: { id: string; name: string; report_date: string; status: string; ai_summary: string | null; lab_values: LabValue[] | null; file_url: string | null }[];
  medications: { name: string; dose: string; frequency: string; times: string[] | null; unit: string | null; quantity: number | null; streak: number }[];
}

interface LabValue { parameter: string; value: string; range: string; status: "high" | "borderline" | "normal" }

function ShareViewPage() {
  const { token } = Route.useParams();
  const [pin, setPin] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PatientData | null>(null);
  const [showPinText, setShowPinText] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "vitals" | "reports" | "medications">("profile");
  const inputRefs = [
    useState<HTMLInputElement | null>(null),
    useState<HTMLInputElement | null>(null),
    useState<HTMLInputElement | null>(null),
    useState<HTMLInputElement | null>(null),
  ];

  const handlePinChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...pin];
    next[idx] = val;
    setPin(next);
    if (val && idx < 3) {
      (document.getElementById(`pin-${idx + 1}`) as HTMLInputElement)?.focus();
    }
  };

  const handlePinKey = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[idx] && idx > 0) {
      (document.getElementById(`pin-${idx - 1}`) as HTMLInputElement)?.focus();
    }
  };

  const submit = async () => {
    const pinStr = pin.join("");
    if (pinStr.length !== 4) { setError("Enter all 4 digits"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/qr-share/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, pin: pinStr }),
      });
      const json = await res.json();
      if (!json.success) { setError(json.error ?? "Access denied"); setLoading(false); return; }
      setData(json.data as PatientData);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  // ── PIN Entry Screen ──
  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#F7F8FA" }}>
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8">
            <MedSevaLogo size="lg" />
          </div>
          <div className="card-base p-8">
            <div className="flex flex-col items-center mb-6">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: "#E8F5F1" }}>
                <Lock size={24} color="#0D7A5F" />
              </div>
              <h1 className="text-lg font-bold text-center" style={{ color: "#1A2332" }}>Secure Patient Records</h1>
              <p className="text-sm text-center mt-1" style={{ color: "#6B7280" }}>
                Enter the 4-digit PIN provided by the patient to access their records.
              </p>
            </div>

            {/* PIN inputs */}
            <div className="flex gap-3 justify-center mb-5">
              {pin.map((digit, i) => (
                <input
                  key={i}
                  id={`pin-${i}`}
                  type={showPinText ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(i, e.target.value)}
                  onKeyDown={(e) => handlePinKey(i, e)}
                  className="w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all"
                  style={{
                    borderColor: digit ? "#0D7A5F" : "#D1D5DB",
                    color: "#1A2332",
                    background: digit ? "#E8F5F1" : "#fff",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#0D7A5F"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13,122,95,0.15)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = digit ? "#0D7A5F" : "#D1D5DB"; e.currentTarget.style.boxShadow = "none"; }}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowPinText(!showPinText)}
              className="flex items-center gap-1.5 mx-auto text-xs mb-4"
              style={{ color: "#9CA3AF" }}
            >
              {showPinText ? <EyeOff size={13} /> : <Eye size={13} />}
              {showPinText ? "Hide PIN" : "Show PIN"}
            </button>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl mb-4" style={{ background: "#FEF2F2" }}>
                <AlertTriangle size={14} color="#B91C1C" />
                <span className="text-sm" style={{ color: "#B91C1C" }}>{error}</span>
              </div>
            )}

            <button
              onClick={submit}
              disabled={loading || pin.join("").length !== 4}
              className="w-full h-11 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: "#0D7A5F" }}
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? "Verifying…" : "Access Records"}
            </button>
          </div>

          <p className="text-center text-xs mt-4" style={{ color: "#9CA3AF" }}>
            <ShieldCheck size={11} className="inline mr-1" />
            End-to-end secured by MedSeva. Access is logged and can be revoked by the patient at any time.
          </p>
        </div>
      </div>
    );
  }

  // ── Patient Data View ──
  const p = data.profile;
  const pt = data.patient;
  const name = p?.full_name ?? "Patient";
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const TABS = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "vitals" as const, label: "Vitals", icon: HeartPulse },
    { id: "reports" as const, label: "Reports", icon: FileText },
    { id: "medications" as const, label: "Medications", icon: Pill },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#F7F8FA" }}>
      {/* Top bar */}
      <header className="bg-white border-b px-6 h-14 flex items-center justify-between sticky top-0 z-20" style={{ borderColor: "#EEF0F3" }}>
        <MedSevaLogo />
        <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: "#E8F5F1", color: "#0D7A5F" }}>
          <ShieldCheck size={13} />
          Secure Session
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Patient header card */}
        <div className="card-base p-5 mb-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0" style={{ background: "#E8F5F1", color: "#0D7A5F" }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold" style={{ color: "#1A2332" }}>{name}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5 text-xs" style={{ color: "#6B7280" }}>
              {pt?.age && <span>{pt.age} yrs</span>}
              {pt?.gender && <span>{pt.gender}</span>}
              {pt?.blood_group && <span>Blood: {pt.blood_group}</span>}
              {p?.phone && <span>{p.phone}</span>}
            </div>
            {pt?.risk_level && (
              <span
                className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: pt.risk_level === "HIGH" ? "#FEF2F2" : pt.risk_level === "MODERATE" ? "#FFFBEB" : "#F0FDF4",
                  color: pt.risk_level === "HIGH" ? "#B91C1C" : pt.risk_level === "MODERATE" ? "#B45309" : "#15803D",
                }}
              >
                {pt.risk_level} RISK
              </span>
            )}
          </div>
          <div className="text-right text-xs shrink-0" style={{ color: "#9CA3AF" }}>
            <div>Risk Score</div>
            <div className="text-2xl font-bold" style={{ color: "#1A2332" }}>{pt?.risk_score ?? "—"}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-5 bg-white border" style={{ borderColor: "#EEF0F3" }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: activeTab === id ? "#E8F5F1" : "transparent",
                color: activeTab === id ? "#0D7A5F" : "#6B7280",
              }}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {activeTab === "profile" && pt && (
          <div className="space-y-4">
            <Section title="Personal Details">
              <Grid>
                <KV label="Full Name" value={p?.full_name} />
                <KV label="Date of Birth" value={pt.dob ? new Date(pt.dob).toLocaleDateString("en-IN") : null} />
                <KV label="Gender" value={pt.gender} />
                <KV label="Blood Group" value={pt.blood_group} />
                <KV label="Height" value={pt.height ? `${pt.height} cm` : null} />
                <KV label="Weight" value={pt.weight ? `${pt.weight} kg` : null} />
                <KV label="Phone" value={p?.phone} />
                <KV label="Email" value={p?.email} />
              </Grid>
            </Section>

            {pt.conditions?.length > 0 && (
              <Section title="Chronic Conditions">
                <div className="flex flex-wrap gap-2">
                  {pt.conditions.map((c) => <Tag key={c} label={c} color="#0D7A5F" bg="#E8F5F1" />)}
                </div>
              </Section>
            )}

            {pt.allergies?.length > 0 && (
              <Section title="Allergies">
                <div className="flex flex-wrap gap-2">
                  {pt.allergies.map((a) => <Tag key={a} label={a} color="#B91C1C" bg="#FEF2F2" />)}
                </div>
              </Section>
            )}

            {pt.emergency_contact && (
              <Section title="Emergency Contact">
                <Grid>
                  <KV label="Name" value={pt.emergency_contact.name} />
                  <KV label="Phone" value={pt.emergency_contact.phone} />
                </Grid>
              </Section>
            )}
          </div>
        )}

        {/* Vitals tab */}
        {activeTab === "vitals" && (
          <div className="card-base overflow-hidden">
            {data.vitals.length === 0 ? (
              <Empty label="No vitals recorded" />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#F7F8FA", borderBottom: "1px solid #EEF0F3" }}>
                    {["Type", "Value", "Unit", "Recorded"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.vitals.map((v, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <td className="px-4 py-3 font-medium capitalize" style={{ color: "#374151" }}>{v.type.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 font-bold" style={{ color: "#1A2332" }}>{v.value}</td>
                      <td className="px-4 py-3" style={{ color: "#6B7280" }}>{v.unit}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#9CA3AF" }}>
                        {new Date(v.recorded_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Reports tab */}
        {activeTab === "reports" && (
          <div className="space-y-3">
            {data.reports.length === 0 ? (
              <div className="card-base p-8"><Empty label="No reports available" /></div>
            ) : data.reports.map((r) => (
              <div key={r.id} className="card-base p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "#1A2332" }}>{r.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                      {new Date(r.report_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: r.status === "Flagged" ? "#FEF2F2" : r.status === "Analyzed" ? "#F0FDF4" : "#FFFBEB",
                        color: r.status === "Flagged" ? "#B91C1C" : r.status === "Analyzed" ? "#15803D" : "#B45309",
                      }}
                    >
                      {r.status}
                    </span>
                    {r.file_url && (
                      <a href={r.file_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-medium" style={{ color: "#0D7A5F" }}>
                        View File
                      </a>
                    )}
                  </div>
                </div>

                {r.ai_summary && (
                  <p className="text-xs leading-relaxed p-3 rounded-lg mb-3" style={{ background: "#F7F8FA", color: "#374151" }}>
                    {r.ai_summary}
                  </p>
                )}

                {r.lab_values && r.lab_values.length > 0 && (
                  <div className="space-y-1.5">
                    {r.lab_values.filter((l) => l.status !== "normal").map((l) => (
                      <div key={l.parameter} className="flex items-center justify-between px-3 py-2 rounded-lg"
                        style={{ background: l.status === "high" ? "#FEF2F2" : "#FFFBEB" }}>
                        <span className="text-xs font-medium" style={{ color: "#374151" }}>{l.parameter}</span>
                        <span className="text-xs font-bold" style={{ color: l.status === "high" ? "#B91C1C" : "#B45309" }}>
                          {l.value} <span className="font-normal" style={{ color: "#9CA3AF" }}>({l.range})</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Medications tab */}
        {activeTab === "medications" && (
          <div className="space-y-2">
            {data.medications.length === 0 ? (
              <div className="card-base p-8"><Empty label="No active medications" /></div>
            ) : data.medications.map((m, i) => (
              <div key={i} className="card-base p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#E8F5F1" }}>
                  <Pill size={16} color="#0D7A5F" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold" style={{ color: "#1A2332" }}>
                    {m.name} <span style={{ color: "#6B7280", fontWeight: 400 }}>({m.quantity ?? 1} {m.unit ?? "tablet"})</span>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                    {m.dose} · {m.frequency}
                    {m.times?.length ? ` · ${m.times.join(", ")}` : ""}
                  </div>
                </div>
                {m.streak > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#E8F5F1", color: "#0D7A5F" }}>
                    🔥 {m.streak}d streak
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs mt-8" style={{ color: "#9CA3AF" }}>
          <ShieldCheck size={11} className="inline mr-1" />
          This session is monitored. The patient can revoke access at any time.
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-base p-5 space-y-3">
      <h3 className="text-sm font-semibold" style={{ color: "#1A2332" }}>{title}</h3>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{children}</div>;
}

function KV({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#9CA3AF" }}>{label}</div>
      <div className="text-sm font-medium" style={{ color: value ? "#1A2332" : "#D1D5DB" }}>{value ?? "—"}</div>
    </div>
  );
}

function Tag({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: bg, color }}>{label}</span>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="text-sm text-center py-8" style={{ color: "#9CA3AF" }}>{label}</p>;
}
