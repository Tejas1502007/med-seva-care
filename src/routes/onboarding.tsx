import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { MedSevaLogo } from "@/components/MedSevaLogo";
import {
  Shield, Lock, Eye, EyeOff, Mail, User, Phone,
  CheckCircle2, Stethoscope, Building2, Award, Upload, Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Create Account — MedSeva" }] }),
  component: Onboarding,
});

const conditions = ["Diabetes", "Hypertension", "CKD", "COPD", "Cardiovascular Disease", "Other"];

const PATIENT_STEPS = [
  { number: 1, label: "Account" },
  { number: 2, label: "Profile" },
  { number: 3, label: "Conditions" },
  { number: 4, label: "Medications" },
];

const DOCTOR_STEPS = [
  { number: 1, label: "Account" },
  { number: 2, label: "Professional Details" },
  { number: 3, label: "License & Verification" },
];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1 — account (shared)
  const [role, setRole] = useState<"Patient" | "Doctor">("Patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Patient Step 2 — personal info
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("Male");
  const [language, setLanguage] = useState("Hindi");

  // Patient Step 3 — conditions
  const [selected, setSelected] = useState<string[]>([]);

  // Patient Step 4 — medication
  const [medName, setMedName] = useState("");
  const [dose, setDose] = useState("");
  const [frequency, setFrequency] = useState("Once daily");
  const [medTime, setMedTime] = useState("");

  // Doctor Step 2 — professional details
  const [docName, setDocName] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [qualification, setQualification] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [experience, setExperience] = useState("");
  const [hospital, setHospital] = useState("");

  // Doctor Step 3 — license
  const [licenseFile, setLicenseFile] = useState<string>("");

  const totalSteps = role === "Doctor" ? 3 : 4;
  const steps = role === "Doctor" ? DOCTOR_STEPS : PATIENT_STEPS;

  const [loading, setLoading] = useState(false);
  // Store the user id after signUp so we can write profile data even before email confirmation
  const [signedUpUserId, setSignedUpUserId] = useState<string | null>(null);

  // Step 1 → create Supabase auth account
  const signUpWithEmail = async () => {
    if (!email || !password) {
      toast.error("Please enter email and password");
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return false;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return false;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role.toLowerCase(),
            full_name: role === "Doctor"
              ? (docName || email.split("@")[0])
              : (fullName || email.split("@")[0]),
          },
        },
      });

      if (error) {
        console.error("Signup error:", error);
        toast.error(error.message || "Sign-up failed");
        setLoading(false);
        return false;
      }

      if (!data.user) {
        toast.error("Sign-up failed — please try again.");
        setLoading(false);
        return false;
      }

      setSignedUpUserId(data.user.id);
      toast.success("Account created! Complete your profile.");
      setLoading(false);
      return true;
    } catch (err) {
      console.error("Signup exception:", err);
      toast.error("An unexpected error occurred during sign-up");
      setLoading(false);
      return false;
    }
  };

  // Final step → save profile data to Supabase
  const saveProfile = async () => {
    setLoading(true);

    try {
      // Use the stored id from signUp, or fall back to the active session
      let userId = signedUpUserId;
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id ?? null;
      }

      if (!userId) {
        toast.error("Session not found. Please sign in and try again.");
        setLoading(false);
        return false;
      }

      if (role === "Patient") {
        if (!fullName || !age) {
          toast.error("Please fill in all required fields");
          setLoading(false);
          return false;
        }

        try {
          const { error: profileError } = await supabase.from("patient_profiles").upsert({
            id: userId,
            age: age ? parseInt(age) : null,
            gender: gender as "Male" | "Female" | "Other",
            language_pref: language,
            conditions: selected,
          });

          if (profileError) {
            console.error("Patient profile error:", profileError);
            toast.error(profileError.message || "Failed to save profile");
            setLoading(false);
            return false;
          }

          // Save medications if provided
          if (medName && dose) {
            try {
              await supabase.from("medications").insert({
                patient_id: userId,
                name: medName,
                dose,
                frequency,
                time: medTime || undefined,
              });
            } catch (medErr) {
              console.error("Medication save error:", medErr);
              // Don't fail the entire process for medications
            }
          }

          // Update full name and phone
          try {
            await supabase.from("profiles").update({
              full_name: fullName,
              phone: phone || undefined,
            }).eq("id", userId);
          } catch (nameErr) {
            console.error("Profile update error:", nameErr);
          }
        } catch (err) {
          console.error("Patient profile save exception:", err);
          toast.error("Failed to save patient profile");
          setLoading(false);
          return false;
        }
      } else {
        // Doctor profile
        if (!docName || !regNumber) {
          toast.error("Please fill in all required fields");
          setLoading(false);
          return false;
        }

        try {
          const { error: docError } = await supabase.from("doctor_profiles").upsert({
            id: userId,
            registration_number: regNumber,
            qualification: qualification || undefined,
            specialization: specialization || undefined,
            years_of_experience: experience ? parseInt(experience) : null,
            hospital_clinic: hospital || undefined,
          });

          if (docError) {
            console.error("Doctor profile error:", docError);
            toast.error(docError.message || "Failed to save doctor profile");
            setLoading(false);
            return false;
          }

          // Update full name
          try {
            await supabase.from("profiles").update({
              full_name: docName,
            }).eq("id", userId);
          } catch (nameErr) {
            console.error("Doctor name update error:", nameErr);
          }
        } catch (err) {
          console.error("Doctor profile save exception:", err);
          toast.error("Failed to save doctor profile");
          setLoading(false);
          return false;
        }
      }

      setLoading(false);
      return true;
    } catch (err) {
      console.error("saveProfile exception:", err);
      toast.error("An unexpected error occurred");
      setLoading(false);
      return false;
    }
  };

  const next = async () => {
    if (step === 1) {
      const ok = await signUpWithEmail();
      if (!ok) return;
    }
    if (step === totalSteps) {
      const ok = await saveProfile();
      if (!ok) return;

      // Check if a session exists (no email confirmation required)
      // or if confirmation is required (user exists but no session yet)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        toast.success("Setup complete! Welcome to MedSeva 🎉");
        navigate({ to: role === "Doctor" ? "/doctor" : "/dashboard" });
      } else {
        // Email confirmation is required — send them to login with a hint
        toast.success("Account created! Check your email to confirm, then sign in.");
        navigate({ to: "/login" });
      }
      return;
    }
    setStep(step + 1);
  };

  const back = () => { if (step > 1) setStep(step - 1); };
  const onGoogleSignup = async () => {
    try {
      const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const redirectUrl = `${appUrl}/auth/callback`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: { role: role.toLowerCase() },
        },
      });
      
      if (error) {
        console.error("Google signup error:", error);
        toast.error(error.message || "Google sign-up failed");
      }
    } catch (err) {
      console.error("Google signup exception:", err);
      toast.error("Failed to initiate Google sign-up");
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#FFFFFF" }}>

      {/* ── Left visual panel ── */}
      <div
        className="hidden lg:flex flex-1 flex-col items-center justify-center relative overflow-hidden px-12"
        style={{ background: "linear-gradient(135deg, #0D7A5F 0%, #0a5e49 100%)" }}
      >
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10" style={{ background: "#FFFFFF" }} />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full opacity-10" style={{ background: "#FFFFFF" }} />
        <div className="relative z-10 flex flex-col items-start gap-10 max-w-md">
          <MedSevaLogo size="lg" />
          <div>
            <h2 className="text-3xl font-bold leading-snug text-white">
              {role === "Doctor" ? "Join as a Doctor." : "Start your care"}<br />
              {role === "Doctor" ? "Empower your patients." : "journey today."}
            </h2>
            <p className="mt-3 text-base opacity-80 text-white">
              {role === "Doctor"
                ? "Manage chronic care patients with AI-powered insights and real-time monitoring."
                : "Set up your account in minutes and get AI-powered chronic care management."}
            </p>
          </div>
          <div className="flex flex-col gap-4 w-full">
            {steps.map((s) => (
              <div key={s.number} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                  style={{
                    background: step > s.number ? "rgba(255,255,255,0.9)" : step === s.number ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
                    color: step > s.number ? "#0D7A5F" : "#FFFFFF",
                  }}
                >
                  {step > s.number ? <CheckCircle2 size={14} color="#0D7A5F" /> : s.number}
                </div>
                <span className="text-sm font-medium transition-all"
                  style={{ color: step === s.number ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.55)" }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-5 text-xs text-white opacity-70">
            <span className="inline-flex items-center gap-1.5"><Shield size={13} /> HIPAA Compliant</span>
            <span className="inline-flex items-center gap-1.5"><Lock size={13} /> End-to-End Encrypted</span>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-6 flex justify-center"><MedSevaLogo /></div>
          <div className="lg:hidden flex items-center gap-1.5 mb-6">
            {steps.map((s) => (
              <div key={s.number} className="flex-1 h-1.5 rounded-full transition-all duration-300"
                style={{ background: s.number <= step ? "#0D7A5F" : "#E8ECF0" }} />
            ))}
          </div>

          {/* ── STEP 1: Account (shared) ── */}
          {step === 1 && (
            <>
              <h1 className="text-2xl font-bold mb-1" style={{ color: "#1A2332" }}>Create your account</h1>
              <p className="text-sm mb-6" style={{ color: "#6B7280" }}>Step 1 of {totalSteps} — Account details</p>
              <div className="flex p-1 rounded-full mb-5" style={{ background: "#F3F4F6" }}>
                {(["Patient", "Doctor"] as const).map((r) => (
                  <button key={r} type="button" onClick={() => { setRole(r); setStep(1); }}
                    className="flex-1 h-9 rounded-full text-sm font-semibold transition-all"
                    style={{ background: role === r ? "#0D7A5F" : "transparent", color: role === r ? "#FFFFFF" : "#374151" }}>
                    {r}
                  </button>
                ))}
              </div>
              <button type="button" onClick={onGoogleSignup}
                className="w-full h-11 rounded-xl border flex items-center justify-center gap-3 font-medium text-sm transition-colors hover:bg-gray-50 mb-4"
                style={{ borderColor: "#E8ECF0", color: "#374151" }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Sign up with Google
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px" style={{ background: "#E8ECF0" }} />
                <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>or with email</span>
                <div className="flex-1 h-px" style={{ background: "#E8ECF0" }} />
              </div>
              <div className="space-y-4">
                <InputField label="Email address" type="email" value={email} onChange={setEmail}
                  placeholder="you@example.com" icon={<Mail size={15} color="#9CA3AF" />} />
                <PasswordField label="Password" value={password} onChange={setPassword}
                  show={showPassword} onToggle={() => setShowPassword(!showPassword)} placeholder="Min. 8 characters" />
                <PasswordField label="Confirm password" value={confirmPassword} onChange={setConfirmPassword}
                  show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} placeholder="Re-enter password"
                  error={confirmPassword !== "" && confirmPassword !== password ? "Passwords don't match" : ""} />
              </div>
            </>
          )}

          {/* ── PATIENT STEP 2: Personal info ── */}
          {step === 2 && role === "Patient" && (
            <>
              <h1 className="text-2xl font-bold mb-1" style={{ color: "#1A2332" }}>Tell us about yourself</h1>
              <p className="text-sm mb-6" style={{ color: "#6B7280" }}>Step 2 of 4 — Personal information</p>
              <div className="space-y-4">
                <InputField label="Full Name" value={fullName} onChange={setFullName} placeholder="Rajesh Sharma" icon={<User size={15} color="#9CA3AF" />} />
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Age" value={age} onChange={setAge} placeholder="62" type="number" />
                  <InputField label="Phone" value={phone} onChange={setPhone} placeholder="+91 98765 43210" icon={<Phone size={15} color="#9CA3AF" />} />
                </div>
                <div>
                  <span className="text-sm font-medium block mb-2" style={{ color: "#374151" }}>Gender</span>
                  <div className="flex p-1 rounded-lg gap-1" style={{ background: "#F3F4F6" }}>
                    {["Male", "Female", "Other"].map((g) => (
                      <button key={g} type="button" onClick={() => setGender(g)}
                        className="flex-1 h-9 rounded-md text-sm font-medium transition-all"
                        style={{ background: gender === g ? "#FFFFFF" : "transparent", color: gender === g ? "#0D7A5F" : "#6B7280", boxShadow: gender === g ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block" style={{ color: "#374151" }}>Language Preference</label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border bg-white text-sm outline-none"
                    style={{ borderColor: "#D1D5DB", color: "#1A2332" }}>
                    {["Hindi", "Marathi", "Tamil", "Telugu", "Bengali", "English"].map((l) => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* ── PATIENT STEP 3: Conditions ── */}
          {step === 3 && role === "Patient" && (
            <>
              <h1 className="text-2xl font-bold mb-1" style={{ color: "#1A2332" }}>Your medical conditions</h1>
              <p className="text-sm mb-6" style={{ color: "#6B7280" }}>Step 3 of 4 — Select all that apply</p>
              <div className="grid grid-cols-2 gap-3">
                {conditions.map((c) => {
                  const on = selected.includes(c);
                  return (
                    <button key={c} type="button"
                      onClick={() => setSelected(on ? selected.filter((x) => x !== c) : [...selected, c])}
                      className="h-12 rounded-xl border text-sm font-medium transition-all"
                      style={{ background: on ? "#E8F5F1" : "#FFFFFF", borderColor: on ? "#0D7A5F" : "#E8ECF0", color: on ? "#0D7A5F" : "#374151", boxShadow: on ? "0 0 0 1px #0D7A5F" : "none" }}>
                      {c}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs mt-4" style={{ color: "#9CA3AF" }}>You can update these anytime from your profile.</p>
            </>
          )}

          {/* ── PATIENT STEP 4: Medication ── */}
          {step === 4 && role === "Patient" && (
            <>
              <h1 className="text-2xl font-bold mb-1" style={{ color: "#1A2332" }}>Add your first medication</h1>
              <p className="text-sm mb-6" style={{ color: "#6B7280" }}>Step 4 of 4 — You can add more later</p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Medication Name" value={medName} onChange={setMedName} placeholder="Metformin" />
                  <InputField label="Dose" value={dose} onChange={setDose} placeholder="500mg" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block" style={{ color: "#374151" }}>Frequency</label>
                  <select value={frequency} onChange={(e) => setFrequency(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border bg-white text-sm outline-none"
                    style={{ borderColor: "#D1D5DB", color: "#1A2332" }}>
                    {["Once daily", "Twice daily", "Thrice daily", "As needed"].map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <InputField label="Time" value={medTime} onChange={setMedTime} placeholder="8:00 PM" />
              </div>
            </>
          )}

          {/* ── DOCTOR STEP 2: Professional details ── */}
          {step === 2 && role === "Doctor" && (
            <>
              <h1 className="text-2xl font-bold mb-1" style={{ color: "#1A2332" }}>Professional details</h1>
              <p className="text-sm mb-6" style={{ color: "#6B7280" }}>Step 2 of 3 — Your medical credentials</p>
              <div className="space-y-4">
                <InputField label="Full Name" value={docName} onChange={setDocName}
                  placeholder="Dr. Ananya Iyer" icon={<User size={15} color="#9CA3AF" />} />
                <InputField label="Medical Registration Number" value={regNumber} onChange={setRegNumber}
                  placeholder="MCI-12345-2018" icon={<Award size={15} color="#9CA3AF" />} />
                <div>
                  <label className="text-sm font-medium mb-1.5 block" style={{ color: "#374151" }}>Qualification</label>
                  <select value={qualification} onChange={(e) => setQualification(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border bg-white text-sm outline-none"
                    style={{ borderColor: "#D1D5DB", color: qualification ? "#1A2332" : "#9CA3AF" }}>
                    <option value="" disabled>e.g. MBBS, MD, BAMS, BHMS</option>
                    {["MBBS", "MD", "MS", "DM", "BAMS", "BHMS", "BDS", "MDS", "DNB", "Other"].map((q) => (
                      <option key={q} value={q} style={{ color: "#1A2332" }}>{q}</option>
                    ))}
                  </select>
                </div>
                <InputField label="Specialization" value={specialization} onChange={setSpecialization}
                  placeholder="Endocrinology" icon={<Stethoscope size={15} color="#9CA3AF" />} />
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Years of Experience" value={experience} onChange={setExperience}
                    placeholder="12" type="number" />
                  <InputField label="Hospital / Clinic" value={hospital} onChange={setHospital}
                    placeholder="Apollo Hospital" icon={<Building2 size={15} color="#9CA3AF" />} />
                </div>
              </div>
            </>
          )}

          {/* ── DOCTOR STEP 3: License upload ── */}
          {step === 3 && role === "Doctor" && (
            <>
              <h1 className="text-2xl font-bold mb-1" style={{ color: "#1A2332" }}>License & Verification</h1>
              <p className="text-sm mb-6" style={{ color: "#6B7280" }}>Step 3 of 3 — Upload your registration certificate</p>
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium block mb-2" style={{ color: "#374151" }}>
                    Medical License / Registration Certificate
                  </label>
                  <label
                    className="flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:bg-[#F0FDF9]"
                    style={{ borderColor: licenseFile ? "#0D7A5F" : "#D1D5DB", minHeight: 140, background: licenseFile ? "#E8F5F1" : "#FAFAFA" }}
                  >
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only"
                      onChange={(e) => setLicenseFile(e.target.files?.[0]?.name ?? "")} />
                    {licenseFile ? (
                      <div className="flex flex-col items-center gap-2 px-4 text-center">
                        <CheckCircle2 size={28} color="#0D7A5F" />
                        <span className="text-sm font-medium truncate max-w-[200px]" style={{ color: "#0D7A5F" }}>{licenseFile}</span>
                        <span className="text-xs" style={{ color: "#6B7280" }}>Click to replace</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 px-4 text-center">
                        <Upload size={24} color="#9CA3AF" />
                        <span className="text-sm font-medium" style={{ color: "#374151" }}>Click to upload</span>
                        <span className="text-xs" style={{ color: "#9CA3AF" }}>PDF, JPG or PNG · max 5MB</span>
                      </div>
                    )}
                  </label>
                </div>
                <div className="rounded-xl p-4" style={{ background: "#F0FDF9", border: "1px solid #BBF7D0" }}>
                  <p className="text-xs leading-relaxed" style={{ color: "#166534" }}>
                    <span className="font-semibold">Verification note:</span> Your credentials will be reviewed within 1–2 business days. You'll receive an email once your account is approved.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* ── Actions ── */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button type="button" onClick={back}
                className="flex-1 h-11 rounded-xl border font-semibold text-sm transition-colors hover:bg-gray-50"
                style={{ borderColor: "#E8ECF0", color: "#374151" }}>
                Back
              </button>
            )}
            <button type="button" onClick={next}
              className="flex-1 h-11 rounded-xl font-semibold text-white text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: "#0D7A5F" }} disabled={loading}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#0A6650"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#0D7A5F"; }}>
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? "Please wait…" : step === totalSteps ? "Complete Setup" : "Continue"}
            </button>
          </div>

          {/* Skip — only for optional patient steps */}
          {role === "Patient" && step >= 3 && (
            <div className="text-center mt-3">
              <button type="button" onClick={next} className="text-sm" style={{ color: "#9CA3AF" }}>
                Skip for now
              </button>
            </div>
          )}

          {step === 1 && (
            <p className="text-center text-sm mt-6" style={{ color: "#6B7280" }}>
              Already have an account?{" "}
              <Link to="/login" className="font-semibold" style={{ color: "#0D7A5F" }}>Sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Reusable input ── */
function InputField({ label, value, onChange, placeholder, type = "text", icon }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; icon?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium block mb-1.5" style={{ color: "#374151" }}>{label}</span>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">{icon}</span>}
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full h-11 rounded-xl border outline-none text-sm transition-colors"
          style={{ borderColor: "#D1D5DB", color: "#1A2332", paddingLeft: icon ? 36 : 12, paddingRight: 12 }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "#0D7A5F"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13,122,95,0.1)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "#D1D5DB"; e.currentTarget.style.boxShadow = "none"; }} />
      </div>
    </label>
  );
}

/* ── Password input with toggle ── */
function PasswordField({ label, value, onChange, show, onToggle, placeholder, error }: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; placeholder?: string; error?: string;
}) {
  return (
    <div>
      <span className="text-sm font-medium block mb-1.5" style={{ color: "#374151" }}>{label}</span>
      <div className="relative">
        <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" color="#9CA3AF" />
        <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-11 pl-9 pr-10 rounded-xl border outline-none text-sm transition-colors"
          style={{ borderColor: error ? "#EF4444" : "#D1D5DB" }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "#0D7A5F"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13,122,95,0.1)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = error ? "#EF4444" : "#D1D5DB"; e.currentTarget.style.boxShadow = "none"; }} />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {error && <p className="text-xs mt-1" style={{ color: "#EF4444" }}>{error}</p>}
    </div>
  );
}
