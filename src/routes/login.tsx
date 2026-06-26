import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { MedSevaLogo } from "@/components/MedSevaLogo";
import { Shield, Lock, Eye, EyeOff, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — MedSeva" },
      { name: "description", content: "Sign in to MedSeva to manage your continuous care plan." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"Patient" | "Doctor">("Patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error("Login error:", error);
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Please confirm your email first");
        } else {
          toast.error(error.message || "Login failed");
        }
        setLoading(false);
        return;
      }

      if (!data.user) {
        toast.error("Login failed. Please try again.");
        setLoading(false);
        return;
      }

      // Try JWT metadata first (fast), fall back to DB query for older accounts
      let userRole = (data.user.user_metadata?.role as string) ?? null;

      if (!userRole) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .maybeSingle();
          userRole = profile?.role ?? null;
        } catch (err) {
          console.error("Profile fetch error:", err);
        }
      }

      if (!userRole) {
        try {
          const { data: patientRow } = await supabase
            .from("patient_profiles")
            .select("id")
            .eq("id", data.user.id)
            .maybeSingle();
          userRole = patientRow ? "patient" : "doctor";
        } catch (err) {
          console.error("Patient profile check error:", err);
          userRole = "patient"; // Default to patient
        }
      }

      toast.success("Sign in successful!");
      // Skip role toggle validation — just go to the right dashboard
      navigate({ to: userRole === "doctor" ? "/doctor" : "/dashboard" });
    } catch (err) {
      console.error("Login exception:", err);
      toast.error("An unexpected error occurred");
      setLoading(false);
    }
  };

  const onGoogleLogin = async () => {
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
        console.error("Google auth error:", error);
        toast.error(error.message || "Google sign-in failed");
      }
    } catch (err) {
      console.error("Google login exception:", err);
      toast.error("Failed to initiate Google sign-in");
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
              Your health,<br />continuously monitored.
            </h2>
            <p className="mt-3 text-base opacity-80 text-white">
              AI-powered chronic care management for patients and doctors across India.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {["Real-time vitals & risk scoring", "Personalised AI care plans", "Doctor–patient collaboration"].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.2)" }}>
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-white opacity-90">{f}</span>
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
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex justify-center"><MedSevaLogo /></div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "#1A2332" }}>Welcome back</h1>
          <p className="text-sm mb-6" style={{ color: "#6B7280" }}>Sign in to continue your care journey.</p>

          {/* Role toggle */}
          <div className="flex p-1 rounded-full mb-6" style={{ background: "#F3F4F6" }}>
            {(["Patient", "Doctor"] as const).map((r) => (
              <button key={r} type="button" onClick={() => setRole(r)}
                className="flex-1 h-9 rounded-full text-sm font-semibold transition-all duration-150"
                style={{ background: role === r ? "#0D7A5F" : "transparent", color: role === r ? "#FFFFFF" : "#374151" }}>
                {r}
              </button>
            ))}
          </div>

          {/* Google */}
          <button type="button" onClick={onGoogleLogin}
            className="w-full h-11 rounded-xl border flex items-center justify-center gap-3 font-medium text-sm transition-colors hover:bg-gray-50 mb-4"
            style={{ borderColor: "#E8ECF0", color: "#374151" }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: "#E8ECF0" }} />
            <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>or sign in with email</span>
            <div className="flex-1 h-px" style={{ background: "#E8ECF0" }} />
          </div>

          <form onSubmit={onLogin} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium block mb-1.5" style={{ color: "#374151" }}>Email address</span>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" color="#9CA3AF" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" disabled={loading}
                  className="w-full h-11 pl-9 pr-4 rounded-xl border outline-none transition-colors text-sm"
                  style={{ borderColor: "#D1D5DB", color: "#1A2332" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#0D7A5F"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13,122,95,0.1)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#D1D5DB"; e.currentTarget.style.boxShadow = "none"; }} />
              </div>
            </label>
            <label className="block">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium" style={{ color: "#374151" }}>Password</span>
                <button type="button" className="text-xs font-medium" style={{ color: "#0D7A5F" }}>Forgot password?</button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" color="#9CA3AF" />
                <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" disabled={loading}
                  className="w-full h-11 pl-9 pr-10 rounded-xl border outline-none transition-colors text-sm"
                  style={{ borderColor: "#D1D5DB", color: "#1A2332" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#0D7A5F"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13,122,95,0.1)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#D1D5DB"; e.currentTarget.style.boxShadow = "none"; }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            <button type="submit" disabled={loading}
              className="w-full h-11 rounded-xl font-semibold text-white text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: "#0D7A5F" }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#0A6650"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#0D7A5F"; }}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: "#6B7280" }}>
            Don't have an account?{" "}
            <Link to="/onboarding" className="font-semibold" style={{ color: "#0D7A5F" }}>Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
