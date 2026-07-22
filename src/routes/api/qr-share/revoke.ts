import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

export const Route = createFileRoute("/api/qr-share/revoke")({
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

          const { share_id } = (await request.json()) as { share_id: string };
          if (!share_id) return new Response(JSON.stringify({ error: "Missing share_id" }), { status: 400 });

          // Use user-scoped client for the update — works with RLS policies
          const { error } = await (userClient as any)
            .from("qr_shares")
            .update({ is_active: false })
            .eq("id", share_id)
            .eq("patient_id", user.id); // enforce ownership

          if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

          return new Response(JSON.stringify({ success: true }), {
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
