-- ============================================================
-- ADMIN RLS POLICIES — run once in Supabase SQL Editor
-- Allows users with role='admin' in profiles to read all rows
-- ============================================================

-- Helper: reusable function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ── profiles ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;
CREATE POLICY "Admin can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- ── patient_profiles ─────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can read all patient_profiles" ON public.patient_profiles;
CREATE POLICY "Admin can read all patient_profiles"
  ON public.patient_profiles FOR SELECT
  USING (public.is_admin());

-- ── doctor_profiles ──────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can read all doctor_profiles" ON public.doctor_profiles;
CREATE POLICY "Admin can read all doctor_profiles"
  ON public.doctor_profiles FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can update doctor_profiles" ON public.doctor_profiles;
CREATE POLICY "Admin can update doctor_profiles"
  ON public.doctor_profiles FOR UPDATE
  USING (public.is_admin());

-- ── health_reports ───────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can read all health_reports" ON public.health_reports;
CREATE POLICY "Admin can read all health_reports"
  ON public.health_reports FOR SELECT
  USING (public.is_admin());

-- ── consultations ────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can read all consultations" ON public.consultations;
CREATE POLICY "Admin can read all consultations"
  ON public.consultations FOR SELECT
  USING (public.is_admin());
