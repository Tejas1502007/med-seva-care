import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CalendarDays, Clock, Stethoscope, IndianRupee,
  MapPin, Video, CheckCircle2, XCircle, Clock3,
  ChevronRight, X, Loader2, RefreshCw, VideoIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { AppointmentMode, AppointmentStatus } from "@/lib/database.types";

// ── Jitsi room name — same formula as doctor side
function jitsiRoom(appointmentId: string) {
  return `medseva-appt-${appointmentId}`;
}

export const Route = createFileRoute("/_patient/appointments")({
  head: () => ({
    meta: [
      { title: "Appointments — MedSeva" },
      { name: "description", content: "Browse doctors and book appointments." },
    ],
  }),
  component: PatientAppointments,
});

// ── Types ──────────────────────────────────────────────────────────────────────

interface DoctorCard {
  id: string;
  // from profiles table
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  // from doctor_profiles table
  dob: string | null;
  gender: string | null;
  specialization: string;
  qualification: string;
  years_of_experience: number | null;
  registration_number: string | null;
  hospital_clinic: string | null;
  hospital_address: string | null;
  consultation_fee: number | null;
  consultation_type: "online" | "offline" | "both" | null;
  verification_status: "pending_review" | "approved" | "rejected" | null;
}

interface Appointment {
  id: string;
  doctor_id: string;
  doctor_name: string;
  doctor_specialization: string;
  appointment_date: string;
  appointment_time: string;
  mode: AppointmentMode;
  reason: string | null;
  rejection_reason: string | null;
  status: AppointmentStatus;
  created_at: string;
}

type Tab = "book" | "my";

// ── Main Component ─────────────────────────────────────────────────────────────

function PatientAppointments() {
  const [tab, setTab] = useState<Tab>("book");
  const [doctors, setDoctors] = useState<DoctorCard[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [apptLoading, setApptLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorCard | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string>("Patient");
  const [jitsiAppt, setJitsiAppt] = useState<Appointment | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        loadDoctors();
        loadMyAppointments(user.id);
        supabase.from("profiles").select("full_name").eq("id", user.id).single()
          .then(({ data }) => { if (data?.full_name) setPatientName(data.full_name); });
      }
    });
  }, []);

  // ── Load all doctors ──────────────────────────────────────────────────────

  const loadDoctors = async () => {
    setLoading(true);

    // Step 1: get all profiles with role = 'doctor'
    const { data: doctorProfiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, avatar_url")
      .eq("role", "doctor");

    if (profilesError) {
      toast.error("Failed to load doctors: " + profilesError.message);
      setLoading(false);
      return;
    }

    if (!doctorProfiles || doctorProfiles.length === 0) {
      setDoctors([]);
      setLoading(false);
      return;
    }

    const ids = doctorProfiles.map((p) => p.id);

    // Step 2: get doctor_profiles for those IDs (may not exist for all)
    const { data: dpData } = await supabase
      .from("doctor_profiles")
      .select(`
        id,
        dob,
        gender,
        specialization,
        qualification,
        years_of_experience,
        registration_number,
        hospital_clinic,
        hospital_address,
        consultation_fee,
        consultation_type,
        verification_status
      `)
      .in("id", ids);

    const dpMap = Object.fromEntries((dpData ?? []).map((dp) => [dp.id, dp]));

    setDoctors(
      doctorProfiles.map((p) => {
        const dp = dpMap[p.id] ?? null;
        return {
          id: p.id,
          full_name: p.full_name ?? "Doctor",
          email: p.email ?? null,
          phone: p.phone ?? null,
          avatar_url: p.avatar_url ?? null,
          dob: dp?.dob ?? null,
          gender: dp?.gender ?? null,
          specialization: dp?.specialization ?? "",
          qualification: dp?.qualification ?? "",
          years_of_experience: dp?.years_of_experience ?? null,
          registration_number: dp?.registration_number ?? null,
          hospital_clinic: dp?.hospital_clinic ?? null,
          hospital_address: dp?.hospital_address ?? null,
          consultation_fee: dp?.consultation_fee ?? null,
          consultation_type: dp?.consultation_type ?? null,
          verification_status: dp?.verification_status ?? null,
        };
      })
    );
    setLoading(false);
  };

  // ── Load patient's own appointments ───────────────────────────────────────

  const loadMyAppointments = async (uid: string) => {
    setApptLoading(true);
    
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        doctor_id,
        appointment_date,
        appointment_time,
        mode,
        reason,
        rejection_reason,
        status,
        created_at
      `)
      .eq("patient_id", uid)
      .order("appointment_date", { ascending: false });

    if (error) {
      console.error("Appointments query error:", error);
      toast.error("Failed to load appointments: " + error.message);
      setApptLoading(false);
      return;
    }

    // Get doctor IDs to fetch their profiles
    const doctorIds = [...new Set((data ?? []).map((a: any) => a.doctor_id))];
    
    if (doctorIds.length === 0) {
      setAppointments([]);
      setApptLoading(false);
      return;
    }

    // Fetch doctor profiles and doctor_profiles in parallel
    const [profilesRes, docProfilesRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name").in("id", doctorIds),
      supabase.from("doctor_profiles").select("id, specialization").in("id", doctorIds),
    ]);

    const profileMap = Object.fromEntries(
      (profilesRes.data ?? []).map((p) => [p.id, p.full_name])
    );
    const docProfileMap = Object.fromEntries(
      (docProfilesRes.data ?? []).map((dp) => [dp.id, dp.specialization])
    );

    setAppointments(
      (data ?? []).map((a: any) => ({
        id: a.id,
        doctor_id: a.doctor_id,
        doctor_name: profileMap[a.doctor_id] ?? "Doctor",
        doctor_specialization: docProfileMap[a.doctor_id] ?? "",
        appointment_date: a.appointment_date,
        appointment_time: a.appointment_time,
        mode: a.mode,
        reason: a.reason,
        rejection_reason: a.rejection_reason,
        status: a.status,
        created_at: a.created_at,
      }))
    );
    setApptLoading(false);
  };

  const handleCancelAppointment = async (id: string) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", id)
      .eq("status", "pending");

    if (error) {
      toast.error("Could not cancel appointment");
      return;
    }
    toast.success("Appointment cancelled");
    if (userId) loadMyAppointments(userId);
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 page-enter">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold" style={{ color: "#1A2332" }}>Appointments</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
          Browse verified doctors and book online or in-person appointments.
        </p>
      </div>

      {/* Tab bar */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-6 w-fit"
        style={{ background: "#F3F4F6" }}
      >
        {(["book", "my"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={
              tab === t
                ? { background: "#FFFFFF", color: "#0D7A5F", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                : { background: "transparent", color: "#6B7280" }
            }
          >
            {t === "book" ? "Find a Doctor" : "My Appointments"}
          </button>
        ))}
      </div>

      {/* ── TAB: Book ── */}
      {tab === "book" && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-52 skeleton rounded-2xl" />
              ))}
            </div>
          ) : doctors.length === 0 ? (
            <div className="card-base flex flex-col items-center justify-center py-20 gap-3">
              <Stethoscope size={32} color="#D1D5DB" />
              <p className="text-sm" style={{ color: "#6B7280" }}>No doctor accounts found.</p>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>Make sure doctor accounts are created in the system.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {doctors.map((doc) => (
                <DoctorCardItem
                  key={doc.id}
                  doc={doc}
                  onBook={() => setSelectedDoctor(doc)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── TAB: My Appointments ── */}
      {tab === "my" && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => userId && loadMyAppointments(userId)}
              className="flex items-center gap-2 h-8 px-3 rounded-lg border text-xs font-medium hover:bg-gray-50 transition-colors"
              style={{ borderColor: "#E8ECF0", color: "#374151" }}
            >
              <RefreshCw size={13} />
              Refresh
            </button>
          </div>
          {apptLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
            </div>
          ) : appointments.length === 0 ? (
            <div className="card-base flex flex-col items-center justify-center py-20 gap-3">
              <CalendarDays size={32} color="#D1D5DB" />
              <p className="text-sm" style={{ color: "#6B7280" }}>No appointments yet. Book one from "Find a Doctor".</p>
              <button
                onClick={() => setTab("book")}
                className="mt-2 h-9 px-5 rounded-lg text-sm font-semibold text-white"
                style={{ background: "#0D7A5F" }}
              >
                Find a Doctor
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((a) => (
                <AppointmentRow
                  key={a.id}
                  appt={a}
                  onCancel={handleCancelAppointment}
                  onJoinMeeting={(appt) => setJitsiAppt(appt)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Jitsi Meeting Modal ── */}
      {jitsiAppt && (
        <JitsiModal
          roomName={jitsiRoom(jitsiAppt.id)}
          displayName={patientName}
          onClose={() => setJitsiAppt(null)}
        />
      )}

      {/* ── Booking Modal ── */}
      {selectedDoctor && (
        <BookingModal
          doctor={selectedDoctor}
          patientId={userId!}
          onClose={() => setSelectedDoctor(null)}
          onBooked={() => {
            setSelectedDoctor(null);
            setTab("my");
            if (userId) loadMyAppointments(userId);
          }}
        />
      )}
    </div>
  );
}

// ── Doctor Card ────────────────────────────────────────────────────────────────

function DoctorCardItem({ doc, onBook }: { doc: DoctorCard; onBook: () => void }) {
  const initials = doc.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const modeLabel =
    doc.consultation_type === "both" ? "Online & In-Person" :
    doc.consultation_type === "online" ? "Online" :
    doc.consultation_type === "offline" ? "In-Person" : "—";

  // Calculate age from dob stored in doctor_profiles
  const age = doc.dob
    ? Math.floor((Date.now() - new Date(doc.dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null;

  const verifBadge = {
    approved:       { label: "Verified",        bg: "#ECFDF5", color: "#065F46" },
    pending_review: { label: "Pending Review",  bg: "#FFFBEB", color: "#B45309" },
    rejected:       { label: "Not Verified",    bg: "#FEF2F2", color: "#B91C1C" },
  };
  const badge = doc.verification_status ? verifBadge[doc.verification_status] : null;

  return (
    <div className="card-base p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">

      {/* ── Avatar + Name ── */}
      <div className="flex items-start gap-3">
        {doc.avatar_url ? (
          <img src={doc.avatar_url} alt={`Dr. ${doc.full_name}`}
            className="w-14 h-14 rounded-full object-cover shrink-0 border-2"
            style={{ borderColor: "#E8F5F1" }} />
        ) : (
          <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg shrink-0"
            style={{ background: "#E8F5F1", color: "#0D7A5F" }}>
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-base font-bold truncate" style={{ color: "#1A2332" }}>
              Dr. {doc.full_name}
            </p>
            {badge && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                style={{ background: badge.bg, color: badge.color }}>
                {badge.label}
              </span>
            )}
          </div>
          {doc.specialization ? (
            <p className="text-sm font-medium truncate" style={{ color: "#0D7A5F" }}>
              {doc.specialization}
            </p>
          ) : (
            <p className="text-sm truncate" style={{ color: "#9CA3AF" }}>Profile not completed</p>
          )}
          {doc.qualification && (
            <p className="text-xs truncate" style={{ color: "#6B7280" }}>
              {doc.qualification}
            </p>
          )}
          {(age || doc.gender) && (
            <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
              {[age ? `${age} yrs` : null, doc.gender].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>

      {/* ── Details ── */}
      <div className="space-y-1.5">
        {doc.hospital_clinic && (
          <div className="flex items-center gap-2 text-xs" style={{ color: "#6B7280" }}>
            <Stethoscope size={12} />
            <span className="truncate font-medium">{doc.hospital_clinic}</span>
          </div>
        )}
        {doc.hospital_address && (
          <div className="flex items-center gap-2 text-xs" style={{ color: "#6B7280" }}>
            <MapPin size={12} />
            <span className="truncate">{doc.hospital_address}</span>
          </div>
        )}
        {doc.years_of_experience != null && (
          <div className="flex items-center gap-2 text-xs" style={{ color: "#6B7280" }}>
            <Clock size={12} />
            <span>{doc.years_of_experience} yrs experience</span>
          </div>
        )}
        {doc.consultation_type && (
          <div className="flex items-center gap-2 text-xs" style={{ color: "#6B7280" }}>
            {doc.consultation_type === "online" ? <Video size={12} /> : <MapPin size={12} />}
            <span>{modeLabel}</span>
          </div>
        )}
        {doc.phone && (
          <div className="flex items-center gap-2 text-xs" style={{ color: "#6B7280" }}>
            <span>📞</span>
            <span>{doc.phone}</span>
          </div>
        )}
        {doc.registration_number && (
          <div className="flex items-center gap-2 text-xs" style={{ color: "#9CA3AF" }}>
            <span>🪪</span>
            <span>Reg: {doc.registration_number}</span>
          </div>
        )}
        {doc.email && !doc.phone && (
          <div className="flex items-center gap-2 text-xs" style={{ color: "#6B7280" }}>
            <span>✉️</span>
            <span className="truncate">{doc.email}</span>
          </div>
        )}
      </div>

      {/* ── Fee + Book ── */}
      <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "#EEF0F3" }}>
        <div>
          <div className="flex items-center gap-0.5 text-base font-bold" style={{ color: "#1A2332" }}>
            <IndianRupee size={14} />
            {doc.consultation_fee != null ? doc.consultation_fee : "—"}
          </div>
          <p className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>per consultation</p>
        </div>
        <button
          onClick={onBook}
          className="flex items-center gap-1 h-9 px-5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "#0D7A5F" }}
        >
          Book <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ── Appointment Row ────────────────────────────────────────────────────────────

function AppointmentRow({
  appt,
  onCancel,
  onJoinMeeting,
}: {
  appt: Appointment;
  onCancel: (id: string) => void;
  onJoinMeeting: (appt: Appointment) => void;
}) {
  const statusConfig: Record<AppointmentStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    pending:   { label: "Pending",   color: "#B45309", bg: "#FEF9C3", icon: <Clock3 size={13} /> },
    approved:  { label: "Approved",  color: "#15803D", bg: "#DCFCE7", icon: <CheckCircle2 size={13} /> },
    rejected:  { label: "Rejected",  color: "#B91C1C", bg: "#FEE2E2", icon: <XCircle size={13} /> },
    cancelled: { label: "Cancelled", color: "#6B7280", bg: "#F3F4F6", icon: <X size={13} /> },
    completed: { label: "Completed", color: "#0D7A5F", bg: "#E8F5F1", icon: <CheckCircle2 size={13} /> },
  };

  const cfg = statusConfig[appt.status];

  const formattedDate = new Date(appt.appointment_date).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
  const formattedTime = appt.appointment_time.slice(0, 5); // "HH:MM"

  return (
    <div className="card-base p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        {/* Left: doctor info + date/time */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-semibold" style={{ color: "#1A2332" }}>
              Dr. {appt.doctor_name}
            </span>
            {appt.doctor_specialization && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#E8F5F1", color: "#0D7A5F" }}>
                {appt.doctor_specialization}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs flex-wrap" style={{ color: "#6B7280" }}>
            <span className="flex items-center gap-1.5">
              <CalendarDays size={12} /> {formattedDate}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={12} /> {formattedTime}
            </span>
            <span className="flex items-center gap-1.5">
              {appt.mode === "online" ? <Video size={12} /> : <MapPin size={12} />}
              {appt.mode === "online" ? "Online" : "In-Person"}
            </span>
          </div>

          {appt.reason && (
            <p className="mt-2 text-xs" style={{ color: "#6B7280" }}>
              <span className="font-medium" style={{ color: "#374151" }}>Reason:</span> {appt.reason}
            </p>
          )}

          {appt.status === "rejected" && appt.rejection_reason && (
            <div
              className="mt-2 px-3 py-2 rounded-lg text-xs"
              style={{ background: "#FEF2F2", color: "#B91C1C" }}
            >
              <span className="font-semibold">Rejected:</span> {appt.rejection_reason}
            </div>
          )}
        </div>

        {/* Right: status badge + cancel */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {cfg.icon} {cfg.label}
          </span>
          {appt.status === "pending" && (
            <button
              onClick={() => onCancel(appt.id)}
              className="text-xs text-red-500 hover:underline"
            >
              Cancel
            </button>
          )}
          {/* Join Meeting — only for approved online appointments */}
          {appt.status === "approved" && appt.mode === "online" && (
            <button
              onClick={() => onJoinMeeting(appt)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "#2563EB" }}
            >
              <VideoIcon size={13} /> Join Meeting
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Jitsi Meeting Modal ────────────────────────────────────────────────────────
function JitsiModal({ roomName, displayName, onClose }: {
  roomName: string; displayName: string; onClose: () => void;
}) {
  const params = [
    `userInfo.displayName="${encodeURIComponent(displayName)}"`,
    "config.prejoinPageEnabled=false",
    "config.startWithVideoMuted=false",
    "config.startWithAudioMuted=false",
  ].join("&");
  const src = `https://meet.jit.si/${roomName}#${params}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#0F172A" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ background: "#1E293B" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#2563EB" }}>
            <VideoIcon size={16} color="#fff" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">MedSeva Video Consultation</p>
            <p className="text-xs" style={{ color: "#94A3B8" }}>Powered by Jitsi Meet · Room: {roomName}</p>
          </div>
        </div>
        <button onClick={onClose}
          className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold transition-colors hover:bg-red-600"
          style={{ background: "#EF4444", color: "#fff" }}>
          <X size={15} /> End & Close
        </button>
      </div>

      {/* Jitsi iframe */}
      <iframe
        src={src}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        className="flex-1 w-full border-0"
        title="MedSeva Video Consultation"
      />
    </div>
  );
}

// ── Booking Modal ──────────────────────────────────────────────────────────────

interface BookingModalProps {
  doctor: DoctorCard;
  patientId: string;
  onClose: () => void;
  onBooked: () => void;
}

function BookingModal({ doctor, patientId, onClose, onBooked }: BookingModalProps) {
  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [mode, setMode] = useState<AppointmentMode>(
    doctor.consultation_type === "online" ? "online" : "offline"
  );
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const availableModes: AppointmentMode[] =
    doctor.consultation_type === "both"
      ? ["online", "offline"]
      : doctor.consultation_type === "online"
      ? ["online"]
      : ["offline"];

  const handleSubmit = async () => {
    if (!date) { toast.error("Please select a date"); return; }
    if (!time) { toast.error("Please select a time"); return; }
    if (!reason.trim()) { toast.error("Please describe your reason for visit"); return; }

    setSubmitting(true);

    const { error } = await supabase.from("appointments").insert({
      patient_id: patientId,
      doctor_id: doctor.id,
      appointment_date: date,
      appointment_time: time + ":00",
      mode,
      reason: reason.trim(),
      status: "pending",
    });

    setSubmitting(false);

    if (error) {
      toast.error("Failed to send request: " + error.message);
      return;
    }

    toast.success("Appointment request sent to Dr. " + doctor.full_name);
    onBooked();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-6 shadow-xl"
        style={{ background: "#FFFFFF" }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={16} color="#6B7280" />
        </button>

        {/* Header with Doctor Profile */}
        <div className="mb-5">
          <h2 className="text-lg font-bold mb-3" style={{ color: "#1A2332" }}>
            Book Appointment
          </h2>
          
          {/* Doctor Card */}
          <div className="p-4 rounded-xl" style={{ background: "#F7F8FA" }}>
            <div className="flex items-start gap-3 mb-3">
              {doctor.avatar_url ? (
                <img src={doctor.avatar_url} alt={`Dr. ${doctor.full_name}`}
                  className="w-12 h-12 rounded-full object-cover shrink-0 border-2"
                  style={{ borderColor: "#E8F5F1" }} />
              ) : (
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold shrink-0"
                  style={{ background: "#E8F5F1", color: "#0D7A5F" }}>
                  {doctor.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold truncate" style={{ color: "#1A2332" }}>
                  Dr. {doctor.full_name}
                </p>
                <p className="text-sm font-medium truncate" style={{ color: "#0D7A5F" }}>
                  {doctor.specialization}
                </p>
                <p className="text-xs truncate" style={{ color: "#6B7280" }}>
                  {doctor.qualification}
                </p>
              </div>
            </div>

            {/* Quick Info */}
            <div className="space-y-1.5 text-xs" style={{ color: "#6B7280" }}>
              {doctor.hospital_clinic && (
                <div className="flex items-center gap-2">
                  <Stethoscope size={11} />
                  <span className="truncate">{doctor.hospital_clinic}</span>
                </div>
              )}
              {doctor.years_of_experience != null && (
                <div className="flex items-center gap-2">
                  <Clock size={11} />
                  <span>{doctor.years_of_experience} years experience</span>
                </div>
              )}
              {doctor.phone && (
                <div className="flex items-center gap-2">
                  <span>📞</span>
                  <span>{doctor.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Consultation mode */}
        <div className="mb-4">
          <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "#374151" }}>
            Consultation Type
          </label>
          <div className="flex gap-2">
            {availableModes.map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border text-sm font-semibold transition-all"
                style={
                  mode === m
                    ? { borderColor: "#0D7A5F", background: "#E8F5F1", color: "#0D7A5F" }
                    : { borderColor: "#E8ECF0", background: "#F7F8FA", color: "#6B7280" }
                }
              >
                {m === "online" ? <Video size={15} /> : <MapPin size={15} />}
                {m === "online" ? "Online" : "In-Person"}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div className="mb-4">
          <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "#374151" }}>
            Preferred Date
          </label>
          <input
            type="date"
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#0D7A5F]/30"
            style={{ borderColor: "#E8ECF0", color: "#1A2332" }}
          />
        </div>

        {/* Time */}
        <div className="mb-4">
          <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "#374151" }}>
            Preferred Time
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#0D7A5F]/30"
            style={{ borderColor: "#E8ECF0", color: "#1A2332" }}
          />
        </div>

        {/* Reason */}
        <div className="mb-6">
          <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "#374151" }}>
            Reason for Visit
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Briefly describe your symptoms or reason..."
            rows={3}
            maxLength={300}
            className="w-full px-3 py-2 rounded-xl border text-sm resize-none outline-none focus:ring-2 focus:ring-[#0D7A5F]/30"
            style={{ borderColor: "#E8ECF0", color: "#1A2332" }}
          />
          <div className="text-right text-[11px] mt-1" style={{ color: "#9CA3AF" }}>
            {reason.length}/300
          </div>
        </div>

        {/* Fee info */}
        {doctor.consultation_fee != null && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-5"
            style={{ background: "#F7F8FA", color: "#374151" }}
          >
            <IndianRupee size={14} color="#0D7A5F" />
            <span>Consultation fee: <strong>₹{doctor.consultation_fee}</strong></span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border text-sm font-semibold transition-colors hover:bg-gray-50"
            style={{ borderColor: "#E8ECF0", color: "#6B7280" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 h-10 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "#0D7A5F" }}
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : null}
            {submitting ? "Sending…" : "Send Request"}
          </button>
        </div>
      </div>
    </div>
  );
}
