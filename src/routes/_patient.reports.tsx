import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, UploadCloud, X, Sparkles, ExternalLink, Loader2, AlertTriangle, ClipboardList, ShieldCheck, TriangleAlert, Vault, HeartPulse, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DrugSafetyContent } from "./_patient.drug-safety";

export const Route = createFileRoute("/_patient/reports")({
  head: () => ({ meta: [{ title: "Health Reports — MedSeva" }] }),
  component: ReportsPage,
});

type LabValue = { parameter: string; value: string; range: string; status: "high" | "borderline" | "normal" };
type Report = {
  id: string;
  name: string;
  report_date: string;
  status: "Analyzing" | "Analyzed" | "Flagged";
  file_url: string | null;
  ai_summary: string | null;
  lab_values: LabValue[] | null;
};

type Stage = "idle" | "uploading" | "converting" | "analyzing" | "saving";
const STAGE_LABEL: Record<Stage, string> = {
  idle: "",
  uploading: "Uploading…",
  converting: "Reading document…",
  analyzing: "AI analyzing…",
  saving: "Saving results…",
};

/* ── Convert file → base64 JPEG for Groq Vision ── */
async function fileToBase64Image(file: File): Promise<{ base64: string; mimeType: string }> {
  // For images: read directly
  if (file.type.startsWith("image/")) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1];
        resolve({ base64, mimeType: "image/jpeg" });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // For PDFs: render first page to canvas using pdf.js
  if (file.type === "application/pdf") {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Dynamic import to avoid SSR issues
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 2.0 }); // scale 2x for better OCR quality
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;

    await page.render({ canvasContext: ctx, viewport }).promise;

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const base64 = dataUrl.split(",")[1];
    return { base64, mimeType: "image/jpeg" };
  }

  throw new Error("Unsupported file type");
}

function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [open, setOpen] = useState<Report | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("reports");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadReports(); }, []);

  const loadReports = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("health_reports")
      .select("id, name, report_date, status, file_url, ai_summary, lab_values")
      .eq("patient_id", user.id)
      .order("report_date", { ascending: false });
    setReports((data ?? []) as Report[]);
    setLoading(false);
  };

  const handleFile = async (file: File) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(file.type)) { toast.error("Only PDF, JPG or PNG"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Max 10MB"); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Not signed in"); return; }

    try {
      // ── 1. Upload to Supabase Storage + convert to image (parallel) ──
      setStage("uploading");
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/${Date.now()}_${safeName}`;

      const [uploadResult, imageResult] = await Promise.allSettled([
        supabase.storage.from("medical-reports").upload(path, file, { contentType: file.type }),
        fileToBase64Image(file),
      ]);

      if (uploadResult.status === "rejected") throw new Error(`Upload failed: ${uploadResult.reason}`);
      if (imageResult.status === "rejected") throw new Error(`Image conversion failed: ${imageResult.reason}`);

      const { base64, mimeType } = imageResult.value;
      const { data: { publicUrl } } = supabase.storage.from("medical-reports").getPublicUrl(path);

      // Insert placeholder row
      const ext = file.name.split(".").pop();
      const displayName = file.name.replace(`.${ext}`, "").replace(/[_-]/g, " ");
      const { data: row, error: insertErr } = await supabase
        .from("health_reports")
        .insert({
          patient_id: user.id,
          name: displayName,
          file_url: publicUrl,
          status: "Analyzing",
          report_date: new Date().toISOString().split("T")[0],
        })
        .select("id, name, report_date, status, file_url, ai_summary, lab_values")
        .single();
      if (insertErr) throw new Error(`DB error: ${insertErr.message}`);
      const reportRow = row as Report;
      setReports((p) => [reportRow, ...p]);

      // ── 2. Send image to Groq Vision for analysis ──
      setStage("analyzing");
      const { data: profile } = await supabase
        .from("profiles").select("full_name").eq("id", user.id).single();
      const patientName = profile?.full_name ?? "Patient";

      const aiRes = await fetch("/api/analyze-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType, patientName, reportId: reportRow.id }),
      });

      if (!aiRes.ok) {
        const errBody = await aiRes.json().catch(() => ({}));
        throw new Error(`Analysis failed: ${errBody.error ?? errBody.detail ?? aiRes.statusText}`);
      }

      const aiJson = await aiRes.json();
      if (!aiJson.success || !aiJson.analysis) throw new Error("No analysis returned");
      const { analysis } = aiJson;

      // ── 3. Update UI immediately ──
      const reportStatus: "Analyzed" | "Flagged" = analysis.risk_level === "HIGH" ? "Flagged" : "Analyzed";

      setReports((p) => p.map((r) => r.id === reportRow.id ? {
        ...reportRow,
        status: reportStatus,
        ai_summary: analysis.summary,
        lab_values: analysis.lab_values ?? [],
      } : r));

      const flaggedCount = (analysis.flagged_items ?? []).length;
      toast.success(flaggedCount > 0
        ? `Analysis done — ${flaggedCount} item${flaggedCount > 1 ? "s" : ""} flagged`
        : "Report analyzed ✓");
      setStage("idle");

      // ── 4. Save to DB in background — exact dashboard parameters ──
      const today = new Date().toISOString();
      const vitalInserts: object[] = [];

      // Blood Sugar → vitals table (shown on dashboard Blood Sugar card)
      if (analysis.blood_sugar_value) {
        vitalInserts.push({
          patient_id: user.id,
          type: "blood_sugar",
          value: analysis.blood_sugar_value,
          unit: "mg/dL",
          recorded_at: today,
        });
      }

      // Blood Pressure → vitals table (shown on dashboard BP card)
      if (analysis.blood_pressure_systolic) {
        vitalInserts.push({
          patient_id: user.id,
          type: "blood_pressure",
          value: analysis.blood_pressure_systolic,
          unit: "mmHg",
          notes: `Diastolic: ${analysis.blood_pressure_diastolic ?? "N/A"}`,
          recorded_at: today,
        });
      }

      // Fire and forget all DB saves
      Promise.all([
        // Update health_reports with AI summary + lab values
        supabase.from("health_reports").update({
          status: reportStatus,
          ai_summary: analysis.summary,
          lab_values: analysis.lab_values ?? [],
        }).eq("id", reportRow.id),

        // Insert vitals (feeds Blood Sugar + BP cards on dashboard)
        vitalInserts.length > 0 ? supabase.from("vitals").insert(vitalInserts) : Promise.resolve(),

        // Update risk score + level (feeds Risk Score card + badge on dashboard)
        analysis.risk_level
          ? supabase.from("patient_profiles").update({
              risk_level: analysis.risk_level,
              risk_score: analysis.risk_score ?? 50,
            }).eq("id", user.id)
          : Promise.resolve(),
      ]).catch((err) => console.warn("Background DB save error:", err));
    } catch (err) {
      toast.error(String(err));
      setStage("idle");
    }
  };

  const busy = stage !== "idle";

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: "#1A2332" }}>Care Hub</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Reports, health vault, recovery plan, and drug safety in one place.</p>
        </div>
        <button onClick={() => fileInputRef.current?.click()} disabled={busy}
          className="h-10 px-4 rounded-lg text-white font-semibold text-sm inline-flex items-center gap-2 disabled:opacity-60"
          style={{ background: "#0D7A5F" }}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
          {busy ? STAGE_LABEL[stage] : "Upload Report"}
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-white border border-[#EEF0F3] p-1 rounded-xl h-auto flex-wrap justify-start gap-1">
          <TabsTrigger value="reports" className="rounded-lg data-[state=active]:bg-[#E8F5F1] data-[state=active]:text-[#0D7A5F]">
            <FileText size={14} className="mr-2" /> Reports
          </TabsTrigger>
          <TabsTrigger value="vault" className="rounded-lg data-[state=active]:bg-[#E8F5F1] data-[state=active]:text-[#0D7A5F]">
            <Vault size={14} className="mr-2" /> Health Vault
          </TabsTrigger>
          <TabsTrigger value="drug" className="rounded-lg data-[state=active]:bg-[#E8F5F1] data-[state=active]:text-[#0D7A5F]">
            <Shield size={14} className="mr-2" /> Drug Safety
          </TabsTrigger>
          <TabsTrigger value="recovery" className="rounded-lg data-[state=active]:bg-[#E8F5F1] data-[state=active]:text-[#0D7A5F]">
            <HeartPulse size={14} className="mr-2" /> Recovery Plan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports">
          <div
            onClick={() => !busy && fileInputRef.current?.click()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f && !busy) handleFile(f); }}
            onDragOver={(e) => e.preventDefault()}
            className="rounded-xl border-2 border-dashed py-10 text-center cursor-pointer transition-colors hover:bg-[#F0FDF9] hover:border-[#0D7A5F] mb-6"
            style={{ borderColor: busy ? "#0D7A5F" : "#D1D5DB", background: "#FFFFFF" }}>
            <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: "#E8F5F1" }}>
              {busy ? <Loader2 size={22} color="#0D7A5F" className="animate-spin" /> : <UploadCloud size={22} color="#0D7A5F" />}
            </div>
            <div className="text-sm font-medium" style={{ color: "#374151" }}>
              {busy ? STAGE_LABEL[stage] : "Drag & drop or click to upload"}
            </div>
            {busy && (
              <div className="flex justify-center gap-2 mt-3">
                {(["uploading", "converting", "analyzing", "saving"] as Stage[]).map((s, i) => {
                  const stageOrder = ["uploading", "converting", "analyzing", "saving"];
                  const done = stageOrder.indexOf(stage) > i;
                  const active = stage === s;
                  return (
                    <div key={s} className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full transition-all ${active ? "bg-[#0D7A5F] scale-125" : done ? "bg-[#0D7A5F] opacity-40" : "bg-gray-200"}`} />
                      {i < 3 && <span style={{ color: "#D1D5DB", fontSize: 10 }}>—</span>}
                    </div>
                  );
                })}
              </div>
            )}
            {!busy && <div className="text-xs mt-1" style={{ color: "#6B7280" }}>PDF, JPG, PNG · Max 10MB · Vision AI analysis</div>}
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 size={24} color="#0D7A5F" className="animate-spin" /></div>
          ) : reports.length === 0 ? (
            <EmptyState onUpload={() => fileInputRef.current?.click()} />
          ) : (
            <><ReportStats reports={reports} /></>
          )}

          {!loading && reports.length > 0 && (
            <div className="space-y-3 mt-6">
              {reports.map((r) => (
                <div key={r.id} className="card-base p-4 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "#E8F5F1" }}>
                    <FileText size={18} color="#0D7A5F" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: "#1A2332" }}>{r.name}</div>
                    <div className="text-xs mt-0.5 flex items-center gap-2" style={{ color: "#6B7280" }}>
                      {new Date(r.report_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      {r.file_url && (
                        <a href={r.file_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:underline" style={{ color: "#0D7A5F" }}
                          onClick={(e) => e.stopPropagation()}>
                          <ExternalLink size={11} /> Open
                        </a>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                  <button onClick={() => setOpen(r)}
                    className="h-9 px-3 rounded-md border text-xs font-semibold whitespace-nowrap"
                    style={{ borderColor: "#0D7A5F", color: "#0D7A5F" }}>
                    View Analysis
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="vault">
          <div className="card-base p-8 text-center">
            <Vault size={28} color="#0D7A5F" className="mx-auto mb-3" />
            <h2 className="text-lg font-semibold" style={{ color: "#1A2332" }}>Health Vault</h2>
            <p className="text-sm mt-2" style={{ color: "#6B7280" }}>The long-term document archive is being wired into this tab so discharge summaries, prescriptions, scans, and insurance records stay organized.</p>
          </div>
        </TabsContent>

        <TabsContent value="drug">
          <DrugSafetyContent />
        </TabsContent>

        <TabsContent value="recovery">
          <div className="card-base p-8 text-center">
            <HeartPulse size={28} color="#0D7A5F" className="mx-auto mb-3" />
            <h2 className="text-lg font-semibold" style={{ color: "#1A2332" }}>Recovery Plan</h2>
            <p className="text-sm mt-2" style={{ color: "#6B7280" }}>Your discharge-based 90-day protocol will appear here once a summary is uploaded and parsed.</p>
          </div>
        </TabsContent>
      </Tabs>

      {open && <AnalysisDrawer report={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="w-full card-base overflow-hidden">
      {/* Hero banner */}
      <div className="w-full px-8 py-10 flex flex-col items-center text-center" style={{ background: "linear-gradient(135deg, #E8F5F1 0%, #F0FDF9 60%, #ffffff 100%)" }}>
        {/* Illustration */}
        <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-5">
          {/* Document */}
          <rect x="25" y="10" width="50" height="64" rx="6" fill="#ffffff" stroke="#0D7A5F" strokeWidth="2"/>
          <rect x="33" y="24" width="34" height="3" rx="1.5" fill="#0D7A5F" opacity="0.3"/>
          <rect x="33" y="32" width="26" height="3" rx="1.5" fill="#0D7A5F" opacity="0.3"/>
          <rect x="33" y="40" width="30" height="3" rx="1.5" fill="#0D7A5F" opacity="0.3"/>
          <rect x="33" y="48" width="20" height="3" rx="1.5" fill="#0D7A5F" opacity="0.2"/>
          {/* Upload arrow */}
          <circle cx="86" cy="30" r="16" fill="#0D7A5F" opacity="0.12"/>
          <path d="M86 38 L86 24 M80 30 L86 24 L92 30" stroke="#0D7A5F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          {/* Sparkle dots */}
          <circle cx="18" cy="20" r="3" fill="#0D7A5F" opacity="0.25"/>
          <circle cx="106" cy="60" r="4" fill="#0D7A5F" opacity="0.2"/>
          <circle cx="14" cy="70" r="2" fill="#0D7A5F" opacity="0.15"/>
          {/* Pulse line at bottom */}
          <path d="M10 88 Q20 88 25 88 L32 88 L37 78 L44 98 L49 82 L54 88 L110 88" stroke="#0D7A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.4"/>
        </svg>
        <h3 className="text-xl font-bold mb-2" style={{ color: "#1A2332" }}>Your health story starts here</h3>
        <p className="text-sm max-w-md" style={{ color: "#6B7280" }}>
          Upload your first health report and get instant AI-powered insights on your blood sugar, blood pressure, and risk score.
        </p>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-3 w-full" style={{ borderTop: "1px solid #EEF0F3" }}>
        {[
          {
            step: "1",
            label: "Upload Report",
            desc: "PDF, JPG or PNG up to 10MB",
            svg: (
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <circle cx="28" cy="28" r="28" fill="#E8F5F1"/>
                <rect x="17" y="14" width="22" height="28" rx="3" fill="#fff" stroke="#0D7A5F" strokeWidth="1.5"/>
                <path d="M28 34 L28 22 M23 27 L28 22 L33 27" stroke="#0D7A5F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="21" y="36" width="14" height="2" rx="1" fill="#0D7A5F" opacity="0.3"/>
              </svg>
            ),
          },
          {
            step: "2",
            label: "AI Analyzes",
            desc: "Vision AI reads your report instantly",
            svg: (
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <circle cx="28" cy="28" r="28" fill="#E8F5F1"/>
                {/* Brain/chip */}
                <rect x="18" y="18" width="20" height="20" rx="4" fill="#fff" stroke="#0D7A5F" strokeWidth="1.5"/>
                <circle cx="28" cy="28" r="4" fill="#0D7A5F" opacity="0.7"/>
                <line x1="18" y1="23" x2="14" y2="23" stroke="#0D7A5F" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="18" y1="28" x2="14" y2="28" stroke="#0D7A5F" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="18" y1="33" x2="14" y2="33" stroke="#0D7A5F" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="38" y1="23" x2="42" y2="23" stroke="#0D7A5F" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="38" y1="28" x2="42" y2="28" stroke="#0D7A5F" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="38" y1="33" x2="42" y2="33" stroke="#0D7A5F" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="23" y1="18" x2="23" y2="14" stroke="#0D7A5F" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="33" y1="18" x2="33" y2="14" stroke="#0D7A5F" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="23" y1="38" x2="23" y2="42" stroke="#0D7A5F" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="33" y1="38" x2="33" y2="42" stroke="#0D7A5F" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ),
          },
          {
            step: "3",
            label: "Get Insights",
            desc: "Dashboard updates with your vitals",
            svg: (
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <circle cx="28" cy="28" r="28" fill="#E8F5F1"/>
                {/* Chart bars */}
                <rect x="16" y="30" width="6" height="12" rx="1.5" fill="#0D7A5F" opacity="0.4"/>
                <rect x="25" y="22" width="6" height="20" rx="1.5" fill="#0D7A5F" opacity="0.7"/>
                <rect x="34" y="16" width="6" height="26" rx="1.5" fill="#0D7A5F"/>
                {/* Trend arrow */}
                <path d="M16 28 L25 20 L34 14" stroke="#0D7A5F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 2"/>
              </svg>
            ),
          },
        ].map(({ step, label, desc, svg }, i, arr) => (
          <div key={step} className="flex flex-col items-center text-center px-8 py-8 relative"
            style={{ borderRight: i < arr.length - 1 ? "1px solid #EEF0F3" : "none" }}>
            {/* connector arrow on sm+ */}
            {i < arr.length - 1 && (
              <span className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 text-lg" style={{ color: "#0D7A5F", opacity: 0.4 }}>›</span>
            )}
            {svg}
            <div className="mt-4 flex items-center gap-2 justify-center">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: "#0D7A5F" }}>{step}</span>
              <span className="text-sm font-semibold" style={{ color: "#1A2332" }}>{label}</span>
            </div>
            <p className="text-xs mt-1" style={{ color: "#6B7280" }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="flex justify-center py-7" style={{ borderTop: "1px solid #EEF0F3" }}>
        <button onClick={onUpload}
          className="h-11 px-8 rounded-lg text-white font-semibold text-sm inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
          style={{ background: "#0D7A5F" }}>
          <UploadCloud size={16} /> Upload First Report
        </button>
      </div>
    </div>
  );
}

function ReportStats({ reports }: { reports: Report[] }) {
  const total = reports.length;
  const analyzed = reports.filter((r) => r.status === "Analyzed").length;
  const flagged = reports.filter((r) => r.status === "Flagged").length;
  const latest = reports[0];
  const lastDate = latest
    ? new Date(latest.report_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {[
        { icon: ClipboardList, label: "Total Reports", value: total, color: "#0D7A5F", bg: "#E8F5F1" },
        { icon: ShieldCheck, label: "Analyzed", value: analyzed, color: "#15803D", bg: "#F0FDF4" },
        { icon: TriangleAlert, label: "Flagged", value: flagged, color: "#B91C1C", bg: "#FEF2F2" },
        { icon: FileText, label: "Last Upload", value: lastDate, color: "#1A2332", bg: "#F7F8FA" },
      ].map(({ icon: Icon, label, value, color, bg }) => (
        <div key={label} className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: bg }}>
            <Icon size={18} color={color} />
          </div>
          <div>
            <div className="text-xs" style={{ color: "#6B7280" }}>{label}</div>
            <div className="text-lg font-bold" style={{ color }}>{value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: "Analyzing" | "Analyzed" | "Flagged" }) {
  const map = { Analyzing: "risk-mod animate-pulse", Analyzed: "risk-stable", Flagged: "risk-high" } as const;
  return <span className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-wider ${map[status]}`}>{status}</span>;
}

function AnalysisDrawer({ report, onClose }: { report: Report; onClose: () => void }) {
  const labValues = report.lab_values ?? [];
  const flagged = labValues.filter((l) => l.status !== "normal");
  const normal = labValues.filter((l) => l.status === "normal");

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative w-full max-w-[480px] h-full bg-white shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: "#E8ECF0" }}>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: "#1A2332" }}>{report.name}</div>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={report.status} />
              {report.file_url && (
                <a href={report.file_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] hover:underline" style={{ color: "#6B7280" }}>
                  <ExternalLink size={10} /> View file
                </a>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-[#F3F4F6]"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* AI Summary — primary focus */}
          {report.ai_summary ? (
            <section className="insight-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} color="#0D7A5F" />
                <span className="label-caps" style={{ color: "#0D7A5F" }}>AI Analysis</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#1A2332" }}>{report.ai_summary}</p>
            </section>
          ) : report.status === "Analyzing" ? (
            <div className="flex items-center gap-2 py-8 justify-center text-sm" style={{ color: "#6B7280" }}>
              <Loader2 size={16} className="animate-spin" color="#0D7A5F" /> Analyzing report…
            </div>
          ) : null}

          {/* Flagged values — highlighted prominently */}
          {flagged.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={13} color="#B45309" />
                <span className="label-caps" style={{ color: "#B45309" }}>Needs Attention ({flagged.length})</span>
              </div>
              <div className="space-y-2">
                {flagged.map((l) => (
                  <div key={l.parameter} className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: l.status === "high" ? "#FEF2F2" : "#FFFBEB", border: `1px solid ${l.status === "high" ? "#FECACA" : "#FDE68A"}` }}>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: "#1A2332" }}>{l.parameter}</div>
                      <div className="text-xs mt-0.5" style={{ color: "#6B7280" }}>Normal: {l.range}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold" style={{ color: l.status === "high" ? "#B91C1C" : "#B45309" }}>{l.value}</div>
                      <div className="text-[10px] font-semibold uppercase" style={{ color: l.status === "high" ? "#B91C1C" : "#B45309" }}>{l.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Normal values — compact table */}
          {normal.length > 0 && (
            <section>
              <span className="label-caps block mb-3">Normal Values ({normal.length})</span>
              <div className="space-y-1.5">
                {normal.map((l) => (
                  <div key={l.parameter} className="flex items-center justify-between px-3 py-2 rounded-lg"
                    style={{ background: "#F7F8FA" }}>
                    <span className="text-sm" style={{ color: "#374151" }}>{l.parameter}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: "#1A2332" }}>{l.value}</span>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#15803D" }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Dashboard update note */}
          {report.status !== "Analyzing" && (
            <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: "#E8F5F1" }}>
              <Sparkles size={13} color="#0D7A5F" className="mt-0.5 flex-shrink-0" />
              <p className="text-xs leading-relaxed" style={{ color: "#0D7A5F" }}>
                Your dashboard has been updated with Blood Sugar, Blood Pressure, and Risk Score from this report.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
