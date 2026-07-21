import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CalendarDays, Clock, Video, MapPin, CheckCircle2,
  XCircle, Clock3, X, Loader2, RefreshCw, Users,
  CalendarCheck, Check, Phone, User, VideoIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { AppointmentStatus } from "@/lib/database.types";

export const Route = createFileRoute("/_doctor/doctor/appointments")({
  head: () => ({ meta: [{ title: "Appointments — MedSeva" }] }),
  component: DoctorAppointments,
});

interface DoctorAppointment {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_age: number | null;
  patient_gender: string | null;
  patient_phone: string | null;
  appointment_date: string;
  appointment_time: string;
  mode: "online" | "offline";
  reason: string | null;
  rejection_reason: string | null;
  status: AppointmentStatus;
  created_at: string;
}

type FilterTab = "pending" | "approved" | "completed" | "rejected" | "all";

// ── Jitsi room name — deterministic, shared between doctor and patient
function jitsiRoom(appointmentId: string) {
  return `medseva-appt-${appointmentId}`;
}

function DoctorAppointments() {
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("pending");
  const [actionModal, setActionModal] = useState<{
    appt: DoctorAppointment; action: "approve" | "reject";
  } | null>(null);
  const [completeModal, setCompleteModal] = useState<DoctorAppointment | null>(null);
  const [jitsiAppt, setJitsiAppt] = useState<DoctorAppointment | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState<string>("Doctor");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setDoctorId(user.id);
        loadAppointments(user.id);
        // get doctor's display name for Jitsi
        supabase.from("profiles").select("full_name").eq("id", user.id).single()
          .then(({ data }) => { if (data?.full_name) setDoctorName(data.full_name); });
      }
    });
  }, []);

  const loadAppointments = async (uid: string) => {
    setLoading(true);

    // Step 1: fetch appointments (no joins — avoids RLS cross-table issues)
    const { data: appts, error } = await supabase
      .from("appointments")
      .select("id,patient_id,appointment_date,appointment_time,mode,reason,rejection_reason,status,created_at")
      .eq("doctor_id", uid)
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    if (error) {
      toast.error("Failed to load appointments: " + error.message);
      setLoading(false);
      return;
    }

    if (!appts || appts.length === 0) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    // Step 2: fetch patient base profiles
    const patientIds = [...new Set(appts.map((a) => a.patient_id))];
    const [profilesRes, ppRes] = await Promise.all([
      supabase.from("profiles").select("id,full_name,phone").in("id", patientIds),
      supabase.from("patient_profiles").select("id,age,gender").in("id", patientIds),
    ]);

    const profileMap = Object.fromEntries((profilesRes.data ?? []).map((p) => [p.id, p]));
    const ppMap = Object.fromEntries((ppRes.data ?? []).map((p) => [p.id, p]));

    setAppointments(appts.map((a: any) => ({
      id: a.id,
      patient_id: a.patient_id,
      patient_name: profileMap[a.patient_id]?.full_name ?? "Patient",
      patient_age: ppMap[a.patient_id]?.age ?? null,
      patient_gender: ppMap[a.patient_id]?.gender ?? null,
      patient_phone: profileMap[a.patient_id]?.phone ?? null,
      appointment_date: a.appointment_date,
      appointment_time: a.appointment_time,
      mode: a.mode,
      reason: a.reason,
      rejection_reason: a.rejection_reason,
      status: a.status,
      created_at: a.created_at,
    })));
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    const { error } = await supabase.from("appointments").update({ status: "approved" }).eq("id", id);
    if (error) { toast.error("Failed to approve"); return; }
    toast.success("Appointment approved ✓");
    setActionModal(null);
    if (doctorId) loadAppointments(doctorId);
  };

  const handleReject = async (id: string, reason: string) => {
    const { error } = await supabase.from("appointments")
      .update({ status: "rejected", rejection_reason: reason.trim() }).eq("id", id);
    if (error) { toast.error("Failed to reject"); return; }
    toast.success("Appointment rejected");
    setActionModal(null);
    if (doctorId) loadAppointments(doctorId);
  };

  const handleComplete = async (id: string) => {
    const { error } = await supabase.from("appointments").update({ status: "completed" }).eq("id", id);
    if (error) { toast.error("Failed to mark complete"); return; }
    toast.success("Appointment marked as completed ✓");
    setCompleteModal(null);
    if (doctorId) loadAppointments(doctorId);
  };

  const counts = {
    pending:   appointments.filter((a) => a.status === "pending").length,
    approved:  appointments.filter((a) => a.status === "approved").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    rejected:  appointments.filter((a) => a.status === "rejected").length,
  };

  const filtered = filter === "all" ? appointments : appointments.filter((a) => a.status === filter);

  const TABS: { key: FilterTab; label: string; color: string }[] = [
    { key: "pending",   label: `Pending${counts.pending > 0 ? ` (${counts.pending})` : ""}`, color: "#B45309" },
    { key: "approved",  label: "Approved",  color: "#15803D" },
    { key: "completed", label: "Completed", color: "#0D7A5F" },
    { key: "rejected",  label: "Rejected",  color: "#B91C1C" },
    { key: "all",       label: "All",       color: "#374151" },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-7 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: "#1A2332" }}>Appointments</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
            Manage patient appointment requests
          </p>
        </div>
        <button onClick={() => doctorId && loadAppointments(doctorId)}
          className="flex items-center gap-2 h-9 px-4 rounded-xl border text-sm font-medium hover:bg-gray-50 transition-colors"
          style={{ borderColor: "#E8ECF0", color: "#374151" }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
        <StatCard label="Pending"   value={counts.pending}   icon={<Clock3 size={16} />}        bg="#FEF9C3" color="#B45309" />
        <StatCard label="Approved"  value={counts.approved}  icon={<CalendarCheck size={16} />} bg="#DCFCE7" color="#15803D" />
        <StatCard label="Completed" value={counts.completed} icon={<CheckCircle2 size={16} />}  bg="#E8F5F1" color="#0D7A5F" />
        <StatCard label="Total"     value={appointments.length} icon={<Users size={16} />}      bg="#F7F8FA" color="#374151" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-5 w-fit flex-wrap" style={{ background: "#F3F4F6" }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
            style={filter === t.key
              ? { background: "#fff", color: t.color, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
              : { background: "transparent", color: "#6B7280" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 skeleton rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-base flex flex-col items-center justify-center py-20 gap-3">
          <CalendarDays size={32} color="#D1D5DB" />
          <p className="text-sm" style={{ color: "#6B7280" }}>
            {filter === "pending" ? "No pending requests right now." : "No appointments here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((appt) => (
            <AppointmentCard key={appt.id} appt={appt}
              onApprove={() => setActionModal({ appt, action: "approve" })}
              onReject={() => setActionModal({ appt, action: "reject" })}
              onComplete={() => setCompleteModal(appt)}
              onStartMeeting={() => setJitsiAppt(appt)}
            />
          ))}
        </div>
      )}

      {/* Approve / Reject modal */}
      {actionModal && (
        <ActionModal appt={actionModal.appt} action={actionModal.action}
          onClose={() => setActionModal(null)}
          onApprove={handleApprove} onReject={handleReject} />
      )}

      {/* Complete confirmation modal */}
      {completeModal && (
        <CompleteModal appt={completeModal}
          onClose={() => setCompleteModal(null)}
          onConfirm={handleComplete} />
      )}

      {/* Jitsi meeting modal */}
      {jitsiAppt && (
        <JitsiModal
          roomName={jitsiRoom(jitsiAppt.id)}
          displayName={`Dr. ${doctorName}`}
          onClose={() => setJitsiAppt(null)}
        />
      )}
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, bg, color }: {
  label: string; value: number; icon: React.ReactNode; bg: string; color: string;
}) {
  return (
    <div className="card-base p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: bg, color }}>
        {icon}
      </div>
      <div>
        <div className="text-xl font-bold" style={{ color }}>{value}</div>
        <div className="text-xs font-medium" style={{ color: "#6B7280" }}>{label}</div>
      </div>
    </div>
  );
}

// ── Appointment Card ───────────────────────────────────────────────────────────
function AppointmentCard({ appt, onApprove, onReject, onComplete, onStartMeeting }: {
  appt: DoctorAppointment;
  onApprove: () => void; onReject: () => void; onComplete: () => void; onStartMeeting: () => void;
}) {
  const STATUS: Record<AppointmentStatus, { label: string; color: string; bg: string }> = {
    pending:   { label: "Pending",   color: "#B45309", bg: "#FEF9C3" },
    approved:  { label: "Approved",  color: "#15803D", bg: "#DCFCE7" },
    rejected:  { label: "Rejected",  color: "#B91C1C", bg: "#FEE2E2" },
    cancelled: { label: "Cancelled", color: "#6B7280", bg: "#F3F4F6" },
    completed: { label: "Completed", color: "#0D7A5F", bg: "#E8F5F1" },
  };
  const cfg = STATUS[appt.status];
  const initials = appt.patient_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const formattedDate = new Date(appt.appointment_date).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
  const formattedTime = appt.appointment_time.slice(0, 5);
  const requestedOn = new Date(appt.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  return (
    <div className="card-base p-5">
      <div className="flex items-start gap-4 flex-wrap">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
          style={{ background: "#E8F5F1", color: "#0D7A5F" }}>
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-base font-semibold" style={{ color: "#1A2332" }}>{appt.patient_name}</span>
            {(appt.patient_age || appt.patient_gender) && (
              <span className="text-xs" style={{ color: "#6B7280" }}>
                {[appt.patient_age ? `${appt.patient_age}y` : null, appt.patient_gender].filter(Boolean).join(" · ")}
              </span>
            )}
            {appt.patient_phone && (
              <span className="flex items-center gap-1 text-xs" style={{ color: "#6B7280" }}>
                <Phone size={11} /> {appt.patient_phone}
              </span>
            )}
            <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: cfg.bg, color: cfg.color }}>
              {cfg.label}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs flex-wrap" style={{ color: "#6B7280" }}>
            <span className="flex items-center gap-1.5"><CalendarDays size={12} /> {formattedDate}</span>
            <span className="flex items-center gap-1.5"><Clock size={12} /> {formattedTime}</span>
            <span className="flex items-center gap-1.5">
              {appt.mode === "online" ? <Video size={12} /> : <MapPin size={12} />}
              {appt.mode === "online" ? "Online" : "In-Person"}
            </span>
            <span className="ml-auto" style={{ color: "#9CA3AF" }}>Requested {requestedOn}</span>
          </div>

          {appt.reason && (
            <div className="mt-2 px-3 py-2 rounded-lg text-xs" style={{ background: "#F7F8FA", color: "#374151" }}>
              <span className="font-semibold">Reason: </span>{appt.reason}
            </div>
          )}

          {appt.status === "rejected" && appt.rejection_reason && (
            <div className="mt-2 px-3 py-2 rounded-lg text-xs" style={{ background: "#FEF2F2", color: "#B91C1C" }}>
              <span className="font-semibold">Rejection reason: </span>{appt.rejection_reason}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {appt.status === "pending" && (
        <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: "#EEF0F3" }}>
          <button onClick={onApprove}
            className="flex items-center gap-1.5 h-9 px-5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "#15803D" }}>
            <CheckCircle2 size={15} /> Approve
          </button>
          <button onClick={onReject}
            className="flex items-center gap-1.5 h-9 px-5 rounded-xl text-sm font-semibold border transition-colors hover:bg-red-50"
            style={{ borderColor: "#FECACA", color: "#B91C1C" }}>
            <XCircle size={15} /> Reject
          </button>
        </div>
      )}

      {appt.status === "approved" && (
        <div className="flex items-center gap-3 mt-4 pt-4 border-t flex-wrap" style={{ borderColor: "#EEF0F3" }}>
          {appt.mode === "online" && (
            <button onClick={onStartMeeting}
              className="flex items-center gap-1.5 h-9 px-5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "#2563EB" }}>
              <VideoIcon size={15} /> Start Meeting
            </button>
          )}
          <button onClick={onComplete}
            className="flex items-center gap-1.5 h-9 px-5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ border: "1.5px solid #0D7A5F", color: "#0D7A5F" }}>
            <Check size={15} /> Mark as Completed
          </button>
          {appt.mode === "online" && (
            <span className="text-xs" style={{ color: "#9CA3AF" }}>Start meeting, then mark complete when done</span>
          )}
        </div>
      )}

      {appt.status === "completed" && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t" style={{ borderColor: "#EEF0F3" }}>
          <CheckCircle2 size={15} color="#0D7A5F" />
          <span className="text-xs font-medium" style={{ color: "#0D7A5F" }}>Appointment completed</span>
        </div>
      )}
    </div>
  );
}

// ── Action Modal (Approve / Reject) ────────────────────────────────────────────
function ActionModal({ appt, action, onClose, onApprove, onReject }: {
  appt: DoctorAppointment;
  action: "approve" | "reject";
  onClose: () => void;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const formattedDate = new Date(appt.appointment_date).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const handleSubmit = async () => {
    if (action === "reject" && !rejectionReason.trim()) {
      toast.error("Please enter a rejection reason"); return;
    }
    setSubmitting(true);
    if (action === "approve") await onApprove(appt.id);
    else await onReject(appt.id, rejectionReason);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="relative w-full max-w-md rounded-2xl p-6 shadow-xl" style={{ background: "#fff" }}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
          <X size={16} color="#6B7280" />
        </button>

        <div className="mb-5">
          <h2 className="text-lg font-bold" style={{ color: "#1A2332" }}>
            {action === "approve" ? "Approve Appointment" : "Reject Appointment"}
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
            {appt.patient_name}{appt.patient_age ? ` · ${appt.patient_age}y` : ""}{appt.patient_gender ? ` · ${appt.patient_gender}` : ""}
          </p>
        </div>

        {/* Summary */}
        <div className="rounded-xl p-4 mb-5 space-y-2" style={{ background: "#F7F8FA" }}>
          <div className="flex items-center gap-2 text-sm" style={{ color: "#374151" }}>
            <CalendarDays size={14} color="#0D7A5F" /> {formattedDate}
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: "#374151" }}>
            <Clock size={14} color="#0D7A5F" /> {appt.appointment_time.slice(0, 5)}
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: "#374151" }}>
            {appt.mode === "online" ? <Video size={14} color="#0D7A5F" /> : <MapPin size={14} color="#0D7A5F" />}
            {appt.mode === "online" ? "Online Consultation" : "In-Person Visit"}
          </div>
          {appt.reason && (
            <div className="flex items-start gap-2 text-sm pt-1 border-t" style={{ borderColor: "#E8ECF0", color: "#6B7280" }}>
              <User size={14} color="#9CA3AF" className="mt-0.5 shrink-0" />
              <span>{appt.reason}</span>
            </div>
          )}
        </div>

        {action === "approve" && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-5" style={{ background: "#DCFCE7", color: "#15803D" }}>
            <CheckCircle2 size={16} /> Patient will be notified of approval.
          </div>
        )}

        {action === "reject" && (
          <div className="mb-5">
            <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "#374151" }}>
              Reason for Rejection <span style={{ color: "#B91C1C" }}>*</span>
            </label>
            <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Not available on this date, please reschedule…"
              rows={3} maxLength={300}
              className="w-full px-3 py-2 rounded-xl border text-sm resize-none outline-none"
              style={{ borderColor: "#FECACA", color: "#1A2332" }} />
            <div className="text-right text-[11px] mt-1" style={{ color: "#9CA3AF" }}>{rejectionReason.length}/300</div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 h-10 rounded-xl border text-sm font-semibold hover:bg-gray-50 transition-colors"
            style={{ borderColor: "#E8ECF0", color: "#6B7280" }}>
            Cancel
          </button>
          <button onClick={handleSubmit}
            disabled={submitting || (action === "reject" && !rejectionReason.trim())}
            className="flex-1 h-10 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
            style={{ background: action === "approve" ? "#15803D" : "#B91C1C" }}>
            {submitting && <Loader2 size={15} className="animate-spin" />}
            {submitting ? "Saving…" : action === "approve" ? "Confirm Approval" : "Confirm Rejection"}
          </button>
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

// ── Complete Confirmation Modal ────────────────────────────────────────────────

function CompleteModal({ appt, onClose, onConfirm }: {
  appt: DoctorAppointment;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    await onConfirm(appt.id);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="relative w-full max-w-sm rounded-2xl p-6 shadow-xl" style={{ background: "#fff" }}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
          <X size={16} color="#6B7280" />
        </button>

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#E8F5F1" }}>
          <CheckCircle2 size={28} color="#0D7A5F" />
        </div>

        <h2 className="text-lg font-bold text-center mb-1" style={{ color: "#1A2332" }}>Mark as Completed?</h2>
        <p className="text-sm text-center mb-5" style={{ color: "#6B7280" }}>
          Confirm that the appointment with <strong>{appt.patient_name}</strong> on{" "}
          {new Date(appt.appointment_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} at{" "}
          {appt.appointment_time.slice(0, 5)} has been completed.
        </p>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 h-10 rounded-xl border text-sm font-semibold hover:bg-gray-50 transition-colors"
            style={{ borderColor: "#E8ECF0", color: "#6B7280" }}>
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={submitting}
            className="flex-1 h-10 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90 transition-opacity"
            style={{ background: "#0D7A5F" }}>
            {submitting && <Loader2 size={15} className="animate-spin" />}
            {submitting ? "Saving…" : "Yes, Completed"}
          </button>
        </div>
      </div>
    </div>
  );
}
