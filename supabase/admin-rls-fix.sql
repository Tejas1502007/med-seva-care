-- ============================================================
-- Admin RLS Fix — allow admin role to read all profiles
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add 'admin' to the user_role enum (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'admin'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'admin';
  END IF;
END$$;

-- 2. Admin can read ALL profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 3. Admin can read ALL patient_profiles
DROP POLICY IF EXISTS "Admins can read all patient profiles" ON public.patient_profiles;
CREATE POLICY "Admins can read all patient profiles"
  ON public.patient_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 4. Admin can read ALL doctor_profiles
DROP POLICY IF EXISTS "Admins can read all doctor profiles" ON public.doctor_profiles;
CREATE POLICY "Admins can read all doctor profiles"
  ON public.doctor_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 5. Admin can read ALL health_reports
DROP POLICY IF EXISTS "Admins can read all health reports" ON public.health_reports;
CREATE POLICY "Admins can read all health reports"
  ON public.health_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 6. Admin can read ALL consultations
DROP POLICY IF EXISTS "Admins can read all consultations" ON public.consultations;
CREATE POLICY "Admins can read all consultations"
  ON public.consultations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 7. Set your admin user's role (replace with your actual admin user UUID)
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
