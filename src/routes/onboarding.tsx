import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MedSevaLogo } from "@/components/MedSevaLogo";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [{ title: "Get Started — MedSeva" }],
  }),
  component: Onboarding,
});

const conditions = ["Diabetes", "Hypertension", "CKD", "COPD", "Cardiovascular Disease", "Other"];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<string[]>(["Diabetes", "Hypertension"]);
  const [gender, setGender] = useState("Male");

  const next = () => (step < 3 ? setStep(step + 1) : navigate({ to: "/dashboard" }));

  return (
    <div className="min-h-screen flex">
      <div
        className="hidden lg:flex flex-1 items-center justify-center"
        style={{ background: "linear-gradient(135deg, #E8F5F1 0%, #F0FDF9 100%)" }}
      >
        <div className="flex flex-col items-center gap-12">
          <MedSevaLogo size="lg" />
          <svg width="380" height="240" viewBox="0 0 380 240">
            <path
              d="M20 140 Q80 140 100 110 T160 130 L190 70 L220 180 L250 120 Q290 90 340 120 T370 130"
              stroke="#0D7A5F"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-white">
        <div className="w-full max-w-md">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 h-1.5 rounded-full" style={{ background: s <= step ? "#0D7A5F" : "#E8ECF0" }} />
            ))}
          </div>
          <div className="label-caps mb-2">Step {step} of 3</div>

          {step === 1 && (
            <>
              <h1 className="text-[22px] font-bold mb-1" style={{ color: "#1A2332" }}>Tell us about yourself</h1>
              <p className="text-sm mb-6" style={{ color: "#6B7280" }}>This helps us personalize your care.</p>
              <div className="space-y-4">
                <Field label="Full Name" placeholder="Rajesh Sharma" />
                <Field label="Age" placeholder="62" type="number" />
                <div>
                  <div className="text-sm font-medium mb-2" style={{ color: "#374151" }}>Gender</div>
                  <div className="flex p-1 rounded-lg" style={{ background: "#F3F4F6" }}>
                    {["Male", "Female", "Other"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className="flex-1 h-9 rounded-md text-sm font-medium"
                        style={{ background: gender === g ? "#FFFFFF" : "transparent", color: gender === g ? "#0D7A5F" : "#6B7280" }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block" style={{ color: "#374151" }}>Language Preference</label>
                  <select className="w-full h-12 px-3 rounded-xl border bg-white" style={{ borderColor: "#D1D5DB" }}>
                    <option>Hindi</option>
                    <option>Marathi</option>
                    <option>Tamil</option>
                    <option>English</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-[22px] font-bold mb-1" style={{ color: "#1A2332" }}>Your medical conditions</h1>
              <p className="text-sm mb-6" style={{ color: "#6B7280" }}>Select all that apply.</p>
              <div className="grid grid-cols-2 gap-3">
                {conditions.map((c) => {
                  const on = selected.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelected(on ? selected.filter((x) => x !== c) : [...selected, c])}
                      className="h-12 rounded-lg border text-sm font-medium transition-colors"
                      style={{
                        background: on ? "#E8F5F1" : "#FFFFFF",
                        borderColor: on ? "#0D7A5F" : "#D1D5DB",
                        color: on ? "#0D7A5F" : "#374151",
                      }}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="text-[22px] font-bold mb-1" style={{ color: "#1A2332" }}>Add your first medication</h1>
              <p className="text-sm mb-6" style={{ color: "#6B7280" }}>You can add more later.</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Medication Name" placeholder="Metformin" />
                <Field label="Dose" placeholder="500mg" />
                <div>
                  <label className="text-sm font-medium mb-2 block" style={{ color: "#374151" }}>Frequency</label>
                  <select className="w-full h-12 px-3 rounded-xl border bg-white" style={{ borderColor: "#D1D5DB" }}>
                    <option>Once daily</option>
                    <option>Twice daily</option>
                    <option>Thrice daily</option>
                  </select>
                </div>
                <Field label="Time" placeholder="8:00 PM" />
              </div>
            </>
          )}

          <button
            onClick={next}
            className="mt-8 w-full h-12 rounded-lg font-semibold text-white"
            style={{ background: "#0D7A5F" }}
          >
            {step === 3 ? "Complete Setup" : "Continue"}
          </button>
          <div className="text-center mt-3">
            {step < 3 ? (
              <button onClick={next} className="text-sm" style={{ color: "#6B7280" }}>Skip for now</button>
            ) : (
              <Link to="/dashboard" className="text-sm" style={{ color: "#6B7280" }}>Skip for now</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, placeholder, type = "text" }: { label: string; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium" style={{ color: "#374151" }}>{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="mt-2 w-full h-12 px-3 rounded-xl border outline-none"
        style={{ borderColor: "#D1D5DB", fontSize: 15 }}
      />
    </label>
  );
}
