-- ============================================================
-- MedSeva — FINAL COMPLETE SETUP FOR MEDICINES
-- Run this COMPLETE script in Supabase SQL Editor
-- This handles medications table + medication_logs table + RLS
-- ============================================================

-- Step 1: Medications Table Updates
-- ============================================================
ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'tablet';

ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS quantity NUMERIC DEFAULT 1;

ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS times TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Update existing records
UPDATE public.medications 
SET quantity = 1, unit = 'tablet'
WHERE quantity IS NULL AND unit IS NULL;

UPDATE public.medications
SET times = ARRAY[time]
WHERE (times IS NULL OR times = ARRAY[]::TEXT[]) AND time IS NOT NULL;

-- Step 2: Medication Logs Table (for tracking when medicines are taken)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.medication_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  patient_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status        TEXT NOT NULL CHECK (status IN ('Taken', 'Pending', 'Missed')),
  logged_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medication_logs_patient ON public.medication_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_med ON public.medication_logs(medication_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_date ON public.medication_logs(logged_at DESC);

-- Step 3: Enable RLS on Both Tables
-- ============================================================
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop Existing Policies (medications)
-- ============================================================
DROP POLICY IF EXISTS "Patients can manage own medications" ON public.medications;
DROP POLICY IF EXISTS "Doctors can read patient medications" ON public.medications;
DROP POLICY IF EXISTS "Patients can insert own medications" ON public.medications;
DROP POLICY IF EXISTS "Patients can select own medications" ON public.medications;
DROP POLICY IF EXISTS "Patients can update own medications" ON public.medications;
DROP POLICY IF EXISTS "Patients can delete own medications" ON public.medications;
DROP POLICY IF EXISTS "Doctors can read assigned patient medications" ON public.medications;
DROP POLICY IF EXISTS "Service role full access medications" ON public.medications;

-- Step 5: Drop Existing Policies (medication_logs)
-- ============================================================
DROP POLICY IF EXISTS "Patients can manage own medication logs" ON public.medication_logs;
DROP POLICY IF EXISTS "Doctors can read patient medication logs" ON public.medication_logs;
DROP POLICY IF EXISTS "Service role full access medication logs" ON public.medication_logs;

-- Step 6: Create RLS Policies for Medications
-- ============================================================

-- Service role (backend operations)
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

-- Patients can UPDATE their own medications (including streak)
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

-- Step 7: Create RLS Policies for Medication Logs
-- ============================================================

-- Service role (backend operations)
CREATE POLICY "Service role full access medication logs"
  ON public.medication_logs
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- Patients can INSERT their own medication logs
CREATE POLICY "Patients can insert own medication logs"
  ON public.medication_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = patient_id);

-- Patients can SELECT their own medication logs
CREATE POLICY "Patients can select own medication logs"
  ON public.medication_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

-- Patients can UPDATE their own medication logs
CREATE POLICY "Patients can update own medication logs"
  ON public.medication_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- Patients can DELETE their own medication logs
CREATE POLICY "Patients can delete own medication logs"
  ON public.medication_logs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = patient_id);

-- Doctors can read medication logs of their assigned patients
CREATE POLICY "Doctors can read assigned patient medication logs"
  ON public.medication_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_profiles pp
      WHERE pp.id = medication_logs.patient_id
        AND pp.assigned_doctor_id = auth.uid()
    )
  );

-- Step 8: Add Column Comments
-- ============================================================
COMMENT ON COLUMN public.medications.unit IS 'Unit of measurement: tablet, capsule, ml, mg, drop, spoon, injection';
COMMENT ON COLUMN public.medications.quantity IS 'Number of units to take per dose (e.g., 1, 2, 0.5)';
COMMENT ON COLUMN public.medications.times IS 'Array of times in HH:MM format (e.g., ["08:00", "14:00", "20:00"])';
COMMENT ON COLUMN public.medications.notes IS 'Special instructions (with food, before bed, etc.)';

COMMENT ON TABLE public.medication_logs IS 'Logs when patient takes their medications (for adherence tracking)';
COMMENT ON COLUMN public.medication_logs.status IS 'Status: Taken, Pending, Missed';

-- Step 9: Verify Setup
-- ============================================================
-- Run these queries to verify setup is complete:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'medications' ORDER BY ordinal_position;
-- SELECT policyname FROM pg_policies WHERE tablename = 'medications';
-- SELECT policyname FROM pg_policies WHERE tablename = 'medication_logs';
-- SELECT COUNT(*) FROM public.medication_logs;

-- ============================================================
-- SETUP COMPLETE!
-- ============================================================
-- Next steps:
-- 1. Verify all columns added: medications has unit, quantity, times, notes
-- 2. Verify RLS policies created: 11 policies total (6 for medications, 5 for logs)
-- 3. Test adding a medicine in the app
-- 4. Test marking medicine as taken
-- 5. Check Supabase medication_logs table for new records
-- ============================================================
