import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import {
  QrCode, ShieldCheck, X, Copy, Eye, EyeOff,
  Clock, Loader2, ToggleLeft, ToggleRight, Download,
  User, HeartPulse, FileText, Pill, ChevronDown, ChevronUp,
  Upload, Trash2, ExternalLink,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_patient/share")({
  head: () => ({ meta: [{ title: "Share Records — MedSeva" }] }),
  component: SharePage,
});

interface QrShare {
  id: string;
  token: string;
  pin: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  last_accessed_at: string | null;
  access_count: number;
  share_vitals: boolean;
  share_reports: boolean;
  share_medications: boolean;
  share_profile: boolean;
  access_log: { accessed_at: string; ip_hint: string }[];
}

interface PatientDoc {
  name: string;
  path: string;
  url: string;
  size: number;
  created_at: string;
}

const DOC_CATEGORIES = [
  { id: "lab-reports",    label: "Lab Reports",         icon: FileText,   desc: "Blood tests, urine tests, pathology reports",   accept: ".pdf,.jpg,.jpeg,.png" },
  { id: "prescriptions",  label: "Prescriptions",        icon: Pill,       desc: "Doctor prescriptions & medication slips",       accept: ".pdf,.jpg,.jpeg,.png" },
  { id: "scans",          label: "Scans & Imaging",      icon: HeartPulse, desc: "X-rays, MRI, CT scans, ultrasound reports",     accept: ".pdf,.jpg,.jpeg,.png,.dcm" },
  { id: "insurance",      label: "Insurance & ID",       icon: User,       desc: "Health insurance cards, Aadhaar, ABHA ID",       accept: ".pdf,.jpg,.jpeg,.png" },
] as const;

type DocCategory = typeof DOC_CATEGORIES[number]["id"];

function SharePage() {
  const { profile } = useAuth();
  const [shares, setShares] = useState<QrShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [activeQr, setActiveQr] = useState<QrShare | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [showWhatInfo, setShowWhatInfo] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // Documents state
  const [docs, setDocs] = useState<Record<DocCategory, PatientDoc[]>>({
    "lab-reports": [], prescriptions: [], scans: [], insurance: [],
  });
  const [docsLoading, setDocsLoading] = useState(true);
  const [uploading, setUploading] = useState<DocCategory | null>(null);
  const fileRefs = useRef<Record<DocCategory, HTMLInputElement | null>>({
    "lab-reports": null, prescriptions: null, scans: null, insurance: null,
  });

  const displayName = profile?.full_name ?? "Patient";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  // Create form state
  const [shareVitals, setShareVitals] = useState(true);
  const [shareReports, setShareReports] = useState(true);
  const [shareMeds, setShareMeds] = useState(true);
  const [shareProfile, setShareProfile] = useState(true);
  const [expiresHours, setExpiresHours] = useState<number | null>(24);

  useEffect(() => { loadShares(); loadDocs(); }, []);

  const loadDocs = async () => {
    setDocsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setDocsLoading(false); return; }
    const result: Record<DocCategory, PatientDoc[]> = {
      "lab-reports": [], prescriptions: [], scans: [], insurance: [],
    };
    await Promise.all(
      DOC_CATEGORIES.map(async ({ id }) => {
        const { data } = await supabase.storage
          .from("patient-documents")
          .list(`${user.id}/${id}`, { sortBy: { column: "created_at", order: "desc" } });
        if (!data) return;
        result[id] = data
          .filter((f) => f.name !== ".emptyFolderPlaceholder")
          .map((f) => {
            const path = `${user.id}/${id}/${f.name}`;
            const { data: { publicUrl } } = supabase.storage.from("patient-documents").getPublicUrl(path);
            return {
              name: f.name,
              path,
              url: publicUrl,
              size: f.metadata?.size ?? 0,
              created_at: f.created_at ?? "",
            };
          });
      })
    );
    setDocs(result);
    setDocsLoading(false);
  };

  const handleUpload = async (category: DocCategory, file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUploading(category);
    const ext = file.name.split(".").pop();
    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const path = `${user.id}/${category}/${safeName}`;
    const { error } = await supabase.storage.from("patient-documents").upload(path, file);
    if (error) { toast.error("Upload failed: " + error.message); setUploading(null); return; }
    toast.success("Document uploaded!");
    setUploading(null);
    await loadDocs();
  };

  const handleDelete = async (path: string, category: DocCategory) => {
    const { error } = await supabase.storage.from("patient-documents").remove([path]);
    if (error) { toast.error("Delete failed"); return; }
    toast.success("Document removed");
    setDocs((prev) => ({ ...prev, [category]: prev[category].filter((d) => d.path !== path) }));
  };

  const loadShares = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("qr_shares" as never)
      .select("*")
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false }) as { data: QrShare[] | null };
    setShares(data ?? []);
    setLoading(false);
  };

  const createShare = async () => {
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Not signed in"); return; }

      const res = await fetch("/api/qr-share/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          share_vitals: shareVitals,
          share_reports: shareReports,
          share_medications: shareMeds,
          share_profile: shareProfile,
          expires_hours: expiresHours,
        }),
      });
      const json = await res.json();
      if (!json.success) { toast.error(json.error ?? "Failed to create"); return; }

      toast.success("QR share created!");
      setShowCreate(false);
      await loadShares();
      // Auto-open the new QR
      setActiveQr(json.share as QrShare);
      setShowPin(true);
    } catch (e) {
      toast.error(String(e));
    } finally {
      setCreating(false);
    }
  };

  const revokeShare = async (shareId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch("/api/qr-share/revoke", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ share_id: shareId }),
    });
    const json = await res.json();
    if (json.success) {
      toast.success("Access revoked");
      setShares((prev) => prev.map((s) => s.id === shareId ? { ...s, is_active: false } : s));
      if (activeQr?.id === shareId) setActiveQr((prev) => prev ? { ...prev, is_active: false } : null);
    } else {
      toast.error(json.error ?? "Failed to revoke");
    }
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied!");
  };

  const downloadQr = () => {
    const canvas = qrRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "medseva-qr.png";
    a.click();
  };

  const shareUrl = (token: string) => `${window.location.origin}/share/${token}`;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 page-enter max-w-4xl mx-auto min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: "#1A2332" }}>QR Document Sharing</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
            Share your health records securely with doctors using a QR code + 4-digit PIN.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="h-10 px-4 rounded-lg text-white font-semibold text-sm inline-flex items-center gap-2"
          style={{ background: "#0D7A5F" }}
        >
          <QrCode size={16} /> Generate QR
        </button>
      </div>

      {/* What's shared info panel */}
      <div className="card-base mb-6 overflow-hidden">
        <button
          onClick={() => setShowWhatInfo(!showWhatInfo)}
          className="w-full flex items-center justify-between px-5 py-4"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck size={15} color="#0D7A5F" />
            <span className="text-sm font-semibold" style={{ color: "#1A2332" }}>What does each section share?</span>
          </div>
          {showWhatInfo ? <ChevronUp size={16} color="#6B7280" /> : <ChevronDown size={16} color="#6B7280" />}
        </button>
        {showWhatInfo && (
          <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t" style={{ borderColor: "#EEF0F3" }}>
            {[
              {
                icon: User, label: "Personal Profile",
                items: ["Full name, age, gender", "Blood group, height, weight", "Phone & email", "Emergency contact"],
              },
              {
                icon: HeartPulse, label: "Vitals",
                items: ["Blood pressure readings", "Heart rate & SpO₂", "Blood sugar levels", "Temperature & weight logs"],
              },
              {
                icon: FileText, label: "Health Reports",
                items: ["Uploaded lab reports", "AI-generated summaries", "Flagged abnormal values", "Report dates & status"],
              },
              {
                icon: Pill, label: "Medications",
                items: ["Active medication names", "Dosage & frequency", "Medication schedule", "Adherence streak"],
              },
            ].map(({ icon: Icon, label, items }) => (
              <div key={label} className="p-4 rounded-xl" style={{ background: "#F7F8FA" }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#E8F5F1" }}>
                    <Icon size={14} color="#0D7A5F" />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: "#1A2332" }}>{label}</span>
                </div>
                <ul className="space-y-1">
                  {items.map((item) => (
                    <li key={item} className="text-xs flex items-center gap-1.5" style={{ color: "#6B7280" }}>
                      <span className="w-1 h-1 rounded-full shrink-0" style={{ background: "#0D7A5F" }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="card-base p-5 mb-6" style={{ background: "linear-gradient(135deg,#E8F5F1,#F0FDF9)" }}>
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={16} color="#0D7A5F" />
          <span className="text-sm font-semibold" style={{ color: "#0D7A5F" }}>How end-to-end security works</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { n: "1", t: "QR holds the link", d: "The QR code contains the secure URL with your unique token." },
            { n: "2", t: "PIN locks access", d: "Doctor must enter the 4-digit PIN you share verbally — two-factor protection." },
            { n: "3", t: "Revoke anytime", d: "Tap Revoke to instantly cut off access, even mid-session." },
          ].map(({ n, t, d }) => (
            <div key={n} className="flex gap-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5" style={{ background: "#0D7A5F" }}>{n}</span>
              <div>
                <div className="text-sm font-semibold" style={{ color: "#1A2332" }}>{t}</div>
                <div className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── My Health Documents ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold" style={{ color: "#1A2332" }}>My Health Documents</h2>
          <span className="text-xs" style={{ color: "#9CA3AF" }}>Upload files to include in QR shares</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DOC_CATEGORIES.map(({ id, label, icon: Icon, desc, accept }) => (
            <div key={id} className="card-base p-4">
              {/* Category header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#E8F5F1" }}>
                    <Icon size={15} color="#0D7A5F" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "#1A2332" }}>{label}</div>
                    <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{desc}</div>
                  </div>
                </div>
                <button
                  onClick={() => fileRefs.current[id]?.click()}
                  disabled={uploading === id}
                  className="h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                  style={{ background: "#E8F5F1", color: "#0D7A5F" }}
                >
                  {uploading === id
                    ? <Loader2 size={12} className="animate-spin" />
                    : <Upload size={12} />}
                  Upload
                </button>
                <input
                  type="file"
                  accept={accept}
                  className="hidden"
                  ref={(el) => { fileRefs.current[id] = el; }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(id, f); e.target.value = ""; }}
                />
              </div>

              {/* Files list */}
              {docsLoading ? (
                <div className="flex justify-center py-3"><Loader2 size={16} color="#D1D5DB" className="animate-spin" /></div>
              ) : docs[id].length === 0 ? (
                <div className="flex flex-col items-center py-4 rounded-xl border-2 border-dashed" style={{ borderColor: "#E8ECF0" }}>
                  <Upload size={18} color="#D1D5DB" className="mb-1" />
                  <span className="text-xs" style={{ color: "#9CA3AF" }}>No files yet</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {docs[id].map((doc) => (
                    <div key={doc.path} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "#F7F8FA" }}>
                      <FileText size={13} color="#0D7A5F" className="shrink-0" />
                      <span className="flex-1 text-xs truncate" style={{ color: "#374151" }}>{doc.name.replace(/^\d+-/, "")}</span>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                        <ExternalLink size={13} color="#9CA3AF" />
                      </a>
                      <button onClick={() => handleDelete(doc.path, id)} className="shrink-0">
                        <Trash2 size={13} color="#EF4444" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Shares list */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} color="#0D7A5F" className="animate-spin" /></div>
      ) : shares.length === 0 ? (
        <div className="card-base p-12 text-center">
          <QrCode size={40} color="#D1D5DB" className="mx-auto mb-3" />
          <p className="text-sm font-medium" style={{ color: "#374151" }}>No QR shares yet</p>
          <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Generate one to share your records with a doctor.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shares.map((s) => (
            <div key={s.id} className="card-base p-4 flex items-center gap-4">
              {/* QR thumbnail */}
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 cursor-pointer"
                style={{ background: s.is_active ? "#E8F5F1" : "#F3F4F6" }}
                onClick={() => { if (s.is_active) { setActiveQr(s); setShowPin(false); } }}
              >
                {s.is_active
                  ? <QrCode size={28} color="#0D7A5F" />
                  : <X size={22} color="#9CA3AF" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold" style={{ color: "#1A2332" }}>
                    Share #{s.id.slice(0, 8)}
                  </span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: s.is_active ? "#E8F5F1" : "#F3F4F6",
                      color: s.is_active ? "#0D7A5F" : "#9CA3AF",
                    }}
                  >
                    {s.is_active ? "ACTIVE" : "REVOKED"}
                  </span>
                </div>
                <div className="text-xs mt-1 flex flex-wrap gap-x-3 gap-y-0.5" style={{ color: "#6B7280" }}>
                  <span>Created {new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  {s.expires_at && (
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      Expires {new Date(s.expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  )}
                  <span>{s.access_count} access{s.access_count !== 1 ? "es" : ""}</span>
                </div>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {s.share_profile && <Chip label="Profile" />}
                  {s.share_vitals && <Chip label="Vitals" />}
                  {s.share_reports && <Chip label="Reports" />}
                  {s.share_medications && <Chip label="Medications" />}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {s.is_active && (
                  <>
                    <button
                      onClick={() => { setActiveQr(s); setShowPin(false); }}
                      className="h-8 px-3 rounded-lg border text-xs font-semibold"
                      style={{ borderColor: "#0D7A5F", color: "#0D7A5F" }}
                    >
                      View QR
                    </button>
                    <button
                      onClick={() => revokeShare(s.id)}
                      className="h-8 px-3 rounded-lg border text-xs font-semibold"
                      style={{ borderColor: "#EF4444", color: "#EF4444" }}
                    >
                      Revoke
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create Modal ── */}
      {showCreate && (
        <Modal onClose={() => setShowCreate(false)} title="Generate New QR Share">
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "#6B7280" }}>Choose what data to share with the doctor:</p>

            <div className="space-y-2">
              {[
                { label: "Personal Profile", desc: "Name, age, blood group, contact", icon: User, val: shareProfile, set: setShareProfile },
                { label: "Vitals & Lab Values", desc: "BP, heart rate, blood sugar, SpO₂", icon: HeartPulse, val: shareVitals, set: setShareVitals },
                { label: "Health Reports & AI Analysis", desc: "Lab reports, summaries, flagged values", icon: FileText, val: shareReports, set: setShareReports },
                { label: "Medication History", desc: "Active meds, dosage, schedule", icon: Pill, val: shareMeds, set: setShareMeds },
              ].map(({ label, desc, icon: Icon, val, set }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => set(!val)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left"
                  style={{ borderColor: val ? "#0D7A5F" : "#E8ECF0", background: val ? "#E8F5F1" : "#fff" }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: val ? "#fff" : "#F3F4F6" }}>
                    <Icon size={15} color={val ? "#0D7A5F" : "#9CA3AF"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium" style={{ color: "#374151" }}>{label}</div>
                    <div className="text-xs" style={{ color: "#9CA3AF" }}>{desc}</div>
                  </div>
                  {val ? <ToggleRight size={22} color="#0D7A5F" /> : <ToggleLeft size={22} color="#9CA3AF" />}
                </button>
              ))}
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "#374151" }}>Link Expiry</label>
              <select
                value={expiresHours ?? ""}
                onChange={(e) => setExpiresHours(e.target.value ? Number(e.target.value) : null)}
                className="w-full h-11 px-3 rounded-xl border bg-white text-sm outline-none"
                style={{ borderColor: "#D1D5DB" }}
              >
                <option value="1">1 hour</option>
                <option value="6">6 hours</option>
                <option value="24">24 hours</option>
                <option value="72">3 days</option>
                <option value="">Never expires</option>
              </select>
            </div>

            <button
              onClick={createShare}
              disabled={creating}
              className="w-full h-11 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: "#0D7A5F" }}
            >
              {creating && <Loader2 size={15} className="animate-spin" />}
              {creating ? "Generating…" : "Generate QR & PIN"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── QR Viewer Modal ── */}
      {activeQr && (
        <Modal onClose={() => setActiveQr(null)} title="Your Secure QR Code">
          <div className="flex flex-col items-center gap-5">
            {/* Patient identity strip */}
            <div className="w-full flex items-center gap-3 p-3 rounded-xl" style={{ background: "#F7F8FA" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: "#E8F5F1", color: "#0D7A5F" }}>
                {initials}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: "#1A2332" }}>{displayName}</div>
                <div className="text-xs" style={{ color: "#6B7280" }}>Sharing: {[
                  activeQr.share_profile && "Profile",
                  activeQr.share_vitals && "Vitals",
                  activeQr.share_reports && "Reports",
                  activeQr.share_medications && "Medications",
                ].filter(Boolean).join(" · ") || "Nothing"}</div>
              </div>
            </div>
            {/* QR Code */}
            <div
              ref={qrRef}
              className="rounded-2xl border-2 flex items-center justify-center"
              style={{ borderColor: activeQr.is_active ? "#0D7A5F" : "#E8ECF0", background: "#fff", padding: 16 }}
            >
              {/* Visible SVG QR */}
              <QRCodeSVG
                value={shareUrl(activeQr.token)}
                size={220}
                level="H"
                marginSize={2}
                fgColor={activeQr.is_active ? "#1A2332" : "#9CA3AF"}
                bgColor="#ffffff"
              />
              {/* Hidden canvas for PNG download */}
              <QRCodeCanvas
                value={shareUrl(activeQr.token)}
                size={512}
                level="H"
                marginSize={4}
                fgColor="#1A2332"
                bgColor="#ffffff"
                style={{ display: "none" }}
              />
            </div>

            {!activeQr.is_active && (
              <div className="text-sm font-semibold px-4 py-2 rounded-lg" style={{ background: "#FEF2F2", color: "#B91C1C" }}>
                This QR has been revoked
              </div>
            )}

            {/* PIN section */}
            {activeQr.is_active && (
              <div className="w-full p-4 rounded-xl border-2 border-dashed" style={{ borderColor: "#0D7A5F", background: "#E8F5F1" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#0D7A5F" }}>
                    4-Digit PIN — Tell this to the doctor verbally
                  </span>
                  <button onClick={() => setShowPin(!showPin)}>
                    {showPin ? <EyeOff size={16} color="#0D7A5F" /> : <Eye size={16} color="#0D7A5F" />}
                  </button>
                </div>
                <div className="flex gap-3 justify-center mt-2">
                  {(showPin ? activeQr.pin : "••••").split("").map((ch, i) => (
                    <div
                      key={i}
                      className="w-12 h-14 rounded-xl flex items-center justify-center text-2xl font-bold"
                      style={{ background: "#fff", color: "#0D7A5F", border: "2px solid #0D7A5F" }}
                    >
                      {ch}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-center mt-3" style={{ color: "#6B7280" }}>
                  The doctor scans the QR, then enters this PIN to unlock your records.
                </p>
              </div>
            )}

            {/* Actions */}
            {activeQr.is_active && (
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => copyLink(activeQr.token)}
                  className="flex-1 h-10 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ borderColor: "#0D7A5F", color: "#0D7A5F" }}
                >
                  <Copy size={14} /> Copy Link
                </button>
                <button
                  onClick={downloadQr}
                  className="flex-1 h-10 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ borderColor: "#0D7A5F", color: "#0D7A5F" }}
                >
                  <Download size={14} /> Download QR
                </button>
                <button
                  onClick={() => revokeShare(activeQr.id)}
                  className="flex-1 h-10 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ borderColor: "#EF4444", color: "#EF4444" }}
                >
                  <X size={14} /> Revoke
                </button>
              </div>
            )}

            {/* Access log */}
            {activeQr.access_log?.length > 0 && (
              <div className="w-full">
                <p className="text-xs font-semibold mb-2" style={{ color: "#374151" }}>
                  Access Log ({activeQr.access_count} total)
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {[...activeQr.access_log].reverse().slice(0, 10).map((entry, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs" style={{ background: "#F7F8FA" }}>
                      <span style={{ color: "#374151" }}>
                        {new Date(entry.accessed_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span style={{ color: "#9CA3AF" }}>{entry.ip_hint}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-8" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#E8ECF0" }}>
          <h2 className="text-base font-semibold" style={{ color: "#1A2332" }}>{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={16} color="#6B7280" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#E8F5F1", color: "#0D7A5F" }}>
      {label}
    </span>
  );
}
