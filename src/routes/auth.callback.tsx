import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Process the callback URL hash
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          setError("Authentication failed. Please try again.");
          setTimeout(() => navigate({ to: "/login" }), 2000);
          return;
        }

        const session = data?.session;
        if (!session) {
          console.log("No session found, redirecting to login");
          navigate({ to: "/login" });
          return;
        }

        // Fetch user profile with proper error handling
        try {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .maybeSingle();

          if (profileError) {
            console.error("Profile fetch error:", profileError);
            // Still proceed with navigation based on user metadata
            const userRole = session.user.user_metadata?.role ?? "patient";
            navigate({ to: userRole === "doctor" ? "/doctor" : "/dashboard" });
            return;
          }

          // Navigate based on role
          const role = profile?.role ?? session.user.user_metadata?.role ?? "patient";
          navigate({ to: role === "doctor" ? "/doctor" : "/dashboard" });
        } catch (profileErr) {
          console.error("Profile error:", profileErr);
          const userRole = session.user.user_metadata?.role ?? "patient";
          navigate({ to: userRole === "doctor" ? "/doctor" : "/dashboard" });
        }
      } catch (err) {
        console.error("Callback error:", err);
        setError("An error occurred during sign in.");
        setTimeout(() => navigate({ to: "/login" }), 2000);
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm font-medium" style={{ color: "#DC2626" }}>{error}</p>
          <p className="text-xs" style={{ color: "#6B7280" }}>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#0D7A5F", borderTopColor: "transparent" }} />
        <p className="text-sm" style={{ color: "#6B7280" }}>Signing you in…</p>
      </div>
    </div>
  );
}
