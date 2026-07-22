import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

interface QrShare {
  id: string;
  patient_id: string;
  token: string;
  pin: string;
  is_active: boolean;
  expires_at: string | null;
  share_vitals: boolean;
  share_reports: boolean;
  share_medications: boolean;
  share_profile: boolean;
  access_count: number;
  access_log: { accessed_at: string; ip_hint: string }[];
}

export const Route = createFileRoute("/api/qr-share/view")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const { token, pin } = (await request.json()) as { token: string; pin: string };
          if (!token || !pin) {
            return new Response(JSON.stringify({ error: "Missing token or PIN" }), { status: 400 });
          }

          // Anon client — public_read_by_token policy allows SELECT
          const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: { persistSession: false },
          });

          const { data: share, error } = await (anonClient as any)
            .from("qr_shares")
            .select("*")
            .eq("token", token)
            .maybeSingle();

          if (error || !share) return new Response(JSON.stringify({ error: "Invalid link" }), { status: 404 });

          const s = share as QrShare;
          if (!s.is_active) return new Response(JSON.stringify({ error: "Access revoked by patient" }), { status: 403 });
          if (s.pin !== pin) return new Response(JSON.stringify({ error: "Incorrect PIN" }), { status: 403 });
          if (s.expires_at && new Date(s.expires_at) < new Date()) {
            return new Response(JSON.stringify({ error: "This link has expired" }), { status: 403 });
          }

          const pid = s.patient_id;

          const [profileRes, patientRes, vitalsRes, reportsRes, medsRes] = await Promise.all([
            s.share_profile
              ? (anonClient as any).from("profiles").select("full_name, email, phone, avatar_url").eq("id", pid).maybeSingle()
              : Promise.resolve({ data: null }),
            s.share_profile
              ? (anonClient as any).from("patient_profiles").select("age, dob, gender, blood_group, height, weight, conditions, allergies, risk_level, risk_score, emergency_contact").eq("id", pid).maybeSingle()
              : Promise.resolve({ data: null }),
            s.share_vitals
              ? (anonClient as any).from("vitals").select("type, value, unit, notes, recorded_at").eq("patient_id", pid).order("recorded_at", { ascending: false }).limit(20)
              : Promise.resolve({ data: [] }),
            s.share_reports
              ? (anonClient as any).from("health_reports").select("id, name, report_date, status, ai_summary, lab_values, file_url").eq("patient_id", pid).order("report_date", { ascending: false }).limit(10)
              : Promise.resolve({ data: [] }),
            s.share_medications
              ? (anonClient as any).from("medications").select("name, dose, frequency, times, unit, quantity, is_active, streak").eq("patient_id", pid).eq("is_active", true).order("created_at", { ascending: false })
              : Promise.resolve({ data: [] }),
          ]);

          // Fetch patient documents from storage
          const DOC_CATEGORIES = ["lab-reports", "prescriptions", "scans", "insurance"];
          const documents: Record<string, { name: string; url: string }[]> = {};
          await Promise.all(
            DOC_CATEGORIES.map(async (cat) => {
              const { data: files } = await anonClient.storage
                .from("patient-documents")
                .list(`${pid}/${cat}`, { sortBy: { column: "created_at", order: "desc" } });
              if (!files) { documents[cat] = []; return; }
              documents[cat] = files
                .filter((f) => f.name !== ".emptyFolderPlaceholder")
                .map((f) => {
                  const path = `${pid}/${cat}/${f.name}`;
                  const { data: { publicUrl } } = anonClient.storage.from("patient-documents").getPublicUrl(path);
                  return { name: f.name.replace(/^\d+-/, ""), url: publicUrl };
                });
            })
          );
          // Update access log using anon client (RLS policies allow this)
          const ipHint = (request.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
          const newLog = [...(s.access_log ?? []), { accessed_at: new Date().toISOString(), ip_hint: ipHint }].slice(-50);

          await (anonClient as any)
            .from("qr_shares")
            .update({
              last_accessed_at: new Date().toISOString(),
              access_count: (s.access_count ?? 0) + 1,
              access_log: newLog,
            })
            .eq("id", s.id);

          return new Response(
            JSON.stringify({
              success: true,
              permissions: {
                share_profile: s.share_profile,
                share_vitals: s.share_vitals,
                share_reports: s.share_reports,
                share_medications: s.share_medications,
              },
              data: {
                profile: profileRes.data,
                patient: patientRes.data,
                vitals: vitalsRes.data ?? [],
                reports: reportsRes.data ?? [],
                medications: medsRes.data ?? [],
                documents,
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (e) {
          return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
        }
      },
    },
  },
});
