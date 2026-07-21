import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ShieldCheck, ShieldAlert, Plus, X, Loader2, AlertTriangle, CheckCircle2, Printer, RefreshCw, Info } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_patient/drug-safety")({
  head: () => ({ meta: [{ title: "Drug Safety — MedSeva" }] }),
  component: DrugSafetyPage,
});

type Severity = "HIGH" | "MODERATE" | "LOW";

type Interaction = {
  drugs: string[];
  severity: Severity;
  explanation: string;
  action: string;
};

const SEVERITY_STYLE: Record<Severity, { bg: string; text: string; border: string; icon: typeof ShieldAlert }> = {
  HIGH:     { bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA", icon: ShieldAlert },
  MODERATE: { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A", icon: AlertTriangle },
  LOW:      { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0", icon: Info },
};

export function DrugSafetyContent() {
  const [drugs, setDrugs] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMeds, setLoadingMeds] = useState(true);
  const [interactions, setInteractions] = useState<Interaction[] | null>(null);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadingMeds(false); return; }
      setUserId(user.id);

      const { data } = await supabase
        .from("medications")
        .select("name")
        .eq("patient_id", user.id)
        .eq("is_active", true);

      if (data && data.length > 0) {
        setDrugs(data.map((m) => m.name));
      }
      setLoadingMeds(false);
    };
    load();
  }, []);

  const addDrug = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (drugs.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Drug already in list");
      return;
    }
    setDrugs([...drugs, trimmed]);
    setInput("");
    setInteractions(null);
  };

  const removeDrug = (name: string) => {
    setDrugs(drugs.filter((d) => d !== name));
    setInteractions(null);
  };

  const checkInteractions = async () => {
    if (drugs.length < 2) {
      toast.error("Add at least 2 medications to check interactions");
      return;
    }

    setLoading(true);
    setInteractions(null);

    try {
      const res = await fetch("/api/drug-interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drugs }),
      });

      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Check failed"); return; }

      setInteractions(data.interactions ?? []);
      setCheckedAt(data.checkedAt);

      if (userId) {
        supabase.from("drug_interaction_checks" as any).insert({
          user_id: userId,
          drugs_checked: drugs,
          interactions_found: data.interactions ?? [],
        }).then(() => {});

        const highInteractions = (data.interactions ?? []).filter((i: Interaction) => i.severity === "HIGH");
        if (highInteractions.length > 0) {
          const steps = [
            { step: 1, label: "Patient notified", status: "done", timestamp: new Date().toISOString(), message: `${highInteractions.length} HIGH severity drug interaction(s) detected` },
            { step: 2, label: "Doctor alert pending", status: "pending", timestamp: null, message: "Awaiting doctor review" },
          ];
          supabase.from("alert_escalations" as any).insert({
            user_id: userId,
            trigger_type: "drug_interaction",
            trigger_value: highInteractions.map((i: Interaction) => i.drugs.join(" + ")).join(", "),
            severity: "HIGH",
            steps,
            current_step: 1,
          }).then(() => {});
          toast.warning(`⚠ ${highInteractions.length} HIGH severity interaction(s) found — doctor has been alerted`);
        } else if (data.interactions?.length === 0) {
          toast.success("All your medications are safe together ✓");
        }
      }
    } catch (err) {
      toast.error("Failed to check interactions");
    } finally {
      setLoading(false);
    }
  };

  const printReport = () => {
    const lines = [
      "MedSeva — Drug Interaction Report",
      `Checked: ${checkedAt ? new Date(checkedAt).toLocaleString("en-IN") : ""}`,
      `Medications: ${drugs.join(", ")}`,
      "",
      interactions?.length === 0
        ? "✓ No interactions found. All medications are safe together."
        : `${interactions?.length} interaction(s) found:`,
      ...(interactions ?? []).map((i) =>
        `\n[${i.severity}] ${i.drugs.join(" + ")}\n${i.explanation}\nAction: ${i.action}`
      ),
    ];
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(`<pre style="font-family:sans-serif;padding:24px">${lines.join("\n")}</pre>`);
      w.print();
    }
  };

  const highCount = interactions?.filter((i) => i.severity === "HIGH").length ?? 0;
  const modCount = interactions?.filter((i) => i.severity === "MODERATE").length ?? 0;

  return (
    <>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-semibold" style={{ color: "#1A2332" }}>Drug Safety Checker</h2>
        {interactions !== null && (
          <button onClick={printReport} className="h-9 px-3 rounded-lg border text-xs font-semibold inline-flex items-center gap-2" style={{ borderColor: "#0D7A5F", color: "#0D7A5F" }}>
            <Printer size={14} /> Print Report
          </button>
        )}
      </div>
      <p className="text-sm mb-4" style={{ color: "#6B7280" }}>
        Check if your medications from different doctors are safe to take together.
      </p>

      <div className="card-base p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: "#1A2332" }}>Your Medications</h3>
          {loadingMeds && <Loader2 size={16} className="animate-spin" color="#0D7A5F" />}
        </div>

        <div className="flex gap-2 mb-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addDrug()}
            placeholder="Add a drug name (e.g. Clarithromycin)"
            className="flex-1 h-11 px-4 rounded-lg border text-sm"
            style={{ borderColor: "#D1D5DB" }}
          />
          <button
            onClick={addDrug}
            className="h-11 px-4 rounded-lg text-white text-sm font-semibold inline-flex items-center gap-2"
            style={{ background: "#0D7A5F" }}
          >
            <Plus size={16} /> Add
          </button>
        </div>

        {drugs.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-2">
            {drugs.map((drug) => (
              <span
                key={drug}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                style={{ background: "#E8F5F1", color: "#0D7A5F" }}
              >
                {drug}
                <button onClick={() => removeDrug(drug)} className="hover:opacity-70">
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        ) : (
          !loadingMeds && (
            <p className="text-sm text-center py-4" style={{ color: "#9CA3AF" }}>
              No medications added yet. Add at least 2 to check interactions.
            </p>
          )
        )}

        <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: "1px solid #EEF0F3" }}>
          <p className="text-xs" style={{ color: "#6B7280" }}>
            {drugs.length} medication{drugs.length !== 1 ? "s" : ""}
          </p>
          <button
            onClick={checkInteractions}
            disabled={loading || drugs.length < 2}
            className="h-10 px-5 rounded-lg text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50"
            style={{ background: "#0D7A5F" }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            {loading ? "Checking…" : "Check Interactions"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="card-base p-10 flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin" color="#0D7A5F" />
          <p className="text-sm font-medium" style={{ color: "#6B7280" }}>Analyzing {drugs.length} medications…</p>
        </div>
      )}

      {!loading && interactions !== null && (
        <>
          {interactions.length === 0 ? (
            <div className="card-base p-5 flex items-center gap-4 mb-6" style={{ borderLeft: "4px solid #15803D" }}>
              <CheckCircle2 size={28} color="#15803D" />
              <div>
                <div className="text-base font-semibold" style={{ color: "#15803D" }}>All your medications are safe together ✓</div>
                <div className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                  No dangerous interactions found among {drugs.length} medications checked.
                </div>
              </div>
            </div>
          ) : (
            <div className="card-base p-5 flex items-center gap-4 mb-6" style={{ borderLeft: "4px solid #B91C1C" }}>
              <ShieldAlert size={28} color="#B91C1C" />
              <div className="flex-1">
                <div className="text-base font-semibold" style={{ color: "#B91C1C" }}>
                  {interactions.length} interaction{interactions.length > 1 ? "s" : ""} found
                </div>
                <div className="text-xs mt-0.5 flex gap-3" style={{ color: "#6B7280" }}>
                  {highCount > 0 && <span style={{ color: "#B91C1C" }}>● {highCount} HIGH</span>}
                  {modCount > 0 && <span style={{ color: "#B45309" }}>● {modCount} MODERATE</span>}
                </div>
              </div>
              <button onClick={checkInteractions} className="h-8 px-3 rounded-lg border text-xs font-semibold inline-flex items-center gap-1" style={{ borderColor: "#D1D5DB", color: "#6B7280" }}>
                <RefreshCw size={12} /> Recheck
              </button>
            </div>
          )}

          <div className="space-y-4">
            {interactions.map((interaction, i) => {
              const style = SEVERITY_STYLE[interaction.severity] ?? SEVERITY_STYLE.LOW;
              const Icon = style.icon;
              return (
                <div key={i} className="card-base p-5" style={{ borderLeft: `4px solid ${style.border}` }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: style.bg }}>
                      <Icon size={18} color={style.text} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-bold" style={{ color: "#1A2332" }}>
                          {interaction.drugs.join(" + ")}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase" style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}>
                          {interaction.severity}
                        </span>
                      </div>
                      <p className="text-sm mb-3" style={{ color: "#374151" }}>{interaction.explanation}</p>
                      <div className="p-3 rounded-lg" style={{ background: style.bg }}>
                        <span className="text-xs font-semibold" style={{ color: style.text }}>What to do: </span>
                        <span className="text-xs" style={{ color: "#374151" }}>{interaction.action}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {checkedAt && (
            <p className="text-xs mt-4 text-center" style={{ color: "#9CA3AF" }}>
              Last checked: {new Date(checkedAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}

          <div className="card-base p-4 mt-4 flex items-start gap-2" style={{ background: "#F0F9FF" }}>
            <Info size={14} color="#0369A1" className="mt-0.5 shrink-0" />
            <p className="text-xs" style={{ color: "#0369A1" }}>
              This tool is for information only. Always consult your doctor before changing any medication. Show this report to your doctor at your next visit.
            </p>
          </div>
        </>
      )}
    </>
  );
}

function DrugSafetyPage() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 page-enter">
      <h1 className="text-[22px] font-bold mb-6" style={{ color: "#1A2332" }}>Drug Safety</h1>
      <DrugSafetyContent />
    </div>
  );
}
