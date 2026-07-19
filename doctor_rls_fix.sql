-- Run this in Supabase SQL Editor if doctor profile page still shows blank

-- Ensure doctors can read their own profiles row
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- Ensure doctors can read their own doctor_profiles row (even if it doesn't exist yet, maybeSingle returns null safely)
DROP POLICY IF EXISTS "Doctor can read own profile" ON public.doctor_profiles;
CREATE POLICY "Doctor can read own profile"
  ON public.doctor_profiles FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Doctor can insert own profile" ON public.doctor_profiles;
CREATE POLICY "Doctor can insert own profile"
  ON public.doctor_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Doctor can update own profile" ON public.doctor_profiles;
CREATE POLICY "Doctor can update own profile"
  ON public.doctor_profiles FOR UPDATE
  USING (id = auth.uid());
