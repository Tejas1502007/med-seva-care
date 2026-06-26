-- ============================================================
-- MedSeva — Complete Medicines Setup for Supabase
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Step 1: Add new columns to medications table
-- ============================================================
ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'tablet';

ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS quantity NUMERIC DEFAULT 1;

ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS times TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Step 2: Update existing records with default values
-- ============================================================
UPDATE public.medications 
SET quantity = 1,
    unit = 'tablet'
WHERE quantity IS NULL AND unit IS NULL;

-- Step 3: Ensure times array has data from time field if empty
-- ============================================================
UPDATE public.medications
SET times = ARRAY[time]
WHERE (times IS NULL OR times = ARRAY[]::TEXT[]) 
  AND time IS NOT NULL;

-- Step 4: Add column comments
-- ============================================================
COMMENT ON COLUMN public.medications.unit IS 'Unit of measurement: tablet, capsule, ml, mg, drop, spoon, injection';
COMMENT ON COLUMN public.medications.quantity IS 'Number of units to take per dose (e.g., 1, 2, 0.5)';
COMMENT ON COLUMN public.medications.times IS 'Array of times to take medication in HH:MM format (e.g., ["08:00", "14:00", "20:00"])';
COMMENT ON COLUMN public.medications.notes IS 'Special instructions: with food, before bed, avoid dairy, etc.';

-- Step 5: Verify all columns exist
-- ============================================================
-- Run this query to verify: SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'medications' ORDER BY ordinal_position;

-- Step 6: Check for Row Level Security policies
-- ============================================================
-- Verify RLS is enabled
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Patients can manage own medications" ON public.medications;
DROP POLICY IF EXISTS "Doctors can read patient medications" ON public.medications;
DROP POLICY IF EXISTS "Patients can insert own medications" ON public.medications;
DROP POLICY IF EXISTS "Patients can select own medications" ON public.medications;
DROP POLICY IF EXISTS "Patients can update own medications" ON public.medications;
DROP POLICY IF EXISTS "Patients can delete own medications" ON public.medications;
DROP POLICY IF EXISTS "Doctors can read assigned patient medications" ON public.medications;
DROP POLICY IF EXISTS "Service role full access medications" ON public.medications;

-- Step 7: Create proper RLS policies
-- ============================================================

-- Service role (for database operations/triggers)
CREATE POLICY "Service role full access medications"
  ON public.medications
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- Patients can INSERT their own medications
CREATE POLICY "Patients can insert own medications"
  ON public.medications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = patient_id);

-- Patients can SELECT their own medications
CREATE POLICY "Patients can select own medications"
  ON public.medications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

-- Patients can UPDATE their own medications
CREATE POLICY "Patients can update own medications"
  ON public.medications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- Patients can DELETE their own medications
CREATE POLICY "Patients can delete own medications"
  ON public.medications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = patient_id);

-- Doctors can read medications of their assigned patients
CREATE POLICY "Doctors can read assigned patient medications"
  ON public.medications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_profiles pp
      WHERE pp.id = medications.patient_id
        AND pp.assigned_doctor_id = auth.uid()
    )
  );

-- Step 8: Create indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_medications_patient ON public.medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_medications_active ON public.medications(patient_id, is_active);

-- Step 9: Verify setup (query these to check)
-- ============================================================
-- SELECT COUNT(*) as total_medications FROM public.medications;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'medications' ORDER BY ordinal_position;
-- SELECT schemaname, tablename, rulename FROM pg_rules WHERE tablename = 'medications';

-- ============================================================
-- SETUP COMPLETE!
-- ============================================================
-- Next steps:
-- 1. Run this entire script in Supabase SQL Editor
-- 2. Verify output: "CREATE POLICY" messages for all policies
-- 3. Run verification queries above to confirm
-- 4. Test adding a medicine in the app
-- 5. Check Supabase Table Editor to see new columns
-- ============================================================
