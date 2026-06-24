import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Pill, MoreVertical, Footprints, Sparkles } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { medications, adherenceWeek, dietPlan } from "@/lib/mock-data";

export const Route = createFileRoute("/_patient/care-plan")({
  head: () => ({ meta: [{ title: "My Care Plan — MedSeva" }] }),
  component: CarePlan,
});

function CarePlan() {
  const [tab, setTab] = useState<"meds" | "diet">("meds");

  return (
    <div className="px-8 py-7 max-w-[1280px] mx-auto">
      <h1 className="text-[22px] font-bold mb-1" style={{ color: "#1A2332" }}>My Care Plan</h1>
      <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
        Manage medications and your AI-curated diet & lifestyle plan.
      </p>

      <div className="flex gap-6 border-b mb-6" style={{ borderColor: "#E8ECF0" }}>
        {[
          { id: "meds", label: "Medications" },
          { id: "diet", label: "Diet & Lifestyle" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as "meds" | "diet")}
            className="pb-3 text-sm font-semibold relative"
            style={{ color: tab === t.id ? "#0D7A5F" : "#6B7280" }}
          >
            {t.label}
            {tab === t.id && <span className="absolute left-0 right-0 -bottom-px h-0.5" style={{ background: "#0D7A5F" }} />}
          </button>
        ))}
      </div>

      {tab === "meds" ? <MedsTab /> : <DietTab />}
    </div>
  );
}

function MedsTab() {
  const [meds, setMeds] = useState(medications);
  const [form, setForm] = useState({ name: "", dose: "", freq: "Once daily", time: "" });

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.dose) return;
    setMeds([
      ...meds,
      { id: `m${Date.now()}`, name: form.name, dose: form.dose, frequency: form.freq, time: form.time || "9:00 AM", status: "Pending", streak: 0 },
    ]);
    setForm({ name: "", dose: "", freq: "Once daily", time: "" });
    toast.success("Medication added");
  };

  return (
    <>
      <form onSubmit={add} className="p-4 rounded-xl mb-5" style={{ background: "#F7F8FA" }}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            placeholder="Medication Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="h-10 px-3 rounded-lg border bg-white text-sm md:col-span-1"
            style={{ borderColor: "#D1D5DB" }}
          />
          <input
            placeholder="Dose (e.g. 500mg)"
            value={form.dose}
            onChange={(e) => setForm({ ...form, dose: e.target.value })}
            className="h-10 px-3 rounded-lg border bg-white text-sm"
            style={{ borderColor: "#D1D5DB" }}
          />
          <select
            value={form.freq}
            onChange={(e) => setForm({ ...form, freq: e.target.value })}
            className="h-10 px-3 rounded-lg border bg-white text-sm"
            style={{ borderColor: "#D1D5DB" }}
          >
            <option>Once daily</option>
            <option>Twice daily</option>
            <option>Thrice daily</option>
          </select>
          <input
            placeholder="Time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            className="h-10 px-3 rounded-lg border bg-white text-sm"
            style={{ borderColor: "#D1D5DB" }}
          />
          <button type="submit" className="h-10 rounded-lg text-white text-sm font-semibold" style={{ background: "#0D7A5F" }}>
            Add
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {meds.map((m) => (
          <div key={m.id} className="card-base p-4 flex items-center gap-4" style={{ borderLeft: "3px solid #0D7A5F" }}>
            <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "#E8F5F1" }}>
              <Pill size={18} color="#0D7A5F" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold" style={{ color: "#1A2332" }}>
                {m.name} {m.dose}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                {m.frequency} • {m.time}
              </div>
            </div>
            <span className="text-xs" style={{ color: "#6B7280" }}>🔥 {m.streak} days</span>
            <span
              className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold uppercase ${
                m.status === "Taken" ? "risk-stable" : "risk-mod"
              }`}
            >
              {m.status}
            </span>
            <button className="p-2 rounded-md hover:bg-[#F3F4F6]"><MoreVertical size={16} color="#6B7280" /></button>
          </div>
        ))}
      </div>

      <div className="card-base p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: "#1A2332" }}>This Week's Adherence</h3>
          <div className="text-[28px] font-bold" style={{ color: "#0D7A5F" }}>85%</div>
        </div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer>
            <BarChart data={adherenceWeek}>
              <CartesianGrid stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="day" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E8ECF0", fontSize: 12 }} />
              <Bar dataKey="taken" stackId="a" fill="#0D7A5F" radius={[0, 0, 0, 0]} />
              <Bar dataKey="missed" stackId="a" fill="#EEF0F3" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

function DietTab() {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs" style={{ color: "#6B7280" }}>
          AI Generated • {dietPlan.basis}
        </div>
        <button
          onClick={() => toast.success("Generating new plan...")}
          className="h-9 px-3 rounded-md border text-xs font-semibold inline-flex items-center gap-2"
          style={{ borderColor: "#0D7A5F", color: "#0D7A5F" }}
        >
          <Sparkles size={13} /> Regenerate Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dietPlan.meals.map((m) => (
          <div key={m.type} className="card-base p-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{m.emoji}</span>
              <div>
                <div className="label-caps">{m.type}</div>
                <div className="text-sm font-semibold mt-0.5" style={{ color: "#1A2332" }}>{m.name}</div>
              </div>
            </div>
            <div className="text-xs mb-3" style={{ color: "#6B7280" }}>{m.calories} kcal</div>
            <span
              className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold mb-2"
              style={{ background: "#E8F5F1", color: "#0D7A5F" }}
            >
              {m.tag}
            </span>
            <p className="text-xs" style={{ color: "#6B7280" }}>{m.reason}</p>
          </div>
        ))}
      </div>

      <div className="card-base p-5 mt-4 flex items-start gap-4" style={{ borderLeft: "3px solid #B45309" }}>
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "#FFFBEB" }}>
          <Footprints size={18} color="#B45309" />
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ color: "#1A2332" }}>30-min Brisk Walk</div>
          <p className="text-[13px] mt-1" style={{ color: "#6B7280" }}>
            Recommended based on your BP reading of 138/88 today. Best time: 6–7 PM after light snack.
          </p>
        </div>
      </div>
    </>
  );
}
