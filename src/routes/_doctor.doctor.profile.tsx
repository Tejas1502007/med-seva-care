import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { doctor } from "@/lib/mock-data";

export const Route = createFileRoute("/_doctor/doctor/profile")({
  head: () => ({ meta: [{ title: "Doctor Profile — MedSeva" }] }),
  component: DoctorProfile,
});

function DoctorProfile() {
  return (
    <div className="px-8 py-7 max-w-[900px] mx-auto">
      <h1 className="text-[22px] font-bold mb-6" style={{ color: "#1A2332" }}>Profile</h1>

      <div className="card-base p-6 space-y-4">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold" style={{ background: "#E8F5F1", color: "#0D7A5F" }}>
            {doctor.initials}
          </div>
          <div>
            <div className="text-lg font-semibold" style={{ color: "#1A2332" }}>{doctor.name}</div>
            <div className="text-sm" style={{ color: "#6B7280" }}>{doctor.role}</div>
          </div>
        </div>

        <Field label="Full Name" defaultValue={doctor.name} />
        <Field label="Specialty" defaultValue={doctor.role} />
        <Field label="Medical License No." defaultValue="MCI-2014-3829" />
        <Field label="Hospital / Clinic" defaultValue="Apollo Hospitals, Bengaluru" />
        <Field label="Email" defaultValue="ananya.iyer@medseva.health" />
        <Field label="Phone" defaultValue="+91 98450 12345" />

        <button
          onClick={() => toast.success("Profile updated")}
          className="w-full h-11 rounded-lg text-white font-semibold text-sm"
          style={{ background: "#0D7A5F" }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium" style={{ color: "#374151" }}>{label}</span>
      <input
        defaultValue={defaultValue}
        className="mt-1.5 w-full h-11 px-3 rounded-lg border text-sm outline-none"
        style={{ borderColor: "#D1D5DB" }}
      />
    </label>
  );
}
