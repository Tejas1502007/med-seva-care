import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Camera, Loader2, CheckCircle2, Users, Copy, AlertCircle, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_patient/profile")({
  head: () => ({ meta: [{ title: "Profile — MedSeva" }] }),
  component: ProfilePage,
});

const CHRONIC_DISEASES = [
  "Diabetes", "Hypertension", "Asthma", "Heart Disease", "Thyroid",
  "Kidney Disease", "Liver Disease", "Arthritis", "Cancer", "COPD",
  "Mental Health", "Other",
];
const ALLERGY_OPTIONS = ["Medicine Allergy", "Food Allergy", "Dust", "Pollen", "Latex", "Other"];
const ADDICTION_OPTIONS = ["Smoking", "Tobacco", "Alcohol", "Drugs", "None"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function ProfilePage() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Personal
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Male");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [altPhone, setAltPhone] = useState("");
  const [address, setAddress] = useState("");

  // Emergency
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  // Medical
  const [conditions, setConditions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [addictions, setAddictions] = useState<string[]>([]);

  // Feature A: ABHA ID
  const [abhaId, setAbhaId] = useState("");
  const [abhaVerified, setAbhaVerified] = useState(false);

  // Feature F: Government Schemes
  const [incomeCategory, setIncomeCategory] = useState("middle");
  const [employmentType, setEmploymentType] = useState("employed");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");

  // Patient code + ABHA input
  const [patientCode, setPatientCode] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [abhaInput, setAbhaInput] = useState("");
  const [savingAbha, setSavingAbha] = useState(false);
  const [editingAbha, setEditingAbha] = useState(false);

  // Feature H: Caregiver
  const [caregiverName, setCaregiverName] = useState("");
  const [caregiverPhone, setCaregiverPhone] = useState("");
  const [caregiverRelation, setCaregiverRelation] = useState("Family Member");

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [{ data: profile }, { data: patient }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("patient_profiles").select("*").eq("id", user.id).single(),
      ]);
      if (profile) {
        setFullName(profile.full_name ?? "");
        setAvatarUrl(profile.avatar_url ?? null);
        setPhone(profile.phone ?? "");
        setEmail(profile.email ?? "");
      }
      if (patient) {
        setDob((patient as never as { dob: string | null }).dob ?? "");
        setGender(patient.gender ?? "Male");
        setBloodGroup(patient.blood_group ?? "O+");
        setHeight(String((patient as never as { height: number | null }).height ?? ""));
        setWeight(String((patient as never as { weight: number | null }).weight ?? ""));
        setAltPhone((patient as never as { alternate_phone: string | null }).alternate_phone ?? "");
        setAddress((patient as never as { address: string | null }).address ?? "");
        setConditions(patient.conditions ?? []);
        setAllergies(patient.allergies ?? []);
        setAddictions((patient as never as { addictions: string[] }).addictions ?? []);
        const ec = patient.emergency_contact as { name?: string; phone?: string } | null;
        setEmergencyName(ec?.name ?? "");
        setEmergencyPhone(ec?.phone ?? "");
        setAbhaId((patient as never as { abha_id: string | null }).abha_id ?? "");
        setAbhaVerified((patient as never as { abha_verified: boolean }).abha_verified ?? false);
        const loadedAbha = (patient as never as { abha_id: string | null }).abha_id ?? "";
        setAbhaId(loadedAbha);
        setAbhaInput(loadedAbha);
        setAbhaVerified((patient as never as { abha_verified: boolean }).abha_verified ?? false);
        setPatientCode((patient as never as { patient_code: string | null }).patient_code ?? null);
        setIncomeCategory((patient as never as { income_category: string }).income_category ?? "middle");
        setEmploymentType((patient as never as { employment_type: string }).employment_type ?? "employed");
        setState((patient as never as { state: string | null }).state ?? "");
        setCity((patient as never as { city: string | null }).city ?? "");
        const cg = patient.caregiver as { name?: string; phone?: string; relation?: string } | null;
        setCaregiverName(cg?.name ?? "");
        setCaregiverPhone(cg?.phone ?? "");
        setCaregiverRelation(cg?.relation ?? "Family Member");
      }
      setLoading(false);
    })();
  }, [user]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload failed"); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
    setAvatarUrl(publicUrl);
    toast.success("Photo updated");
    setUploading(false);
  };

  const save = async () => {
    if (!user) return;
    if (!fullName.trim()) { toast.error("Full name is required"); return; }
    setSaving(true);
    const [r1, r2] = await Promise.all([
      supabase.from("profiles").update({
        full_name: fullName,
        phone: phone || null,
      }).eq("id", user.id),
      supabase.from("patient_profiles").upsert({
        id: user.id,
        dob: dob || null,
        gender: gender as "Male" | "Female" | "Other",
        blood_group: bloodGroup,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        alternate_phone: altPhone || null,
        address: address || null,
        conditions,
        allergies,
        addictions,
        emergency_contact: emergencyName || emergencyPhone
          ? { name: emergencyName, phone: emergencyPhone }
          : null,
        abha_id: abhaId || null,
        abha_verified: abhaVerified,
        income_category: incomeCategory,
        employment_type: employmentType,
        state: state || null,
        city: city || null,
        caregiver: caregiverName || caregiverPhone
          ? { name: caregiverName, phone: caregiverPhone, relation: caregiverRelation }
          : null,
      } as never),
    ]);
    setSaving(false);
    if (r1.error || r2.error) { toast.error("Failed to save profile"); return; }
    toast.success("Profile saved successfully");
  };

  const generatePatientCode = async () => {
    if (!user) return;
    setGeneratingCode(true);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { error } = await (supabase as any)
      .from("patient_profiles")
      .update({ patient_code: code })
      .eq("id", user.id);
    if (error) { toast.error("Failed to generate code"); }
    else { setPatientCode(code); toast.success("Patient code generated!"); }
    setGeneratingCode(false);
  };

  const saveAbha = async () => {
    if (!user) return;
    const cleaned = abhaInput.replace(/\D/g, "");
    if (cleaned.length !== 14) { toast.error("ABHA ID must be 14 digits"); return; }
    setSavingAbha(true);
    const formatted = `${cleaned.slice(0,2)}-${cleaned.slice(2,6)}-${cleaned.slice(6,10)}-${cleaned.slice(10,14)}`;
    const { error } = await (supabase as any)
      .from("patient_profiles")
      .update({ abha_id: formatted })
      .eq("id", user.id);
    if (error) { toast.error("Failed to save ABHA ID"); }
    else { setAbhaId(formatted); setAbhaInput(formatted); setEditingAbha(false); toast.success("ABHA ID saved"); }
    setSavingAbha(false);
  };

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  };

  const initials = fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  // ── Scheme eligibility ──────────────────────────────────────────────────────
  const age = dob ? Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
  const inc = incomeCategory.toLowerCase();
  const emp = employmentType.toLowerCase();
  const st  = state.toLowerCase();

  type SchemeStatus = "ELIGIBLE" | "LIKELY";
  interface Scheme { name: string; coverage: string; status: SchemeStatus; color: string; basis: string; covers: string; applyUrl: string; applyLabel: string }
  const eligibleSchemes: Scheme[] = [];

  if (inc === "bpl" || inc === "ews" || inc === "below_poverty") {
    eligibleSchemes.push({ name: "Ayushman Bharat PM-JAY", coverage: "₹5,00,000/year per family", status: "ELIGIBLE", color: "#15803D", basis: "Based on your income category", covers: "Hospitalization, surgery, ICU — covers Diabetes & Hypertension", applyUrl: "https://beneficiary.nha.gov.in", applyLabel: "Check on PM-JAY Portal" });
  }
  if ((st.includes("maharashtra") || st.includes("mh")) && (inc === "bpl" || inc === "ews" || inc === "below_poverty" || inc === "low" || inc === "lower_middle")) {
    eligibleSchemes.push({ name: "MJPJAY Maharashtra", coverage: "₹1,50,000/year", status: "ELIGIBLE", color: "#15803D", basis: "Based on your Maharashtra residence", covers: "Hospitalization at government & empanelled hospitals", applyUrl: "https://www.jeevandayee.gov.in", applyLabel: "Apply on Jeevandayee Portal" });
  }
  if ((inc === "bpl" || inc === "ews" || inc === "below_poverty") && (st.includes("gujarat") || st.includes("gj"))) {
    eligibleSchemes.push({ name: "MA Yojana Gujarat", coverage: "₹5,00,000/year", status: "ELIGIBLE", color: "#15803D", basis: "Based on Gujarat residence and income", covers: "Hospitalization at government hospitals", applyUrl: "https://www.magujarat.com", applyLabel: "Apply on MA Yojana Portal" });
  }
  if (emp === "central_govt" || emp === "central_govt_retired") {
    eligibleSchemes.push({ name: "CGHS", coverage: "Unlimited OPD + IPD", status: "ELIGIBLE", color: "#15803D", basis: "Based on Central Government employment", covers: "All medical care at CGHS empanelled hospitals across India", applyUrl: "https://cghs.gov.in", applyLabel: "Apply on CGHS Portal" });
  }
  if (emp === "private_salaried") {
    eligibleSchemes.push({ name: "ESI Scheme", coverage: "Complete medical care for family", status: "LIKELY", color: "#B45309", basis: "Based on private salaried employment", covers: "OPD, IPD, specialist care — if employer is registered under ESIC", applyUrl: "https://esic.in", applyLabel: "Check ESIC Registration" });
  }
  if (age && age >= 18 && age <= 70) {
    eligibleSchemes.push({ name: "PM Suraksha Bima Yojana", coverage: "₹2,00,000 accident cover", status: "ELIGIBLE", color: "#15803D", basis: "Available to all Indians aged 18–70", covers: "Accidental death & disability — only ₹12/year premium", applyUrl: "https://jansuraksha.gov.in", applyLabel: "Apply via your bank" });
  }

  const profileIncomplete = !incomeCategory || incomeCategory === "middle" && !state;

  interface InsurancePlan { name: string; insurer: string; premium: string; tag: string; highlight: string; url: string }
  const suggestions: InsurancePlan[] = [];
  const hasDiabetes     = conditions.some((c) => c.toLowerCase().includes("diabet"));
  const hasHypertension = conditions.some((c) => c.toLowerCase().includes("hypertens") || c.toLowerCase().includes("blood pressure"));
  const hasCKD          = conditions.some((c) => c.toLowerCase().includes("kidney"));

  if (hasDiabetes)                       suggestions.push({ name: "Star Health Diabetes Safe",            insurer: "Star Health",      premium: "~₹8,000–15,000/yr",  tag: "For Diabetics",       highlight: "No waiting period for diabetes complications",              url: "https://starhealth.in" });
  if (hasHypertension && !hasDiabetes)   suggestions.push({ name: "Aditya Birla Activ Health Platinum",  insurer: "Aditya Birla",     premium: "~₹10,000–18,000/yr", tag: "For Hypertension",    highlight: "Chronic management program + wellness benefits",            url: "https://adityabirlacapital.com" });
  if (hasCKD)                            suggestions.push({ name: "Niva Bupa ReAssure",                   insurer: "Niva Bupa",        premium: "~₹12,000–22,000/yr", tag: "Covers Kidney Disease", highlight: "Covers dialysis and transplantation",                      url: "https://nivabupa.com" });
  if (age && age > 55)                   suggestions.push({ name: "Care Senior",                          insurer: "Care Health",      premium: "~₹12,000–20,000/yr", tag: "Senior Citizen",      highlight: "Pre-existing conditions covered from year 1",              url: "https://careinsurance.com" });
  suggestions.push({ name: "Niva Bupa ReAssure", insurer: "Niva Bupa", premium: "~₹7,000–12,000/yr", tag: "Comprehensive", highlight: "No room rent capping, restore benefit", url: "https://nivabupa.com" });

  const uniqueSuggestions = suggestions.filter((s, i, arr) => arr.findIndex((x) => x.name === s.name) === i).slice(0, 3);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin" style={{ color: "#0D7A5F" }} />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 page-enter max-w-5xl mx-auto">
      <h1 className="text-[22px] font-bold mb-6" style={{ color: "#1A2332" }}>My Profile</h1>

      <div className="space-y-5">

        {/* ── Personal Information ── */}
        <Section title="Personal Information">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-2">
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
                  style={{ background: "#E8F5F1", color: "#0D7A5F" }}>{initials}</div>
              )}
              <button onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white border flex items-center justify-center"
                style={{ borderColor: "#E8ECF0" }}>
                {uploading ? <Loader2 size={12} className="animate-spin" style={{ color: "#0D7A5F" }} /> : <Camera size={13} color="#0D7A5F" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: "#1A2332" }}>Profile Photo</div>
              <div className="text-xs" style={{ color: "#6B7280" }}>JPG, PNG up to 5MB</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name *" value={fullName} onChange={setFullName} placeholder="Rajesh Sharma" />
            <Field label="Date of Birth" value={dob} onChange={setDob} type="date" />
          </div>

          <div>
            <span className="text-sm font-medium block mb-1.5" style={{ color: "#374151" }}>Gender</span>
            <div className="flex p-1 rounded-lg" style={{ background: "#F3F4F6" }}>
              {["Male", "Female", "Other"].map((g) => (
                <button key={g} type="button" onClick={() => setGender(g)}
                  className="flex-1 h-9 rounded-md text-sm font-medium transition-all"
                  style={{ background: gender === g ? "#fff" : "transparent", color: gender === g ? "#0D7A5F" : "#6B7280" }}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "#374151" }}>Blood Group</label>
              <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border bg-white text-sm outline-none" style={{ borderColor: "#D1D5DB" }}>
                {BLOOD_GROUPS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
            <Field label="Height (cm)" value={height} onChange={setHeight} placeholder="170" type="number" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Weight (kg)" value={weight} onChange={setWeight} placeholder="70" type="number" />
            <Field label="Mobile Number" value={phone} onChange={setPhone} placeholder="+91 98765 43210" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Email" value={email} onChange={setEmail} type="email" readOnly />
            <Field label="Alternate Mobile" value={altPhone} onChange={setAltPhone} placeholder="+91 98765 00000" />
          </div>

          <Field label="Address" value={address} onChange={setAddress} placeholder="123, MG Road, Mumbai, Maharashtra" />
        </Section>

        {/* ── Section 1: Patient Code ── */}
        <div className="card-base p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} color="#0D7A5F" />
            <h3 className="text-base font-semibold" style={{ color: "#1A2332" }}>Your Patient Code</h3>
          </div>
          {patientCode ? (
            <div className="flex flex-col items-center py-4 gap-3">
              <div className="font-mono text-[34px] font-bold tracking-[0.25em]" style={{ color: "#0D7A5F" }}>
                {patientCode}
              </div>
              <p className="text-xs text-center max-w-xs" style={{ color: "#6B7280" }}>
                Share this code with a family member to give them caregiver access
              </p>
              <button
                onClick={() => { navigator.clipboard.writeText(patientCode); toast.success("Copied!"); }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border text-xs font-semibold transition-colors hover:bg-[#E8F5F1]"
                style={{ borderColor: "#0D7A5F", color: "#0D7A5F" }}>
                <Copy size={13} /> Copy Code
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center py-4 gap-3">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#F3F4F6" }}>
                <Users size={24} color="#9CA3AF" />
              </div>
              <p className="text-sm text-center" style={{ color: "#6B7280" }}>No patient code yet</p>
              <button
                onClick={generatePatientCode}
                disabled={generatingCode}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
                style={{ background: "#0D7A5F" }}>
                {generatingCode ? <Loader2 size={14} className="animate-spin" /> : null}
                {generatingCode ? "Generating…" : "Generate Code"}
              </button>
            </div>
          )}
        </div>

        {/* ── Section 2: ABHA ID ── */}
        {!abhaId || editingAbha ? (
          <div className="rounded-xl border-l-4 p-6 space-y-4" style={{ borderColor: "#0D7A5F", background: "#F0FDF9", borderWidth: "1px", borderLeftWidth: "4px" }}>
            <div>
              <h3 className="text-base font-semibold" style={{ color: "#1A2332" }}>Link Your ABHA Health ID</h3>
              <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
                Your ABHA ID connects your records across all government hospitals and ABDM-registered providers
              </p>
            </div>
            <div className="flex gap-2">
              <input
                value={abhaInput}
                onChange={(e) => setAbhaInput(e.target.value)}
                placeholder="XX-XXXX-XXXX-XXXX"
                maxLength={17}
                className="flex-1 h-11 px-3 rounded-xl border outline-none text-sm"
                style={{ borderColor: "#D1D5DB" }}
                onFocus={(e) => e.currentTarget.style.borderColor = "#0D7A5F"}
                onBlur={(e) => e.currentTarget.style.borderColor = "#D1D5DB"}
              />
              <button
                onClick={saveAbha}
                disabled={savingAbha}
                className="h-11 px-4 rounded-xl text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
                style={{ background: "#0D7A5F" }}>
                {savingAbha ? <Loader2 size={14} className="animate-spin" /> : null}
                Save
              </button>
              {editingAbha && (
                <button onClick={() => setEditingAbha(false)} className="h-11 px-3 rounded-xl border text-sm" style={{ borderColor: "#D1D5DB", color: "#6B7280" }}>
                  Cancel
                </button>
              )}
            </div>
            <a href="https://abdm.gov.in" target="_blank" rel="noopener noreferrer"
              className="text-xs inline-flex items-center gap-1 hover:underline" style={{ color: "#0D7A5F" }}>
              Don't have one? Get free ABHA at abdm.gov.in <ExternalLink size={10} />
            </a>
          </div>
        ) : (
          <div className="card-base p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold" style={{ color: "#6B7280" }}>ABHA Health ID</span>
              <div className="flex items-center gap-2">
                {abhaVerified ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: "#F0FDF4", color: "#15803D" }}>
                    <CheckCircle2 size={10} /> Verified
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FFFBEB", color: "#B45309" }}>
                    Saved
                  </span>
                )}
                <button onClick={() => { setAbhaInput(abhaId); setEditingAbha(true); }} className="text-xs hover:underline" style={{ color: "#0D7A5F" }}>
                  Update
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[20px] font-bold tracking-wide" style={{ color: "#0D7A5F" }}>{abhaId}</span>
              <button onClick={() => { navigator.clipboard.writeText(abhaId); toast.success("Copied!"); }}
                className="p-1.5 rounded-lg hover:bg-[#E8F5F1] transition-colors">
                <Copy size={14} color="#0D7A5F" />
              </button>
            </div>
            <p className="text-xs mt-2" style={{ color: "#9CA3AF" }}>
              Your ABHA ID links your health records across India's ABDM network
            </p>
          </div>
        )}

        {/* ── Emergency Contact ── */}
        <Section title="Emergency Contact">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Contact Name" value={emergencyName} onChange={setEmergencyName} placeholder="Priya Sharma" />
            <Field label="Contact Number" value={emergencyPhone} onChange={setEmergencyPhone} placeholder="+91 98765 11111" />
          </div>
        </Section>

        {/* ── Feature H: Caregiver Information ── */}
        <Section title="Caregiver Information">
          <p className="text-xs mb-3" style={{ color: "#6B7280" }}>Add a family member or caregiver who can help monitor your health</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Caregiver Name" value={caregiverName} onChange={setCaregiverName} placeholder="e.g. Priya Sharma" />
            <Field label="Caregiver Phone" value={caregiverPhone} onChange={setCaregiverPhone} placeholder="+91 98765 11111" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: "#374151" }}>Relationship</label>
            <select value={caregiverRelation} onChange={(e) => setCaregiverRelation(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border bg-white text-sm outline-none" style={{ borderColor: "#D1D5DB" }}>
              {["Spouse", "Parent", "Child", "Sibling", "Friend", "Family Member", "Other"].map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
        </Section>

        {/* ── Social & Location (feeds scheme eligibility) ── */}
        <Section title="Social & Location">
          <p className="text-xs mb-1" style={{ color: "#6B7280" }}>Used to calculate your government scheme eligibility</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "#374151" }}>Income Category</label>
              <select value={incomeCategory} onChange={(e) => setIncomeCategory(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border bg-white text-sm outline-none" style={{ borderColor: "#D1D5DB" }}>
                {[
                  { v: "bpl",          l: "Below Poverty Line (BPL)" },
                  { v: "ews",          l: "Economically Weaker Section (EWS)" },
                  { v: "below_poverty",l: "Below Poverty Line" },
                  { v: "low",          l: "Low Income" },
                  { v: "lower_middle", l: "Lower Middle Income" },
                  { v: "middle",       l: "Middle Income" },
                  { v: "high",         l: "High Income" },
                ].map(({ v, l }) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "#374151" }}>Employment Type</label>
              <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border bg-white text-sm outline-none" style={{ borderColor: "#D1D5DB" }}>
                {[
                  { v: "private_salaried",      l: "Private Salaried" },
                  { v: "central_govt",           l: "Central Government" },
                  { v: "central_govt_retired",   l: "Central Govt (Retired)" },
                  { v: "state_govt",             l: "State Government" },
                  { v: "self_employed",          l: "Self-Employed" },
                  { v: "employed",               l: "Employed (Other)" },
                  { v: "unemployed",             l: "Unemployed" },
                  { v: "student",                l: "Student" },
                  { v: "retired",                l: "Retired" },
                ].map(({ v, l }) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
            <Field label="State" value={state} onChange={setState} placeholder="Maharashtra" />
            <Field label="City" value={city} onChange={setCity} placeholder="Mumbai" />
          </div>
        </Section>

        {/* ── Section 3: Health Benefits & Coverage ── */}
        <div className="card-base p-6 space-y-5">
          <div>
            <h3 className="text-base font-semibold" style={{ color: "#1A2332" }}>Health Benefits &amp; Coverage</h3>
            <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>Based on your profile</p>
          </div>

          {profileIncomplete && eligibleSchemes.length === 0 ? (
            <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "#F0F9FF", border: "1px solid #BAE6FD" }}>
              <AlertCircle size={16} color="#0369A1" className="mt-0.5 shrink-0" />
              <p className="text-sm" style={{ color: "#0369A1" }}>
                Complete your income category, state, and date of birth to see your eligible government schemes.
              </p>
            </div>
          ) : eligibleSchemes.length === 0 ? (
            <p className="text-sm" style={{ color: "#6B7280" }}>No schemes matched your current profile. Update income category, state, or employment type to check eligibility.</p>
          ) : (
            <div className="space-y-3">
              {eligibleSchemes.map((scheme) => (
                <div key={scheme.name} className="rounded-xl border p-4 flex items-start gap-4" style={{ borderColor: "#EEF0F3", background: "#FFFFFF" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: scheme.status === "ELIGIBLE" ? "#F0FDF4" : "#FFFBEB" }}>
                    {scheme.status === "ELIGIBLE"
                      ? <CheckCircle2 size={18} color="#15803D" />
                      : <AlertCircle size={18} color="#B45309" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <div className="text-sm font-semibold" style={{ color: "#1A2332" }}>{scheme.name}</div>
                        <div className="text-base font-bold mt-0.5" style={{ color: "#0D7A5F" }}>{scheme.coverage}</div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: "#9CA3AF" }}>{scheme.basis}</div>
                        <div className="text-xs mt-1" style={{ color: "#374151" }}>{scheme.covers}</div>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: scheme.status === "ELIGIBLE" ? "#F0FDF4" : "#FFFBEB", color: scheme.color }}>
                        {scheme.status}
                      </span>
                    </div>
                    <a href={scheme.applyUrl} target="_blank" rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                      style={{ color: "#0D7A5F" }}>
                      {scheme.applyLabel} <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Insurance subsection */}
          {(conditions.length > 0 || (age && age > 0)) && (
            <div className="pt-2 border-t" style={{ borderColor: "#EEF0F3" }}>
              <div className="text-sm font-semibold mb-3" style={{ color: "#6B7280" }}>Recommended Insurance Plans</div>
              <div className="space-y-3">
                {uniqueSuggestions.map((plan) => (
                  <div key={plan.name} className="rounded-xl border p-4 flex items-start justify-between gap-4" style={{ borderColor: "#EEF0F3" }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-bold" style={{ color: "#1A2332" }}>{plan.name}</span>
                        <span className="text-xs" style={{ color: "#6B7280" }}>{plan.insurer}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#E8F5F1", color: "#0D7A5F" }}>{plan.premium}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: "#374151" }}>{plan.tag}</span>
                      </div>
                      <div className="text-xs" style={{ color: "#374151" }}>{plan.highlight}</div>
                    </div>
                    <a href={plan.url} target="_blank" rel="noopener noreferrer"
                      className="shrink-0 text-xs font-semibold inline-flex items-center gap-1 hover:underline whitespace-nowrap"
                      style={{ color: "#0D7A5F" }}>
                      View Plan <ExternalLink size={10} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Chronic Diseases ── */}
        <Section title="Chronic Diseases">
          <p className="text-xs mb-3" style={{ color: "#9CA3AF" }}>Select all that apply</p>
          <div className="flex flex-wrap gap-2">
            {CHRONIC_DISEASES.map((c) => (
              <ChipButton key={c} label={c} active={conditions.includes(c)}
                onClick={() => toggleItem(conditions, setConditions, c)} />
            ))}
          </div>
        </Section>

        {/* ── Allergies ── */}
        <Section title="Allergies">
          <p className="text-xs mb-3" style={{ color: "#9CA3AF" }}>Select all that apply</p>
          <div className="flex flex-wrap gap-2">
            {ALLERGY_OPTIONS.map((a) => (
              <ChipButton key={a} label={a} active={allergies.includes(a)}
                onClick={() => toggleItem(allergies, setAllergies, a)} />
            ))}
          </div>
        </Section>

        {/* ── Addiction ── */}
        <Section title="Addiction / Substance Use">
          <p className="text-xs mb-3" style={{ color: "#9CA3AF" }}>Select all that apply</p>
          <div className="flex flex-wrap gap-2">
            {ADDICTION_OPTIONS.map((a) => (
              <ChipButton key={a} label={a} active={addictions.includes(a)}
                onClick={() => {
                  if (a === "None") {
                    setAddictions(addictions.includes("None") ? [] : ["None"]);
                  } else {
                    const next = addictions.filter((x) => x !== "None");
                    toggleItem(next, setAddictions, a);
                  }
                }} />
            ))}
          </div>
        </Section>

        {/* Save */}
        <button onClick={save} disabled={saving}
          className="w-full h-12 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90 transition-opacity"
          style={{ background: "#0D7A5F" }}>
          {saving && <Loader2 size={15} className="animate-spin" />}
          {saving ? "Saving…" : "Save Profile"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-base p-6 space-y-4">
      <h3 className="text-base font-semibold" style={{ color: "#1A2332" }}>{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", readOnly = false }: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; type?: string; readOnly?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1.5" style={{ color: "#374151" }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder} readOnly={readOnly}
        className="w-full h-11 px-3 rounded-xl border outline-none text-sm transition-all"
        style={{ borderColor: "#D1D5DB", color: "#1A2332", background: readOnly ? "#F7F8FA" : "#fff" }}
        onFocus={(e) => { if (!readOnly) { e.currentTarget.style.borderColor = "#0D7A5F"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13,122,95,0.1)"; } }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "#D1D5DB"; e.currentTarget.style.boxShadow = "none"; }} />
    </div>
  );
}

function ChipButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="px-4 h-9 rounded-xl border text-sm font-medium transition-all"
      style={{
        background: active ? "#E8F5F1" : "#fff",
        borderColor: active ? "#0D7A5F" : "#E8ECF0",
        color: active ? "#0D7A5F" : "#374151",
      }}>
      {label}
    </button>
  );
}
