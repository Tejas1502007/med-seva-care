import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Pill, MoreVertical, Footprints, Sparkles, Check, Clock, Loader2, AlertCircle, X } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { medications, adherenceWeek } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import { CalorieTracker } from "@/components/CalorieTracker";

export const Route = createFileRoute("/_patient/care-plan")({
  head: () => ({ meta: [{ title: "My Care Plan — MedSeva" }] }),
  component: CarePlan,
});

const AVAILABLE_CONDITIONS = [
  { id: "Diabetes", label: "Diabetes", icon: "🩺", color: "#EF4444" },
  { id: "Hypertension", label: "Hypertension (High BP)", icon: "❤️", color: "#F97316" },
  { id: "CKD", label: "Chronic Kidney Disease", icon: "🫘", color: "#8B5CF6" },
  { id: "COPD", label: "COPD (Lung)", icon: "💨", color: "#06B6D4" },
  { id: "Cardiovascular Disease", label: "Heart Disease", icon: "❤️‍🩹", color: "#EC4899" },
  { id: "Thyroid", label: "Thyroid Disorder", icon: "🦗", color: "#14B8A6" },
  { id: "Obesity", label: "Weight Management", icon: "⚖️", color: "#A16207" },
  { id: "Anemia", label: "Anemia", icon: "🩸", color: "#DC2626" },
];

function CarePlan() {
  const [tab, setTab] = useState<"meds" | "diet" | "calories">("meds");
  const [userId, setUserId] = useState<string | null>(null);
  const [conditions, setConditions] = useState<string[]>([]);
  const [patientData, setPatientData] = useState<any>(null);
  const [dietPlan, setDietPlan] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [editingConditions, setEditingConditions] = useState(false);
  const [savingConditions, setSavingConditions] = useState(false);
  const [tempConditions, setTempConditions] = useState<string[]>([]);

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      
      // Load patient profile
      const { data } = await supabase
        .from("patient_profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (data) {
        setConditions(data.conditions || []);
        setPatientData(data);
      }

      // Load the most recent active care plan
      try {
        const { data: planData, error: planError } = await supabase
          .from("care_plans")
          .select("*")
          .eq("patient_id", user.id)
          .eq("is_active", true)
          .order("generated_at", { ascending: false })
          .limit(1);

        if (planError) {
          console.error("❌ Error loading care plan from DB:", planError);
          // Fallback to localStorage
          const cachedPlan = localStorage.getItem(`diet_plan_${user.id}`);
          if (cachedPlan) {
            try {
              const plan = JSON.parse(cachedPlan);
              setDietPlan(plan);
              console.log("✅ Loaded diet plan from cache");
            } catch (e) {
              console.error("Error parsing cached plan:", e);
            }
          }
        } else if (planData && planData.length > 0) {
          const plan = planData[0].meals || planData[0].lifestyle;
          setDietPlan(plan);
          // Also cache in localStorage as backup
          localStorage.setItem(`diet_plan_${user.id}`, JSON.stringify(plan));
          console.log("✅ Loaded existing diet plan from database");
        } else {
          console.log("ℹ️ No active care plan found in database");
          // Try localStorage as fallback
          const cachedPlan = localStorage.getItem(`diet_plan_${user.id}`);
          if (cachedPlan) {
            try {
              const plan = JSON.parse(cachedPlan);
              setDietPlan(plan);
              console.log("✅ Loaded diet plan from cache");
            } catch (e) {
              console.error("Error parsing cached plan:", e);
            }
          }
        }
      } catch (err) {
        console.error("Exception loading care plan:", err);
        // Fallback to localStorage
        const cachedPlan = localStorage.getItem(`diet_plan_${user.id}`);
        if (cachedPlan) {
          try {
            const plan = JSON.parse(cachedPlan);
            setDietPlan(plan);
            console.log("✅ Loaded diet plan from cache");
          } catch (e) {
            console.error("Error parsing cached plan:", e);
          }
        }
      }
    }
  };

  const toggleCondition = (conditionId: string) => {
    setTempConditions((prev) =>
      prev.includes(conditionId)
        ? prev.filter((c) => c !== conditionId)
        : [...prev, conditionId]
    );
  };

  const saveConditions = async () => {
    if (tempConditions.length === 0) {
      toast.error("Please select at least one medical condition");
      return;
    }

    if (!userId) {
      toast.error("Not authenticated");
      return;
    }

    setSavingConditions(true);
    try {
      const { error } = await supabase
        .from("patient_profiles")
        .update({ conditions: tempConditions })
        .eq("id", userId);

      if (error) {
        console.error("Error saving conditions:", error);
        toast.error("Failed to save conditions");
        return;
      }

      setConditions(tempConditions);
      setEditingConditions(false);
      toast.success("✓ Medical conditions updated!");

      // Mark previous diet plans as inactive since conditions changed
      const { error: updateError } = await supabase
        .from("care_plans")
        .update({ is_active: false })
        .eq("patient_id", userId)
        .eq("is_active", true);

      if (updateError) {
        console.error("Error updating previous plans:", updateError);
      }

      // Clear diet plan to regenerate with new conditions
      setDietPlan(null);
      // Clear cache since conditions changed
      if (userId) {
        localStorage.removeItem(`diet_plan_${userId}`);
      }
    } catch (err) {
      console.error("Exception saving conditions:", err);
      toast.error("Failed to save conditions");
    } finally {
      setSavingConditions(false);
    }
  };

  const startEditingConditions = () => {
    setTempConditions(conditions);
    setEditingConditions(true);
  };

  const cancelEditingConditions = () => {
    setEditingConditions(false);
    setTempConditions([]);
  };

  const generateDietPlan = async () => {
    if (!conditions.length) {
      toast.error("Please set your medical conditions first");
      setEditingConditions(true);
      return;
    }

    setLoadingPlan(true);
    try {
      const response = await fetch("/api/nutrition/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conditions,
          age: patientData.age || 45,
          gender: patientData.gender || "Male",
          bloodSugar: patientData.blood_sugar,
          bloodPressure: patientData.blood_pressure,
          weight: patientData.weight,
          activityLevel: "Moderate",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to generate diet plan");
        return;
      }

      // Set plan in state IMMEDIATELY - don't wait for save
      console.log("📋 Setting diet plan in state:", data.plan?.basis);
      setDietPlan(data.plan);
      
      // Cache in localStorage for persistence (works even without database)
      if (userId) {
        localStorage.setItem(`diet_plan_${userId}`, JSON.stringify(data.plan));
        console.log("💾 Cached plan in localStorage");
      }

      // Save to database in background
      try {
        const { error: dbError } = await supabase
          .from("care_plans")
          .insert([
            {
              patient_id: userId,
              basis: data.plan.basis || `Diet plan for ${conditions.join(", ")}`,
              meals: data.plan,
              lifestyle: {
                exercise: data.plan.exercise,
                hydration: data.plan.hydration,
                dailyGoals: data.plan.dailyGoals,
                foodsToInclude: data.plan.foodsToInclude,
                foodsToAvoid: data.plan.foodsToAvoid,
              },
              generated_at: new Date().toISOString(),
              valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              is_active: true,
            },
          ]);

        if (dbError) {
          console.error("❌ Error saving to database:", dbError);
          console.error("Error code:", dbError.code);
          console.error("Error message:", dbError.message);
          console.error("User ID:", userId);
          toast.warning("Plan generated and displaying, but database save failed");
        } else {
          console.log("✅ Plan saved to database successfully");
          toast.success("✓ Diet plan generated and saved successfully!");
        }
      } catch (dbErr) {
        console.error("❌ Database exception:", dbErr);
        toast.warning("Plan generated and displaying, but database save failed");
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Failed to generate diet plan");
    } finally {
      setLoadingPlan(false);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 page-enter">
      <h1 className="text-[22px] font-bold mb-1" style={{ color: "#1A2332" }}>My Care Plan</h1>
      <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
        Manage medications, diet plan, and track your daily nutrition.
      </p>

      <div className="flex gap-6 border-b mb-6 overflow-x-auto" style={{ borderColor: "#E8ECF0" }}>
        {[
          { id: "meds", label: "Medications" },
          { id: "diet", label: "Diet Plan" },
          { id: "calories", label: "Calorie Tracker" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className="pb-3 text-sm font-semibold relative whitespace-nowrap"
            style={{ color: tab === t.id ? "#0D7A5F" : "#6B7280" }}
          >
            {t.label}
            {tab === t.id && <span className="absolute left-0 right-0 -bottom-px h-0.5" style={{ background: "#0D7A5F" }} />}
          </button>
        ))}
      </div>

      {/* Debug Info */}
      {tab === "diet" && (
        <div style={{ display: "none" }}>
          <div>userId: {userId}</div>
          <div>conditions: {JSON.stringify(conditions)}</div>
          <div>dietPlan exists: {!!dietPlan}</div>
          <div>dietPlan.days length: {dietPlan?.days?.length || 0}</div>
        </div>
      )}

      {tab === "meds" ? (
        <MedsTab />
      ) : tab === "diet" ? (
        <DietTab
          dietPlan={dietPlan}
          conditions={conditions}
          editingConditions={editingConditions}
          tempConditions={tempConditions}
          onGenerate={generateDietPlan}
          onStartEditConditions={startEditingConditions}
          onToggleCondition={toggleCondition}
          onSaveConditions={saveConditions}
          onCancelEditConditions={cancelEditingConditions}
          loading={loadingPlan}
          savingConditions={savingConditions}
        />
      ) : (
        <CaloriesTab userId={userId} conditions={conditions} />
      )}
    </div>
  );
}

function MedsTab() {
  const [meds, setMeds] = useState<any[]>([]);
  const [form, setForm] = useState({ 
    name: "", 
    quantity: 1, 
    unit: "tablet", 
    frequency: "Once daily", 
    times: ["09:00"],
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user ID and load medications from database
  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      // Load medications from database
      const { data, error } = await supabase
        .from("medications")
        .select("*")
        .eq("patient_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error loading medications:", error);
        toast.error("Error loading medicines");
      } else if (data) {
        // Map database records to component format
        setMeds(data.map((m: any) => ({
          id: m.id,
          name: m.name,
          quantity: m.quantity || 1,
          unit: m.unit || "tablet",
          frequency: m.frequency,
          times: m.times || [m.time] || ["09:00"],
          notes: m.notes,
          status: "Pending",
          streak: m.streak || 0,
          patient_id: m.patient_id,
        })));
      }
    }
  };

  const updateFormTime = (index: number, value: string) => {
    const newTimes = [...form.times];
    newTimes[index] = value;
    setForm({ ...form, times: newTimes });
  };

  const addTime = () => {
    setForm({ ...form, times: [...form.times, "12:00"] });
  };

  const removeTime = (index: number) => {
    if (form.times.length > 1) {
      setForm({ ...form, times: form.times.filter((_, i) => i !== index) });
    }
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.quantity || !form.unit) {
      toast.error("Please fill in medicine name, quantity and unit");
      return;
    }

    if (form.times.length === 0) {
      toast.error("Please add at least one time");
      return;
    }

    if (!userId) {
      toast.error("Not authenticated. Please log in.");
      return;
    }

    setLoading(true);
    try {
      // Create dose string from quantity and unit
      const dose = `${form.quantity} ${form.unit}`;
      
      // Insert into database
      const { data, error } = await supabase
        .from("medications")
        .insert([
          {
            patient_id: userId,
            name: form.name,
            dose: dose,
            quantity: form.quantity,
            unit: form.unit,
            frequency: form.frequency,
            times: form.times,
            notes: form.notes || null,
            time: form.times[0],
            streak: 0,
            is_active: true,
          },
        ])
        .select();

      if (error) {
        console.error("Error adding medication:", error);
        toast.error(`Error adding medication: ${error.message}`);
        return;
      }

      if (data) {
        // Reload all medicines
        await loadMedicines();
        setForm({ 
          name: "", 
          quantity: 1, 
          unit: "tablet", 
          frequency: "Once daily", 
          times: ["09:00"],
          notes: ""
        });
        toast.success("✓ Medication added successfully");
      }
    } catch (err) {
      console.error("Exception adding medication:", err);
      toast.error("Failed to add medication");
    } finally {
      setLoading(false);
    }
  };

  const markAsTaken = async (medicineId: string, medicineName: string) => {
    if (!userId) {
      toast.error("Not authenticated");
      return;
    }

    setUpdating(medicineId);
    try {
      // Insert medication log
      const { error: logError } = await supabase
        .from("medication_logs")
        .insert([
          {
            medication_id: medicineId,
            patient_id: userId,
            status: "Taken",
            logged_at: new Date().toISOString(),
          },
        ]);

      if (logError) {
        console.error("Error logging medication:", logError);
        toast.error("Error marking medication");
        return;
      }

      // Update medication streak
      const currentMed = meds.find(m => m.id === medicineId);
      if (currentMed) {
        const { error: updateError } = await supabase
          .from("medications")
          .update({ 
            streak: (currentMed.streak || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq("id", medicineId);

        if (updateError) {
          console.error("Error updating streak:", updateError);
        }
      }

      // Update local state
      setMeds(prevMeds =>
        prevMeds.map(m =>
          m.id === medicineId
            ? { ...m, status: "Taken", streak: (m.streak || 0) + 1 }
            : m
        )
      );

      toast.success(`✓ ${medicineName} marked as taken`);
    } catch (err) {
      console.error("Exception marking as taken:", err);
      toast.error("Failed to mark medication");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <>
      <form onSubmit={add} className="p-5 rounded-xl mb-5" style={{ background: "#F7F8FA" }}>
        <div className="mb-4">
          <label className="text-xs font-semibold mb-2 block" style={{ color: "#6B7280" }}>Medication Name *</label>
          <input
            placeholder="e.g., Metformin, Aspirin"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            disabled={loading}
            className="w-full h-10 px-3 rounded-lg border bg-white text-sm disabled:opacity-50"
            style={{ borderColor: "#D1D5DB" }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#6B7280" }}>Quantity *</label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              placeholder="e.g., 1, 2"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) || 1 })}
              disabled={loading}
              className="w-full h-10 px-3 rounded-lg border bg-white text-sm disabled:opacity-50"
              style={{ borderColor: "#D1D5DB" }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#6B7280" }}>Unit *</label>
            <select
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              disabled={loading}
              className="w-full h-10 px-3 rounded-lg border bg-white text-sm disabled:opacity-50"
              style={{ borderColor: "#D1D5DB" }}
            >
              <option value="tablet">Tablet</option>
              <option value="capsule">Capsule</option>
              <option value="ml">ML</option>
              <option value="mg">MG</option>
              <option value="drop">Drop</option>
              <option value="spoon">Spoon</option>
              <option value="injection">Injection</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#6B7280" }}>Frequency *</label>
            <select
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              disabled={loading}
              className="w-full h-10 px-3 rounded-lg border bg-white text-sm disabled:opacity-50"
              style={{ borderColor: "#D1D5DB" }}
            >
              <option value="Once daily">Once daily</option>
              <option value="Twice daily">Twice daily</option>
              <option value="Thrice daily">Thrice daily</option>
              <option value="Four times daily">Four times daily</option>
              <option value="Every alternate day">Every alternate day</option>
              <option value="Weekly">Weekly</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs font-semibold mb-2 block" style={{ color: "#6B7280" }}>
            Times to Take Medicine *
            <span className="text-[11px] ml-1" style={{ color: "#9CA3AF" }}>(e.g., 09:00, 14:00, 21:00)</span>
          </label>
          <div className="space-y-2">
            {form.times.map((time, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => updateFormTime(index, e.target.value)}
                  disabled={loading}
                  className="flex-1 h-10 px-3 rounded-lg border bg-white text-sm disabled:opacity-50"
                  style={{ borderColor: "#D1D5DB" }}
                />
                {form.times.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTime(index)}
                    disabled={loading}
                    className="h-10 px-3 rounded-lg text-white text-sm font-semibold disabled:opacity-50"
                    style={{ background: "#EF4444" }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addTime}
              disabled={loading || form.times.length >= 4}
              className="h-10 px-3 rounded-lg text-sm font-semibold disabled:opacity-50"
              style={{ 
                borderColor: "#0D7A5F", 
                color: "#0D7A5F",
                border: "1px dashed #0D7A5F"
              }}
            >
              + Add Another Time
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs font-semibold mb-2 block" style={{ color: "#6B7280" }}>
            Special Instructions
            <span className="text-[11px] ml-1" style={{ color: "#9CA3AF" }}>(e.g., with food, before bed)</span>
          </label>
          <textarea
            placeholder="e.g., Take with meals, avoid dairy products"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            disabled={loading}
            className="w-full h-20 px-3 py-2 rounded-lg border bg-white text-sm disabled:opacity-50"
            style={{ borderColor: "#D1D5DB" }}
          />
        </div>

        <button type="submit" disabled={loading} className="w-full h-11 rounded-lg text-white text-sm font-semibold disabled:opacity-50" style={{ background: "#0D7A5F" }}>
          {loading ? "Adding..." : "Add Medication"}
        </button>
      </form>

      <div className="space-y-3">
        {meds.map((m) => (
          <div key={m.id} className="card-base p-4 flex items-center gap-4" style={{ borderLeft: "3px solid #0D7A5F" }}>
            <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "#E8F5F1" }}>
              <Pill size={18} color="#0D7A5F" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold" style={{ color: "#1A2332" }}>
                {m.name} <span style={{ color: "#6B7280", fontWeight: 500 }}>({m.quantity} {m.unit})</span>
              </div>
              <div className="text-xs mt-1" style={{ color: "#6B7280" }}>
                {m.frequency} • {Array.isArray(m.times) ? m.times.join(", ") : m.times}
              </div>
              {m.notes && (
                <div className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
                  📝 {m.notes}
                </div>
              )}
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

      {/* ── MEDICINE CHECKLIST TABLE ── */}
      <div className="card-base p-6 mt-6 mb-6">
        <h3 className="text-base font-semibold mb-4" style={{ color: "#1A2332" }}>Daily Medicine Checklist</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "2px solid #E8ECF0" }}>
                <th className="text-left py-3 px-3 font-semibold" style={{ color: "#6B7280" }}>Medicine Name</th>
                <th className="text-center py-3 px-3 font-semibold" style={{ color: "#6B7280" }}>Dose</th>
                <th className="text-center py-3 px-3 font-semibold" style={{ color: "#6B7280" }}>Time</th>
                <th className="text-center py-3 px-3 font-semibold" style={{ color: "#6B7280" }}>Frequency</th>
                <th className="text-center py-3 px-3 font-semibold" style={{ color: "#6B7280" }}>Status</th>
                <th className="text-center py-3 px-3 font-semibold" style={{ color: "#6B7280" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {meds.map((m) => (
                <tr key={m.id} style={{ borderBottom: "1px solid #EEF0F3" }} className="hover:bg-gray-50">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#F0FDF4" }}>
                        <Pill size={14} color="#0D7A5F" />
                      </div>
                      <span className="font-medium" style={{ color: "#1A2332" }}>{m.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center" style={{ color: "#6B7280" }}>{m.quantity} {m.unit}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium" style={{ background: "#F0F9FF", color: "#0369A1" }}>
                      <Clock size={12} /> {Array.isArray(m.times) ? m.times.join(", ") : m.times}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center text-xs" style={{ color: "#6B7280" }}>{m.frequency}</td>
                  <td className="py-3 px-3 text-center">
                    {m.status === "Taken" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "#DCFCE7", color: "#15803D" }}>
                        <Check size={12} /> Taken
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "#FEF3C7", color: "#D97706" }}>
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {m.status === "Taken" ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg" style={{ background: "#ECFDF5", color: "#15803D" }}>
                        <Check size={14} /> Done
                      </span>
                    ) : (
                      <button
                        onClick={() => markAsTaken(m.id, m.name)}
                        disabled={updating === m.id}
                        className="h-7 px-3 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                        style={{ background: "#0D7A5F" }}
                      >
                        {updating === m.id ? "Saving..." : "Mark Taken"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

function DietTab({
  dietPlan,
  conditions,
  editingConditions,
  tempConditions,
  onGenerate,
  onStartEditConditions,
  onToggleCondition,
  onSaveConditions,
  onCancelEditConditions,
  loading,
  savingConditions,
}: {
  dietPlan: any;
  conditions: string[];
  editingConditions: boolean;
  tempConditions: string[];
  onGenerate: () => void;
  onStartEditConditions: () => void;
  onToggleCondition: (id: string) => void;
  onSaveConditions: () => void;
  onCancelEditConditions: () => void;
  loading: boolean;
  savingConditions: boolean;
}) {
  // Medical Conditions Setup Section
  if (editingConditions) {
    return (
      <div className="card-base p-6">
        <div className="flex items-center gap-2 mb-6">
          <AlertCircle size={20} color="#0D7A5F" />
          <h3 className="text-lg font-semibold" style={{ color: "#1A2332" }}>
            Your Medical Conditions
          </h3>
        </div>

        <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
          Select all conditions that apply to you. This helps generate a personalized diet plan specific to your health needs.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {AVAILABLE_CONDITIONS.map((condition) => (
            <button
              key={condition.id}
              onClick={() => onToggleCondition(condition.id)}
              className="p-4 rounded-lg border-2 transition-all flex items-start gap-3"
              style={{
                borderColor: tempConditions.includes(condition.id) ? condition.color : "#E8ECF0",
                background: tempConditions.includes(condition.id)
                  ? `${condition.color}15`
                  : "#F7F8FA",
              }}
            >
              <div className="w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 mt-1" style={{
                borderColor: tempConditions.includes(condition.id) ? condition.color : "#D1D5DB",
                background: tempConditions.includes(condition.id) ? condition.color : "transparent",
              }}>
                {tempConditions.includes(condition.id) && (
                  <Check size={16} color="white" />
                )}
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold" style={{ color: "#1A2332" }}>
                  {condition.label}
                </div>
              </div>
            </button>
          ))}
        </div>

        {tempConditions.length > 0 && (
          <div className="p-4 rounded-lg mb-6" style={{ background: "#E8F5F1" }}>
            <p className="text-sm font-semibold mb-2" style={{ color: "#0D7A5F" }}>
              Selected Conditions:
            </p>
            <div className="flex flex-wrap gap-2">
              {tempConditions.map((cond) => {
                const condInfo = AVAILABLE_CONDITIONS.find((c) => c.id === cond);
                return (
                  <span
                    key={cond}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: "#0D7A5F33", color: "#0D7A5F" }}
                  >
                    {condInfo?.icon} {condInfo?.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancelEditConditions}
            disabled={savingConditions}
            className="flex-1 h-11 rounded-lg border text-sm font-semibold"
            style={{ borderColor: "#D1D5DB", color: "#374151" }}
          >
            Cancel
          </button>
          <button
            onClick={onSaveConditions}
            disabled={savingConditions || tempConditions.length === 0}
            className="flex-1 h-11 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: "#0D7A5F" }}
          >
            {savingConditions ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check size={16} />
                Save Conditions
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Show current conditions and option to edit
  if (!dietPlan) {
    return (
      <>
        {/* Current Conditions Card */}
        {conditions.length > 0 && (
          <div className="card-base p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold" style={{ color: "#1A2332" }}>
                Your Medical Conditions
              </h3>
              <button
                onClick={onStartEditConditions}
                className="text-xs px-3 py-1.5 rounded-lg border font-semibold hover:bg-gray-50 transition"
                style={{ borderColor: "#0D7A5F", color: "#0D7A5F" }}
              >
                Edit
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {conditions.map((cond) => {
                const condInfo = AVAILABLE_CONDITIONS.find((c) => c.id === cond);
                return (
                  <span
                    key={cond}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold"
                    style={{ background: `${condInfo?.color}20`, color: condInfo?.color }}
                  >
                    {condInfo?.icon} {condInfo?.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Generate Diet Plan Card */}
        <div className="card-base p-8 flex flex-col items-center justify-center text-center">
          <Sparkles size={32} color="#0D7A5F" className="mb-4" />
          <h3 className="text-lg font-semibold mb-2" style={{ color: "#1A2332" }}>
            {conditions.length === 0 ? "Set Your Medical Conditions" : "Generate Your Personalized Diet Plan"}
          </h3>
          <p className="text-sm mb-6" style={{ color: "#6B7280", maxWidth: "400px" }}>
            {conditions.length === 0
              ? "Start by selecting your medical conditions. This helps us create a diet plan specifically designed for your health needs."
              : "AI will create a disease-specific diet plan based on your medical conditions, age, and health metrics."}
          </p>
          <button
            onClick={conditions.length === 0 ? onStartEditConditions : onGenerate}
            disabled={loading}
            className="h-11 px-6 rounded-lg text-white text-sm font-semibold flex items-center gap-2"
            style={{ background: "#0D7A5F" }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                {conditions.length === 0 ? "Set Conditions" : "Generate Diet Plan"}
              </>
            )}
          </button>
        </div>
      </>
    );
  }

  // Show generated diet plan
  return (
    <>
      {/* Header Section */}
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold mb-1" style={{ color: "#1A2332" }}>
              📋 Your Personalized Diet Plan
            </h3>
            <p className="text-xs" style={{ color: "#6B7280" }}>
              Customized for: <span className="font-semibold" style={{ color: "#0D7A5F" }}>{conditions.join(", ")}</span>
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={onStartEditConditions}
              className="h-9 px-3 rounded-md border text-xs font-semibold whitespace-nowrap"
              style={{ borderColor: "#0D7A5F", color: "#0D7A5F" }}
            >
              Edit Conditions
            </button>
            <button
              onClick={onGenerate}
              disabled={loading}
              className="h-9 px-3 rounded-md border text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap"
              style={{ borderColor: "#0D7A5F", color: "#0D7A5F" }}
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {loading ? "Regenerating..." : "Regenerate"}
            </button>
          </div>
        </div>
      </div>

      {/* Daily Goals Section */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold mb-3" style={{ color: "#1A2332" }}>Daily Nutrition Goals</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card-base p-4 text-center rounded-lg">
            <div className="text-3xl font-bold mb-1" style={{ color: "#0D7A5F" }}>
              {dietPlan.dailyGoals?.calories || 2000}
            </div>
            <div className="text-xs font-medium" style={{ color: "#6B7280" }}>Calories/day</div>
          </div>
          <div className="card-base p-4 text-center rounded-lg">
            <div className="text-3xl font-bold mb-1" style={{ color: "#0D7A5F" }}>
              {dietPlan.dailyGoals?.carbs || 225}<span className="text-lg">g</span>
            </div>
            <div className="text-xs font-medium" style={{ color: "#6B7280" }}>Carbohydrates</div>
          </div>
          <div className="card-base p-4 text-center rounded-lg">
            <div className="text-3xl font-bold mb-1" style={{ color: "#0D7A5F" }}>
              {dietPlan.dailyGoals?.protein || 50}<span className="text-lg">g</span>
            </div>
            <div className="text-xs font-medium" style={{ color: "#6B7280" }}>Protein</div>
          </div>
          <div className="card-base p-4 text-center rounded-lg">
            <div className="text-3xl font-bold mb-1" style={{ color: "#0D7A5F" }}>
              {dietPlan.dailyGoals?.fat || 65}<span className="text-lg">g</span>
            </div>
            <div className="text-xs font-medium" style={{ color: "#6B7280" }}>Fat</div>
          </div>
        </div>
      </div>

      {/* Weekly Meals Section */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold mb-3" style={{ color: "#1A2332" }}>Weekly Meal Plan</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dietPlan.days &&
            dietPlan.days.map((day: any) => (
              <div key={day.day} className="card-base p-4 rounded-lg">
                <h4 className="text-sm font-bold mb-3 pb-2 border-b-2" style={{ color: "#1A2332", borderColor: "#0D7A5F" }}>
                  {day.day}
                </h4>
                {["breakfast", "lunch", "dinner", "snack"].map((mealType) => {
                  const meal = day[mealType];
                  return (
                    <div key={mealType} className="mb-3 pb-3 border-b last:border-b-0 last:mb-0 last:pb-0" style={{ borderColor: "#E8ECF0" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="capitalize text-sm font-semibold flex-1" style={{ color: "#0D7A5F" }}>
                          {mealType}
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full whitespace-nowrap" style={{ background: "#E8F5F1", color: "#0D7A5F" }}>
                          {meal.calories} kcal
                        </span>
                      </div>
                      <ul className="text-xs space-y-1" style={{ color: "#6B7280" }}>
                        {meal.items?.map((item: string, idx: number) => (
                          <li key={idx}>• {item}</li>
                        ))}
                      </ul>
                      <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
                        {meal.reason}
                      </p>
                    </div>
                  );
                })}
              </div>
            ))}
        </div>
      </div>

      {/* Foods to Include/Avoid Section */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold mb-3" style={{ color: "#1A2332" }}>Dietary Guidelines</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card-base p-4 rounded-lg" style={{ borderLeft: "4px solid #0D7A5F" }}>
            <h5 className="text-sm font-bold mb-3" style={{ color: "#0D7A5F" }}>
              ✅ Foods to Include
            </h5>
            <ul className="space-y-2">
              {dietPlan.foodsToInclude?.map((food: string, idx: number) => (
                <li key={idx} className="text-sm flex items-start gap-2" style={{ color: "#374151" }}>
                  <span style={{ color: "#0D7A5F", fontWeight: "bold" }}>✓</span>
                  <span>{food}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card-base p-4 rounded-lg" style={{ borderLeft: "4px solid #EF4444" }}>
            <h5 className="text-sm font-bold mb-3" style={{ color: "#EF4444" }}>
              ❌ Foods to Avoid
            </h5>
            <ul className="space-y-2">
              {dietPlan.foodsToAvoid?.map((food: string, idx: number) => (
                <li key={idx} className="text-sm flex items-start gap-2" style={{ color: "#374151" }}>
                  <span style={{ color: "#EF4444", fontWeight: "bold" }}>✕</span>
                  <span>{food}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Exercise & Hydration Section */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold mb-3" style={{ color: "#1A2332" }}>Lifestyle Recommendations</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dietPlan.exercise && (
            <div className="card-base p-4 rounded-lg" style={{ borderLeft: "4px solid #B45309" }}>
              <div className="flex items-center gap-2 mb-2">
                <Footprints size={18} style={{ color: "#B45309" }} />
                <h5 className="text-sm font-bold" style={{ color: "#B45309" }}>
                  Physical Activity
                </h5>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold" style={{ color: "#1A2332" }}>
                  {dietPlan.exercise.activity}
                </p>
                <p className="text-xs" style={{ color: "#6B7280" }}>
                  📅 {dietPlan.exercise.frequency} • ⏰ {dietPlan.exercise.timing}
                </p>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>
                  {dietPlan.exercise.benefits}
                </p>
              </div>
            </div>
          )}

          {dietPlan.hydration && (
            <div className="card-base p-4 rounded-lg" style={{ borderLeft: "4px solid #0369A1" }}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ fontSize: "20px" }}>💧</span>
                <h5 className="text-sm font-bold" style={{ color: "#0369A1" }}>
                  Hydration
                </h5>
              </div>
              <p className="text-sm font-semibold" style={{ color: "#1A2332" }}>
                {dietPlan.hydration}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function CaloriesTab({ userId, conditions }: { userId: string | null; conditions: string[] }) {
  if (!userId) {
    return (
      <div className="card-base p-8 text-center">
        <p className="text-sm" style={{ color: "#6B7280" }}>
          Please log in to use the calorie tracker
        </p>
      </div>
    );
  }

  // Set daily goals based on conditions
  const getDailyGoals = () => {
    const baseGoals = { calories: 2000, carbs: 225, protein: 50, fat: 65 };

    if (conditions.includes("Diabetes")) {
      return { calories: 1800, carbs: 180, protein: 55, fat: 60 };
    }
    if (conditions.includes("Hypertension")) {
      return { calories: 1900, carbs: 210, protein: 50, fat: 55 };
    }
    if (conditions.includes("CKD")) {
      return { calories: 1800, carbs: 200, protein: 40, fat: 60 };
    }

    return baseGoals;
  };

  return <CalorieTracker userId={userId} condition={conditions[0]} dailyGoals={getDailyGoals()} />;
}
