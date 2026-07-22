import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { Database } from "./database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  profile: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;

    // Listen for auth changes first to avoid missing events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      const profile = session ? await fetchProfile(session.user.id) : null;
      if (isMounted) setState({ session, user: session?.user ?? null, profile, loading: false });
    });

    // Then get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      const profile = session ? await fetchProfile(session.user.id) : null;
      if (isMounted) setState({ session, user: session?.user ?? null, profile, loading: false });
    });

    return () => { isMounted = false; subscription.unsubscribe(); };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id, role, full_name, email, phone, avatar_url, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();
  return data ?? null;
}

export function useAuth() {
  return useContext(AuthContext);
}

// ── Logout helper ──────────────────────────────────────────────────────────
export async function signOut() {
  await supabase.auth.signOut();
}
