-- ============================================================
-- Fix: Add INSERT policy for care_plans table
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Add INSERT policy so patients can insert their own care plans
CREATE POLICY "Patients can insert own care plans"
  ON public.care_plans FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

-- Optional: Add UPDATE policy for updating care plans
CREATE POLICY "Patients can update own care plans"
  ON public.care_plans FOR UPDATE
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- Verify policies are in place
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'care_plans'
ORDER BY policyname;

