import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

function randomHex(bytes: number) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

function randomPin() {
  const arr = new Uint8Array(2);
  crypto.getRandomValues(arr);
  return String(1000 + (((arr[0] << 8) | arr[1]) % 9000));
}

export const Route = createFileRoute("/api/qr-share/create")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const authHeader = request.headers.get("Authorization") ?? "";
          const jwt = authHeader.replace("Bearer ", "");
          if (!jwt) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

          // Create a user-scoped client — this makes auth.uid() work in RLS
          const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: `Bearer ${jwt}` } },
            auth: { persistSession: false },
          });

          // Verify the JWT is valid
          const { data: { user }, error: authErr } = await userClient.auth.getUser();
          if (authErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

          const body = (await request.json()) as {
            share_vitals?: boolean;
            share_reports?: boolean;
            share_medications?: boolean;
            share_profile?: boolean;
            expires_hours?: number | null;
          };

          const token = randomHex(16);
          const pin = randomPin();
          const expiresAt = body.expires_hours
            ? new Date(Date.now() + body.expires_hours * 3600 * 1000).toISOString()
            : null;

          const { data, error } = await (userClient as any)
            .from("qr_shares")
            .insert({
              patient_id: user.id,
              token,
              pin,
              share_vitals: body.share_vitals ?? true,
              share_reports: body.share_reports ?? true,
              share_medications: body.share_medications ?? true,
              share_profile: body.share_profile ?? true,
              expires_at: expiresAt,
              is_active: true,
            })
            .select("id, token, pin, expires_at, created_at")
            .single();

          if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

          return new Response(JSON.stringify({ success: true, share: data }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
        }
      },
    },
  },
});
