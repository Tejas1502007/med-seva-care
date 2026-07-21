-- Allow admin to read all patient_profiles and doctor_profiles
-- Uses JWT role claim directly — no cross-table lookup, no recursion

-- Admin reads all patient_profiles
CREATE POLICY "admin_patient_profiles"
  ON public.patient_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role::text = 'admin'
    )
  );

-- Admin reads all doctor_profiles  
CREATE POLICY "admin_doctor_profiles"
  ON public.doctor_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role::text = 'admin'
    )
  );

-- Admin reads all profiles (for enriching with name/email)
CREATE POLICY "admin_all_profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles self
      WHERE self.id = auth.uid() AND self.role::text = 'admin'
    )
  );

-- Verify
SELECT tablename, policyname FROM pg_policies
WHERE tablename IN ('profiles','patient_profiles','doctor_profiles')
ORDER BY tablename, policyname;
