-- ============================================================
-- Patient Data Fix — restores all missing SELECT policies
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── profiles ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- ── patient_profiles ─────────────────────────────────────────
DROP POLICY IF EXISTS "Patients can read own patient profile" ON public.patient_profiles;
CREATE POLICY "Patients can read own patient profile"
  ON public.patient_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- ── vitals ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Patients can manage own vitals" ON public.vitals;
CREATE POLICY "Patients can manage own vitals"
  ON public.vitals FOR ALL
  TO authenticated
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- ── health_reports ───────────────────────────────────────────
DROP POLICY IF EXISTS "Patients can manage own reports" ON public.health_reports;
CREATE POLICY "Patients can manage own reports"
  ON public.health_reports FOR ALL
  TO authenticated
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- ── medications ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Patients can select own medications" ON public.medications;
CREATE POLICY "Patients can select own medications"
  ON public.medications FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

-- ── care_plans ───────────────────────────────────────────────
DROP POLICY IF EXISTS "Patients can read own care plans" ON public.care_plans;
CREATE POLICY "Patients can read own care plans"
  ON public.care_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

-- ── chat_messages ────────────────────────────────────────────
DROP POLICY IF EXISTS "Patients can manage own chat messages" ON public.chat_messages;
CREATE POLICY "Patients can manage own chat messages"
  ON public.chat_messages FOR ALL
  TO authenticated
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- ── Verify all policies are in place ─────────────────────────
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN (
  'profiles', 'patient_profiles', 'vitals',
  'health_reports', 'medications', 'care_plans', 'chat_messages'
)
ORDER BY tablename, cmd;
