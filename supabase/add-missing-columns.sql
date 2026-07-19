-- ============================================================
-- Add missing columns to patient_profiles + reload schema cache
-- ============================================================

ALTER TABLE public.patient_profiles
  ADD COLUMN IF NOT EXISTS dob              date,
  ADD COLUMN IF NOT EXISTS height           numeric,
  ADD COLUMN IF NOT EXISTS weight           numeric,
  ADD COLUMN IF NOT EXISTS alternate_phone  text,
  ADD COLUMN IF NOT EXISTS address          text,
  ADD COLUMN IF NOT EXISTS addictions       text[] DEFAULT '{}';

-- Reload PostgREST schema cache so select=* works
NOTIFY pgrst, 'reload schema';

-- Verify all columns now exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'patient_profiles'
ORDER BY ordinal_position;
