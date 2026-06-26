import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, UploadCloud, X, Sparkles, ExternalLink, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";

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
    <div className="px-8 py-7 max-w-[1280px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-bold" style={{ color: "#1A2332" }}>Health Reports</h1>
        <button onClick={() => fileInputRef.current?.click()} disabled={busy}
          className="h-10 px-4 rounded-lg text-white font-semibold text-sm inline-flex items-center gap-2 disabled:opacity-60"
          style={{ background: "#0D7A5F" }}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
          {busy ? STAGE_LABEL[stage] : "Upload Report"}
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />

      {/* Drop zone */}
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

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} color="#0D7A5F" className="animate-spin" /></div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: "#6B7280" }}>No reports yet. Upload your first health report above.</div>
      ) : (
        <div className="space-y-3">
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

      {open && <AnalysisDrawer report={open} onClose={() => setOpen(null)} />}
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
