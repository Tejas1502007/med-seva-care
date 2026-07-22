import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { MedSevaLogo } from "@/components/MedSevaLogo";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Create Account — MedSeva" }] }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [signedUpUserId, setSignedUpUserId] = useState<string | null>(null);

  // Step 1 — Account
  const [role, setRole] = useState<"Patient" | "Doctor">("Patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Step 2 — Patient basic info
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Male");
  const [phone, setPhone] = useState("");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  // Step 2 — Doctor basic info
  const [docName, setDocName] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [hospital, setHospital] = useState("");

  const totalSteps = 2;

  const signUpWithEmail = async () => {
    if (!email || !password) { toast.error("Please enter email and password"); return false; }
    if (password !== confirmPassword) { toast.error("Passwords don't match"); return false; }
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return false; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role.toLowerCase(),
            full_name: role === "Doctor" ? docName || email.split("@")[0] : fullName || email.split("@")[0],
          },
        },
      });
      if (error) { toast.error(error.message); setLoading(false); return false; }
      if (!data.user) { toast.error("Sign-up failed"); setLoading(false); return false; }
      setSignedUpUserId(data.user.id);
      toast.success("Account created! Fill in your details.");
      setLoading(false);
      return true;
    } catch {
      toast.error("An unexpected error occurred");
      setLoading(false);
      return false;
    }
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      let userId = signedUpUserId;
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id ?? null;
      }
      if (!userId) { toast.error("Session not found. Please try signing in."); setLoading(false); return false; }

      if (role === "Patient") {
        if (!fullName) { toast.error("Please enter your full name"); setLoading(false); return false; }
        const age = dob ? Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000) : null;

        await Promise.all([
          supabase.from("profiles").upsert({ id: userId, role: "patient", email, full_name: fullName, phone: phone || null }),
          supabase.from("patient_profiles").upsert({
            id: userId, age, dob: dob || null,
            gender: gender as "Male" | "Female" | "Other",
            blood_group: bloodGroup,
            height: height ? parseFloat(height) : null,
            weight: weight ? parseFloat(weight) : null,
          } as never),
        ]);

      } else {
        if (!docName) { toast.error("Please enter your full name"); setLoading(false); return false; }
        if (!regNumber) { toast.error("Please enter your registration number"); setLoading(false); return false; }

        await Promise.all([
          supabase.from("profiles").upsert({ id: userId, role: "doctor", email, full_name: docName }),
          supabase.from("doctor_profiles").upsert({
            id: userId,
            registration_number: regNumber,
            specialization: specialization || "General",
            qualification: "MBBS",
            hospital_clinic: hospital || null,
            profile_completed: false,
            verification_status: "pending_review",
          }),
        ]);
      }

      setLoading(false);
      return true;
    } catch (err) {
      console.error("saveProfile error:", err);
      toast.error("Failed to save profile. Please try again.");
      setLoading(false);
      return false;
    }
  };

  const next = async () => {
    if (step === 1) {
      const ok = await signUpWithEmail();
      if (!ok) return;
      setStep(2);
      return;
    }
    if (step === 2) {
      const ok = await saveProfile();
      if (!ok) return;

      const { data: { session } } = await supabase.auth.getSession();

      if (role === "Doctor") {
        if (session) {
          toast.success("Account created! Complete your profile to get verified.");
          window.location.href = "/doctor";
        } else {
          toast.success("Check your email to confirm your account, then sign in.");
          navigate({ to: "/login" });
        }
      } else {
        if (session) {
          toast.success("Welcome to MedSeva 🎉");
          window.location.href = "/dashboard";
        } else {
          toast.success("Check your email to confirm your account, then sign in.");
          navigate({ to: "/login" });
        }
      }
    }
  };

  const onGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ background: "#F7F8FA" }}>
      <div className="w-full max-w-[440px]">
        <div className="flex justify-center mb-8">
          <Link to="/"><MedSevaLogo /></Link>
        </div>

        <div className="card-base p-8">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-6">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                style={{ background: i < step ? "#0D7A5F" : "#E8ECF0" }} />
            ))}
          </div>

          {/* Step 1 — Account */}
          {step === 1 && (
            <>
              <h1 className="text-xl font-bold mb-1" style={{ color: "#1A2332" }}>Create your account</h1>
              <p className="text-sm mb-5" style={{ color: "#6B7280" }}>Step 1 of {totalSteps} — Account details</p>

              <div className="flex p-1 rounded-xl mb-5" style={{ background: "#F3F4F6" }}>
                {(["Patient", "Doctor"] as const).map((r) => (
                  <button key={r} type="button" onClick={() => setRole(r)}
                    className="flex-1 h-9 rounded-lg text-sm font-semibold transition-all"
                    style={{ background: role === r ? "#0D7A5F" : "transparent", color: role === r ? "#fff" : "#374151" }}>
                    {r}
                  </button>
                ))}
              </div>

              <button type="button" onClick={onGoogle}
                className="w-full h-11 rounded-xl border flex items-center justify-center gap-3 font-medium text-sm hover:bg-gray-50 transition-colors mb-4"
                style={{ borderColor: "#E8ECF0", color: "#374151" }}>
                <GoogleIcon /> Sign up with Google
              </button>

              <Divider label="or with email" />

              <div className="space-y-4 mt-4">
                <Field label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
                <PasswordField label="Password" value={password} onChange={setPassword} show={showPassword} onToggle={() => setShowPassword(!showPassword)} placeholder="Min. 8 characters" />
                <PasswordField label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} placeholder="Re-enter password"
                  error={confirmPassword !== "" && confirmPassword !== password ? "Passwords don't match" : ""} />
              </div>
            </>
          )}

          {/* Step 2 — Patient basic info */}
          {step === 2 && role === "Patient" && (
            <>
              <h1 className="text-xl font-bold mb-1" style={{ color: "#1A2332" }}>Basic information</h1>
              <p className="text-sm mb-5" style={{ color: "#6B7280" }}>Step 2 of {totalSteps} — You can fill more details in your profile later</p>
              <div className="space-y-4">
                <Field label="Full Name *" value={fullName} onChange={setFullName} placeholder="Rajesh Sharma" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Date of Birth" value={dob} onChange={setDob} type="date" />
                  <Field label="Mobile Number" value={phone} onChange={setPhone} placeholder="+91 98765 43210" />
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
                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "#374151" }}>Blood Group</label>
                  <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border bg-white text-sm outline-none" style={{ borderColor: "#D1D5DB" }}>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Height (cm)" value={height} onChange={setHeight} placeholder="170" type="number" />
                  <Field label="Weight (kg)" value={weight} onChange={setWeight} placeholder="70" type="number" />
                </div>
              </div>
            </>
          )}

          {/* Step 2 — Doctor basic info */}
          {step === 2 && role === "Doctor" && (
            <>
              <h1 className="text-xl font-bold mb-1" style={{ color: "#1A2332" }}>Professional details</h1>
              <p className="text-sm mb-5" style={{ color: "#6B7280" }}>Step 2 of {totalSteps} — Your credentials</p>
              <div className="space-y-4">
                <Field label="Full Name *" value={docName} onChange={setDocName} placeholder="Dr. Anjali Mehta" />
                <Field label="Registration Number *" value={regNumber} onChange={setRegNumber} placeholder="MCI-12345-2018" />
                <Field label="Specialization" value={specialization} onChange={setSpecialization} placeholder="Endocrinology" />
                <Field label="Hospital / Clinic" value={hospital} onChange={setHospital} placeholder="Apollo Hospital" />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button type="button" onClick={() => setStep(step - 1)}
                className="flex-1 h-11 rounded-xl border font-semibold text-sm hover:bg-gray-50 transition-colors"
                style={{ borderColor: "#E8ECF0", color: "#374151" }}>
                Back
              </button>
            )}
            <button type="button" onClick={next} disabled={loading}
              className="flex-1 h-11 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90 transition-opacity"
              style={{ background: "#0D7A5F" }}>
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? "Please wait…" : step === totalSteps ? "Enter MedSeva" : "Continue"}
            </button>
          </div>

          {step === 2 && (
            <button type="button" onClick={next}
              className="w-full text-center text-sm mt-3" style={{ color: "#9CA3AF" }}>
              Skip for now
            </button>
          )}
        </div>

        {step === 1 && (
          <p className="text-center text-sm mt-5" style={{ color: "#6B7280" }}>
            Already have an account?{" "}
            <Link to="/login" className="font-semibold" style={{ color: "#0D7A5F" }}>Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1.5" style={{ color: "#374151" }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full h-11 px-3 rounded-xl border outline-none text-sm transition-all"
        style={{ borderColor: "#D1D5DB", color: "#1A2332" }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "#0D7A5F"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13,122,95,0.1)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "#D1D5DB"; e.currentTarget.style.boxShadow = "none"; }} />
    </div>
  );
}

function PasswordField({ label, value, onChange, show, onToggle, placeholder, error }: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; placeholder?: string; error?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1.5" style={{ color: "#374151" }}>{label}</label>
      <div className="relative">
        <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-11 px-3 pr-10 rounded-xl border outline-none text-sm transition-all"
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

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px" style={{ background: "#E8ECF0" }} />
      <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: "#E8ECF0" }} />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
