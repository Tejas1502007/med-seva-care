import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MedSevaLogo } from "@/components/MedSevaLogo";
import { Shield, Lock } from "lucide-react";

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
  const [phone, setPhone] = useState("");
  const [stage, setStage] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState(["", "", "", ""]);

  const onGetOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, "").length < 10) return;
    setStage("otp");
  };

  const onVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "Doctor") navigate({ to: "/doctor" });
    else navigate({ to: "/onboarding" });
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#FFFFFF" }}>
      {/* Left visual panel */}
      <div
        className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #E8F5F1 0%, #F0FDF9 100%)" }}
      >
        <div className="flex flex-col items-center gap-12 px-12">
          <MedSevaLogo size="lg" />
          <svg width="420" height="280" viewBox="0 0 420 280" fill="none">
            <path
              d="M20 160 Q90 160 110 130 T180 150 L210 90 L240 200 L270 140 Q310 100 360 130 T400 150"
              stroke="#0D7A5F"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity="0.9"
            />
            <path
              d="M20 200 Q100 200 130 175 T200 195 L230 150 L260 230 L290 185 Q330 155 380 180 T400 195"
              stroke="#0D7A5F"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity="0.35"
            />
            <circle cx="210" cy="90" r="6" fill="#0D7A5F" />
            <circle cx="240" cy="200" r="6" fill="#0D7A5F" opacity="0.6" />
          </svg>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          {/* Role toggle */}
          <div
            className="flex p-1 rounded-full mb-8"
            style={{ background: "#F3F4F6" }}
          >
            {(["Patient", "Doctor"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className="flex-1 h-9 rounded-full text-sm font-semibold transition-colors"
                style={{
                  background: role === r ? "#0D7A5F" : "transparent",
                  color: role === r ? "#FFFFFF" : "#374151",
                }}
              >
                {r}
              </button>
            ))}
          </div>

          {stage === "phone" ? (
            <form onSubmit={onGetOtp} className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium" style={{ color: "#374151" }}>Mobile Number</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 00000 00000"
                  className="mt-2 w-full h-12 px-4 rounded-xl border outline-none transition-colors"
                  style={{ borderColor: "#D1D5DB", fontSize: 15 }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#0D7A5F")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#D1D5DB")}
                />
              </label>
              <button
                type="submit"
                className="w-full h-12 rounded-lg font-semibold text-white transition-colors"
                style={{ background: "#0D7A5F" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#0A6650")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#0D7A5F")}
              >
                Get OTP
              </button>
            </form>
          ) : (
            <form onSubmit={onVerify} className="space-y-5">
              <div>
                <div className="text-base font-semibold" style={{ color: "#1A2332" }}>Enter OTP</div>
                <div className="text-[13px] mt-1" style={{ color: "#6B7280" }}>
                  Sent to {phone || "+91 98765 43210"}
                </div>
              </div>
              <div className="flex gap-3 justify-between">
                {otp.map((v, i) => (
                  <input
                    key={i}
                    value={v}
                    maxLength={1}
                    onChange={(e) => {
                      const next = [...otp];
                      next[i] = e.target.value.replace(/\D/g, "");
                      setOtp(next);
                      if (e.target.value && i < 3) {
                        (document.getElementById(`otp-${i + 1}`) as HTMLInputElement)?.focus();
                      }
                    }}
                    id={`otp-${i}`}
                    className="w-14 h-14 text-center text-xl font-semibold rounded-lg border outline-none"
                    style={{ borderColor: "#D1D5DB" }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#0D7A5F";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13,122,95,0.15)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#D1D5DB";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                ))}
              </div>
              <button type="button" className="text-[13px] font-medium" style={{ color: "#0D7A5F" }}>
                Resend OTP
              </button>
              <button
                type="submit"
                className="w-full h-12 rounded-lg font-semibold text-white"
                style={{ background: "#0D7A5F" }}
              >
                Verify & Continue
              </button>
            </form>
          )}

          <div className="flex items-center justify-center gap-5 mt-8 text-xs" style={{ color: "#6B7280" }}>
            <span className="inline-flex items-center gap-1.5">
              <Shield size={13} /> HIPAA Compliant
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Lock size={13} /> End-to-End Encrypted
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
