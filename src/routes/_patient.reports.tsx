import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { FileText, UploadCloud, X, Sparkles, Download, Share2 } from "lucide-react";
import { reports as initialReports, labValues } from "@/lib/mock-data";

export const Route = createFileRoute("/_patient/reports")({
  head: () => ({ meta: [{ title: "Health Reports — MedSeva" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const [open, setOpen] = useState<string | null>(null);
  const [reports, setReports] = useState(initialReports);

  const upload = () => {
    const id = `r${Date.now()}`;
    setReports([
      { id, name: "New Lab Report — Apollo Diagnostics", date: "24 Jun 2026", doctor: "Dr. Ananya Iyer", status: "Analyzing" as const },
      ...reports,
    ]);
    toast.success("Report uploaded — AI analyzing...");
    setTimeout(() => {
      setReports((r) => r.map((x) => (x.id === id ? { ...x, status: "Analyzed" as const } : x)));
      toast.success("Analysis ready");
    }, 2500);
  };

  return (
    <div className="px-8 py-7 max-w-[1280px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-bold" style={{ color: "#1A2332" }}>Health Reports</h1>
        <button
          onClick={upload}
          className="h-10 px-4 rounded-lg text-white font-semibold text-sm inline-flex items-center gap-2"
          style={{ background: "#0D7A5F" }}
        >
          <UploadCloud size={16} /> Upload Report
        </button>
      </div>

      <div
        onClick={upload}
        className="rounded-xl border-2 border-dashed py-12 text-center cursor-pointer transition-colors hover:bg-[#F0FDF9] hover:border-[#0D7A5F]"
        style={{ borderColor: "#D1D5DB", background: "#FFFFFF" }}
      >
        <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: "#E8F5F1" }}>
          <UploadCloud size={22} color="#0D7A5F" />
        </div>
        <div className="text-sm font-medium" style={{ color: "#374151" }}>
          Drag &amp; drop your report or click to browse
        </div>
        <div className="text-xs mt-1" style={{ color: "#6B7280" }}>Supports PDF, JPG, PNG</div>
      </div>

      <div className="mt-6 space-y-3">
        {reports.map((r) => (
          <div key={r.id} className="card-base p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "#E8F5F1" }}>
              <FileText size={18} color="#0D7A5F" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate" style={{ color: "#1A2332" }}>{r.name}</div>
              <div className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{r.date} • {r.doctor}</div>
            </div>
            <StatusBadge status={r.status} />
            <button
              onClick={() => setOpen(r.id)}
              className="h-9 px-3 rounded-md border text-xs font-semibold whitespace-nowrap"
              style={{ borderColor: "#0D7A5F", color: "#0D7A5F" }}
            >
              View Analysis
            </button>
          </div>
        ))}
      </div>

      {open && <AnalysisDrawer reportName={reports.find((r) => r.id === open)?.name || ""} onClose={() => setOpen(null)} />}
    </div>
  );
}

function StatusBadge({ status }: { status: "Analyzing" | "Analyzed" | "Flagged" }) {
  const styles = {
    Analyzing: "risk-mod animate-pulse",
    Analyzed: "risk-stable",
    Flagged: "risk-high",
  } as const;
  return (
    <span className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-wider ${styles[status]}`}>
      {status}
    </span>
  );
}

function AnalysisDrawer({ reportName, onClose }: { reportName: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative w-full max-w-[480px] h-full bg-white shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: "#E8ECF0" }}>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: "#1A2332" }}>{reportName}</div>
            <span className="inline-flex items-center gap-1 mt-1 text-[11px] px-2 py-0.5 rounded-full risk-stable">
              <Sparkles size={10} /> Analyzed by AI
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-[#F3F4F6]"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <h4 className="label-caps mb-3">Extracted Values</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left" style={{ color: "#6B7280" }}>
                  <th className="font-medium pb-2 text-xs">Parameter</th>
                  <th className="font-medium pb-2 text-xs">Value</th>
                  <th className="font-medium pb-2 text-xs">Normal</th>
                  <th className="font-medium pb-2 text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {labValues.map((l) => (
                  <tr key={l.parameter} className="border-t" style={{ borderColor: "#EEF0F3", background: l.status !== "normal" ? "#FFFBEB" : undefined }}>
                    <td className="py-2.5 font-medium" style={{ color: "#374151" }}>{l.parameter}</td>
                    <td className="py-2.5" style={{ color: "#1A2332" }}>{l.value}</td>
                    <td className="py-2.5 text-xs" style={{ color: "#6B7280" }}>{l.range}</td>
                    <td className="py-2.5">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{
                          background:
                            l.status === "high" ? "#B91C1C" : l.status === "borderline" ? "#B45309" : "#15803D",
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="insight-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} color="#0D7A5F" />
              <span className="label-caps" style={{ color: "#0D7A5F" }}>AI Plain-Language Summary</span>
            </div>
            <p className="text-sm" style={{ color: "#1A2332", lineHeight: 1.6 }}>
              Your HbA1c of 7.2% means your average blood sugar over the past 3 months has been slightly above target. This is manageable — focus on reducing rice portions at dinner and continue your evening walks.
            </p>
          </section>

          <section>
            <h4 className="label-caps mb-3">Flagged Items</h4>
            <div className="space-y-3">
              {labValues.filter((l) => l.status !== "normal").map((l) => (
                <div key={l.parameter} className="p-3 rounded-lg" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold" style={{ color: "#1A2332" }}>{l.parameter} — {l.value}</span>
                    <span className="text-[11px] font-semibold uppercase" style={{ color: l.status === "high" ? "#B91C1C" : "#B45309" }}>{l.status}</span>
                  </div>
                  <p className="text-xs" style={{ color: "#6B7280" }}>
                    {l.parameter === "HbA1c" && "Indicates your 3-month average glucose is high. Discuss medication adjustment with your doctor."}
                    {l.parameter === "Fasting Glucose" && "Morning sugar is above target. Try a 15-minute walk after dinner."}
                    {l.parameter === "LDL" && "Bad cholesterol slightly elevated. Reduce fried foods and ghee."}
                    {l.parameter === "Triglycerides" && "Cut back on sweets and refined carbs to bring this down."}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div className="flex gap-3 pt-2">
            <button className="flex-1 h-10 rounded-lg text-white text-sm font-semibold inline-flex items-center justify-center gap-2" style={{ background: "#0D7A5F" }}>
              <Share2 size={14} /> Share with Doctor
            </button>
            <button className="flex-1 h-10 rounded-lg border text-sm font-semibold inline-flex items-center justify-center gap-2" style={{ borderColor: "#0D7A5F", color: "#0D7A5F" }}>
              <Download size={14} /> Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
