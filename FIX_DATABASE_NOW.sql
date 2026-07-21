-- ============================================================
-- RUN THIS ENTIRE FILE IN SUPABASE SQL EDITOR
-- Dashboard → SQL Editor → New query → paste all → Run
-- ============================================================

-- ── STEP 1: Create the auto-profile trigger ──────────────────
-- This creates a profiles row automatically whenever a new user signs up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient')::public.user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE
    SET
      email     = EXCLUDED.email,
      role      = COALESCE(EXCLUDED.role, public.profiles.role),
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── STEP 2: Fix RLS on profiles ──────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- Users can insert their own profile (needed for upsert in onboarding)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Patients can read all doctor profiles (needed for Find Doctor tab)
DROP POLICY IF EXISTS "Anyone can read doctor profiles" ON public.profiles;
CREATE POLICY "Anyone can read doctor profiles"
  ON public.profiles FOR SELECT
  USING (role = 'doctor');

-- Admin can read all profiles
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;
CREATE POLICY "Admin can read all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p2
      WHERE p2.id = auth.uid() AND p2.role = 'admin'
    )
  );


-- ── STEP 3: Fix RLS on doctor_profiles ───────────────────────

ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;

-- Doctors can manage their own doctor_profile
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

-- Patients and authenticated users can read all doctor_profiles (Find Doctor tab)
DROP POLICY IF EXISTS "Authenticated users can read doctor_profiles" ON public.doctor_profiles;
CREATE POLICY "Authenticated users can read doctor_profiles"
  ON public.doctor_profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admin can read and update all doctor_profiles
DROP POLICY IF EXISTS "Admin can read all doctor_profiles" ON public.doctor_profiles;
CREATE POLICY "Admin can read all doctor_profiles"
  ON public.doctor_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin can update doctor_profiles" ON public.doctor_profiles;
CREATE POLICY "Admin can update doctor_profiles"
  ON public.doctor_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


-- ── STEP 4: Backfill profiles for existing auth users ────────
-- This creates profiles rows for any users who already signed up
-- but didn't get a profiles row (because the trigger was missing)

INSERT INTO public.profiles (id, email, role, full_name)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'role', 'patient')::public.user_role,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1))
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO NOTHING;


-- ── STEP 5: Verify ───────────────────────────────────────────

SELECT
  p.id,
  p.email,
  p.role,
  p.full_name,
  dp.specialization,
  dp.verification_status
FROM public.profiles p
LEFT JOIN public.doctor_profiles dp ON dp.id = p.id
ORDER BY p.created_at DESC
LIMIT 20;
