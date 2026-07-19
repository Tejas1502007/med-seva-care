-- ============================================================
-- FINAL FIX — eliminates infinite recursion in RLS policies
-- The 500 is caused by policies that query 'profiles' from
-- within a policy on 'profiles' or 'patient_profiles',
-- creating infinite recursion.
-- ============================================================

-- Step 1: Nuke every policy on profiles and patient_profiles
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'patient_profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.patient_profiles', r.policyname);
  END LOOP;
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
  END LOOP;
END$$;

-- Step 2: Create a security definer function to get role
-- This breaks the recursion by bypassing RLS inside the function
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;

-- Step 3: Rebuild profiles policies (NO cross-table lookups)
CREATE POLICY "svc_profiles"
  ON public.profiles FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "own_profile_select"
  ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

CREATE POLICY "own_profile_update"
  ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id);

-- Step 4: Rebuild patient_profiles policies
-- Use get_my_role() for admin check to avoid recursion
CREATE POLICY "svc_patient_profiles"
  ON public.patient_profiles FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "patient_select"
  ON public.patient_profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

CREATE POLICY "patient_insert"
  ON public.patient_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "patient_update"
  ON public.patient_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id);

CREATE POLICY "doctor_reads_assigned_patients"
  ON public.patient_profiles FOR SELECT
  TO authenticated USING (assigned_doctor_id = auth.uid());

CREATE POLICY "admin_reads_all_patients"
  ON public.patient_profiles FOR SELECT
  TO authenticated USING (public.get_my_role() = 'admin');

-- Step 5: Verify — no errors means no recursion
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('profiles', 'patient_profiles')
ORDER BY tablename, policyname;
