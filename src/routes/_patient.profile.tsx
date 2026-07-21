import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Camera, Loader2, CheckCircle2 } from "lucide-react";
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

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  };

  const initials = fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

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

        {/* ── Feature A: ABHA ID ── */}
        <Section title="ABHA ID (Ayushman Bharat Health Account)">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="ABHA ID" value={abhaId} onChange={setAbhaId} placeholder="e.g. 12-3456-7890-1234" />
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "#374151" }}>Verification Status</label>
              <div className="flex items-center gap-2 h-11 px-3 rounded-xl border" style={{ borderColor: "#D1D5DB", background: "#F7F8FA" }}>
                <div className="w-2 h-2 rounded-full" style={{ background: abhaVerified ? "#15803D" : "#9CA3AF" }} />
                <span className="text-sm" style={{ color: abhaVerified ? "#15803D" : "#6B7280" }}>
                  {abhaVerified ? "Verified" : "Not Verified"}
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs mt-2" style={{ color: "#6B7280" }}>ABHA ID helps you access government health schemes and portals. Verify your ID at <a href="https://abha.abdm.gov.in" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "#0D7A5F" }}>abha.abdm.gov.in</a></p>
        </Section>

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

        {/* ── Feature F: Government Scheme Eligibility ── */}
        <Section title="Government Scheme Eligibility">
          <p className="text-xs mb-3" style={{ color: "#6B7280" }}>Help us determine your eligibility for government health schemes</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "#374151" }}>Income Category</label>
              <select value={incomeCategory} onChange={(e) => setIncomeCategory(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border bg-white text-sm outline-none" style={{ borderColor: "#D1D5DB" }}>
                {["below_poverty", "low", "middle", "high"].map((ic) => (
                  <option key={ic} value={ic}>
                    {ic === "below_poverty" ? "Below Poverty Line" : ic === "low" ? "Low Income" : ic === "middle" ? "Middle Income" : "High Income"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "#374151" }}>Employment Type</label>
              <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border bg-white text-sm outline-none" style={{ borderColor: "#D1D5DB" }}>
                {["employed", "self_employed", "unemployed", "student", "retired"].map((et) => (
                  <option key={et} value={et}>
                    {et === "self_employed" ? "Self-Employed" : et.charAt(0).toUpperCase() + et.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Field label="State" value={state} onChange={setState} placeholder="Maharashtra" />
            <Field label="City" value={city} onChange={setCity} placeholder="Mumbai" />
          </div>
          <div className="mt-4 p-3 rounded-lg" style={{ background: "#F0F9FF" }}>
            <p className="text-xs" style={{ color: "#0369A1" }}>
              Based on your information, you may be eligible for schemes like Ayushman Bharat, PMJAY, and state-specific health programs. Check eligibility on government portals.
            </p>
          </div>
        </Section>

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
