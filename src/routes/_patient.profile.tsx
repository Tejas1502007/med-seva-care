import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { patient } from "@/lib/mock-data";
import { useTranslation } from "react-i18next";
import { setLanguage } from "@/i18n";

export const Route = createFileRoute("/_patient/profile")({
  head: () => ({ meta: [{ title: "Profile — MedSeva" }] }),
  component: ProfilePage,
});

const allConditions = ["Diabetes", "Hypertension", "CKD", "COPD", "Cardiovascular Disease", "Other"];

function ProfilePage() {
  const { t, i18n } = useTranslation();
  const [conditions, setConditions] = useState<string[]>(patient.conditions.map((c) => (c.startsWith("Type 2") ? "Diabetes" : c)));
  const [gender, setGender] = useState(patient.gender);
  const [allergies, setAllergies] = useState<string[]>(patient.allergies);
  const [allergyInput, setAllergyInput] = useState("");

  const LANG_OPTIONS = [
    { value: "en", label: "English" },
    { value: "hi", label: "हिंदी (Hindi)" },
  ];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-[22px] font-bold mb-6" style={{ color: "#1A2332" }}>{t("profile.title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Personal */}
        <div className="card-base p-6 space-y-4">
          <h3 className="text-base font-semibold" style={{ color: "#1A2332" }}>{t("profile.personalInfo")}</h3>

          <div className="flex items-center gap-4">
            <div className="relative">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
                style={{ background: "#E8F5F1", color: "#0D7A5F" }}
              >
                RS
              </div>
              <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white border flex items-center justify-center" style={{ borderColor: "#E8ECF0" }}>
                <Camera size={14} color="#0D7A5F" />
              </button>
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: "#1A2332" }}>{t("profile.profilePhoto")}</div>
              <div className="text-xs" style={{ color: "#6B7280" }}>{t("profile.photoHint")}</div>
            </div>
          </div>

          <Field label={t("profile.fullName")} defaultValue={patient.name} />
          <Field label={t("profile.age")} defaultValue={String(patient.age)} type="number" />

          <div>
            <div className="text-sm font-medium mb-2" style={{ color: "#374151" }}>{t("profile.gender")}</div>
            <div className="flex p-1 rounded-lg" style={{ background: "#F3F4F6" }}>
              {(["Male", "Female", "Other"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className="flex-1 h-9 rounded-md text-sm font-medium"
                  style={{ background: gender === g ? "#FFFFFF" : "transparent", color: gender === g ? "#0D7A5F" : "#6B7280" }}
                >
                  {t(`profile.${g.toLowerCase()}`)}
                </button>
              ))}
            </div>
          </div>

          <Field label={t("profile.phone")} defaultValue={patient.phone} readOnly />

          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: "#374151" }}>{t("profile.language")}</label>
            <select
              value={i18n.language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border bg-white text-sm" style={{ borderColor: "#D1D5DB" }}>
              {LANG_OPTIONS.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => toast.success("Profile saved")}
            className="w-full h-11 rounded-lg text-white font-semibold text-sm"
            style={{ background: "#0D7A5F" }}
          >
            {t("profile.saveChanges")}
          </button>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <div className="card-base p-6 space-y-4">
            <h3 className="text-base font-semibold" style={{ color: "#1A2332" }}>{t("profile.medicalProfile")}</h3>

            <div>
              <div className="text-sm font-medium mb-2" style={{ color: "#374151" }}>{t("profile.conditions")}</div>
              <div className="flex flex-wrap gap-2">
                {allConditions.map((c) => {
                  const on = conditions.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() => setConditions(on ? conditions.filter((x) => x !== c) : [...conditions, c])}
                      className="px-3 h-9 rounded-lg border text-sm"
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
            </div>

            <div>
              <div className="text-sm font-medium mb-2" style={{ color: "#374151" }}>{t("profile.allergies")}</div>
              <div className="flex flex-wrap gap-2 mb-2">
                {allergies.map((a) => (
                  <span key={a} className="px-3 h-8 inline-flex items-center rounded-lg text-sm" style={{ background: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A" }}>
                    {a}
                    <button className="ml-2" onClick={() => setAllergies(allergies.filter((x) => x !== a))}>×</button>
                  </span>
                ))}
              </div>
              <input
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && allergyInput.trim()) {
                    setAllergies([...allergies, allergyInput.trim()]);
                    setAllergyInput("");
                  }
                }}
                placeholder={t("profile.allergyPlaceholder")}
                className="w-full h-10 px-3 rounded-lg border text-sm"
                style={{ borderColor: "#D1D5DB" }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: "#374151" }}>{t("profile.bloodGroup")}</label>
                <select defaultValue={patient.bloodGroup} className="w-full h-10 px-3 rounded-lg border bg-white text-sm" style={{ borderColor: "#D1D5DB" }}>
                  {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t("profile.emergencyContact")} defaultValue={patient.emergencyContact.name} />
              <Field label={t("profile.phone")} defaultValue={patient.emergencyContact.phone} />
            </div>
          </div>

          <div className="card-base p-6">
            <h3 className="text-base font-semibold mb-3" style={{ color: "#1A2332" }}>{t("profile.linkedCaregiver")}</h3>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center font-semibold" style={{ background: "#E8F5F1", color: "#0D7A5F" }}>
                PS
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold" style={{ color: "#1A2332" }}>Priya Sharma</div>
                <div className="text-xs" style={{ color: "#6B7280" }}>Daughter</div>
              </div>
              <button className="h-9 px-3 rounded-md text-white text-xs font-semibold" style={{ background: "#0D7A5F" }}>
                {t("profile.sendHealthUpdate")}
              </button>
              <button className="text-xs" style={{ color: "#6B7280" }}>{t("profile.remove")}</button>
            </div>
          </div>

          <div className="card-base p-6 space-y-3">
            <h3 className="text-base font-semibold mb-2" style={{ color: "#1A2332" }}>{t("profile.notifications")}</h3>
            {[
              { label: t("profile.whatsappAlerts"), desc: t("profile.whatsappDesc") },
              { label: t("profile.medReminders"), desc: t("profile.medRemindersDesc") },
              { label: t("profile.aaraCheckin"), desc: t("profile.aaraCheckinDesc") },
              { label: t("profile.weeklyReport"), desc: t("profile.weeklyReportDesc") },
            ].map((row, i) => <ToggleRow key={row.label} {...row} defaultOn={i !== 3} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, defaultValue, type = "text", readOnly = false }: { label: string; defaultValue?: string; type?: string; readOnly?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-medium" style={{ color: "#374151" }}>{label}</span>
      <input
        defaultValue={defaultValue}
        type={type}
        readOnly={readOnly}
        className="mt-1.5 w-full h-11 px-3 rounded-lg border text-sm outline-none"
        style={{ borderColor: "#D1D5DB", background: readOnly ? "#F7F8FA" : "#FFFFFF" }}
      />
    </label>
  );
}

function ToggleRow({ label, desc, defaultOn }: { label: string; desc: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="text-sm font-medium" style={{ color: "#1A2332" }}>{label}</div>
        <div className="text-xs" style={{ color: "#6B7280" }}>{desc}</div>
      </div>
      <button
        onClick={() => setOn(!on)}
        className="w-11 h-6 rounded-full relative transition-colors"
        style={{ background: on ? "#0D7A5F" : "#D1D5DB" }}
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
          style={{ left: on ? "calc(100% - 22px)" : 2 }}
        />
      </button>
    </div>
  );
}
