-- ============================================================
-- RUN THIS IN SUPABASE SQL EDITOR — fixes Find Doctor visibility
-- Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

-- ── FIX 1: profiles table ────────────────────────────────────
-- Allow any logged-in user to read profiles where role = 'doctor'
-- (the old policy had a self-reference bug)

DROP POLICY IF EXISTS "Anyone can read doctor profiles" ON public.profiles;
CREATE POLICY "Anyone can read doctor profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (role = 'doctor'::public.user_role);


-- ── FIX 2: doctor_profiles table ─────────────────────────────
-- Allow any logged-in user to read all doctor_profiles rows

DROP POLICY IF EXISTS "Authenticated users can read doctor_profiles" ON public.doctor_profiles;
CREATE POLICY "Authenticated users can read doctor_profiles"
  ON public.doctor_profiles FOR SELECT
  TO authenticated
  USING (true);


-- ── VERIFY: run this to confirm it works ─────────────────────
SELECT id, email, role, full_name
FROM public.profiles
WHERE role = 'doctor'::public.user_role
LIMIT 10;
