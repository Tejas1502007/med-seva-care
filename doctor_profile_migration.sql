-- ============================================================
-- Doctor Profile Migration — run in Supabase SQL Editor
-- ============================================================

-- Add new columns to doctor_profiles
ALTER TABLE public.doctor_profiles
  ADD COLUMN IF NOT EXISTS dob date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS hospital_address text,
  ADD COLUMN IF NOT EXISTS consultation_fee numeric,
  ADD COLUMN IF NOT EXISTS consultation_type text DEFAULT 'offline',
  ADD COLUMN IF NOT EXISTS degree_certificate_url text,
  ADD COLUMN IF NOT EXISTS government_id_url text,
  ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('doctor-documents', 'doctor-documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('doctor-avatars', 'doctor-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ── doctor-documents policies ─────────────────────────────────
DROP POLICY IF EXISTS "Doctors upload own documents" ON storage.objects;
CREATE POLICY "Doctors upload own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'doctor-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Doctors read own documents" ON storage.objects;
CREATE POLICY "Doctors read own documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'doctor-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Admin reads all doctor documents" ON storage.objects;
CREATE POLICY "Admin reads all doctor documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'doctor-documents'
    AND public.is_admin()
  );

-- ── doctor-avatars policies ───────────────────────────────────
DROP POLICY IF EXISTS "Doctor avatars public read" ON storage.objects;
CREATE POLICY "Doctor avatars public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'doctor-avatars');

DROP POLICY IF EXISTS "Doctors upload own avatar" ON storage.objects;
CREATE POLICY "Doctors upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'doctor-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Doctors update own avatar" ON storage.objects;
CREATE POLICY "Doctors update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'doctor-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── doctor_profiles table policies ───────────────────────────
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
