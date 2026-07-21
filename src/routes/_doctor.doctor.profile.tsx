import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, FileText, CreditCard, CheckCircle, Clock, XCircle, RefreshCw, Pencil, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_doctor/doctor/profile")({
  head: () => ({ meta: [{ title: "Doctor Profile — MedSeva" }] }),
  component: DoctorProfile,
});

type VerifStatus = "pending_review" | "approved" | "rejected" | null;

interface DoctorForm {
  full_name: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  specialization: string;
  qualification: string;
  years_of_experience: string;
  registration_number: string;
  hospital_clinic: string;
  hospital_address: string;
  consultation_fee: string;
  consultation_type: "online" | "offline" | "both";
}

const EMPTY_FORM: DoctorForm = {
  full_name: "", dob: "", gender: "", phone: "", email: "",
  specialization: "", qualification: "", years_of_experience: "",
  registration_number: "", hospital_clinic: "", hospital_address: "",
  consultation_fee: "", consultation_type: "offline",
};

function DoctorProfile() {
  const [form, setForm] = useState<DoctorForm>(EMPTY_FORM);
  const [verifStatus, setVerifStatus] = useState<VerifStatus>(null);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [licenseUrl, setLicenseUrl] = useState<string | null>(null);
  const [degreeUrl, setDegreeUrl] = useState<string | null>(null);
  const [govIdUrl, setGovIdUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const avatarRef = useRef<HTMLInputElement>(null);
  const licenseRef = useRef<HTMLInputElement>(null);
  const degreeRef = useRef<HTMLInputElement>(null);
  const govIdRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [profileRes, dpRes] = await Promise.all([
          supabase.from("profiles").select("full_name, email, phone, avatar_url").eq("id", user.id).single(),
          supabase.from("doctor_profiles").select("*").eq("id", user.id).maybeSingle(),
        ]);

        const p = profileRes.data;
        const dp = dpRes.data as Record<string, unknown> | null;

        setAvatarUrl((p?.avatar_url as string | null) ?? null);
        setVerifStatus((dp?.verification_status as VerifStatus) ?? null);
        setProfileCompleted((dp?.profile_completed as boolean) ?? false);

        setForm({
          full_name: (p?.full_name as string) ?? "",
          email: (p?.email as string) ?? "",
          phone: (p?.phone as string) ?? "",
          dob: (dp?.dob as string) ?? "",
          gender: (dp?.gender as string) ?? "",
          specialization: (dp?.specialization as string) ?? "",
          qualification: (dp?.qualification as string) ?? "",
          years_of_experience: dp?.years_of_experience != null ? String(dp.years_of_experience) : "",
          registration_number: (dp?.registration_number as string) ?? "",
          hospital_clinic: (dp?.hospital_clinic as string) ?? "",
          hospital_address: (dp?.hospital_address as string) ?? "",
          consultation_fee: dp?.consultation_fee != null ? String(dp.consultation_fee) : "",
          consultation_type: (dp?.consultation_type as "online" | "offline" | "both") ?? "offline",
        });

        setLicenseUrl((dp?.license_file_url as string | null) ?? null);
        setDegreeUrl((dp?.degree_certificate_url as string | null) ?? null);
        setGovIdUrl((dp?.government_id_url as string | null) ?? null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const set = (k: keyof DoctorForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const uploadFile = async (file: File, bucket: string, path: string, onDone: (url: string) => void) => {
    setUploading(path);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Not authenticated"); return; }
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/${path}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true });
      if (error) { toast.error(`Upload failed: ${error.message}`); return; }
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      onDone(data.publicUrl);
      toast.success("File uploaded");
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async (isResubmit = false) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (!form.full_name || !form.specialization || !form.qualification || !form.registration_number) {
      toast.error("Please fill all required fields"); return;
    }
    if (!licenseUrl) { toast.error("Medical license upload is required"); return; }

    setSaving(true);
    const [profileErr, dpErr] = await Promise.all([
      supabase.from("profiles").update({ full_name: form.full_name, phone: form.phone, avatar_url: avatarUrl }).eq("id", user.id).then((r) => r.error),
      supabase.from("doctor_profiles").upsert({
        id: user.id,
        dob: form.dob || null,
        gender: form.gender || null,
        specialization: form.specialization,
        qualification: form.qualification,
        years_of_experience: form.years_of_experience ? Number(form.years_of_experience) : null,
        registration_number: form.registration_number,
        hospital_clinic: form.hospital_clinic || null,
        hospital_address: form.hospital_address || null,
        consultation_fee: form.consultation_fee ? Number(form.consultation_fee) : null,
        consultation_type: form.consultation_type,
        license_file_url: licenseUrl,
        degree_certificate_url: degreeUrl,
        government_id_url: govIdUrl,
        profile_completed: true,
        verification_status: "pending_review",
      }).then((r) => r.error),
    ]);
    setSaving(false);

    if (profileErr || dpErr) { toast.error("Failed to save profile"); console.error(profileErr, dpErr); return; }
    setProfileCompleted(true);
    setVerifStatus("pending_review");
    setEditMode(false);
    toast.success(isResubmit ? "Profile re-submitted for review!" : "Profile submitted for review!");
  };

  if (loading) return <PageLoader />;

  // ── Approved + read-only view ──────────────────────────────
  if (verifStatus === "approved" && !editMode) {
    return (
      <div className="px-4 sm:px-8 py-7 max-w-[860px] mx-auto page-enter">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-bold" style={{ color: "#1A2332" }}>My Profile</h1>
            <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>Your profile is approved and active.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: "#ECFDF5", color: "#065F46" }}>
              <CheckCircle size={13} /> Approved
            </span>
            <button onClick={() => setEditMode(true)}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl border text-sm font-medium hover:bg-gray-50 transition-colors"
              style={{ borderColor: "#0D7A5F", color: "#0D7A5F" }}>
              <Pencil size={14} /> Edit Profile
            </button>
          </div>
        </div>

        {/* Avatar */}
        <div className="card-base p-6 mb-4">
          <div className="flex items-center gap-5">
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" className="w-20 h-20 rounded-full object-cover" />
              : <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold" style={{ background: "#E8F5F1", color: "#0D7A5F" }}>
                  {form.full_name ? form.full_name[0].toUpperCase() : "D"}
                </div>
            }
            <div>
              <p className="text-lg font-bold" style={{ color: "#1A2332" }}>{form.full_name}</p>
              <p className="text-sm" style={{ color: "#6B7280" }}>{form.specialization} · {form.qualification}</p>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="card-base p-6 mb-4">
          <h2 className="text-sm font-semibold mb-4 label-caps">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReadField label="Full Name" value={form.full_name} />
            <ReadField label="Date of Birth" value={form.dob} />
            <ReadField label="Gender" value={form.gender} />
            <ReadField label="Mobile Number" value={form.phone} />
            <ReadField label="Email" value={form.email} />
          </div>
        </div>

        {/* Professional */}
        <div className="card-base p-6 mb-4">
          <h2 className="text-sm font-semibold mb-4 label-caps">Professional Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReadField label="Specialization" value={form.specialization} />
            <ReadField label="Qualification" value={form.qualification} />
            <ReadField label="Years of Experience" value={form.years_of_experience} />
            <ReadField label="Medical License No." value={form.registration_number} />
            <ReadField label="Hospital / Clinic" value={form.hospital_clinic} />
            <ReadField label="Hospital Address" value={form.hospital_address} />
          </div>
        </div>

        {/* Consultation */}
        <div className="card-base p-6 mb-4">
          <h2 className="text-sm font-semibold mb-4 label-caps">Consultation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReadField label="Consultation Fee" value={form.consultation_fee ? `₹${form.consultation_fee}` : ""} />
            <ReadField label="Consultation Type" value={form.consultation_type} />
          </div>
        </div>

        {/* Documents */}
        <div className="card-base p-6">
          <h2 className="text-sm font-semibold mb-4 label-caps">Documents</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <DocView label="Medical License" url={licenseUrl} />
            <DocView label="Degree Certificate" url={degreeUrl} />
            <DocView label="Government ID" url={govIdUrl} />
          </div>
        </div>
      </div>
    );
  }

  // ── Pending review screen ──────────────────────────────────
  if (profileCompleted && verifStatus === "pending_review") return <StatusScreen />;

  const isRejected = verifStatus === "rejected";
  const isEdit = editMode && verifStatus === "approved";

  return (
    <div className="px-4 sm:px-8 py-7 max-w-[860px] mx-auto page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: "#1A2332" }}>
            {isEdit ? "Edit Profile" : isRejected ? "Re-submit Profile" : "Complete Your Profile"}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
            {isEdit ? "Update your details and re-submit for admin approval."
              : isRejected ? "Your profile was rejected. Update and re-submit."
              : "Fill in your details and submit for admin approval."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isRejected && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: "#FEF2F2", color: "#B91C1C" }}>
              <XCircle size={13} /> Rejected
            </span>
          )}
          {isEdit && (
            <button onClick={() => setEditMode(false)}
              className="h-9 px-4 rounded-xl border text-sm font-medium hover:bg-gray-50 transition-colors"
              style={{ borderColor: "#D1D5DB", color: "#6B7280" }}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Avatar */}
      <div className="card-base p-6 mb-4">
        <h2 className="text-sm font-semibold mb-4 label-caps">Profile Photo</h2>
        <div className="flex items-center gap-5">
          <div className="relative">
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" className="w-20 h-20 rounded-full object-cover" />
              : <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold" style={{ background: "#E8F5F1", color: "#0D7A5F" }}>
                  {form.full_name ? form.full_name[0].toUpperCase() : "D"}
                </div>
            }
            <button onClick={() => avatarRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center shadow"
              style={{ background: "#0D7A5F" }}>
              <Camera size={13} color="#fff" />
            </button>
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "#374151" }}>Upload a clear photo</p>
            <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>JPG or PNG, max 2MB</p>
          </div>
          <input ref={avatarRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "doctor-avatars", "avatar", setAvatarUrl)} />
        </div>
      </div>

      {/* Personal Info */}
      <div className="card-base p-6 mb-4">
        <h2 className="text-sm font-semibold mb-4 label-caps">Personal Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name *" value={form.full_name} onChange={set("full_name")} placeholder="Dr. Ananya Iyer" />
          <Field label="Date of Birth" value={form.dob} onChange={set("dob")} type="date" />
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>Gender</label>
            <select value={form.gender} onChange={set("gender")} className="w-full h-11 px-3 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#D1D5DB" }}>
              <option value="">Select gender</option>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>
          <Field label="Mobile Number" value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" />
          <Field label="Email" value={form.email} onChange={() => {}} disabled />
        </div>
      </div>

      {/* Professional Info */}
      <div className="card-base p-6 mb-4">
        <h2 className="text-sm font-semibold mb-4 label-caps">Professional Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Specialization *" value={form.specialization} onChange={set("specialization")} placeholder="Cardiology" />
          <Field label="Qualification *" value={form.qualification} onChange={set("qualification")} placeholder="MBBS, MD" />
          <Field label="Years of Experience" value={form.years_of_experience} onChange={set("years_of_experience")} type="number" placeholder="5" />
          <Field label="Medical License No. *" value={form.registration_number} onChange={set("registration_number")} placeholder="MCI-2014-XXXX" />
          <Field label="Hospital / Clinic Name" value={form.hospital_clinic} onChange={set("hospital_clinic")} placeholder="Apollo Hospitals" />
          <Field label="Hospital Address" value={form.hospital_address} onChange={set("hospital_address")} placeholder="123, MG Road, Bengaluru" />
        </div>
      </div>

      {/* Consultation */}
      <div className="card-base p-6 mb-4">
        <h2 className="text-sm font-semibold mb-4 label-caps">Consultation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Consultation Fee (₹)" value={form.consultation_fee} onChange={set("consultation_fee")} type="number" placeholder="500" />
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>Consultation Type</label>
            <div className="flex gap-3">
              {(["online", "offline", "both"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, consultation_type: t }))}
                  className="flex-1 h-11 rounded-lg border text-sm font-medium capitalize transition-all"
                  style={{ background: form.consultation_type === t ? "#0D7A5F" : "#fff", borderColor: form.consultation_type === t ? "#0D7A5F" : "#D1D5DB", color: form.consultation_type === t ? "#fff" : "#374151" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="card-base p-6 mb-6">
        <h2 className="text-sm font-semibold mb-4 label-caps">Document Uploads</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <DocUpload label="Medical License *" icon={FileText} url={licenseUrl} loading={uploading === "license"} inputRef={licenseRef} onFile={(f) => uploadFile(f, "doctor-documents", "license", setLicenseUrl)} />
          <DocUpload label="Degree Certificate" icon={FileText} url={degreeUrl} loading={uploading === "degree"} inputRef={degreeRef} onFile={(f) => uploadFile(f, "doctor-documents", "degree", setDegreeUrl)} />
          <DocUpload label="Government ID" icon={CreditCard} url={govIdUrl} loading={uploading === "govid"} inputRef={govIdRef} onFile={(f) => uploadFile(f, "doctor-documents", "govid", setGovIdUrl)} />
        </div>
      </div>

      {isEdit && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "#FFFBEB", color: "#B45309" }}>
          ⚠ Editing your profile will set it back to <strong>pending review</strong>. You can still use the platform until admin re-reviews.
        </div>
      )}

      <button onClick={() => handleSubmit(isEdit)} disabled={saving}
        className="w-full h-12 rounded-xl text-white font-semibold text-sm disabled:opacity-60 transition-opacity hover:opacity-90"
        style={{ background: "#0D7A5F" }}>
        {saving ? "Submitting…" : isEdit ? "Re-submit for Approval" : isRejected ? "Re-submit for Approval" : "Submit for Approval"}
      </button>
    </div>
  );
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium mb-1 label-caps">{label}</p>
      <p className="text-sm font-medium px-3 py-2.5 rounded-lg" style={{ background: "#F9FAFB", color: value ? "#1A2332" : "#9CA3AF" }}>
        {value || "—"}
      </p>
    </div>
  );
}

function DocView({ label, url }: { label: string; url: string | null }) {
  return (
    <div>
      <p className="text-sm font-medium mb-2" style={{ color: "#374151" }}>{label}</p>
      <div className="h-24 rounded-xl border-2 flex flex-col items-center justify-center gap-2"
        style={{ borderColor: url ? "#0D7A5F" : "#E5E7EB", background: url ? "#F0FDF9" : "#F9FAFB" }}>
        {url
          ? <><CheckCircle size={18} color="#0D7A5F" /><span className="text-xs font-medium" style={{ color: "#0D7A5F" }}>Uploaded ✓</span></>
          : <span className="text-xs" style={{ color: "#9CA3AF" }}>Not uploaded</span>
        }
      </div>
      {url && (
        <a href={url} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1 text-[11px] mt-1 underline" style={{ color: "#0D7A5F" }}>
          View file <ExternalLink size={10} />
        </a>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, disabled }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; placeholder?: string; disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium" style={{ color: "#374151" }}>{label}</span>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
        className="mt-1.5 w-full h-11 px-3 rounded-lg border text-sm outline-none disabled:bg-gray-50 disabled:text-gray-400"
        style={{ borderColor: "#D1D5DB" }}
        onFocus={(e) => { if (!disabled) { e.currentTarget.style.borderColor = "#0D7A5F"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13,122,95,0.1)"; } }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "#D1D5DB"; e.currentTarget.style.boxShadow = "none"; }} />
    </label>
  );
}

function DocUpload({ label, icon: Icon, url, loading, inputRef, onFile }: {
  label: string; icon: React.ElementType; url: string | null;
  loading: boolean; inputRef: React.RefObject<HTMLInputElement>; onFile: (f: File) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium mb-2" style={{ color: "#374151" }}>{label}</p>
      <button type="button" onClick={() => inputRef.current?.click()}
        className="w-full h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors hover:border-[#0D7A5F] hover:bg-[#F0FDF9]"
        style={{ borderColor: url ? "#0D7A5F" : "#D1D5DB", background: url ? "#F0FDF9" : "#FAFAFA" }}>
        {loading ? <RefreshCw size={18} color="#0D7A5F" className="animate-spin" />
          : url ? <><CheckCircle size={18} color="#0D7A5F" /><span className="text-xs font-medium" style={{ color: "#0D7A5F" }}>Uploaded ✓</span></>
          : <><Icon size={18} color="#9CA3AF" /><span className="text-xs" style={{ color: "#9CA3AF" }}>Click to upload</span></>}
      </button>
      {url && <a href={url} target="_blank" rel="noreferrer" className="text-[11px] mt-1 block truncate underline" style={{ color: "#0D7A5F" }}>View file ↗</a>}
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
    </div>
  );
}

function StatusScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center page-enter">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: "#FFFBEB" }}>
        <Clock size={36} color="#B45309" />
      </div>
      <h2 className="text-xl font-bold mb-2" style={{ color: "#1A2332" }}>Profile Under Review</h2>
      <p className="text-sm max-w-sm leading-relaxed" style={{ color: "#6B7280" }}>
        Your profile has been submitted and is under review by our admin team.
        This usually takes up to <strong>24 hours</strong>.
      </p>
      <div className="mt-6 px-5 py-3 rounded-xl text-sm font-medium" style={{ background: "#FFFBEB", color: "#B45309" }}>
        ⏳ Awaiting admin approval
      </div>
      <p className="text-xs mt-4" style={{ color: "#9CA3AF" }}>All features will be unlocked after approval.</p>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="px-8 py-7 max-w-[860px] mx-auto space-y-4">
      <div className="h-8 w-48 skeleton rounded-xl" />
      {[...Array(4)].map((_, i) => <div key={i} className="h-40 skeleton rounded-2xl" />)}
    </div>
  );
}
