-- Drop every single policy on all tables, no exceptions
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END$$;

-- Rebuild only what's needed, zero cross-table lookups
-- profiles
CREATE POLICY "p1" ON public.profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "p2" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "p3" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- patient_profiles
CREATE POLICY "pp1" ON public.patient_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "pp2" ON public.patient_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "pp3" ON public.patient_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "pp4" ON public.patient_profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- doctor_profiles
CREATE POLICY "dp1" ON public.doctor_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "dp2" ON public.doctor_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "dp3" ON public.doctor_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "dp4" ON public.doctor_profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- vitals
CREATE POLICY "v1" ON public.vitals FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "v2" ON public.vitals FOR ALL TO authenticated USING (auth.uid() = patient_id) WITH CHECK (auth.uid() = patient_id);

-- health_reports
CREATE POLICY "hr1" ON public.health_reports FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "hr2" ON public.health_reports FOR ALL TO authenticated USING (auth.uid() = patient_id) WITH CHECK (auth.uid() = patient_id);

-- medications
CREATE POLICY "m1" ON public.medications FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "m2" ON public.medications FOR ALL TO authenticated USING (auth.uid() = patient_id) WITH CHECK (auth.uid() = patient_id);

-- medication_logs
CREATE POLICY "ml1" ON public.medication_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "ml2" ON public.medication_logs FOR ALL TO authenticated USING (auth.uid() = patient_id) WITH CHECK (auth.uid() = patient_id);

-- care_plans
CREATE POLICY "cp1" ON public.care_plans FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "cp2" ON public.care_plans FOR ALL TO authenticated USING (auth.uid() = patient_id) WITH CHECK (auth.uid() = patient_id);

-- chat_messages
CREATE POLICY "cm1" ON public.chat_messages FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "cm2" ON public.chat_messages FOR ALL TO authenticated USING (auth.uid() = patient_id) WITH CHECK (auth.uid() = patient_id);

-- consultations
CREATE POLICY "co1" ON public.consultations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "co2" ON public.consultations FOR SELECT TO authenticated USING (auth.uid() = patient_id OR auth.uid() = doctor_id);
CREATE POLICY "co3" ON public.consultations FOR ALL TO authenticated USING (auth.uid() = doctor_id) WITH CHECK (auth.uid() = doctor_id);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

-- Confirm counts
SELECT tablename, COUNT(*) as policies
FROM pg_policies WHERE schemaname = 'public'
GROUP BY tablename ORDER BY tablename;
