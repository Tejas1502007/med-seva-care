-- ============================================================
-- NUCLEAR RESET — drops ALL policies on ALL tables and rebuilds
-- Run in Supabase SQL Editor
-- ============================================================

-- Drop every policy on every affected table
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE tablename IN (
      'profiles', 'patient_profiles', 'doctor_profiles',
      'vitals', 'health_reports', 'medications', 'medication_logs',
      'consultations', 'care_plans', 'chat_messages'
    )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END$$;

-- Add 'admin' to enum if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'admin'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'admin';
    COMMIT;
  END IF;
END$$;

-- ── profiles ──────────────────────────────────────────────────
CREATE POLICY "svc_profiles" ON public.profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "own_profile_select" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "own_profile_update" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ── patient_profiles ──────────────────────────────────────────
CREATE POLICY "svc_patient_profiles" ON public.patient_profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "patient_select" ON public.patient_profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "patient_insert" ON public.patient_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "patient_update" ON public.patient_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ── doctor_profiles ───────────────────────────────────────────
CREATE POLICY "svc_doctor_profiles" ON public.doctor_profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "doctor_select" ON public.doctor_profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "doctor_insert" ON public.doctor_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "doctor_update" ON public.doctor_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ── vitals ────────────────────────────────────────────────────
CREATE POLICY "svc_vitals" ON public.vitals
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "patient_vitals" ON public.vitals
  FOR ALL TO authenticated
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- ── health_reports ────────────────────────────────────────────
CREATE POLICY "svc_reports" ON public.health_reports
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "patient_reports" ON public.health_reports
  FOR ALL TO authenticated
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- ── medications ───────────────────────────────────────────────
CREATE POLICY "svc_medications" ON public.medications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "patient_medications" ON public.medications
  FOR ALL TO authenticated
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- ── medication_logs ───────────────────────────────────────────
CREATE POLICY "svc_med_logs" ON public.medication_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "patient_med_logs" ON public.medication_logs
  FOR ALL TO authenticated
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- ── consultations ─────────────────────────────────────────────
CREATE POLICY "svc_consultations" ON public.consultations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "patient_consultations_select" ON public.consultations
  FOR SELECT TO authenticated USING (auth.uid() = patient_id);

CREATE POLICY "doctor_consultations" ON public.consultations
  FOR ALL TO authenticated USING (auth.uid() = doctor_id);

-- ── care_plans ────────────────────────────────────────────────
CREATE POLICY "svc_care_plans" ON public.care_plans
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "patient_care_plans" ON public.care_plans
  FOR ALL TO authenticated
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- ── chat_messages ─────────────────────────────────────────────
CREATE POLICY "svc_chat" ON public.chat_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "patient_chat" ON public.chat_messages
  FOR ALL TO authenticated
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- ── Verify ────────────────────────────────────────────────────
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN (
  'profiles','patient_profiles','doctor_profiles',
  'vitals','health_reports','medications','medication_logs',
  'consultations','care_plans','chat_messages'
)
GROUP BY tablename
ORDER BY tablename;
