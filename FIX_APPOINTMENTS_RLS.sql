-- ============================================================
-- FIX APPOINTMENTS RLS — run in Supabase SQL Editor
-- ============================================================

-- Doctors need to read patient profiles to show names/age in their appointments list
DROP POLICY IF EXISTS "Doctors can read patient profiles" ON public.profiles;
CREATE POLICY "Doctors can read patient profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    -- doctors can read profiles of their own patients (via appointments)
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.patient_id = profiles.id
        AND a.doctor_id = auth.uid()
    )
  );

-- Doctors can read patient_profiles of their patients
DROP POLICY IF EXISTS "Doctors can read patient_profiles" ON public.patient_profiles;
CREATE POLICY "Doctors can read patient_profiles"
  ON public.patient_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.patient_id = patient_profiles.id
        AND a.doctor_id = auth.uid()
    )
  );

-- Also make sure patients can read their own patient_profile
DROP POLICY IF EXISTS "Patients can read own patient_profile" ON public.patient_profiles;
CREATE POLICY "Patients can read own patient_profile"
  ON public.patient_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Fix appointments admin policy to use SECURITY DEFINER function (avoids recursion)
DROP POLICY IF EXISTS "admins have full access" ON public.appointments;
CREATE POLICY "admins have full access"
  ON public.appointments FOR ALL
  TO authenticated
  USING (public.get_my_role() = 'admin'::public.user_role);

-- Verify
SELECT policyname, cmd, roles FROM pg_policies 
WHERE tablename IN ('appointments', 'profiles', 'patient_profiles')
ORDER BY tablename, cmd;
