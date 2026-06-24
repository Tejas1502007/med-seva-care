import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, X, Plus, Paperclip, Mic, ExternalLink } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceDot, Cell
} from "recharts";
import { patientQueue, labValues, medications, bp30Days, glucose30Days, consultationTimeline } from "@/lib/mock-data";
import { RiskBadge } from "@/components/RiskBadge";

export const Route = createFileRoute("/_doctor/doctor/patient/$id")({
  loader: ({ params }) => {
    const p = patientQueue.find((x) => x.id === params.id);
    if (!p) throw notFound();
    return { patient: p };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.patient.name ?? "Patient"} — MedSeva` }],
  }),
  component: PatientDetail,
  notFoundComponent: () => <div className="p-8 text-sm" style={{ color: "#6B7280" }}>Patient not found.</div>,
});

function PatientDetail() {
  const { patient } = Route.useLoaderData();
  const [dismissed, setDismissed] = useState(false);
  const [note, setNote] = useState("");

  return (
    <div className="px-8 py-7 max-w-[1400px] mx-auto">
      <div className="text-[13px] mb-3" style={{ color: "#6B7280" }}>
        <Link to="/doctor" style={{ color: "#6B7280" }}>Patient Queue</Link> &gt; <span style={{ color: "#1A2332" }}>{patient.name}</span>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg" style={{ background: "#E8F5F1", color: "#0D7A5F" }}>
          {patient.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
        </div>
        <div className="flex-1">
          <h1 className="text-[22px] font-bold" style={{ color: "#1A2332" }}>{patient.name}</h1>
          <div className="text-sm" style={{ color: "#6B7280" }}>{patient.age}{patient.gender} • {patient.condition}</div>
        </div>
        <RiskBadge level={patient.risk} />
      </div>

      {!dismissed && (
        <div className="card-base p-5 mb-6 flex items-start gap-4" style={{ borderLeft: "3px solid #0D7A5F" }}>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} color="#0D7A5F" />
              <span className="label-caps" style={{ color: "#0D7A5F" }}>AARA Clinical Insights</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border" style={{ borderColor: "#0D7A5F", color: "#0D7A5F" }}>
                AI Powered
              </span>
            </div>
            <p className="text-sm" style={{ color: "#374151", lineHeight: 1.55 }}>{patient.insight}</p>
          </div>
          <button onClick={() => toast.success("Recommendation applied to care plan")} className="h-9 px-3 rounded-md border text-xs font-semibold whitespace-nowrap" style={{ borderColor: "#0D7A5F", color: "#0D7A5F" }}>
            Apply Recommendation
          </button>
          <button onClick={() => setDismissed(true)} className="p-2 rounded-md hover:bg-[#F3F4F6]"><X size={16} color="#6B7280" /></button>
        </div>
      )}

      <h3 className="text-base font-semibold mb-3" style={{ color: "#1A2332" }}>Vitals &amp; Trends</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="card-base p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold" style={{ color: "#1A2332" }}>Blood Pressure (Systolic)</div>
              <div className="text-xs" style={{ color: "#6B7280" }}>Last 30 days</div>
            </div>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={bp30Days}>
                <CartesianGrid stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="day" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} domain={[100, 170]} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E8ECF0", fontSize: 12 }} />
                <Bar dataKey="systolic" radius={[3, 3, 0, 0]}>
                  {bp30Days.map((d, i) => (
                    <Cell key={i} fill={d.elevated ? "#F9A8D4" : "#0D7A5F"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-base p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold" style={{ color: "#1A2332" }}>Fasting Glucose</div>
              <div className="text-xs" style={{ color: "#6B7280" }}>Last 30 days</div>
            </div>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={glucose30Days}>
                <CartesianGrid stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="day" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} domain={[80, 220]} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E8ECF0", fontSize: 12 }} />
                <Line type="monotone" dataKey="value" stroke="#0D7A5F" strokeWidth={2.5} dot={false} />
                {glucose30Days.filter((d) => d.critical).map((d) => (
                  <ReferenceDot key={d.day} x={d.day} y={d.value} r={5} fill="#B91C1C" stroke="#FFFFFF" strokeWidth={2} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card-base p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: "#1A2332" }}>Extracted Lab Reports</h3>
          <button className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: "#0D7A5F" }}>
            <ExternalLink size={12} /> View Original PDF
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left" style={{ color: "#6B7280" }}>
              {["Test Parameter", "Result", "Reference Range", "Trend", "Action"].map((h) => (
                <th key={h} className="font-medium pb-3 text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {labValues.map((l, idx) => (
              <tr key={l.parameter} className="border-t" style={{ borderColor: "#EEF0F3" }}>
                <td className="py-3 font-medium" style={{ color: "#1A2332" }}>{l.parameter}</td>
                <td className="py-3">
                  {l.status === "high" && <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold risk-high">HIGH {l.value}</span>}
                  {l.status === "borderline" && <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold risk-mod">BORDERLINE {l.value}</span>}
                  {l.status === "normal" && <span className="text-sm" style={{ color: "#1A2332" }}>{l.value}</span>}
                </td>
                <td className="py-3 text-xs" style={{ color: "#6B7280" }}>{l.range}</td>
                <td className="py-3">
                  <span style={{ color: idx % 3 === 0 ? "#B91C1C" : "#15803D", fontSize: 14 }}>
                    {idx % 3 === 0 ? "↑" : "↓"}
                  </span>
                </td>
                <td className="py-3"><button className="text-xs font-semibold" style={{ color: "#0D7A5F" }}>Adjust →</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card-base p-5">
          <h3 className="text-base font-semibold mb-4" style={{ color: "#1A2332" }}>Current Care Plan</h3>
          <div className="space-y-3">
            {medications.map((m) => (
              <div key={m.id} className="p-3 rounded-lg" style={{ background: "#F7F8FA", borderLeft: "3px solid #0D7A5F" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "#1A2332" }}>{m.name} {m.dose}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{m.frequency} • {m.time}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase" style={{ background: "#E8F5F1", color: "#0D7A5F" }}>
                    {m.frequency === "Twice daily" ? "BD" : "OD"}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full h-10 mt-3 rounded-lg border-2 border-dashed text-sm font-medium inline-flex items-center justify-center gap-1" style={{ borderColor: "#D1D5DB", color: "#6B7280" }}>
            <Plus size={14} /> Add New Medication
          </button>
          <button onClick={() => toast.success("Care plan updated")} className="w-full h-11 mt-4 rounded-lg text-white text-sm font-semibold" style={{ background: "#0D7A5F" }}>
            Update Care Plan
          </button>
          <div className="text-xs text-center mt-2" style={{ color: "#6B7280" }}>Last updated by Dr. Anjali K.</div>
        </div>

        <div className="card-base p-5">
          <h3 className="text-base font-semibold mb-4" style={{ color: "#1A2332" }}>Consultation Timeline</h3>
          <div className="relative pl-5">
            <div className="absolute left-[5px] top-2 bottom-2 w-px" style={{ background: "#E8ECF0" }} />
            {consultationTimeline.map((c, i) => (
              <div key={i} className="relative mb-5 last:mb-0">
                <span
                  className="absolute -left-[18px] top-1 w-3 h-3 rounded-full border-2 border-white"
                  style={{ background: i === 0 ? "#0D7A5F" : "#D1D5DB" }}
                />
                <div className="flex items-baseline justify-between">
                  <div className="label-caps">{c.date}</div>
                  <div className="text-xs" style={{ color: "#6B7280" }}>{c.doctor}</div>
                </div>
                <div className="mt-2 p-3 rounded-lg text-sm" style={{ background: "#F7F8FA", color: "#374151", lineHeight: 1.5 }}>
                  {c.note}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add clinical observation or follow-up note..."
              className="w-full min-h-12 p-3 rounded-lg border text-sm outline-none resize-none"
              style={{ borderColor: "#D1D5DB" }}
              rows={2}
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-md hover:bg-[#F3F4F6]"><Paperclip size={16} color="#6B7280" /></button>
                <button className="p-2 rounded-md hover:bg-[#F3F4F6]"><Mic size={16} color="#6B7280" /></button>
              </div>
              <button
                onClick={() => { if (note.trim()) { toast.success("Note added"); setNote(""); } }}
                className="h-9 px-4 rounded-md text-white text-xs font-semibold"
                style={{ background: "#0D7A5F" }}
              >
                Add Note
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
