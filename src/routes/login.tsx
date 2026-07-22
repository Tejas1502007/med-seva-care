import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { MedSevaLogo } from "@/components/MedSevaLogo";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Sign in — MedSeva" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please enter email and password"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message.includes("Invalid login credentials") ? "Invalid email or password" : error.message);
        setLoading(false);
        return;
      }
      if (!data.user) { toast.error("Login failed. Please try again."); setLoading(false); return; }

      // Use metadata first (instant), fall back to DB only if missing
      const metaRole = data.user.user_metadata?.role as string | undefined;
      if (metaRole === "admin") { window.location.href = "/admin/"; return; }
      if (metaRole === "doctor") { window.location.href = "/doctor"; return; }
      if (metaRole === "patient") { window.location.href = "/dashboard"; return; }

      // Fallback: fetch role from DB (only if metadata missing)
      const { data: profileData } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      const userRole = profileData?.role ?? "patient";
      if (userRole === "admin") { window.location.href = "/admin/"; }
      else if (userRole === "doctor") { window.location.href = "/doctor"; }
      else { window.location.href = "/dashboard"; }
    } catch {
      toast.error("An unexpected error occurred");
      setLoading(false);
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#F7F8FA" }}>
      <div className="w-full max-w-[560px]">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/">
            <MedSevaLogo size="lg" />
          </Link>
        </div>

        {/* Card */}
        <div className="card-base p-10">
          <h1 className="text-xl font-bold mb-1 text-center" style={{ color: "#1A2332" }}>Welcome back</h1>
          <p className="text-sm text-center mb-6" style={{ color: "#6B7280" }}>Sign in to continue your care journey</p>

          {/* Google */}
          <button type="button" onClick={onGoogle}
            className="w-full h-11 rounded-xl border flex items-center justify-center gap-3 font-medium text-sm hover:bg-gray-50 transition-colors mb-4"
            style={{ borderColor: "#E8ECF0", color: "#374151" }}>
            <GoogleIcon />
            Continue with Google
          </button>

          <Divider label="or" />

          <form onSubmit={onLogin} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "#374151" }}>Email address</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" disabled={loading}
                className="w-full h-11 px-3 rounded-xl border outline-none text-sm transition-all"
                style={{ borderColor: "#D1D5DB", color: "#1A2332" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#0D7A5F"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13,122,95,0.1)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#D1D5DB"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium" style={{ color: "#374151" }}>Password</label>
                <button type="button" className="text-xs font-medium" style={{ color: "#0D7A5F" }}>Forgot password?</button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} required value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" disabled={loading}
                  className="w-full h-11 px-3 pr-10 rounded-xl border outline-none text-sm transition-all"
                  style={{ borderColor: "#D1D5DB", color: "#1A2332" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#0D7A5F"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13,122,95,0.1)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#D1D5DB"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-11 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity hover:opacity-90"
              style={{ background: "#0D7A5F" }}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-5" style={{ color: "#6B7280" }}>
          Don't have an account?{" "}
          <Link to="/onboarding" className="font-semibold" style={{ color: "#0D7A5F" }}>Create account</Link>
        </p>
      </div>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
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
