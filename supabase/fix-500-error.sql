-- ============================================================
-- FIX for 500 Internal Server Error on patient_profiles
-- The admin RLS policies reference role='admin' which may not
-- exist in the enum, causing a crash on every query.
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Step 1: Drop ALL policies on patient_profiles cleanly
DROP POLICY IF EXISTS "Patients can read own patient profile"      ON public.patient_profiles;
DROP POLICY IF EXISTS "Patients can insert own patient profile"    ON public.patient_profiles;
DROP POLICY IF EXISTS "Patients can update own patient profile"    ON public.patient_profiles;
DROP POLICY IF EXISTS "Doctors can read assigned patient profiles" ON public.patient_profiles;
DROP POLICY IF EXISTS "Service role can manage patient profiles"   ON public.patient_profiles;
DROP POLICY IF EXISTS "Admins can read all patient profiles"       ON public.patient_profiles;

-- Step 2: Drop ALL policies on profiles cleanly
DROP POLICY IF EXISTS "Users can read own profile"                 ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"               ON public.profiles;
DROP POLICY IF EXISTS "Doctors can read assigned patient profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage profiles"           ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles"               ON public.profiles;

-- Step 3: Add 'admin' to enum safely (skip if already exists)
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

-- Step 4: Recreate profiles policies (clean, no broken references)
CREATE POLICY "Service role can manage profiles"
  ON public.profiles FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Doctors can read assigned patient profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_profiles pp
      WHERE pp.id = profiles.id
        AND pp.assigned_doctor_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Step 5: Recreate patient_profiles policies (clean)
CREATE POLICY "Service role can manage patient profiles"
  ON public.patient_profiles FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Patients can read own patient profile"
  ON public.patient_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Patients can insert own patient profile"
  ON public.patient_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Patients can update own patient profile"
  ON public.patient_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Doctors can read assigned patient profiles"
  ON public.patient_profiles FOR SELECT
  TO authenticated
  USING (assigned_doctor_id = auth.uid());

CREATE POLICY "Admins can read all patient profiles"
  ON public.patient_profiles FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Step 6: Verify — should show all policies with no errors
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('profiles', 'patient_profiles')
ORDER BY tablename, policyname;
